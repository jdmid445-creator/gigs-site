"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ago, short } from "@/lib/client";
import { isUnread } from "@/lib/inbox";

type T = { key: string; peer: string; gig: { id: string }; role: string; otherHandle: string | null; last: { sender: string; body: string; created_at: string } | null; count: number };

/** For the poster: everyone who has messaged about this gig, each opening in Messages. */
export default function GigThreads({ gigId, skip }: { gigId: string; skip?: string | null }) {
  const [threads, setThreads] = useState<T[] | null>(null);
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => {
    const load = () => api<{ wallet: string; threads: T[] }>("/api/messages")
      .then((r) => { setMe(r.wallet); setThreads(r.threads.filter((t) => t.gig.id === gigId && t.role === "poster" && t.peer !== skip && t.count > 0)); })
      .catch(() => setThreads([]));
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 15000);
    return () => clearInterval(t);
  }, [gigId, skip]);

  return (
    <div className="panel pad">
      <h2 className="panel-title">Messages about this gig</h2>
      {threads === null ? <p className="hint">Loading…</p> : threads.length === 0 ? (
        <p className="hint">Nobody has written yet. People can message you privately from this page, and you can reply to anyone who writes or applies.</p>
      ) : (
        <ul className="gig-threads">
          {threads.map((t) => (
            <li key={t.key}>
              <Link href={`/messages?gig=${gigId}&peer=${t.peer}`} className={isUnread(t.key, t.last, me) ? "unread" : undefined}>
                <span className="thread-top">
                  <span className="thread-name">{t.otherHandle ? `@${t.otherHandle}` : short(t.peer)}</span>
                  <span className="thread-time">{t.last ? ago(t.last.created_at) : ""}</span>
                </span>
                <span className="thread-last">{t.last ? `${t.last.sender === me ? "You: " : ""}${t.last.body}` : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
