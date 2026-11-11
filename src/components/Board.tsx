"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GigRow, { SlipGig } from "./Slip";
import { CATEGORIES } from "@/lib/config";
import { api, ago, short } from "@/lib/client";
import Bunny from "./Bunny";

type Gig = SlipGig & { poster: string; description?: string };
type Res = { gigs: Gig[]; totals: { lockedSol: number; lockedUsdc: number; paidCount: number } };

const TABS = [
  { id: "open", label: "Open" },
  { id: "active", label: "In progress" },
  { id: "done", label: "Paid" },
];

export default function Board() {
  const [status, setStatus] = useState("open");
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Res | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    setErr("");
    setData(null);
    const p = new URLSearchParams({ status, ...(cat ? { category: cat } : {}) });
    api<Res>(`/api/gigs?${p}`)
      .then((d) => live && setData(d))
      .catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [status, cat]);

  const shown = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    if (!t) return data.gigs;
    return data.gigs.filter((g) => `${g.title} ${g.category} ${g.description ?? ""}`.toLowerCase().includes(t));
  }, [data, q]);

  const t = data?.totals;
  return (
    <section className="board" id="board">
      <div className="wrap">
        <div className="board-bar">
          <div className="tabs" role="group" aria-label="Status">
            {TABS.map((x) => (
              <button key={x.id} aria-pressed={status === x.id} onClick={() => setStatus(x.id)}>{x.label}</button>
            ))}
          </div>
          <label className="search">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gigs" aria-label="Search gigs" />
          </label>
        </div>
        <div className="chips" role="group" aria-label="Category">
          <button className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>All work</button>
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {err && (
          <div className="empty">
            <h3>The board didn&apos;t load</h3>
            <p className="muted">{err}</p>
          </div>
        )}
        {!data && !err && (
          <div className="list" aria-busy>
            {[0, 1, 2, 3].map((i) => <div key={i} className="placeholder-row"><i /><i /></div>)}
          </div>
        )}
        {data && shown.length === 0 && (
          <div className="empty empty-bunny">
            <Bunny size={130} id="gigs-empty" mood="sleep" title="GIGS napping" />
            <h3>{q ? `Nothing matches “${q}”` : status === "open" ? "No open gigs here yet" : "Nothing here yet"}</h3>
            <p className="muted">Post one. Your budget stays in your wallet until you hire someone.</p>
            <Link className="btn primary" href="/post">Post a gig</Link>
          </div>
        )}
        {data && shown.length > 0 && (
          <div className="list">
            {shown.map((g) => (
              <GigRow
                key={g.id}
                gig={g}
                meta={
                  <>
                    <span>{g.deadline_days} day deadline</span>
                    <span>{short(g.poster)}</span>
                    <span>{ago(g.created_at)}</span>
                  </>
                }
              />
            ))}
          </div>
        )}
        {t && (t.lockedSol > 0 || t.lockedUsdc > 0 || t.paidCount > 0) && (
          <div className="totals">
            <span><b>{t.lockedSol.toLocaleString("en-US", { maximumFractionDigits: 2 })} SOL</b>and <b>{t.lockedUsdc.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC</b>locked right now</span>
            <span><b>{t.paidCount}</b>gigs paid out</span>
          </div>
        )}
      </div>
    </section>
  );
}
