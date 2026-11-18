import { handle, json } from "@/lib/api";
import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { REFEREE } from "@/lib/config";
import { HIRED, tableMissing } from "@/lib/chat";

export const dynamic = "force-dynamic";

const GIG = "id,title,poster,worker,status,amount,currency,updated_at";
type G = { id: string; title: string; poster: string; worker: string | null; status: string; amount: string | number; currency: string; updated_at: string };
type M = { gig_id: string; peer: string | null; sender: string; body: string; created_at: string };

/** Every conversation you're part of: one thread per gig and person, for gigs you posted, asked about, applied to or were hired on. */
export const GET = handle(async () => {
  const wallet = await currentWallet();
  if (!wallet) return json({ wallet: null, threads: [] });

  const gigs = new Map<string, G>();
  const { data: posted } = await db().from("gigs").select(GIG).eq("poster", wallet).order("updated_at", { ascending: false }).limit(300);
  for (const g of posted ?? []) gigs.set(g.id, g as G);
  const { data: hiredOn } = await db().from("gigs").select(GIG).eq("worker", wallet).in("status", [...HIRED]).limit(300);
  for (const g of hiredOn ?? []) gigs.set(g.id, g as G);

  // messages on gigs I posted, plus threads where I'm the other side
  const postedIds = (posted ?? []).map((g) => g.id);
  const [a, b] = await Promise.all([
    postedIds.length ? db().from("messages").select("gig_id,peer,sender,body,created_at").in("gig_id", postedIds).order("created_at", { ascending: false }).limit(3000) : Promise.resolve({ data: [] as M[], error: null }),
    db().from("messages").select("gig_id,peer,sender,body,created_at").eq("peer", wallet).order("created_at", { ascending: false }).limit(2000),
  ]);
  const missing = tableMissing(a.error) || tableMissing(b.error);
  if (a.error && !tableMissing(a.error)) throw a.error;
  if (b.error && !tableMissing(b.error)) throw b.error;
  const msgs = missing ? [] : ([...(a.data ?? []), ...(b.data ?? [])] as M[]);

  type Th = { gig: string; peer: string; role: "poster" | "worker" | "seller" | "referee"; last: M | null; count: number };
  const threads = new Map<string, Th>();
  const add = (gig: string, peer: string, role: Th["role"]) => {
    const k = `${gig}:${peer}`;
    if (!threads.has(k)) threads.set(k, { gig, peer, role, last: null, count: 0 });
    return threads.get(k)!;
  };

  if (REFEREE && wallet === REFEREE) {
    const { data: disp } = await db().from("disputes").select("gig_id").limit(500);
    const ids = [...new Set((disp ?? []).map((d) => d.gig_id))].filter((id) => !gigs.has(id));
    if (ids.length) {
      const { data: more } = await db().from("gigs").select(GIG).in("id", ids);
      for (const g of more ?? []) gigs.set(g.id, g as G);
    }
    for (const id of new Set((disp ?? []).map((d) => d.gig_id))) {
      const g = gigs.get(id);
      if (g?.worker && g.poster !== wallet && g.worker !== wallet) add(g.id, g.worker, "referee");
    }
  }

  // load any gig we only know about from a message
  const unknown = [...new Set(msgs.map((m) => m.gig_id))].filter((id) => !gigs.has(id));
  if (unknown.length) {
    const { data: more } = await db().from("gigs").select(GIG).in("id", unknown);
    for (const g of more ?? []) gigs.set(g.id, g as G);
  }

  for (const g of gigs.values()) {
    if (g.worker && HIRED.has(g.status)) {
      if (g.poster === wallet) add(g.id, g.worker, "poster");
      else if (g.worker === wallet) add(g.id, wallet, "worker");
    }
  }
  for (const m of msgs) {
    const g = gigs.get(m.gig_id);
    if (!g || !m.peer) continue;
    const role = g.poster === wallet ? "poster" : m.peer === wallet ? (g.worker === wallet && HIRED.has(g.status) ? "worker" : "seller") : null;
    if (!role) continue;
    const t = add(g.id, m.peer, role);
    if (!t.last || t.last.created_at < m.created_at) t.last = m;
    t.count++;
  }

  const others = new Set<string>();
  for (const t of threads.values()) {
    const g = gigs.get(t.gig)!;
    others.add(t.role === "poster" ? t.peer : g.poster);
  }
  others.delete(wallet);
  const { data: profs } = others.size
    ? await db().from("profiles").select("wallet,handle").in("wallet", [...others])
    : { data: [] as { wallet: string; handle: string | null }[] };
  const handles = new Map((profs ?? []).map((p) => [p.wallet, p.handle]));

  const out = [...threads.values()].map((t) => {
    const g = gigs.get(t.gig)!;
    const other = t.role === "poster" ? t.peer : t.role === "referee" ? null : g.poster;
    return {
      key: `${t.gig}:${t.peer}`,
      peer: t.peer,
      gig: { id: g.id, title: g.title, status: g.status, amount: String(g.amount), currency: g.currency, poster: g.poster, worker: g.worker },
      role: t.role,
      other,
      otherHandle: other ? handles.get(other) ?? null : null,
      last: t.last ? { sender: t.last.sender, body: t.last.body, created_at: t.last.created_at } : null,
      count: t.count,
      updated: t.last?.created_at ?? g.updated_at,
    };
  }).sort((x, y) => y.updated.localeCompare(x.updated));

  return json({ wallet, threads: out, off: missing });
});
