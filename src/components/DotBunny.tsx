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
    let quietY = 0.3, quietH = 0.12, quietW = 0.24, quietX = 0.5;

    let W = 0, H = 0, DPR = 1, step = 6, rowStep = 12, R = 3, cols = 0, rows = 0;
    let seeds = new Float32Array(0);
    let k = 1, ox = 0, oy = 0;
    const look = { x: 0, y: 0 }, target = { x: 0, y: 0 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      DPR = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      const wide = W >= 900;
      step = Math.max(5, W / (wide ? 240 : 150));
      rowStep = step * 1.7;
      R = step * 0.48;
      cols = Math.ceil(W / step);
      rows = Math.ceil(H / rowStep);
      for (const f of [A.body, A.eyes, B.body, B.eyes]) { f.c.width = cols; f.c.height = rows; }
      seeds = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) seeds[j * cols + i] = 0.55 * hash(i, j) + 0.45 * hash(j * 3.1, 7.7);
      const copy = canvas.parentElement?.querySelector<HTMLElement>("[data-copy]");
      const cr = copy?.getBoundingClientRect();
      const SHOWN = 501; // ear tips (y 14) down to just under his tool belt (y 515)
      if (wide) {
        // A scene: GIGS fills the right side, cropped under his belt, waving at you.
        k = (H * 0.94) / SHOWN;
        const cx = Math.max(W * 0.7, (cr ? cr.right - r.left : W * 0.5) + 180 * k);
        ox = cx - 200 * k;
        oy = H - 515 * k;
      } else {
        // Phones: under the copy, as big as fits, cropped at the bottom.
        const top = cr ? cr.bottom - r.top + 24 : H * 0.5;
        k = Math.min((H - top) / 380, (W * 1.05) / 330);
        ox = W / 2 - 205 * k;
        oy = top - 14 * k;
      }
      if (cr) {
        quietY = (cr.top + cr.height / 2 - r.top) / H;
        quietH = cr.height / 2 / H + 0.03;
        quietW = cr.width / 2 / W + 0.03;
        quietX = (cr.left + cr.width / 2 - r.left) / W;
      }
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
      const m = still ? 0 : mixAt(t, 4.6, 7.8, 1.3);
      const tick = Math.floor(time * 7);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const ink = new Path2D();
      const lime = new Path2D();
      for (let j = 0; j < rows; j++) {
        const shift = !still && hash(j, tick) > 0.975 ? Math.round((hash(tick, j) - 0.5) * 8) : 0;
        const cy = (j + 0.5) * rowStep;
        for (let i = 0; i < cols; i++) {
          const si = Math.min(cols - 1, Math.max(0, i - shift));
          const idx = j * cols + si;
          const seed = seeds[j * cols + i];
          const useB = seed < m;
          const f = useB ? fb : fa;
          const lum = f.body[idx * 4] / 255;
          const eye = f.eyes[idx * 4] < 128;
          let v = eye ? 1 : Math.min(1, Math.max(0, (1 - lum - 0.16) / 0.42));
          // keep the copy readable: no dots behind the headline block
          const qx = ((i + 0.5) / cols - quietX) / quietW, qy = ((j + 0.5) / rows - quietY) / quietH;
          v *= smooth(0.95, 1.2, Math.hypot(qx, qy));
          if (v <= 0) continue;
          if (!still) {
            v *= 0.9 + 0.1 * Math.sin(time * 3.2 + seed * 40);
            if (m > 0.001 && m < 0.999) {
              const d = Math.abs(seed - m);
              if (d < 0.12) v *= (d / 0.12) * (hash(i + tick, j) > 0.4 ? 1 : 0.3);
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
      ctx.fillStyle = INK;
      ctx.fill(ink);
      ctx.fillStyle = LIME;
      ctx.fill(lime);
    };

    resize();
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

    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", onMove); };
  }, []);

  return <canvas ref={ref} className={className} role="img" aria-label="GIGS the bunny drawn in dots, waving" />;
}
