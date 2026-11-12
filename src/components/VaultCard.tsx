"use client";
import { useEffect, useState } from "react";

/**
 * The hero's showcase: one gig ticket going through its life, Open → Locked → Paid.
 * Auto-advances like a card carousel; the dots pick a state. Example content, not live data.
 */
const STATES = [
  {
    key: "open", status: "Open", tag: "No money moves yet",
    title: ["Post it", "for free"], sub: "Nothing leaves your wallet until you hire someone.",
    sigs: 0,
  },
  {
    key: "locked", status: "Locked", tag: "In a 2 of 3 vault",
    title: ["Locked", "in a vault"], sub: "The worker sees the money before they start.",
    sigs: 1,
  },
  {
    key: "paid", status: "Paid", tag: "Sent to the worker",
    title: ["Paid in two", "signatures"], sub: "They deliver, you both sign, the vault pays out.",
    sigs: 2,
  },
] as const;

export default function VaultCard() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % STATES.length), 3600);
    return () => clearInterval(t);
  }, [paused]);

  const s = STATES[i];
  return (
    <div className="vc" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className={`vc-ticket is-${s.key}`} aria-hidden>
        <span className="vc-hole" />
        <div className="vc-top">
          <span className="vc-cat">Design</span>
          <span className={`status ${s.key === "open" ? "open" : s.key === "locked" ? "locked" : "paid"}`}>{s.status}</span>
        </div>
        <div className="vc-title">Logo for a Solana token, 3 options</div>
        <div className="vc-amt">2.5<small>SOL</small></div>
        <div className="vc-foot">
          <span>{s.tag}</span>
          <span className="vc-sigs" aria-label={`${s.sigs} of 2 signatures`}>
            {[0, 1].map((n) => <i key={n} className={n < s.sigs ? "on" : ""} />)}
          </span>
        </div>
      </div>
      <div className="vc-copy" aria-live="polite">
        <h2 className="vc-h" key={s.key}>{s.title[0]}<br />{s.title[1]}</h2>
        <p className="vc-sub">{s.sub}</p>
      </div>
      <div className="vc-dots" role="group" aria-label="Show a step">
        {STATES.map((x, n) => (
          <button key={x.key} type="button" className={n === i ? "is-active" : ""} aria-label={`Show step ${n + 1}: ${x.status}`} aria-pressed={n === i} onClick={() => { setI(n); setPaused(true); }} />
        ))}
      </div>
    </div>
  );
}
