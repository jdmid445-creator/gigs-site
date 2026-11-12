"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/Providers";
import { api, ago, short } from "@/lib/client";
import { formatAmount, Currency } from "@/lib/money";

type Q = {
  disputes: { id: string; gig_id: string; opened_by: string; reason: string; created_at: string;
    gigs: { id: string; title: string; poster: string; worker: string; amount: string; currency: Currency; status: string } | null }[];
  reports: { gig_id: string; reporter: string; reason: string; created_at: string; gigs: { id: string; title: string; hidden: boolean; status: string } | null }[];
  hidden: { id: string; title: string; status: string }[];
};

export default function Admin() {
  const { wallet, isReferee, signIn, setPickerOpen } = useSession();
  const [q, setQ] = useState<Q | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api<Q>("/api/admin/queue").then(setQ).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => { if (isReferee) load(); }, [isReferee, load]);

  if (!wallet) return <div className="page container"><div className="page-head"><div><h1>Referee</h1><p className="lede">Sign in with the referee wallet.</p></div><button className="btn btn-ink" onClick={() => signIn().catch(() => setPickerOpen(true))}>Sign in</button></div></div>;
  if (!isReferee) return <div className="page container"><div className="page-head"><div><h1>Referee</h1><p className="lede">This page is only for the referee wallet.</p></div></div></div>;

  const hide = async (id: string, hidden: boolean) => { await api("/api/admin/hide", { id, hidden }); load(); };

  return (
    <div className="page container">
      <div className="stack">
        <div className="page-head"><div><h1>Referee</h1><p className="lede">Open disputes, reported listings and anything hidden.</p></div></div>
        {err && <p className="error">{err}</p>}
        <section className="panel pad">
          <h2 className="panel-title">Open disputes ({q?.disputes.length ?? 0})</h2>
          {q?.disputes.length === 0 && <p className="muted">No disputes right now.</p>}
          {q?.disputes.map((d) => d.gigs && (
            <div key={d.id} className="item">
              <div className="item-top">
                <Link href={`/gigs/${d.gig_id}`}><strong>{d.gigs.title}</strong></Link>
                <span>{formatAmount(d.gigs.amount, d.gigs.currency)}</span>
              </div>
              <span className="muted small">Opened by the {d.opened_by === d.gigs.poster ? "poster" : "worker"} ({short(d.opened_by)}) {ago(d.created_at)}</span>
              <p className="prose">{d.reason}</p>
              <div><Link className="btn btn-ink btn-sm" href={`/gigs/${d.gig_id}`}>Review and vote</Link></div>
            </div>
          ))}
        </section>
        <section className="panel pad">
          <h2 className="panel-title">Reports</h2>
          {q?.reports.length === 0 && <p className="muted">No reports.</p>}
          {q?.reports.map((r, i) => r.gigs && (
            <div key={i} className="item">
              <div className="item-top">
                <Link href={`/gigs/${r.gig_id}`}>{r.gigs.title}</Link>
                <button className="btn btn-soft btn-sm" onClick={() => hide(r.gig_id, !r.gigs!.hidden)}>{r.gigs.hidden ? "Restore listing" : "Hide listing"}</button>
              </div>
              <span className="muted small">{short(r.reporter)}, {ago(r.created_at)}</span>
              <p>{r.reason}</p>
            </div>
          ))}
        </section>
        {q && q.hidden.length > 0 && (
          <section className="panel pad">
            <h2 className="panel-title">Hidden listings</h2>
            {q.hidden.map((g) => (
              <div key={g.id} className="item-top">
                <Link href={`/gigs/${g.id}`}>{g.title}</Link>
                <button className="btn btn-soft btn-sm" onClick={() => hide(g.id, false)}>Restore</button>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
