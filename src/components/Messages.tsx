"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ago, short } from "@/lib/client";
import { markRead } from "@/lib/inbox";

type Msg = { id: string; sender: string; body: string; created_at: string };

/** Private thread between a gig's poster and one other wallet (the referee can join the hired worker's thread in a dispute). */
export default function Messages({ gigId, peer, me, poster, worker, names, title = "Messages", tall = false }: {
  gigId: string; peer?: string | null; me: string; poster: string; worker: string; names: Record<string, string | undefined>; title?: string; tall?: boolean;
}) {
  const url = `/api/gigs/${gigId}/messages${peer ? `?peer=${encodeURIComponent(peer)}` : ""}`;
  const readKey = `${gigId}:${peer || me}`;
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const r = await api<{ messages: Msg[] }>(url);
      setMsgs(r.messages);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [url]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 6000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const lastAt = msgs?.[msgs.length - 1]?.created_at;
    if (lastAt) markRead(readKey, lastAt);
    if (msgs && msgs.length !== count.current && list.current) {
      list.current.scrollTop = list.current.scrollHeight;
      count.current = msgs.length;
    }
  }, [msgs, readKey]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await api<{ message: Msg }>(url, { body });
      setMsgs((m) => [...(m ?? []), r.message]);
      setText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const label = (w: string) => {
    if (w === me) return "You";
    const name = names[w] ?? short(w);
    const role = w === poster ? "Poster" : w === worker && worker ? "Worker" : w === peer || !peer ? "" : "Referee";
    return role ? `${name} · ${role}` : name;
  };
  const otherWallet = me === poster ? (peer || worker) : !peer || peer === me ? poster : null;
  const other = otherWallet ? names[otherWallet] ?? (otherWallet === poster ? "the poster" : short(otherWallet)) : "both sides";

  return (
    <div className="panel pad">
      <h2 className="panel-title">{title}</h2>
      <p className="hint">Private between you and {other}, shown by wallet or @handle only. If a dispute is opened on a hired gig, the referee can read it. Nobody here will ever ask for your seed phrase.</p>
      <div className={`chat-list${tall ? " tall" : ""}`} ref={list} aria-live="polite">
        {msgs === null && <p className="hint">Loading…</p>}
        {msgs && msgs.length === 0 && <p className="hint chat-empty">No messages yet. Say hi, share files or ask a question about the brief.</p>}
        {msgs?.map((m) => (
          <div key={m.id} className={`msg${m.sender === me ? " mine" : ""}`}>
            <span className="msg-meta">{label(m.sender)} · {ago(m.created_at)}</span>
            <p className="msg-body">{m.body}</p>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          className="textarea chat-input"
          rows={2}
          maxLength={2000}
          placeholder={`Message ${other}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="btn btn-ink" type="submit" disabled={busy || !text.trim()}>{busy ? "Sending…" : "Send"}</button>
      </form>
      {err && <p className="error">{err}</p>}
    </div>
  );
}
