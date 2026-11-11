"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ago, short } from "@/lib/client";
import { amountParts } from "./Slip";
import { Currency } from "@/lib/money";

type Item = {
  id: number;
  kind: "posted" | "funded" | "paid" | "refunded";
  at: string;
  gig: { id: string; title: string; amount: string; currency: Currency };
  who: string;
  handle: string | null;
};

const VERB: Record<Item["kind"], string> = {
  posted: "posted",
  funded: "locked",
  paid: "got paid",
  refunded: "was refunded",
};

/** What just happened on the board, refreshed every 15 seconds. New lines fade in at the top. */
export default function LiveFeed() {
  const [items, setItems] = useState<Item[] | null>(null);
  const seen = useRef<Set<number>>(new Set());
  const [fresh, setFresh] = useState<Set<number>>(new Set());

  useEffect(() => {
    let live = true;
    const load = () =>
      api<{ items: Item[] }>("/api/feed")
        .then(({ items }) => {
          if (!live) return;
          const first = seen.current.size === 0;
          const added = new Set(items.filter((i) => !seen.current.has(i.id)).map((i) => i.id));
          items.forEach((i) => seen.current.add(i.id));
          setFresh(first ? new Set() : added);
          setItems(items);
        })
        .catch(() => live && setItems((x) => x ?? []));
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 15_000);
    return () => { live = false; clearInterval(t); };
  }, []);

  return (
    <aside className="feed" aria-label="Live activity">
      <div className="feed-head">
        <h2>Live</h2>
        <span className="live-dot" aria-hidden />
      </div>
      {items === null && <p className="hint">Loading…</p>}
      {items?.length === 0 && <p className="hint">Nothing yet. New gigs and payouts show up here as they happen.</p>}
      <ol className="feed-list">
        {items?.map((i) => (
          <li key={i.id} className={`feed-item kind-${i.kind}${fresh.has(i.id) ? " is-new" : ""}`}>
            <Link href={`/gigs/${i.gig.id}`}>
              <span className="feed-line">
                <b>{i.handle ? `@${i.handle}` : short(i.who)}</b> {VERB[i.kind]}{" "}
                <span className="feed-amt">{amountParts(i.gig.amount, i.gig.currency)} {i.gig.currency}</span>
              </span>
              <span className="feed-title">{i.gig.title}</span>
              <span className="feed-when">{ago(i.at)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
