"use client";
import { useEffect, useState } from "react";
import GuardBunny from "./GuardBunny";

/**
 * The vault, signing itself: worker approves, poster approves, funds release.
 * The only animated moment on the page.
 */
const FRAMES = [
  { worker: false, poster: false, status: "Locked", cls: "locked", note: "Needs 2 of 3 to release" },
  { worker: true, poster: false, status: "Delivered", cls: "locked", note: "Worker signed, 1 of 2" },
  { worker: true, poster: true, status: "Paid", cls: "paid", note: "Released to the worker" },
];

export default function HeroDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % FRAMES.length), 2400);
    return () => clearInterval(t);
  }, []);
  const f = FRAMES[i];
  const rows = [
    { who: "Worker", what: f.worker ? "Signed payout" : "Delivering", on: f.worker },
    { who: "Poster", what: f.poster ? "Signed payout" : "Reviewing", on: f.poster },
    { who: "Referee", what: "Only votes in a dispute", on: false },
  ];
  return (
    <div className="vault has-guard" aria-label="Example: a gig budget locked in a 2-of-3 vault">
      <GuardBunny variant="hero" intro="I keep an eye on every vault." />
      <div className="vault-top">
        <span className="vault-title">Logo pack, 3 concepts</span>
      </div>
      <div className="vault-amt">4.5<small>SOL locked</small></div>
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
