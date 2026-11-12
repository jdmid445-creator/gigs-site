"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "./Providers";
import { api } from "@/lib/client";
import { isUnread } from "@/lib/inbox";

type T = { gig: { id: string }; last: { sender: string; created_at: string } | null };

/** Chat icon in the header, with a dot when someone wrote to you. Only shows when you're signed in. */
export default function InboxButton() {
  const { wallet } = useSession();
  const [threads, setThreads] = useState<T[]>([]);
  const [, bump] = useState(0);
  useEffect(() => {
    if (!wallet) { setThreads([]); return; }
    const load = () => api<{ threads: T[] }>("/api/messages").then((r) => setThreads(r.threads)).catch(() => {});
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    const onRead = () => bump((x) => x + 1);
    window.addEventListener("gigs:read", onRead);
    return () => { clearInterval(t); window.removeEventListener("gigs:read", onRead); };
  }, [wallet]);
  if (!wallet) return null;
  const unread = threads.filter((t) => isUnread(t.gig.id, t.last, wallet)).length;
  return (
    <Link href="/messages" className="icon-btn inbox-btn" aria-label={unread ? `Messages, ${unread} unread` : "Messages"}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 12.5a7.5 7.5 0 0 1-11.1 6.6L4 20l1-4.4A7.5 7.5 0 1 1 20 12.5z" />
      </svg>
      {unread > 0 && <span className="inbox-dot">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
