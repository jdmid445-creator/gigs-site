import { PublicKey } from "@solana/web3.js";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Gigs";

export type Cluster = "mainnet-beta" | "devnet";
export const CLUSTER: Cluster =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet";

/** RPC used in the browser for sending signed transactions. */
export const PUBLIC_RPC =
  process.env.NEXT_PUBLIC_RPC_URL ||
  (CLUSTER === "mainnet-beta" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");

/** RPC used on the server for building, simulating and verifying (can be a private Helius URL). */
export const SERVER_RPC = process.env.SOLANA_RPC_URL || PUBLIC_RPC;

export const USDC_MINT = new PublicKey(
  CLUSTER === "mainnet-beta"
    ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    : "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);
export const USDC_DECIMALS = 6;

/** Your referee wallet: the 3rd key on every vault, and the only wallet allowed into /admin. */
export const REFEREE = process.env.NEXT_PUBLIC_REFEREE_WALLET || "";

/** Optional platform fee taken from each payout (basis points, 100 = 1%). Capped at 10%. */
export const FEE_BPS = Math.min(Math.max(Number(process.env.NEXT_PUBLIC_FEE_BPS || 0), 0), 1000);
export const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "";

export const CATEGORIES = [
  "Design",
  "Video & motion",
  "Writing & threads",
  "Dev & bots",
  "Community & mod",
  "Raids & engagement",
  "Research",
  "Other online work",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const MIN_AMOUNT = { SOL: 0.01, USDC: 1 } as const;
export const MAX_AMOUNT = { SOL: 500, USDC: 50_000 } as const;

export function explorerTx(sig: string) {
  return `https://solscan.io/tx/${sig}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
}
export function explorerAccount(addr: string) {
  return `https://solscan.io/account/${addr}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
}
export function squadsVaultUrl(multisig: string) {
  return `https://app.squads.so/squads/${multisig}/home`;
}
