import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { USDC_DECIMALS } from "./config";

export type Currency = "SOL" | "USDC";

export function decimals(c: Currency) {
  return c === "SOL" ? 9 : USDC_DECIMALS;
}

/** "1.5" -> 1500000000n for SOL. Rejects more decimals than the currency has. */
export function toBase(value: string, c: Currency): bigint {
  const v = value.trim();
  if (!/^\d+(\.\d+)?$/.test(v)) throw new Error("Enter a number like 1.5");
  const [whole, frac = ""] = v.split(".");
  const d = decimals(c);
  if (frac.length > d) throw new Error(`Too many decimals for ${c}`);
  return BigInt(whole) * 10n ** BigInt(d) + BigInt((frac + "0".repeat(d)).slice(0, d) || "0");
}

export function fromBase(amount: bigint | number | string, c: Currency): number {
  const d = decimals(c);
  return Number(BigInt(amount)) / 10 ** d;
}

export function formatAmount(amount: bigint | number | string, c: Currency) {
  const n = fromBase(amount, c);
  const max = c === "SOL" ? (n < 1 ? 3 : 2) : 2;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: max })} ${c}`;
}

export const LAMPORTS = BigInt(LAMPORTS_PER_SOL);

export function feeSplit(amount: bigint, feeBps: number) {
  const fee = (amount * BigInt(feeBps)) / 10_000n;
  return { fee, payout: amount - fee };
}
