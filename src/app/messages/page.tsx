"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/Providers";
import Messages from "@/components/Messages";
import { api, ago, short } from "@/lib/client";
import { isUnread } from "@/lib/inbox";

type Thread = {
  key: string;
  peer: string;
  gig: { id: string; title: string; status: string; amount: string; currency: string; poster: string; worker: string | null };
  role: "poster" | "worker" | "seller" | "referee";
  other: string | null;
  otherHandle: string | null;
  last: { sender: string; body: string; created_at: string } | null;
  count: number;
  updated: string;
};

const STATUS: Record<string, string> = { open: "Open", hiring: "Hiring", funded: "In progress", submitted: "Delivered", paid: "Paid", refunded: "Refunded", cancelled: "Closed" };
const ROLE: Record<Thread["role"], string> = { poster: "you posted this gig", worker: "you\u2019re the worker", seller: "you asked about this gig", referee: "you\u2019re the referee" };

export default function Inbox() {
  const { wallet, signIn, setPickerOpen, loading } = useSession();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [off, setOff] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [, bump] = useState(0);

  const load = useCallback(async () => {
    const r = await api<{ threads: Thread[]; off?: boolean }>("/api/messages");
    setThreads(r.threads);
    setOff(!!r.off);
  }, []);

  useEffect(() => {
    if (!wallet) return;
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 10000);
    const onRead = () => bump((x) => x + 1);
    window.addEventListener("gigs:read", onRead);
    return () => { clearInterval(t); window.removeEventListener("gigs:read", onRead); };
  }, [wallet, load]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const g = sp.get("gig"), p = sp.get("peer");
    if (g) setOpen(p ? `${g}:${p}` : g);
  }, []);
  useEffect(() => {
    if (!threads?.length) return;
    // a link with only ?gig= opens the first thread on that gig
    if (open && !open.includes(":")) { const t = threads.find((x) => x.gig.id === open); if (t) setOpen(t.key); return; }
    if (!open && window.matchMedia("(min-width: 900px)").matches) setOpen(threads[0].key);
  }, [threads, open]);

  if (loading) return <div className="page container"><p className="muted">Loading…</p></div>;
  if (!wallet)
    return (
      <div className="page container">
        <div className="page-head">
          <div>
            <h1>Messages</h1>
            <p className="lede">Sign in with your wallet to see your conversations about gigs you posted, asked about or worked on.</p>
          </div>
          <button className="btn btn-ink" onClick={() => signIn().catch(() => setPickerOpen(true))}>Sign in</button>
        </div>
      </div>
    );

  const name = (t: Thread) => t.role === "referee" ? "Dispute" : t.otherHandle ? `@${t.otherHandle}` : short(t.other ?? "");
  const current = threads?.find((t) => t.key === open) ?? null;

  return (
    <div className="page container">
      <div className="page-head">
        <div>
          <h1>Messages</h1>
          <p className="lede">Private chats about your gigs, buyer to seller, shown by wallet or @handle only.</p>
        </div>
      </div>

      {off && <div className="notice warn" style={{ marginBottom: 20 }}>Messages aren&apos;t switched on yet. Run the messages SQL in Supabase to turn them on.</div>}

      {threads && threads.length === 0 ? (
        <div className="panel pad inbox-empty">
          <p className="prose">No conversations yet. Open any gig to message the poster, or wait for someone to ask about yours.</p>
          <div className="inbox-empty-cta">
            <Link className="btn btn-ink" href="/post">Post a gig</Link>
            <Link className="btn btn-soft" href="/#board">Find work</Link>
          </div>
        </div>
      ) : (
        <div className={`inbox${open ? " has-open" : ""}`}>
          <div className="panel inbox-list" role="list">
            {threads === null && <p className="hint pad">Loading…</p>}
            {threads?.map((t) => {
              const unread = isUnread(t.key, t.last, wallet);
              return (
                <button key={t.key} role="listitem" className={`thread${open === t.key ? " on" : ""}${unread ? " unread" : ""}`} onClick={() => setOpen(t.key)}>
                  <span className="thread-top">
                    <span className="thread-name">{name(t)}</span>
                    <span className="thread-time">{t.last ? ago(t.last.created_at) : ""}</span>
                  </span>
                  <span className="thread-gig">{t.gig.title}</span>
                  <span className="thread-last">
                    {unread && <span className="dot" aria-label="Unread" />}
                    {t.last ? `${t.last.sender === wallet ? "You: " : ""}${t.last.body}` : "No messages yet"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="inbox-thread">
            {current ? (
              <>
                <div className="inbox-thread-head">
                  <button className="btn btn-soft inbox-back" onClick={() => setOpen(null)}>← All messages</button>
                  <Link className="inline-link" href={`/gigs/${current.gig.id}`}>{current.gig.title}</Link>
                  <span className="hint">{STATUS[current.gig.status] ?? current.gig.status} · {ROLE[current.role]}</span>
                </div>
                <Messages
                  key={current.key}
                  gigId={current.gig.id}
                  peer={current.peer}
                  me={wallet}
                  poster={current.gig.poster}
                  worker={current.gig.worker ?? ""}
                  names={current.other && current.otherHandle ? { [current.other]: `@${current.otherHandle}` } : {}}
                  title={name(current)}
                  tall
                />
              </>
            ) : (
              threads && threads.length > 0 && <div className="panel pad inbox-pick"><p className="hint">Pick a conversation.</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
