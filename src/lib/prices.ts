import "server-only";

const SOL_MINT = "So11111111111111111111111111111111111111112";
export type Prices = { SOL: number | null; USDC: number };

let cached: { at: number; value: Prices } | null = null;

/** SOL price in USD from Jupiter, cached for a minute (the keyless API allows one call every 2 seconds). */
export async function getPrices(): Promise<Prices> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  let sol: number | null = cached?.value.SOL ?? null;
  try {
    const headers: Record<string, string> = {};
    if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;
    const res = await fetch(`https://api.jup.ag/price/v3?ids=${SOL_MINT}`, { headers, next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const p = Number(data?.[SOL_MINT]?.usdPrice);
      if (Number.isFinite(p) && p > 0) sol = p;
    }
  } catch {
    // keep the last known price
  }
  cached = { at: Date.now(), value: { SOL: sol, USDC: 1 } };
  return cached.value;
}
