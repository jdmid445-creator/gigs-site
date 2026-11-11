"use client";
import { useEffect, useRef, useState } from "react";
import Bunny, { Mood } from "./Bunny";

// GIGS guarding a card: pops up the first time you scroll to him and says something.
// Tap him: he ducks, peeks back up to his eyes, says a line, then hops back up.
const LINES = [
  "The budget's locked. I checked twice.",
  "Two signatures and it hops out.",
  "Nobody runs off with the carrots.",
  "I don't hold the money. The vault does.",
  "Deliver the work, get the bag.",
  "Say what “done” means. Saves a fight later.",
];

type Phase = "hidden" | "rise" | "idle" | "down" | "peek" | "up";

export default function GuardBunny({
  variant = "",
  intro = "",
  mood = "idle",
}: {
  variant?: string;
  intro?: string;
  mood?: Mood;
}) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [line, setLine] = useState("");
  const [bubble, setBubble] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const next = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  const still = () => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  };

  useEffect(() => {
    next.current = Math.floor(Math.random() * LINES.length);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (still() || typeof IntersectionObserver === "undefined" || !el) {
      setPhase("idle");
      return;
    }
    let done = false;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const go = () => {
      if (done) return;
      done = true;
      io.disconnect();
      setLine(intro || LINES[next.current++ % LINES.length]);
      setPhase("rise");
      at(450, () => setBubble(true));
      at(900, () => setPhase("idle"));
      at(4200, () => setBubble(false));
    };
    const io = new IntersectionObserver(
      (entries) => {
        clearTimeout(settle);
        if (entries.some((e) => e.isIntersecting)) settle = setTimeout(go, 300);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(settle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tap() {
    if (phase !== "idle") return;
    setLine(LINES[next.current++ % LINES.length]);
    if (still()) { setBubble(true); at(3000, () => setBubble(false)); return; }
    setPhase("down");
    at(320, () => setPhase("peek"));
    at(700, () => setBubble(true));
    at(3600, () => { setPhase("up"); setBubble(false); });
    at(4100, () => setPhase("idle"));
  }

  return (
    <div ref={box} className={`guard${variant ? ` guard-${variant}` : ""}`}>
      <span className={`guard-bubble${bubble ? " is-on" : ""}`} role="status" aria-live="polite">{line}</span>
      <button type="button" className={`guard-bunny is-${phase}`} onClick={tap} aria-label="Tap GIGS the bunny">
        <Bunny size={120} id={`gigs-guard${variant ? `-${variant}` : ""}`} mood={mood} ground={false} title="" />
      </button>
    </div>
  );
}
