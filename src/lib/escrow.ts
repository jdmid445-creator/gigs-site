import "server-only";
import * as multisig from "@sqds/multisig";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  AddressLookupTableAccount,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SERVER_RPC, USDC_MINT, USDC_DECIMALS, REFEREE, FEE_BPS, FEE_WALLET } from "./config";
import { feeSplit } from "./money";
import type { Gig } from "./db";
import { HttpError } from "./auth";

const { Permission, Permissions } = multisig.types;

let conn: Connection | null = null;
export function connection() {
  if (!conn) conn = new Connection(SERVER_RPC, "confirmed");
  return conn;
}

export function refereeKey() {
  if (!REFEREE) throw new HttpError(500, "Referee wallet is not configured");
  return new PublicKey(REFEREE);
}

export function vaultFor(multisigPda: PublicKey) {
  return multisig.getVaultPda({ multisigPda, index: 0 })[0];
}

const PRIORITY = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 });

async function finalize(
  payer: PublicKey,
  ixs: TransactionInstruction[],
  luts: AddressLookupTableAccount[] = [],
  extraSigners: Keypair[] = []
) {
  const c = connection();
  const { blockhash } = await c.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [PRIORITY, ...ixs],
  }).compileToV0Message(luts);
  const tx = new VersionedTransaction(msg);
  if (extraSigners.length) tx.sign(extraSigners);

  // Simulate before handing it to the wallet, so users never sign something that will fail.
  const sim = await c.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true });
  if (sim.value.err) {
    const logs = (sim.value.logs || []).slice(-6).join("\n");
    throw new HttpError(400, `Transaction would fail: ${JSON.stringify(sim.value.err)}\n${logs}`);
  }
  return Buffer.from(tx.serialize()).toString("base64");
}

/* ---------------- payout instructions (run by the vault) ---------------- */

function payoutInstructions(gig: Gig, vault: PublicKey, to: PublicKey, withFee: boolean) {
  const amount = BigInt(gig.amount);
  const { fee, payout } =
    withFee && FEE_BPS > 0 && FEE_WALLET ? feeSplit(amount, FEE_BPS) : { fee: 0n, payout: amount };
  const feeTo = fee > 0n ? new PublicKey(FEE_WALLET) : null;
  const ixs: TransactionInstruction[] = [];

  if (gig.currency === "SOL") {
    ixs.push(SystemProgram.transfer({ fromPubkey: vault, toPubkey: to, lamports: payout }));
    if (feeTo) ixs.push(SystemProgram.transfer({ fromPubkey: vault, toPubkey: feeTo, lamports: fee }));
  } else {
    const fromAta = getAssociatedTokenAddressSync(USDC_MINT, vault, true);
    ixs.push(
      createTransferCheckedInstruction(
        fromAta, USDC_MINT, getAssociatedTokenAddressSync(USDC_MINT, to, true), vault, payout, USDC_DECIMALS
      )
    );
    if (feeTo)
      ixs.push(
        createTransferCheckedInstruction(
          fromAta, USDC_MINT, getAssociatedTokenAddressSync(USDC_MINT, feeTo, true), vault, fee, USDC_DECIMALS
        )
      );
  }
  return { ixs, feeTo };
}

/** Token accounts the vault will pay into must exist first; the signer creates them (idempotent). */
function ataSetup(gig: Gig, payer: PublicKey, owners: (PublicKey | null)[]) {
  if (gig.currency !== "USDC") return [];
  return owners
    .filter((o): o is PublicKey => !!o)
    .map((o) =>
      createAssociatedTokenAccountIdempotentInstruction(
        payer, getAssociatedTokenAddressSync(USDC_MINT, o, true), o, USDC_MINT
      )
    );
}

/* ---------------- 1. hire: create vault + lock funds ---------------- */

export async function buildHireTx(gig: Gig, workerStr: string) {
  const poster = new PublicKey(gig.poster);
  const worker = new PublicKey(workerStr);
  const referee = refereeKey();
  if (worker.equals(poster)) throw new HttpError(400, "You can't hire yourself");
  if (worker.equals(referee) || poster.equals(referee))
    throw new HttpError(400, "The referee wallet can't be a party to a gig");

  const c = connection();
  const createKey = Keypair.generate();
  const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
  const vault = vaultFor(multisigPda);
  const cfg = await multisig.accounts.ProgramConfig.fromAccountAddress(c, multisig.getProgramConfigPda({})[0]);

  const ixs: TransactionInstruction[] = [
    multisig.instructions.multisigCreateV2({
      createKey: createKey.publicKey,
      creator: poster,
      multisigPda,
      configAuthority: null, // nobody can change members or threshold later
      threshold: 2,
      members: [
        { key: poster, permissions: Permissions.all() },
        { key: worker, permissions: Permissions.all() },
        { key: referee, permissions: Permissions.fromPermissions([Permission.Vote]) },
      ],
      timeLock: 0,
      treasury: cfg.treasury,
      rentCollector: null,
      memo: `gig:${gig.id}`,
    }),
  ];

  const amount = BigInt(gig.amount);
  if (gig.currency === "SOL") {
    ixs.push(SystemProgram.transfer({ fromPubkey: poster, toPubkey: vault, lamports: amount }));
  } else {
    const vaultAta = getAssociatedTokenAddressSync(USDC_MINT, vault, true);
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(poster, vaultAta, vault, USDC_MINT),
      createTransferCheckedInstruction(
        getAssociatedTokenAddressSync(USDC_MINT, poster, true), USDC_MINT, vaultAta, poster, amount, USDC_DECIMALS
      )
    );
  }

  const tx = await finalize(poster, ixs, [], [createKey]);
  return {
    tx,
    createKey: createKey.publicKey.toBase58(),
    multisig: multisigPda.toBase58(),
    vault: vault.toBase58(),
    creationFeeLamports: cfg.multisigCreationFee.toString(),
  };
}

/* ---------------- 2. propose payout (worker) or refund (poster) ---------------- */

export async function buildProposalTx(gig: Gig, kind: "release" | "refund", signerStr: string) {
  const c = connection();
  const signer = new PublicKey(signerStr);
  const multisigPda = new PublicKey(gig.multisig!);
  const vault = vaultFor(multisigPda);
  const ms = await multisig.accounts.Multisig.fromAccountAddress(c, multisigPda);
  const index = BigInt(ms.transactionIndex.toString()) + 1n;

  const to = new PublicKey(kind === "release" ? gig.worker! : gig.poster);
  const { ixs: inner, feeTo } = payoutInstructions(gig, vault, to, kind === "release");
  const { blockhash } = await c.getLatestBlockhash();
  const transactionMessage = new TransactionMessage({ payerKey: vault, recentBlockhash: blockhash, instructions: inner });

  const ixs = [
    ...ataSetup(gig, signer, [to, kind === "release" ? feeTo : null]),
    multisig.instructions.vaultTransactionCreate({
      multisigPda, transactionIndex: index, creator: signer, rentPayer: signer,
      vaultIndex: 0, ephemeralSigners: 0, transactionMessage, memo: `gig:${gig.id}:${kind}`,
    }),
    multisig.instructions.proposalCreate({ multisigPda, transactionIndex: index, creator: signer, rentPayer: signer }),
    multisig.instructions.proposalApprove({ multisigPda, transactionIndex: index, member: signer }),
  ];
  return { tx: await finalize(signer, ixs), index: index.toString() };
}

/* ---------------- 3. approve (+ execute if we'll hit 2 of 3) ---------------- */

export async function buildApproveTx(gig: Gig, index: bigint, memberStr: string, execute: boolean) {
  const member = new PublicKey(memberStr);
  const multisigPda = new PublicKey(gig.multisig!);
  const ixs: TransactionInstruction[] = [multisig.instructions.proposalApprove({ multisigPda, transactionIndex: index, member })];
  let luts: AddressLookupTableAccount[] = [];
  if (execute) {
    const ex = await multisig.instructions.vaultTransactionExecute({
      connection: connection(), multisigPda, transactionIndex: index, member,
    });
    ixs.push(ex.instruction);
    luts = ex.lookupTableAccounts;
  }
  return finalize(member, ixs, luts);
}

export async function buildExecuteTx(gig: Gig, index: bigint, memberStr: string) {
  const member = new PublicKey(memberStr);
  const ex = await multisig.instructions.vaultTransactionExecute({
    connection: connection(), multisigPda: new PublicKey(gig.multisig!), transactionIndex: index, member,
  });
  return finalize(member, [ex.instruction], ex.lookupTableAccounts);
}

/* ---------------- on-chain verification ---------------- */

/** The vault must be exactly poster + worker + referee, 2-of-3, no admin, and hold the full budget. */
export async function verifyFunded(gig: Gig, workerStr: string, multisigStr: string) {
  const c = connection();
  const multisigPda = new PublicKey(multisigStr);
  const ms = await multisig.accounts.Multisig.fromAccountAddress(c, multisigPda).catch(() => null);
  if (!ms) return { ok: false, reason: "Vault not found on-chain yet" };

  const want = [gig.poster, workerStr, refereeKey().toBase58()].sort();
  const have = ms.members.map((m) => m.key.toBase58()).sort();
  if (JSON.stringify(want) !== JSON.stringify(have)) return { ok: false, reason: "Vault members don't match" };
  if (ms.threshold !== 2) return { ok: false, reason: "Vault threshold isn't 2" };
  if (!ms.configAuthority.equals(PublicKey.default)) return { ok: false, reason: "Vault has a config authority" };

  const refMember = ms.members.find((m) => m.key.equals(refereeKey()))!;
  if (refMember.permissions.mask !== Permission.Vote) return { ok: false, reason: "Referee permissions are wrong" };

  const balance = await vaultBalance(gig, multisigPda);
  if (balance < BigInt(gig.amount)) return { ok: false, reason: "Vault doesn't hold the full budget yet" };
  return { ok: true as const };
}

export async function vaultBalance(gig: Gig, multisigPda: PublicKey) {
  const c = connection();
  const vault = vaultFor(multisigPda);
  if (gig.currency === "SOL") return BigInt(await c.getBalance(vault, "confirmed"));
  const ata = getAssociatedTokenAddressSync(USDC_MINT, vault, true);
  const bal = await c.getTokenAccountBalance(ata, "confirmed").catch(() => null);
  return BigInt(bal?.value.amount ?? "0");
}

/** Checks a proposal at `index` really is the payout (or refund) we expect — not something swapped in. */
export async function verifyProposal(gig: Gig, kind: "release" | "refund", index: bigint) {
  const c = connection();
  const multisigPda = new PublicKey(gig.multisig!);
  const vault = vaultFor(multisigPda);
  const [txPda] = multisig.getTransactionPda({ multisigPda, index });
  const vt = await multisig.accounts.VaultTransaction.fromAccountAddress(c, txPda).catch(() => null);
  if (!vt) return { ok: false, reason: "Proposal not found on-chain yet" };
  if (vt.vaultIndex !== 0) return { ok: false, reason: "Wrong vault" };

  const to = new PublicKey(kind === "release" ? gig.worker! : gig.poster);
  const expected = payoutInstructions(gig, vault, to, kind === "release").ixs;
  const keys = vt.message.accountKeys;
  const got = vt.message.instructions.map((ix) => ({
    program: keys[ix.programIdIndex].toBase58(),
    accounts: Array.from(ix.accountIndexes).map((i) => keys[i].toBase58()),
    data: Buffer.from(ix.data).toString("hex"),
  }));
  const want = expected.map((ix) => ({
    program: ix.programId.toBase58(),
    accounts: ix.keys.map((k) => k.pubkey.toBase58()),
    data: Buffer.from(ix.data).toString("hex"),
  }));
  if (JSON.stringify(got) !== JSON.stringify(want)) return { ok: false, reason: "Proposal contents don't match" };
  if (got.some((g) => g.program !== SystemProgram.programId.toBase58() && g.program !== TOKEN_PROGRAM_ID.toBase58()))
    return { ok: false, reason: "Unexpected program in proposal" };

  return { ok: true as const };
}

export type ProposalState = "none" | "active" | "approved" | "executed" | "rejected" | "cancelled";

export async function proposalState(gig: Gig, index: bigint | null) {
  if (index === null || !gig.multisig) return { state: "none" as ProposalState, approved: [] as string[] };
  const multisigPda = new PublicKey(gig.multisig);
  const [pda] = multisig.getProposalPda({ multisigPda, transactionIndex: index });
  const p = await multisig.accounts.Proposal.fromAccountAddress(connection(), pda).catch(() => null);
  if (!p) return { state: "none" as ProposalState, approved: [] };
  const kind = p.status.__kind;
  const state: ProposalState =
    kind === "Executed" || kind === "Executing" ? "executed"
    : kind === "Approved" ? "approved"
    : kind === "Rejected" ? "rejected"
    : kind === "Cancelled" ? "cancelled"
    : "active";
  return { state, approved: p.approved.map((k) => k.toBase58()) };
}

export async function confirmSignature(sig: string) {
  const st = await connection().getSignatureStatus(sig, { searchTransactionHistory: true });
  const v = st.value;
  if (!v) return false;
  if (v.err) throw new HttpError(400, "That transaction failed on-chain");
  return v.confirmationStatus === "confirmed" || v.confirmationStatus === "finalized";
}
