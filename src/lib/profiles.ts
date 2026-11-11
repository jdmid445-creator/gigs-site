import "server-only";
import { PublicKey } from "@solana/web3.js";
import { db, Gig } from "./db";
import { fromBase } from "./money";
import { getPrices, Prices } from "./prices";

export type Profile = { wallet: string; handle: string | null; bio: string; x_handle: string | null; skills: string[]; created_at: string };

/** /u/<wallet> or /u/<handle> → wallet, or null. */
export async function resolveUser(param: string): Promise<string | null> {
  const p = decodeURIComponent(param).replace(/^@/, "");
  try {
    return new PublicKey(p).toBase58();
  } catch {
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(p)) return null;
    const { data } = await db().from("profiles").select("wallet").ilike("handle", p).maybeSingle();
    return data?.wallet ?? null;
  }
}

function usd(amount: string, currency: "SOL" | "USDC", prices: Prices) {
  const rate = currency === "USDC" ? 1 : prices.SOL ?? 0;
  return fromBase(amount, currency) * rate;
}

export async function getUserPage(wallet: string) {
  const [prof, worked, posted, reviews, prices] = await Promise.all([
    db().from("profiles").select("*").eq("wallet", wallet).maybeSingle(),
    db().from("gigs").select("*").eq("worker", wallet).in("status", ["funded", "submitted", "paid", "refunded"]).eq("hidden", false).order("updated_at", { ascending: false }).limit(100),
    db().from("gigs").select("*").eq("poster", wallet).eq("hidden", false).order("created_at", { ascending: false }).limit(100),
    db().from("reviews").select("gig_id, author, rating, body, created_at").eq("subject", wallet).order("created_at", { ascending: false }).limit(50),
    getPrices(),
  ]);
  const w = (worked.data ?? []) as Gig[];
  const p = (posted.data ?? []) as Gig[];
  const paidW = w.filter((g) => g.status === "paid");
  const refundedW = w.filter((g) => g.status === "refunded");
  const paidP = p.filter((g) => g.status === "paid");
  const sum = (gs: Gig[], c: "SOL" | "USDC") => gs.filter((g) => g.currency === c).reduce((a, g) => a + fromBase(g.amount, c), 0);
  const rv = reviews.data ?? [];

  const authors = [...new Set(rv.map((r) => r.author))];
  const { data: authorProfs } = authors.length
    ? await db().from("profiles").select("wallet, handle").in("wallet", authors)
    : { data: [] as { wallet: string; handle: string | null }[] };
  const gigTitles = new Map([...w, ...p].map((g) => [g.id, g.title]));

  return {
    profile: (prof.data as Profile | null) ?? null,
    stats: {
      done: paidW.length,
      earnedSol: sum(paidW, "SOL"),
      earnedUsdc: sum(paidW, "USDC"),
      earnedUsd: paidW.reduce((a, g) => a + usd(g.amount, g.currency, prices), 0),
      completion: paidW.length + refundedW.length ? paidW.length / (paidW.length + refundedW.length) : null,
      posted: p.length,
      paidOutUsd: paidP.reduce((a, g) => a + usd(g.amount, g.currency, prices), 0),
      rating: rv.length ? rv.reduce((a, r) => a + r.rating, 0) / rv.length : null,
      reviews: rv.length,
      inProgress: w.filter((g) => g.status === "funded" || g.status === "submitted").length,
    },
    worked: w,
    posted: p,
    reviews: rv.map((r) => ({
      ...r,
      authorHandle: authorProfs?.find((a) => a.wallet === r.author)?.handle ?? null,
      gigTitle: gigTitles.get(r.gig_id) ?? null,
    })),
  };
}

export async function getLeaderboard() {
  const [{ data }, prices] = await Promise.all([
    db().from("gigs").select("poster, worker, amount, currency").eq("status", "paid").eq("hidden", false).limit(5000),
    getPrices(),
  ]);
  const rows = (data ?? []) as Pick<Gig, "poster" | "worker" | "amount" | "currency">[];
  const workers = new Map<string, { usd: number; done: number }>();
  const posters = new Map<string, { usd: number; done: number }>();
  for (const g of rows) {
    const v = usd(g.amount, g.currency, prices);
    if (g.worker) {
      const a = workers.get(g.worker) ?? { usd: 0, done: 0 };
      a.usd += v; a.done += 1; workers.set(g.worker, a);
    }
    const b = posters.get(g.poster) ?? { usd: 0, done: 0 };
    b.usd += v; b.done += 1; posters.set(g.poster, b);
  }
  const top = (m: Map<string, { usd: number; done: number }>) =>
    [...m.entries()].sort((a, b) => b[1].usd - a[1].usd || b[1].done - a[1].done).slice(0, 20).map(([wallet, s]) => ({ wallet, ...s }));
  const tw = top(workers), tp = top(posters);
  const all = [...new Set([...tw, ...tp].map((x) => x.wallet))];
  const { data: profs } = all.length
    ? await db().from("profiles").select("wallet, handle").in("wallet", all)
    : { data: [] as { wallet: string; handle: string | null }[] };
  const handle = (w: string) => profs?.find((p) => p.wallet === w)?.handle ?? null;
  return {
    workers: tw.map((x) => ({ ...x, handle: handle(x.wallet) })),
    posters: tp.map((x) => ({ ...x, handle: handle(x.wallet) })),
    solPrice: prices.SOL,
  };
}
