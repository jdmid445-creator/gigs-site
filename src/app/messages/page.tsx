"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/Providers";
import Messages from "@/components/Messages";
import { api, ago, short } from "@/lib/client";
import { isUnread } from "@/lib/inbox";

type Thread = {
  gig: { id: string; title: string; status: string; amount: string; currency: string; poster: string; worker: string | null };
  role: "poster" | "worker" | "referee";
  other: string | null;
  otherHandle: string | null;
  last: { sender: string; body: string; created_at: string } | null;
  count: number;
  updated: string;
};

const STATUS: Record<string, string> = { funded: "In progress", submitted: "Delivered", paid: "Paid", refunded: "Refunded" };

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
    const q = new URLSearchParams(window.location.search).get("gig");
    if (q) setOpen(q);
  }, []);
  useEffect(() => {
    if (!open && threads?.length && window.matchMedia("(min-width: 900px)").matches) setOpen(threads[0].gig.id);
  }, [threads, open]);

  if (loading) return <div className="page container"><p className="muted">Loading…</p></div>;
  if (!wallet)
    return (
      <div className="page container">
        <div className="page-head">
          <div>
            <h1>Messages</h1>
            <p className="lede">Sign in with your wallet to see your conversations with the people you hired or worked for.</p>
          </div>
          <button className="btn btn-ink" onClick={() => signIn().catch(() => setPickerOpen(true))}>Sign in</button>
        </div>
      </div>
    );

  const name = (t: Thread) => t.role === "referee" ? "Dispute" : t.otherHandle ? `@${t.otherHandle}` : short(t.other ?? "");
  const current = threads?.find((t) => t.gig.id === open) ?? null;

  return (
    <div className="page container">
      <div className="page-head">
        <div>
          <h1>Messages</h1>
          <p className="lede">Every conversation with the people you hired or worked for, in one place.</p>
        </div>
      </div>

      {off && <div className="notice warn" style={{ marginBottom: 20 }}>Messages aren&apos;t switched on yet. Run the messages SQL in Supabase to turn them on.</div>}

      {threads && threads.length === 0 ? (
        <div className="panel pad inbox-empty">
          <p className="prose">No conversations yet. A thread opens on a gig as soon as someone is hired and the budget is locked.</p>
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
              const unread = isUnread(t.gig.id, t.last, wallet);
              return (
                <button key={t.gig.id} role="listitem" className={`thread${open === t.gig.id ? " on" : ""}${unread ? " unread" : ""}`} onClick={() => setOpen(t.gig.id)}>
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
                  <span className="hint">{STATUS[current.gig.status] ?? current.gig.status} · you&apos;re the {current.role}</span>
                </div>
                <Messages
                  key={current.gig.id}
                  gigId={current.gig.id}
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
