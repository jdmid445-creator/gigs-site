"use client";
import { useEffect, useState } from "react";
import { fromBase, Currency } from "@/lib/money";

export type Prices = { SOL: number | null; USDC: number };

let shared: Prices | null = null;
let inflight: Promise<Prices | null> | null = null;
const listeners = new Set<(p: Prices) => void>();

function load() {
  if (!inflight) {
    inflight = fetch("/api/prices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Prices | null) => {
        if (p) { shared = p; listeners.forEach((l) => l(p)); }
        return p;
      })
      .catch(() => null)
      .finally(() => { setTimeout(() => (inflight = null), 55_000); });
  }
  return inflight;
}

/** One shared price fetch for the whole page, refreshed every minute. */
export function usePrices() {
  const [p, setP] = useState<Prices | null>(shared);
  useEffect(() => {
    listeners.add(setP);
    load();
    const t = setInterval(load, 60_000);
    return () => { listeners.delete(setP); clearInterval(t); };
  }, []);
  return p;
}

export function usdValue(amount: string | number | bigint, currency: Currency, p: Prices | null) {
  const rate = currency === "USDC" ? 1 : p?.SOL;
  if (!rate) return null;
  return fromBase(BigInt(amount), currency) * rate;
}

export function formatUsd(n: number | null) {
  if (n === null) return "";
  if (n >= 100) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "≈ $1,050" for SOL budgets; nothing for USDC, where the number already is dollars. */
export function UsdHint({ amount, currency, className = "usd" }: { amount: string; currency: Currency; className?: string }) {
  const p = usePrices();
  if (currency === "USDC") return null;
  const v = usdValue(amount, currency, p);
  if (v === null) return null;
  return <span className={className}>≈ {formatUsd(v)}</span>;
}
