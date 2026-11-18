"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { api } from "@/lib/client";
import { amountShort, Currency } from "@/lib/money";

type Gig = { id: string; title: string; category: string; amount: string; currency: Currency; deadline_days: number };

/**
 * A plain search over the open gigs: real results show right away and filter as you type,
 * with matching categories as shortcuts. Enter hands the query to the board below.
 */
export default function Finder() {
  const [gigs, setGigs] = useState<Gig[] | null>(null);
  const [q, setQ] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ gigs: Gig[] }>("/api/gigs?status=open").then((d) => setGigs(d.gigs)).catch(() => setGigs([]));
  }, []);

  const term = q.trim().toLowerCase();
  const cats = term ? CATEGORIES.filter((c) => c.toLowerCase().includes(term)).slice(0, 4) : [];
  const matches = (gigs ?? []).filter((g) => !term || `${g.title} ${g.category}`.toLowerCase().includes(term)).slice(0, 3);

  const go = (query: string) => {
    window.dispatchEvent(new CustomEvent("gigs:search", { detail: query }));
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={panel} className="finder is-owned">
      <form className="search-bar" onSubmit={(e) => { e.preventDefault(); go(q); }}>
        <span className="mag"><svg width="18" height="18" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search design, video, threads, code" aria-label="Search gigs" />
        <button type="submit" className="btn btn-ink btn-sm">Search</button>
      </form>

      <div className="finder-drop" aria-live="polite">
        {cats.length > 0 && (
          <div className="finder-cats">
            {cats.map((c) => (
              <button type="button" key={c} className="cat-chip" onClick={() => go(c)}>{c}</button>
            ))}
          </div>
        )}
        {gigs === null ? (
          <ul className="finder-results"><li className="finder-none"><span>Loading open gigs</span></li></ul>
        ) : (
          <ul className="finder-results">
            {matches.map((g) => (
              <li key={g.id}>
                <Link href={`/gigs/${g.id}`}>
                  <span className="quick-name"><strong>{g.title}</strong><span>{g.category}, {g.deadline_days} day deadline</span></span>
                  <span className="quick-val">{amountShort(g.amount, g.currency)} {g.currency}</span>
                </Link>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="finder-none">
                <span>{gigs.length ? "Nothing open for that yet" : "The board is fresh. Be the first to post a gig"}</span>
                <Link href="/post" className="btn btn-soft btn-sm">Post a gig</Link>
              </li>
            )}
            {matches.length > 0 && <li className="finder-count">{gigs.length} open gig{gigs.length === 1 ? "" : "s"} on the board</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
