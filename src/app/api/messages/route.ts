import { handle, json } from "@/lib/api";
import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { REFEREE } from "@/lib/config";

export const dynamic = "force-dynamic";

const OPEN_FOR_CHAT = ["funded", "submitted", "paid", "refunded"];

/** Every conversation you're part of: gigs you posted or were hired on (and disputes, for the referee). */
export const GET = handle(async () => {
  const wallet = await currentWallet();
  if (!wallet) return json({ wallet: null, threads: [] });

  const { data: mine } = await db()
    .from("gigs").select("id,title,poster,worker,status,amount,currency,updated_at")
    .or(`poster.eq.${wallet},worker.eq.${wallet}`).not("worker", "is", null).in("status", OPEN_FOR_CHAT)
    .order("updated_at", { ascending: false }).limit(200);
  let gigs = (mine ?? []).filter((g) => g.poster === wallet || g.worker === wallet);

  if (REFEREE && wallet === REFEREE) {
    const { data: disp } = await db().from("disputes").select("gig_id").limit(500);
    const ids = [...new Set((disp ?? []).map((d) => d.gig_id))].filter((id) => !gigs.some((g) => g.id === id));
    if (ids.length) {
      const { data: more } = await db().from("gigs").select("id,title,poster,worker,status,amount,currency,updated_at").in("id", ids);
      gigs = gigs.concat(more ?? []);
    }
  }
  if (!gigs.length) return json({ wallet, threads: [] });

  const ids = gigs.map((g) => g.id);
  const { data: msgs, error } = await db()
    .from("messages").select("gig_id,sender,body,created_at").in("gig_id", ids)
    .order("created_at", { ascending: false }).limit(2000);
  const missing = !!error && (error.code === "42P01" || error.code === "PGRST205");
  if (error && !missing) throw error;

  const last = new Map<string, { sender: string; body: string; created_at: string }>();
  const counts = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (!last.has(m.gig_id)) last.set(m.gig_id, m);
    counts.set(m.gig_id, (counts.get(m.gig_id) ?? 0) + 1);
  }

  const others = [...new Set(gigs.flatMap((g) => [g.poster, g.worker]).filter((w): w is string => !!w && w !== wallet))];
  const { data: profs } = others.length
    ? await db().from("profiles").select("wallet,handle").in("wallet", others)
    : { data: [] as { wallet: string; handle: string | null }[] };
  const handles = new Map((profs ?? []).map((p) => [p.wallet, p.handle]));

  const threads = gigs.map((g) => {
    const role = g.poster === wallet ? "poster" : g.worker === wallet ? "worker" : "referee";
    const other = role === "poster" ? g.worker! : role === "worker" ? g.poster : null;
    return {
      gig: { id: g.id, title: g.title, status: g.status, amount: String(g.amount), currency: g.currency, poster: g.poster, worker: g.worker },
      role,
      other,
      otherHandle: other ? handles.get(other) ?? null : null,
      last: last.get(g.id) ?? null,
      count: counts.get(g.id) ?? 0,
      updated: last.get(g.id)?.created_at ?? g.updated_at,
    };
  }).sort((a, b) => b.updated.localeCompare(a.updated));

  return json({ wallet, threads, off: missing });
});
