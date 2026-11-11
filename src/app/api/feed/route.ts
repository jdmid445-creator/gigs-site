import { handle, json } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const KINDS = ["posted", "funded", "paid", "refunded"];

/** The latest things that happened on the board, newest first. Only public gigs, only real events. */
export const GET = handle(async () => {
  const { data, error } = await db()
    .from("events")
    .select("id, kind, actor, created_at, gig_id, gigs!inner(id, title, amount, currency, hidden, poster, worker)")
    .in("kind", KINDS)
    .eq("gigs.hidden", false)
    .order("created_at", { ascending: false })
    .limit(16);
  if (error) throw error;

  type Row = { id: number; kind: string; actor: string | null; created_at: string; gig_id: string;
    gigs: { id: string; title: string; amount: string; currency: "SOL" | "USDC"; poster: string; worker: string | null } };
  const rows = (data ?? []) as unknown as Row[];

  // the person each line is about: the poster for new gigs and hires, the worker for payouts
  const who = (r: Row) => (r.kind === "paid" ? r.gigs.worker : r.gigs.poster) ?? r.actor ?? "";
  const wallets = [...new Set(rows.map(who).filter(Boolean))];
  const { data: profs } = wallets.length
    ? await db().from("profiles").select("wallet, handle").in("wallet", wallets)
    : { data: [] as { wallet: string; handle: string | null }[] };
  const handles = Object.fromEntries((profs ?? []).map((p) => [p.wallet, p.handle]));

  return json({
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      at: r.created_at,
      gig: { id: r.gigs.id, title: r.gigs.title, amount: r.gigs.amount, currency: r.gigs.currency },
      who: who(r),
      handle: handles[who(r)] ?? null,
    })),
  });
});
