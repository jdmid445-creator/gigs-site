"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { api } from "@/lib/client";
import { amountShort, Currency } from "@/lib/money";

type Gig = { id: string; title: string; category: string; amount: string; currency: Currency; deadline_days: number };

const QUERY = "Design";
const LOOP = 6200;

/**
 * A search panel that demos itself: it types a query, suggests categories, then shows real open
 * gigs from the board. Touch it and the demo stops; it becomes a real search that hands off to
 * the board below.
 */
export default function Finder() {
  const [gigs, setGigs] = useState<Gig[] | null>(null);
  const [typed, setTyped] = useState("");
  const [stage, setStage] = useState<"idle" | "typing" | "suggest" | "results">("results");
  const [owned, setOwned] = useState(false);
  const [q, setQ] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ gigs: Gig[] }>("/api/gigs?status=open").then((d) => setGigs(d.gigs)).catch(() => setGigs([]));
  }, []);

  // the self-typing loop, paused off screen and when the visitor takes over
  useEffect(() => {
    if (owned) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(QUERY); setStage("results"); return; }
    let timers: number[] = [];
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      const cycle = () => {
        timers.forEach(clearTimeout); timers = [];
        setStage("idle"); setTyped("");
        const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
        [...QUERY].forEach((_, i) => at(700 + i * 70, () => { setStage("typing"); setTyped(QUERY.slice(0, i + 1)); }));
        at(1400, () => setStage("suggest"));
        at(3000, () => setStage("results"));
        at(LOOP, cycle);
      };
      cycle();
    };
    const stop = () => { running = false; timers.forEach(clearTimeout); timers = []; };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? run() : stop()), { threshold: 0.2 });
    if (panel.current) io.observe(panel.current);
    return () => { stop(); io.disconnect(); };
  }, [owned]);

  const take = () => { if (!owned) { setOwned(true); setQ(""); setStage("suggest"); } };
  const term = (owned ? q : typed).trim().toLowerCase();
  const cats = CATEGORIES.filter((c) => !term || c.toLowerCase().includes(term)).slice(0, 4);
  const matches = (gigs ?? []).filter((g) => !term || `${g.title} ${g.category}`.toLowerCase().includes(term)).slice(0, 3);
  const showCats = stage === "suggest" || (owned && !!q && stage !== "results");
  const showResults = stage === "results" || (owned && !q);

  const go = (query: string) => {
    window.dispatchEvent(new CustomEvent("gigs:search", { detail: query }));
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={panel} className={`finder${owned ? " is-owned" : ""}`} onPointerDown={take} onFocusCapture={take}>
      <form className="search-bar" onSubmit={(e) => { e.preventDefault(); go(q); }}>
        <span className="mag"><svg width="18" height="18" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></span>
        {owned ? (
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setStage(e.target.value ? "suggest" : "results"); }}
            placeholder="Search design, video, threads, code…" aria-label="Search gigs" />
        ) : (
          <span className="finder-typed" aria-hidden>{typed ? <b>{typed}</b> : "Search design, video, threads, code…"}{stage === "typing" && <i className="caret" />}</span>
        )}
        <button type="submit" className="btn btn-ink btn-sm" tabIndex={owned ? 0 : -1}>Search</button>
      </form>

      <div className="finder-drop" aria-live="polite">
        {showCats && (
          <div className="finder-cats">
            {cats.length ? cats.map((c, i) => (
              <button type="button" key={c} className="cat-chip" style={{ "--i": i } as React.CSSProperties} onClick={() => go(c)}>{c}</button>
            )) : <span className="hint">No category matches. Search the whole board instead.</span>}
          </div>
        )}
        {showResults && gigs !== null && (
          <ul className="finder-results">
            {matches.map((g, i) => (
              <li key={g.id} style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/gigs/${g.id}`}>
                  <span className="quick-name"><strong>{g.title}</strong><span>{g.category}, {g.deadline_days} day deadline</span></span>
                  <span className="quick-val">{amountShort(g.amount, g.currency)} {g.currency}</span>
                </Link>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="finder-none" style={{ "--i": 0 } as React.CSSProperties}>
                <span>{gigs.length ? "Nothing open for that yet." : "The board is fresh. Be the first to post a gig."}</span>
                <Link href="/post" className="btn btn-soft btn-sm">Post a gig</Link>
              </li>
            )}
            {matches.length > 0 && <li className="finder-count" style={{ "--i": matches.length } as React.CSSProperties}>{gigs.length} open gig{gigs.length === 1 ? "" : "s"} on the board</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
