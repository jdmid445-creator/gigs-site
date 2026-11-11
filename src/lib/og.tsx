import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  EAR_L, EAR_L_IN, EAR_R, EAR_R_IN, HEAD, MASK, NOSE, EYES, TORSO, BELLY, BELT, POUCH, FEET,
  ARM_W, SHOULDER_L, SHOULDER_R, HAND_L, handR, TICKET, COLORS as C,
} from "./bunnyShapes";
import { SITE_NAME } from "./config";

export const OG_SIZE = { width: 1200, height: 630 };
const BG = "#f5f5f3";
const INK = "#12151b";
const MUTED = "#79808c";

let fonts: { name: string; data: Buffer; weight: 400 | 500 | 600; style: "normal" }[] | null = null;
export async function ogFonts() {
  if (fonts) return fonts;
  const f = (w: 400 | 500 | 600) => readFile(join(process.cwd(), `src/app/fonts/geist-latin-${w}-normal.woff`));
  const [a, b, c] = await Promise.all([f(400), f(500), f(600)]);
  fonts = [
    { name: "Geist", data: a, weight: 400, style: "normal" },
    { name: "Geist", data: b, weight: 500, style: "normal" },
    { name: "Geist", data: c, weight: 600, style: "normal" },
  ];
  return fonts;
}

const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** GIGS standing, as a plain SVG string (same shapes as the on-page mascot). */
export function bunnySrc(mood: "idle" | "happy" = "idle") {
  const w = handR(2.15);
  const eyes = mood === "happy"
    ? `<g fill="none" stroke="${C.eye}" stroke-width="7" stroke-linecap="round"><path d="M162 246 Q174 228 186 246"/><path d="M214 246 Q226 228 238 246"/></g>
       <ellipse cx="152" cy="268" rx="11" ry="5.5" fill="${C.nose}" opacity="0.6"/><ellipse cx="248" cy="268" rx="11" ry="5.5" fill="${C.nose}" opacity="0.6"/>`
    : EYES.map((e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="10" ry="16" fill="${C.eye}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 8 380 560">
<defs>
<radialGradient id="b" cx="38%" cy="26%" r="80%"><stop offset="0%" stop-color="#8d95a5"/><stop offset="52%" stop-color="#3b414d"/><stop offset="100%" stop-color="#14171d"/></radialGradient>
<radialGradient id="e" cx="40%" cy="20%" r="90%"><stop offset="0%" stop-color="#7d8595"/><stop offset="60%" stop-color="#3b414d"/><stop offset="100%" stop-color="#1b1f26"/></radialGradient>
</defs>
${FEET.map((f) => `<ellipse cx="${f.cx}" cy="${f.cy}" rx="${f.rx}" ry="${f.ry}" fill="${C.paw}"/>`).join("")}
<path d="${TORSO}" fill="url(#b)"/><path d="${BELLY}" fill="#4a515e" opacity="0.55"/>
<path d="${BELT}" fill="${C.belt}"/><path d="${POUCH}" fill="#2b3039"/><rect x="238" y="482" width="22" height="4" rx="2" fill="${C.belt}"/>
<line x1="${SHOULDER_L.x}" y1="${SHOULDER_L.y}" x2="${HAND_L.x}" y2="${HAND_L.y}" stroke="#2f343e" stroke-width="${ARM_W}" stroke-linecap="round"/>
<g transform="translate(${HAND_L.x - 18} ${HAND_L.y - 16}) rotate(${(TICKET.angle * 180) / Math.PI})">
<rect x="${-TICKET.w / 2}" y="${-TICKET.h / 2}" width="${TICKET.w}" height="${TICKET.h}" rx="6" fill="#fff" stroke="#d6dae0" stroke-width="2"/>
<rect x="-18" y="-22" width="28" height="5" rx="2.5" fill="#c3c8d0"/><rect x="-18" y="-10" width="36" height="5" rx="2.5" fill="#c3c8d0"/>
<path d="M-12 14 l7 7 l15 -16" fill="none" stroke="#3a4a00" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
<circle cx="${HAND_L.x}" cy="${HAND_L.y}" r="19" fill="#3b414d"/>
<path d="${EAR_L}" fill="url(#e)"/><path d="${EAR_L_IN}" fill="${C.nose}"/><path d="${EAR_R}" fill="url(#e)"/><path d="${EAR_R_IN}" fill="${C.nose}"/>
<path d="${HEAD}" fill="url(#b)"/><path d="${MASK}" fill="#0a0c10"/>${eyes}
<path d="${NOSE}" fill="${C.nose}"/><rect x="190.5" y="281" width="9" height="12" rx="2.5" fill="${C.teeth}"/><rect x="200.5" y="281" width="9" height="12" rx="2.5" fill="${C.teeth}"/>
<line x1="${SHOULDER_R.x}" y1="${SHOULDER_R.y}" x2="${w.x}" y2="${w.y}" stroke="#2f343e" stroke-width="${ARM_W}" stroke-linecap="round"/>
<circle cx="${w.x}" cy="${w.y}" r="19" fill="#3b414d"/>
</svg>`;
  return svgData(svg);
}

function logoSrc() {
  return svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="70 14 260 330"><mask id="m"><rect width="400" height="400" fill="#fff"/><ellipse cx="174" cy="246" rx="13" ry="20"/><ellipse cx="226" cy="246" rx="13" ry="20"/></mask><g fill="${INK}" mask="url(#m)"><path d="${EAR_L}"/><path d="${EAR_R}"/><path d="${HEAD}"/></g></svg>`
  );
}

/** The shared frame: logo top left, content on the left, GIGS standing on the right, cut at the bottom edge. */
export function Card({ children, mood = "idle", corner }: { children: React.ReactNode; mood?: "idle" | "happy"; corner?: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: BG, fontFamily: "Geist", color: INK, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 0 56px 64px", width: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc()} width={30} height={38} alt="" />
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>{SITE_NAME}</span>
          {corner}
        </div>
        {children}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bunnySrc(mood)} width={420} height={619} alt="" style={{ position: "absolute", right: 24, bottom: -150 }} />
    </div>
  );
}

export const og = { INK, MUTED, BG };
