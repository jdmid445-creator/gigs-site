"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Slip, { SlipGig } from "./Slip";
import { CATEGORIES } from "@/lib/config";
import { api, ago, short } from "@/lib/client";

type Gig = SlipGig & { poster: string };
type Res = { gigs: Gig[]; totals: { lockedSol: number; lockedUsdc: number; paidCount: number } };

const TABS = [
  { id: "open", label: "Open" },
  { id: "active", label: "In progress" },
  { id: "done", label: "Paid" },
];

export default function Board() {
  const [status, setStatus] = useState("open");
  const [cat, setCat] = useState<string | null>(null);
  const [data, setData] = useState<Res | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    setErr("");
    const q = new URLSearchParams({ status, ...(cat ? { category: cat } : {}) });
    api<Res>(`/api/gigs?${q}`)
      .then((d) => live && setData(d))
      .catch((e) => live && setErr(e.message));
    return () => {
      live = false;
    };
  }, [status, cat]);

  const t = data?.totals;
  return (
    <section className="board" id="board">
      <div className="wrap">
        {t && (t.lockedSol > 0 || t.lockedUsdc > 0 || t.paidCount > 0) && (
          <div className="totals" style={{ paddingBottom: 26 }}>
            <span><strong>{t.lockedSol.toLocaleString("en-US", { maximumFractionDigits: 2 })} SOL</strong>locked in escrow</span>
            <span><strong>{t.lockedUsdc.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC</strong>locked in escrow</span>
            <span><strong>{t.paidCount}</strong>gigs paid out</span>
          </div>
        )}
        <div className="board-head">
          <h2>Gigs</h2>
          <div className="tabs" role="group" aria-label="Status">
            {TABS.map((x) => (
              <button key={x.id} aria-pressed={status === x.id} onClick={() => setStatus(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chips" role="group" aria-label="Category">
          <button className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>

        {err && <p className="error">Couldn&apos;t load gigs: {err}</p>}
        {!data && !err && <p className="muted">Loading gigs…</p>}
        {data && data.gigs.length === 0 && (
          <div className="empty">
            <h3>{status === "open" ? "No open gigs here yet" : "Nothing here yet"}</h3>
            <p className="muted">
              Post the first one. Your budget stays in your wallet until you hire someone.
            </p>
            <Link className="btn" href="/post">Post a gig</Link>
          </div>
        )}
        {data && data.gigs.length > 0 && (
          <div className="slips">
            {data.gigs.map((g) => (
              <Slip
                key={g.id}
                gig={g}
                meta={
                  <>
                    <span>{g.deadline_days}d deadline</span>
                    <span>by {short(g.poster)}</span>
                    <span>{ago(g.created_at)}</span>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
