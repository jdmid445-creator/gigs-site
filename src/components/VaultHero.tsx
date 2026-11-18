"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

// The opening screen: copy on a graphite pane, and a brushed-metal vault card on the right
// that walks through one gig: funded, delivered, paid. The three dots pick the step.

const STEPS = [
  { key: "Funded", title: ["Locked", "before work"], sub: "The budget sits in a 2 of 3 vault before anyone starts", signed: [true, false, false] },
  { key: "Delivered", title: ["Work", "delivered"], sub: "The worker hands over the files and signs the payout", signed: [false, true, false] },
  { key: "Paid", title: ["Paid out", "two of three"], sub: "You sign too, and the vault pays their wallet directly", signed: [true, true, false] },
];
const SIGNERS = ["Poster", "Worker", "Referee"];

const ARROW = "M7 17L17 7M9 7h8v8";

export default function VaultHero() {
  const [step, setStep] = useState(0);
  const [spin, setSpin] = useState(0);
  const touched = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (touched.current) return;
      setStep((s) => (s + 1) % STEPS.length);
      setSpin((n) => n + 1);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  const pick = (i: number) => {
    touched.current = true;
    if (i === step) return;
    setStep(i);
    setSpin((n) => n + 1);
  };
  const s = STEPS[step];

  return (
    <section className="vx" aria-label="Gigs">
      <div className="vx-pane vx-left">
        <div className="vx-copy">
          <h1 className="vx-title">
            <span>Crypto work,</span>
            <span>paid from</span>
            <span>a vault</span>
          </h1>
          <p className="vx-lede">Hire anyone for design, edits, threads or code. The budget waits in a 2 of 3 vault until the work is done.</p>
        </div>
        <div className="vx-actions">
          <Link href="/post" className="vx-cta">
            <span className="vx-cta-label">Post a gig</span>
            <span className="vx-cta-arrow" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={ARROW} /></svg>
            </span>
          </Link>
          <Link href="/#board" className="vx-quiet">Find work</Link>
        </div>
      </div>

      <div className="vx-pane vx-right" id="vault">
        <svg className="vx-rings" viewBox="0 0 600 600" aria-hidden>
          <circle cx="300" cy="300" r="299.5" fill="none" stroke="url(#ringDown)" />
          <circle cx="300" cy="300" r="210" fill="none" stroke="url(#ringDown)" />
        </svg>
        <p className="vx-eyebrow">Escrow on Solana</p>

        <div className="vx-stage">
          <div className="vx-card" key={spin} data-first={spin === 0 ? "" : undefined}>
            <div className="vx-face vx-front">
              <div className="vx-card-top">
                <span className="vx-brand"><Logo size={18} /> Gigs</span>
                <span>Vault 0412</span>
              </div>
              <div className="vx-card-mid">
                <span className="vx-state">{s.key}</span>
                <span className="vx-gig">Logo for a Solana token</span>
              </div>
              <div className="vx-card-amt">2.5 <small>SOL</small></div>
              <ul className="vx-signers">
                {SIGNERS.map((n, i) => (
                  <li key={n} className={s.signed[i] ? "on" : undefined}><i aria-hidden />{n}</li>
                ))}
              </ul>
            </div>
            <div className="vx-face vx-back" aria-hidden>
              <Logo size={88} />
            </div>
          </div>
        </div>

        <div className="vx-show" aria-live="polite">
          <h2 className="vx-show-title"><span>{s.title[0]}</span><span>{s.title[1]}</span></h2>
          <p className="vx-show-sub">{s.sub}</p>
        </div>

        <div className="vx-dots" role="group" aria-label="Steps of a gig">
          {STEPS.map((x, i) => (
            <button key={x.key} className={i === step ? "is-on" : undefined} aria-pressed={i === step} aria-label={`Show ${x.key.toLowerCase()}`} onClick={() => pick(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
