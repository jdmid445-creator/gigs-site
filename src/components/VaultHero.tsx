"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

// The opening screen, one centred column: the promise, two actions, then a brushed-metal vault card
// that walks through one gig: funded, delivered, paid. The step buttons under it pick the step.

const STEPS = [
  { key: "Funded", sub: "The budget sits in a 2 of 3 vault before anyone starts", signed: [true, false, false] },
  { key: "Delivered", sub: "The worker hands over the files and signs the payout", signed: [false, true, false] },
  { key: "Paid", sub: "You sign too, and the vault pays their wallet directly", signed: [true, true, false] },
];
const SIGNERS = ["Poster", "Worker", "Referee"];

export default function VaultHero() {
  const [step, setStep] = useState(0);
  const touched = useRef(false);
  const hover = useRef(false);
  const pane = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);

  // walk through the steps on a calm clock, paused while the pointer is on the card or after a pick
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (touched.current || hover.current || document.hidden) return;
      setStep((s) => (s + 1) % STEPS.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, []);

  // the card leans toward the pointer, eased, and the light on the metal follows
  useEffect(() => {
    const el = pane.current, c = card.current;
    if (!el || !c || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      c.style.setProperty("--rx", `${(-y * 8).toFixed(3)}deg`);
      c.style.setProperty("--ry", `${(x * 10).toFixed(3)}deg`);
      c.style.setProperty("--lx", `${(50 + x * 40).toFixed(2)}%`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.4) * 2));
      go();
    };
    const leave = () => { tx = 0; ty = 0; go(); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);

  const pick = (i: number) => {
    touched.current = true;
    setStep(i);
  };
  const s = STEPS[step];

  return (
    <section className="vh2" aria-label="Gigs" ref={pane}>
      <div className="vh2-copy">
        <h1 className="vh2-title">
          <span>Crypto work,</span>
          <span>paid from a vault</span>
        </h1>
        <p className="vh2-lede">Hire anyone for design, edits, threads or code. The budget waits in a 2 of 3 vault until the work is done.</p>
        <div className="vh2-actions">
          <Link href="/post" className="vh2-btn vh2-btn-main">Post a gig</Link>
          <Link href="/#board" className="vh2-btn">Find work</Link>
        </div>
      </div>

      <div className="vh2-vault" id="vault">
        <svg className="vh2-rings" viewBox="0 0 800 800" aria-hidden>
          <circle cx="400" cy="400" r="399.5" fill="none" stroke="url(#ringUp)" />
          <circle cx="400" cy="400" r="300" fill="none" stroke="url(#ringUp)" />
        </svg>
        <div className="vx-stage">
          <div className="vx-float">
            <div className="vx-card" ref={card} onPointerEnter={() => { hover.current = true; }} onPointerLeave={() => { hover.current = false; }}>
              <div className="vx-card-top">
                <span className="vx-brand"><Logo size={18} /> Gigs</span>
                <span>Vault 0412</span>
              </div>
              <div className="vx-card-mid">
                <span className="vx-state-box"><span key={s.key} className="vx-state vx-swap">{s.key}</span></span>
                <span className="vx-gig">Logo for a Solana token</span>
              </div>
              <div className="vx-card-amt">2.5 <small>SOL</small></div>
              <ul className="vx-signers">
                {SIGNERS.map((n, i) => (
                  <li key={n} className={s.signed[i] ? "on" : undefined}><i aria-hidden />{n}</li>
                ))}
              </ul>
              <span key={`sheen-${step}`} className="vx-sheen" aria-hidden />
            </div>
          </div>
        </div>

        <div className="vh2-steps" role="group" aria-label="Steps of a gig">
          {STEPS.map((x, i) => (
            <button key={x.key} className={i === step ? "is-on" : undefined} aria-pressed={i === step} onClick={() => pick(i)}>
              <span className="vh2-step-n">{i + 1}</span>{x.key}
            </button>
          ))}
        </div>
        <p className="vh2-sub" aria-live="polite"><span key={s.key} className="vx-swap">{s.sub}</span></p>
      </div>
    </section>
  );
}
