"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "./Providers";
import { api } from "@/lib/client";
import { isUnread } from "@/lib/inbox";

type T = { key: string; last: { sender: string; created_at: string } | null };

/** How many threads have something new you haven't read, refreshed every 30 seconds. */
function useUnread() {
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
  return wallet ? threads.filter((t) => isUnread(t.key, t.last, wallet)).length : 0;
}

/** "Messages" in the top navigation, with the unread count. */
export function NavMessages() {
  const unread = useUnread();
  return (
    <Link href="/messages" className="nav-msg" aria-label={unread ? `Messages, ${unread} unread` : undefined}>
      Messages{unread > 0 && <span className="nav-count">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}

/** Chat icon in the header on phones, where the navigation links are hidden. */
export default function InboxButton() {
  const unread = useUnread();
  return (
    <Link href="/messages" className="icon-btn inbox-btn" aria-label={unread ? `Messages, ${unread} unread` : "Messages"}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 12.5a7.5 7.5 0 0 1-11.1 6.6L4 20l1-4.4A7.5 7.5 0 1 1 20 12.5z" />
      </svg>
      {unread > 0 && <span className="inbox-dot">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
