import { z } from "zod";
import { VersionedTransaction } from "@solana/web3.js";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { connection } from "@/lib/escrow";

/** Relays a wallet-signed transaction through our RPC (so a private RPC key never reaches the browser). */
export const POST = handle(async (req: Request) => {
  const wallet = await requireWallet();
  const { tx } = z.object({ tx: z.string().max(4000) }).parse(await req.json());
  const vtx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
  const signerKeys = vtx.message.staticAccountKeys.slice(0, vtx.message.header.numRequiredSignatures);
  if (!signerKeys.some((k) => k.toBase58() === wallet)) throw new HttpError(403, "Not your transaction");
  const sig = await connection().sendRawTransaction(vtx.serialize(), { skipPreflight: false, maxRetries: 3 });
  return json({ sig });
});
