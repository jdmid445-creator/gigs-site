"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ago, short } from "@/lib/client";
import { amountShort, Currency } from "@/lib/money";
import Avatar from "./Avatar";
import { usePrices, usdValue, formatUsd } from "./usePrices";

type Item = {
  id: number;
  kind: "posted" | "funded" | "paid" | "refunded";
  at: string;
  gig: { id: string; title: string; amount: string; currency: Currency };
  who: string;
  handle: string | null;
};

const VERB: Record<Item["kind"], string> = {
  posted: "posted a gig",
  funded: "locked a budget",
  paid: "got paid",
  refunded: "was refunded",
};

/** Every new gig, lock and payout, newest first. Refreshes every 15 seconds; new rows slide in. */
export default function LiveFeed({ limit = 12, compact = false }: { limit?: number; compact?: boolean }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const seen = useRef<Set<number>>(new Set());
  const prices = usePrices();

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

  const rows = items?.slice(0, limit) ?? [];
  if (compact) {
    return (
      <ul className="now">
        {items === null && <li><span>Loading…</span></li>}
        {items?.length === 0 && <li><span>Nothing yet. The first gig shows up here.</span></li>}
        {rows.map((i) => (
          <li key={i.id}>
            <span>{i.handle ? `@${i.handle}` : short(i.who)} {VERB[i.kind]}</span>
            <b>{amountShort(i.gig.amount, i.gig.currency)} {i.gig.currency}</b>
          </li>
        ))}
      </ul>
    );
  }

  const paid = items?.filter((i) => i.kind === "paid").length ?? 0;
  return (
    <div className="card feed">
      <div className="feed-head">
        <span className="feed-title"><span className="live-dot" aria-hidden /> Live</span>
        {items && items.length > 0 && <span className="feed-totals">{items.length} recent events, {paid} payout{paid === 1 ? "" : "s"}</span>}
      </div>
      {items === null && <div className="feed-empty">Loading…</div>}
      {items?.length === 0 && <div className="feed-empty">Nothing yet. New gigs, locked budgets and payouts show up here the moment they happen.</div>}
      <ol className="feed-list">
        {rows.map((i) => {
          const usd = usdValue(i.gig.amount, i.gig.currency, prices);
          return (
            <li key={i.id} className={`kind-${i.kind}${fresh.has(i.id) ? " is-new" : ""}`}>
              <Link href={`/gigs/${i.gig.id}`}>
                <Avatar wallet={i.who} size={34} />
                <span className="feed-main">
                  <span><strong>{i.handle ? `@${i.handle}` : short(i.who)}</strong> <span className="feed-verb">{VERB[i.kind]}</span></span>
                  <span className="feed-sub">{i.gig.title}</span>
                </span>
                <span className="feed-side">
                  <span className="feed-amt">{amountShort(i.gig.amount, i.gig.currency)} {i.gig.currency}</span>
                  <span className="feed-when">{i.gig.currency === "SOL" && usd ? `${formatUsd(usd)}, ` : ""}{ago(i.at)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
