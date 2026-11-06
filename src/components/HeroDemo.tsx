"use client";
import { useEffect, useState } from "react";

/** One slip that stamps through the escrow states: the single animated moment on the page. */
const STEPS = [
  { stamp: "Open", cls: "", text: "Poster lists the job and budget" },
  { stamp: "Locked", cls: "", text: "Hired: 4 SOL locked in a 2-of-3 vault" },
  { stamp: "Delivered", cls: "", text: "Worker delivers and requests payment" },
  { stamp: "Paid", cls: "paid", text: "Poster approves, the vault pays out" },
];

export default function HeroDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % STEPS.length), 2200);
    return () => clearInterval(t);
  }, []);
  const s = STEPS[i];
  return (
    <div className="demo" aria-label="Example of a gig moving through escrow">
      <div className="demo-card">
      <div className="slip">
        <div className="slip-body" style={{ paddingBottom: 26 }}>
          <span className="slip-cat">Video &amp; motion</span>
          <span className="slip-title">15s launch teaser, motion graphics only, 1:1</span>
          <div className="slip-meta">
            <span>Due in 3 days</span>
            <span>7 applicants</span>
          </div>
        </div>
        <div className="slip-stub">
          <span className="slip-amount">4</span>
          <span className="slip-cur">SOL</span>
        </div>
      </div>
      <span key={i} className={`stamp demo-stamp ${s.cls}`}>{s.stamp}</span>
      </div>
      <ol className="demo-steps">
        {STEPS.map((st, n) => (
          <li key={st.stamp} className={n === i ? "on" : ""}>
            <b>{n + 1}</b>
            {st.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
