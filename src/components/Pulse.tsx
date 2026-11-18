"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Bunny from "./Bunny";
import PaidTicket from "./PaidTicket";

// The homepage opener, after the Pulse 3D layout: one pinned screen driven by native scroll.
// 0 to 1: GIGS falls away and the bunny hops aside. 0.75: the three steps slide in.
// 1.15 to 1.65: the dark panel rises over a blurred first screen. 1.45 to 3.5: the story turns on a drum.

const TITLE = "GIGS";

const TILES = [
  { t: "Post a gig for free", href: "/post", o: 120 },
  { t: "The budget waits in a 2 of 3 vault", href: "/#how", o: 180 },
  { t: "Paid out when the work is done", href: "/#board", o: 240 },
];

const LINES = [
  "Gigs is a [job board] for [crypto work]:",
  "[logos], [edits], [threads], [bots],",
  "[raids], [research] and [community].",
  "Post what you need, [set a budget]",
  "and pick [who you want] to hire.",
  "Hiring [locks the budget] in its own",
  "[Squads vault] with [three signers]:",
  "[you], [the worker] and [a referee].",
  "Any [two signatures] move the money,",
  "so [nobody can take it alone],",
  "[us included].",
  "",
  "The worker can [see the money]",
  "is there [before they start].",
  "When the work [is delivered],",
  "you both sign and the vault",
  "[pays them directly].",
  "If you disagree, [the referee]",
  "reads both sides and [casts the vote].",
  "Every payout builds a [public profile],",
  "so the [next gig] is [easier to win].",
];

const WORK = ["Logos", "Banners", "Video edits", "Threads", "Memes", "Discord mods", "Bots", "Raids", "Research", "Websites", "Stickers", "Translations"];

const MAX = 3.5;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function line(l: string) {
  if (!l) return " ";
  return l.split(/(\[[^\]]+\])/).filter(Boolean).map((s, i) => (s[0] === "[" ? <b key={i}>{s.slice(1, -1)}</b> : <span key={i}>{s}</span>));
}

export default function Pulse() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));
    const first = el.querySelector<HTMLElement>(".pz-first")!;
    const second = el.querySelector<HTMLElement>(".pz-second")!;
    const bunny = el.querySelector<HTMLElement>(".pz-bunny")!;
    const intro = el.querySelector<HTMLElement>(".pz-intro")!;
    const tileBox = el.querySelector<HTMLElement>(".pz-tiles")!;
    const chars = q(".pz-char");
    const tiles = q(".pz-tile");
    const drum = q(".pz-drum p");
    const header = document.querySelector<HTMLElement>(".site-header");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let target = 0, cur = 0, raf = 0, hov = -1, dirty = true;
    const read = () => {
      const r = el.getBoundingClientRect();
      const run = el.offsetHeight - window.innerHeight;
      target = run > 0 ? clamp01(-r.top / run) * MAX : 0;
      header?.classList.toggle("on-pulse", r.bottom > 72);
    };
    tiles.forEach((t, i) => {
      t.addEventListener("mouseenter", () => { hov = i; dirty = true; });
      t.addEventListener("mouseleave", () => { hov = -1; dirty = true; });
    });

    const draw = (p: number) => {
      const w = window.innerWidth, desk = w >= 768;
      // 1. GIGS falls letter by letter
      const hp = Math.min(1, p);
      chars.forEach((c, i) => {
        const e = inOut(clamp01(hp * 1.45 - i * 0.15));
        c.style.transform = `translateY(calc(${e * 300}% + ${e * 25}vh)) scale(${1 - e * 0.1}, ${1 + e * 0.2})`;
        c.style.opacity = String(1 - e);
      });
      intro.style.opacity = String(1 - clamp01(hp / 0.45));
      intro.style.transform = `translateY(${-clamp01(hp / 0.45) * 24}px)`;
      // the bunny hops from the title to the right side
      const b = inOut(clamp01(hp / 0.9));
      const hop = Math.sin(b * Math.PI) * (desk ? 90 : 50);
      const x = desk ? b * 24 : 0, y = desk ? b * -3 : b * -4;
      bunny.style.transform = `translate(calc(-50% + ${x}vw), calc(${y}vh - ${hop}px)) rotate(${Math.sin(b * Math.PI) * -8}deg) scale(${1 + b * (desk ? 0.08 : 0)})`;
      // 2. the steps slide in
      const ep = clamp01((p - 0.75) / 0.22);
      tileBox.classList.toggle("off", p <= 0.75);
      tiles.forEach((t, i) => {
        const off = +(TILES[i].o) * (desk ? 1 : 0.25);
        let ty = 0, sc = 1;
        if (desk && hov >= 0) { if (i === hov) sc = 1.08; else ty = (i < hov ? -1 : 1) * 10; }
        t.style.opacity = String(ep);
        t.style.filter = ep < 1 ? `blur(${(1 - ep) * 12}px)` : "none";
        t.style.transform = `translate(${(ep - 1) * off}px, ${ty}px) scale(${sc})`;
      });
      // 3. the dark panel rises
      const sp = clamp01((p - 1.15) / 0.5), er = 1 - Math.pow(1 - sp, 3);
      first.style.filter = sp > 0 && !still ? `blur(${Math.sin((sp * Math.PI) / 2) * 32}px)` : "none";
      second.style.transform = `translateY(${(1 - er) * 100}%)`;
      second.style.visibility = sp > 0 ? "visible" : "hidden";
      // 4. the drum
      if (sp > 0) {
        const R = desk ? 380 : 300, LH = desk ? 36 : 28;
        const ti = clamp01((p - 1.45) / 1.95) * (LINES.length - 1);
        drum.forEach((d, i) => {
          const ty = (i - ti) * LH, a = ty / R;
          if (Math.abs(a) > Math.PI / 2) { d.style.opacity = "0"; return; }
          const c = Math.cos(a), bl = Math.min(6, Math.max(0, (Math.abs(i - ti) - 1.5) * 0.75));
          d.style.transform = `translateY(${ty}px) translateZ(${c * R - R}px) rotateX(${(-a * 180 / Math.PI) * 0.8}deg) scale(${0.78 + c * 0.22})`;
          d.style.opacity = String(Math.max(0, (c - 0.2) / 0.8) * (LINES[i] ? 1 : 0.3));
          d.style.filter = bl > 0.1 && !still ? `blur(${bl}px)` : "none";
        });
      }
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const d = target - cur;
      if (!dirty && Math.abs(d) < 0.0005) return;
      cur = still || Math.abs(d) < 0.0005 ? target : cur + d * 0.12;
      dirty = false;
      draw(cur);
    };
    const onScroll = () => { read(); if (still) dirty = true; };
    read(); cur = target; draw(cur);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const onResize = () => { dirty = true; };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("resize", onResize);
      header?.classList.remove("on-pulse");
    };
  }, []);

  return (
    <section ref={root} className="pulse" aria-label="Gigs">
      <div className="pz-stage">
        <div className="pz-first">
          <div className="pz-intro">
            <h1 className="pz-lede">Crypto work, paid from a vault</h1>
            <p className="pz-sub">Hire anyone for design, edits, threads or code. The budget waits in a 2 of 3 vault until the work is done.</p>
            <div className="pz-cta">
              <Link href="/post" className="pz-btn">Post a gig</Link>
              <Link href="/#board" className="pz-btn pz-btn-q">Find work</Link>
            </div>
          </div>

          <div className="pz-bunny" aria-hidden>
            <Bunny full size={300} id="gigs-pulse" title="" ground={false} />
            <span className="pz-shadow" />
          </div>

          <div className="pz-title" aria-hidden>
            {TITLE.split("").map((c, i) => <span key={i} className="pz-char">{c}</span>)}
          </div>

          <div className="pz-tiles off">
            {TILES.map((t) => (
              <Link key={t.t} href={t.href} className="pz-tile"><span>{t.t}</span></Link>
            ))}
          </div>
        </div>

        <div className="pz-second">
          <span className="pz-pill" aria-hidden />
          <div className="pz-drum" aria-hidden>
            <div className="pz-drum-in">
              {LINES.map((l, i) => <p key={i}>{line(l)}</p>)}
            </div>
          </div>
          <p className="sr-only">{LINES.join(" ").replace(/[[\]]/g, "")}</p>
          <div className="pz-ticket"><PaidTicket /></div>
          <div className="pz-mq">
            <div className="pz-mq-row">
              <div className="pz-track">
                {[...WORK, ...WORK].map((w, i) => <span key={i}>{w}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
