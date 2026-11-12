"use client";
import { useEffect, useRef } from "react";
import {
  EAR_L, EAR_L_IN, EAR_R, EAR_R_IN, HEAD, MASK, NOSE, EYES, TORSO, BELLY, BELT, POUCH, FEET,
  ARM_W, SHOULDER_L, SHOULDER_R, HAND_L, handR, TICKET,
} from "@/lib/bunnyShapes";

/**
 * GIGS standing full height, drawn live as an LED dot-matrix halftone at the bottom of the hero.
 * Shading becomes dot size; his eyes and tool belt are the only color. His eyes follow the cursor,
 * he waves, blinks, twitches an ear, and every loop glitch-dissolves into a happy hop and back.
 */
const INK = "#12151b";
const LIME = "#a9d81c";
const LOOP = 14;
const LEVELS = [0, 0.26, 0.52, 0.78, 1];
const FOOT = 552; // bunny-space y of the soles

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mixAt = (t: number, on: number, off: number, dur: number) => smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t));

type Pose = { happy: boolean; blink: number; earR: number; lift: number; lx: number; ly: number; wave: number };

const cache = new Map<string, Path2D>();
function path(d: string) {
  let p = cache.get(d);
  if (!p) { p = new Path2D(d); cache.set(d, p); }
  return p;
}

/** Draws one pose in bunny space into a shade field (dot size) and an accent field (lime dots). */
function drawPose(body: CanvasRenderingContext2D, acc: CanvasRenderingContext2D, pose: Pose) {
  const shade = body.createRadialGradient(165, 170, 10, 200, 300, 330);
  shade.addColorStop(0, "#cdcdcd");
  shade.addColorStop(0.42, "#727272");
  shade.addColorStop(1, "#101010");

  // feet stay on the ground while he hops
  body.fillStyle = "#6c6c6c";
  for (const f of FEET) { body.beginPath(); body.ellipse(f.cx, f.cy + 4, f.rx, f.ry, 0, 0, Math.PI * 2); body.fill(); }

  for (const x of [body, acc]) { x.save(); x.translate(0, -pose.lift); }

  body.fillStyle = shade;
  body.fill(path(TORSO));
  body.fillStyle = "rgba(255,255,255,0.18)";
  body.fill(path(BELLY));

  // arm with the work ticket
  body.lineCap = "round";
  body.strokeStyle = "#3c3c3c";
  body.lineWidth = ARM_W;
  body.beginPath(); body.moveTo(SHOULDER_L.x, SHOULDER_L.y); body.lineTo(HAND_L.x, HAND_L.y); body.stroke();
  body.save();
  body.translate(HAND_L.x - 18, HAND_L.y - 16);
  body.rotate(TICKET.angle);
  body.fillStyle = "#d4d4d4";
  body.strokeStyle = "#5a5a5a";
  body.lineWidth = 6;
  body.beginPath(); body.roundRect(-TICKET.w / 2, -TICKET.h / 2, TICKET.w, TICKET.h, 6); body.fill(); body.stroke();
  body.fillStyle = "#4a4a4a";
  body.fillRect(-18, -22, 28, 7); body.fillRect(-18, -6, 36, 7);
  body.restore();
  body.fillStyle = "#454545";
  body.beginPath(); body.arc(HAND_L.x, HAND_L.y, 19, 0, Math.PI * 2); body.fill();

  // ears
  body.fillStyle = shade;
  body.fill(path(EAR_L));
  body.fillStyle = "#b8b8b8";
  body.fill(path(EAR_L_IN));
  body.save();
  body.translate(232, 168); body.rotate(pose.earR); body.translate(-232, -168);
  body.fillStyle = shade;
  body.fill(path(EAR_R));
  body.fillStyle = "#b8b8b8";
  body.fill(path(EAR_R_IN));
  body.restore();

  body.fillStyle = shade;
  body.fill(path(HEAD));
  body.fillStyle = "#050505";
  body.fill(path(MASK));
  body.fillStyle = "#cfcfcf";
  body.fill(path(NOSE));
  body.fillStyle = "#ffffff";
  body.fillRect(190.5, 281, 19, 12);

  // waving arm
  const h = handR(pose.wave);
  body.strokeStyle = "#3c3c3c";
  body.beginPath(); body.moveTo(SHOULDER_R.x, SHOULDER_R.y); body.lineTo(h.x, h.y); body.stroke();
  body.fillStyle = "#454545";
  body.beginPath(); body.arc(h.x, h.y, 19, 0, Math.PI * 2); body.fill();

  // lime: tool belt and eyes
  acc.fillStyle = "#000";
  acc.fill(path(BELT));
  acc.fillStyle = "#fff";
  acc.fill(path(POUCH));
  body.fillStyle = "#2a2a2a";
  body.fill(path(POUCH));
  acc.fillStyle = "#000";
  acc.strokeStyle = "#000";
  if (pose.happy) {
    acc.lineWidth = 10;
    acc.lineCap = "round";
    for (const e of EYES) {
      acc.beginPath();
      acc.moveTo(e.cx - 13, e.cy + 6);
      acc.quadraticCurveTo(e.cx, e.cy - 14, e.cx + 13, e.cy + 6);
      acc.stroke();
    }
  } else {
    for (const e of EYES) {
      acc.beginPath();
      acc.ellipse(e.cx + pose.lx, e.cy + pose.ly, 11, Math.max(1.5, 17 * (1 - pose.blink)), 0, 0, Math.PI * 2);
      acc.fill();
    }
  }
  for (const x of [body, acc]) x.restore();
}

export default function DotBunny({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mk = () => {
      const c = document.createElement("canvas");
      return { c, x: c.getContext("2d", { willReadFrequently: true })! };
    };
    const A = { body: mk(), eyes: mk() };
    const B = { body: mk(), eyes: mk() };
    let boardBottom = 0;
    const maskC = document.createElement("canvas");
    const maskX = maskC.getContext("2d", { willReadFrequently: true })!;
    let mask: Uint8ClampedArray | null = null;

    let W = 0, H = 0, DPR = 1, step = 6, rowStep = 12, R = 3, cols = 0, rows = 0;
    let seeds = new Float32Array(0);
    let k = 1, ox = 0, oy = 0;
    const look = { x: 0, y: 0 }, target = { x: 0, y: 0 };

    /**
     * Paints a halo around every letter of the headline (and solid blocks around the small copy and
     * buttons) so the dots fill in between the letters but never touch them. Also returns the
     * headline's last baseline, which is where GIGS stands.
     */
    const measure = () => {
      const r = canvas.getBoundingClientRect();
      const copy = canvas.parentElement?.querySelector<HTMLElement>("[data-copy]");
      maskC.width = Math.max(1, Math.round(W)); maskC.height = Math.max(1, Math.round(H));
      maskX.clearRect(0, 0, W, H);
      maskX.fillStyle = maskX.strokeStyle = "#000";
      maskX.lineJoin = "round";
      let ground = H * 0.7;
      if (!copy) { mask = null; return ground; }
      const range = document.createRange();
      const halo = step * 1.25 + R;
      const title = copy.querySelector<HTMLElement>(".hero-title");
      if (title) {
        const cs = getComputedStyle(title);
        maskX.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        maskX.textBaseline = "alphabetic";
        maskX.lineWidth = halo * 2;
        const asc = maskX.measureText("H").fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.9;
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = n.textContent ?? "";
          // each word is one solid cutout (no stray dots in counters), hugged by the letter halo below
          for (const m of text.matchAll(/\S+/g)) {
            range.setStart(n, m.index!); range.setEnd(n, m.index! + m[0].length);
            const b = range.getBoundingClientRect();
            const capTop = b.top - r.top + asc - parseFloat(cs.fontSize) * 0.72;
            maskX.beginPath();
            maskX.roundRect(b.left - r.left - halo * 0.4, capTop, b.width + halo * 0.8, b.bottom - r.top - capTop, 6);
            maskX.fill();
          }
          for (let c = 0; c < text.length; c++) {
            if (!text[c].trim()) continue;
            range.setStart(n, c); range.setEnd(n, c + 1);
            const b = range.getBoundingClientRect();
            if (!b.width) continue;
            const x = b.left - r.left, base = b.top - r.top + asc;
            maskX.fillText(text[c], x, base);
            maskX.strokeText(text[c], x, base);
            ground = base;
          }
        }
      }
      // small copy and buttons: a clean rounded block, dots stay clear of them entirely
      for (const el of copy.querySelectorAll<HTMLElement>(".hero-side p, .hero-actions .btn")) {
        range.selectNodeContents(el);
        const boxes = el.matches(".btn") ? [el.getBoundingClientRect()] : Array.from(range.getClientRects());
        for (const b of boxes) {
          maskX.beginPath();
          maskX.roundRect(b.left - r.left - halo, b.top - r.top - halo * 0.6, b.width + halo * 2, b.height + halo * 1.2, 14);
          maskX.fill();
        }
      }
      mask = maskX.getImageData(0, 0, maskC.width, maskC.height).data;
      return ground;
    };
    const masked = (x: number, y: number) => {
      if (!mask) return false;
      const xi = Math.round(x), yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= maskC.width || yi >= maskC.height) return false;
      return mask[(yi * maskC.width + xi) * 4 + 3] > 0;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      DPR = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      const wide = W >= 900;
      step = Math.max(4.5, W / (wide ? 280 : 86));
      rowStep = step * 1.6;
      R = step * 0.48;
      cols = Math.ceil(W / step);
      rows = Math.ceil(H / rowStep);
      for (const f of [A.body, A.eyes, B.body, B.eyes]) { f.c.width = cols; f.c.height = rows; }
      seeds = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) seeds[j * cols + i] = 0.55 * hash(i, j) + 0.45 * hash(j * 3.1, 7.7);
      // GIGS stands on the headline's last baseline, full height, with the letters cutting through him.
      const ground = measure();
      boardBottom = ground;
      const top = wide ? 62 : 70;
      const SHOWN = 558 - 14; // ear tips to the soles
      k = Math.min((ground - top) / SHOWN, (W * (wide ? 0.4 : 0.9)) / 380);
      ox = W * 0.5 - 200 * k;
      oy = ground - 558 * k;
    };

    const fieldPose = (f: typeof A, pose: Pose, breathe: number) => {
      for (const ff of [f.body, f.eyes]) {
        const x = ff.x;
        x.setTransform(1, 0, 0, 1, 0, 0);
        x.fillStyle = "#fff";
        x.fillRect(0, 0, cols, rows);
        x.setTransform(cols / W, 0, 0, rows / H, 0, 0);
        x.translate(ox + 200 * k, oy + FOOT * k);
        x.scale(k * breathe, k * (2 - breathe));
        x.translate(-200, -FOOT);
      }
      drawPose(f.body.x, f.eyes.x, pose);
      return { body: f.body.x.getImageData(0, 0, cols, rows).data, eyes: f.eyes.x.getImageData(0, 0, cols, rows).data };
    };

    const render = (time: number) => {
      if (!W || !H) return;
      const t = ((time % LOOP) + LOOP) % LOOP;
      look.x += (target.x - look.x) * 0.08;
      look.y += (target.y - look.y) * 0.08;
      const breathe = still ? 1 : 1 + 0.008 * Math.sin((t / LOOP) * Math.PI * 6);
      const blink = still ? 0 : Math.max(smooth(2.1, 2.18, t) * (1 - smooth(2.22, 2.32, t)), smooth(11.4, 11.48, t) * (1 - smooth(11.52, 11.62, t)));
      const twitch = still ? 0 : (smooth(9.2, 9.35, t) - smooth(9.35, 9.6, t) * 1.4 + smooth(9.6, 9.8, t) * 0.4) * 0.16;
      const waveA = 2.15 + (still ? 0 : mixAt(t, 0.6, 3.2, 0.4) * 0.3 * Math.sin(t * 9));
      const fa = fieldPose(A, { happy: false, blink, earR: twitch, lift: 0, lx: look.x, ly: look.y, wave: waveA }, breathe);
      const hop = still ? 0 : Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - 5.4) / 0.7)) * Math.PI)) * 22;
      const fb = fieldPose(B, { happy: true, blink: 0, earR: -0.12, lift: 10 + hop, lx: 0, ly: 0, wave: 2.5 + (still ? 0 : 0.25 * Math.sin(t * 10)) }, breathe);
      const m = still ? 0 : mixAt(t, 4.6, 7.8, 0.55);
      const tick = Math.floor(time * 7);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const ink = new Path2D();
      const lime = new Path2D();
      const off = new Path2D();
      const offR = R * 0.2;
      for (let j = 0; j < rows; j++) {
        const shift = !still && hash(j, tick) > 0.994 ? Math.round((hash(tick, j) - 0.5) * 4) : 0;
        const cy = (j + 0.5) * rowStep;
        if (cy > boardBottom + 2) break; // nothing below the board edge
        for (let i = 0; i < cols; i++) {
          const si = Math.min(cols - 1, Math.max(0, i - shift));
          const idx = j * cols + si;
          const seed = seeds[j * cols + i];
          const useB = seed < m;
          const f = useB ? fb : fa;
          const lum = f.body[idx * 4] / 255;
          const eye = f.eyes[idx * 4] < 128;
          let v = eye ? 1 : Math.min(1, Math.max(0, (1 - lum - 0.16) / 0.42));
          const cx0 = (i + 0.5) * step;
          if (masked(cx0, cy)) continue; // the letters stay clear
          if (v <= 0.02) {
            // an unlit LED, fading out toward the bottom of the board
            const fade = Math.min(1, (boardBottom - cy) / 160);
            if (fade > 0.2 && hash(i, j * 1.7) < fade) { off.moveTo(cx0 + offR, cy); off.arc(cx0, cy, offR, 0, Math.PI * 2); }
            continue;
          }
          if (!still) {
            v *= 0.9 + 0.1 * Math.sin(time * 3.2 + seed * 40);
            if (m > 0.001 && m < 0.999) {
              const d = Math.abs(seed - m);
              if (d < 0.06) v *= d / 0.06;
            }
          }
          let level = 0;
          for (let l = LEVELS.length - 1; l > 0; l--) if (v >= LEVELS[l] - 0.13) { level = l; break; }
          if (!level) continue;
          const r = level === 1 ? R * 0.38 : R * LEVELS[level];
          const cx = (i + 0.5) * step;
          const p = eye ? lime : ink;
          p.moveTo(cx + r, cy);
          p.arc(cx, cy, r, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = "rgba(17, 19, 24, 0.16)";
      ctx.fill(off);
      ctx.fillStyle = INK;
      ctx.fill(ink);
      ctx.fillStyle = LIME;
      ctx.fill(lime);
    };

    resize();
    const late = window.setTimeout(resize, 1400);
    document.fonts?.ready.then(() => resize());
    const ro = new ResizeObserver(() => { resize(); if (still) render(0); });
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const ex = r.left + ox + 200 * k, ey = r.top + oy + 240 * k;
      const dx = e.clientX - ex, dy = e.clientY - ey;
      const len = Math.hypot(dx, dy) || 1;
      const s = Math.min(1, len / 420);
      target.x = (dx / len) * 13 * s;
      target.y = (dy / len) * 9 * s;
    };
    if (!still) window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0, visible = true;
    const t0 = performance.now();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (visible) render((now - t0) / 1000);
    };
    if (still) render(0);
    else raf = requestAnimationFrame(loop);
    (window as unknown as { __gigsRender?: (t: number) => void }).__gigsRender = render;

    return () => { clearTimeout(late); cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", onMove); };
  }, []);

  return <canvas ref={ref} className={className} role="img" aria-label="GIGS the bunny drawn in dots, waving" />;
}
