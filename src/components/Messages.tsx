"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ago, short } from "@/lib/client";

type Msg = { id: string; sender: string; body: string; created_at: string };

/** Private thread between the poster and the hired worker (the referee joins in a dispute). */
export default function Messages({ gigId, me, poster, worker, names }: {
  gigId: string; me: string; poster: string; worker: string; names: Record<string, string | undefined>;
}) {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const r = await api<{ messages: Msg[] }>(`/api/gigs/${gigId}/messages`);
      setMsgs(r.messages);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [gigId]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 6000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (msgs && msgs.length !== count.current && list.current) {
      list.current.scrollTop = list.current.scrollHeight;
      count.current = msgs.length;
    }
  }, [msgs]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await api<{ message: Msg }>(`/api/gigs/${gigId}/messages`, { body });
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
    const role = w === poster ? "Poster" : w === worker ? "Worker" : "Referee";
    return names[w] ? `${names[w]} · ${role}` : `${short(w)} · ${role}`;
  };
  const other = me === poster ? "the worker" : me === worker ? "the poster" : "both sides";

  return (
    <div className="panel pad">
      <h2 className="panel-title">Messages</h2>
      <p className="hint">Only you and {other} can see this. The referee can read it if a dispute is opened. Nobody here will ever ask for your seed phrase.</p>
      <div className="chat-list" ref={list} aria-live="polite">
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
