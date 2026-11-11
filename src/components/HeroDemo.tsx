"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The vault signing itself once when it comes into view: worker signs, poster signs, it pays out.
 * It explains the product, so it plays once and stops. Click the card to watch it again.
 */
const FRAMES = [
  { worker: false, poster: false, status: "Locked", cls: "locked", note: "Needs 2 of 3 signatures to release" },
  { worker: true, poster: false, status: "Delivered", cls: "locked", note: "Worker signed, 1 of 2" },
  { worker: true, poster: true, status: "Paid", cls: "paid", note: "Released to the worker" },
];

export default function HeroDemo() {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    setI(0);
    timers.current = [setTimeout(() => setI(1), 1600), setTimeout(() => setI(2), 3200)];
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setI(2); return; }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
    }, { threshold: 0.6 });
    io.observe(el);
    const t = timers.current;
    return () => { io.disconnect(); t.forEach(clearTimeout); };
  }, []);

  const f = FRAMES[i];
  const rows = [
    { who: "Worker", what: f.worker ? "Signed the payout" : "Delivering", on: f.worker },
    { who: "Poster", what: f.poster ? "Signed the payout" : "Reviewing", on: f.poster },
    { who: "Referee", what: "Only votes in a dispute", on: false },
  ];
  return (
    <div ref={ref} className="vault" onClick={play} title="Play again"
      aria-label="Example: a gig budget locked in a 2-of-3 vault">
      <div className="vault-top">
        <span className="vault-title">Logo pack, 3 concepts</span>
        <span className="dots" aria-label={`${(f.worker ? 1 : 0) + (f.poster ? 1 : 0)} of 2 signatures`}>
          <i className={f.worker ? "on" : ""} /><i className={f.poster ? "on" : ""} /><i />
        </span>
      </div>
      <div className="vault-amt">4.5<small>SOL in the vault</small></div>
      <ul className="signers">
        {rows.map((r) => (
          <li key={r.who} className={`signer ${r.on ? "on" : ""}`}>
            <span className={`sig ${r.on ? "on" : ""}`} />
            <span className="who">{r.who}</span>
            <span className="what">{r.what}</span>
          </li>
        ))}
      </ul>
      <div className="vault-foot">
        <span>{f.note}</span>
        <span className={`status ${f.cls}`}>{f.status}</span>
      </div>
    </div>
  );
}
