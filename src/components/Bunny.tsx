// GIGS, the mascot. Peeking over an edge by default; `full` shows him standing with his tool belt,
// waving with one hand and holding a work ticket in the other.
import {
  COLORS as C, EAR_L, EAR_L_IN, EAR_R, EAR_R_IN, HEAD, MASK, NOSE, EYES, PAWS,
  TORSO, BELLY, BELT, POUCH, FEET, ARM_W, SHOULDER_L, SHOULDER_R, HAND_L, handR, TICKET,
} from "@/lib/bunnyShapes";

export type Mood = "idle" | "happy" | "sleep";

export default function Bunny({
  size = 160,
  id = "gigs",
  mood = "idle",
  title = "GIGS the bunny",
  ground = true,
  crop = false,
  full = false,
}: {
  size?: number;
  id?: string;
  mood?: Mood;
  title?: string;
  ground?: boolean;
  /** Tight crop around the head for logo / favicon use. */
  crop?: boolean;
  /** Standing, full body. */
  full?: boolean;
}) {
  const vb = crop ? "70 14 260 300" : full ? "20 8 380 560" : "0 0 400 400";
  const height = full ? Math.round((size * 560) / 380) : size;
  const wave = handR(2.15);
  const face = (
    <>
      {mood === "idle" && (
        <g className="bunny-eyes">
          {EYES.map((e) => <ellipse key={e.cx} className="bunny-eye" cx={e.cx} cy={e.cy} rx="10" ry="16" fill={C.eye} />)}
        </g>
      )}
      {mood === "happy" && (
        <g fill="none" stroke={C.eye} strokeWidth="7" strokeLinecap="round">
          <path d="M162 246 Q174 228 186 246" />
          <path d="M214 246 Q226 228 238 246" />
        </g>
      )}
      {mood === "sleep" && (
        <g fill="none" stroke={C.eye} strokeWidth="6" strokeLinecap="round">
          <path d="M163 240 Q174 250 185 240" />
          <path d="M215 240 Q226 250 237 240" />
        </g>
      )}
      <path d={NOSE} fill={C.nose} />
      <rect x="190.5" y="281" width="9" height="12" rx="2.5" fill={C.teeth} />
      <rect x="200.5" y="281" width="9" height="12" rx="2.5" fill={C.teeth} />
      <ellipse className="bunny-cheek" cx="152" cy="268" rx="11" ry="5.5" fill={C.nose} />
      <ellipse className="bunny-cheek" cx="248" cy="268" rx="11" ry="5.5" fill={C.nose} />
    </>
  );
  const ears = (
    <>
      <g className="bunny-ear-l">
        <path d={EAR_L} fill={`url(#${id}-e)`} />
        <path d={EAR_L_IN} fill={C.nose} />
      </g>
      <g className="bunny-ear-r">
        <path d={EAR_R} fill={`url(#${id}-e)`} />
        <path d={EAR_R_IN} fill={C.nose} />
      </g>
    </>
  );

  return (
    <svg role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}
      width={size} height={height} viewBox={vb} xmlns="http://www.w3.org/2000/svg" className={`bunny mood-${mood}${full ? " is-full" : ""}`}>
      <defs>
        <radialGradient id={`${id}-b`} cx="38%" cy="26%" r="80%">
          <stop offset="0%" stopColor="#8d95a5" />
          <stop offset="52%" stopColor="#3b414d" />
          <stop offset="100%" stopColor="#14171d" />
        </radialGradient>
        <radialGradient id={`${id}-e`} cx="40%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#7d8595" />
          <stop offset="60%" stopColor="#3b414d" />
          <stop offset="100%" stopColor="#1b1f26" />
        </radialGradient>
        <clipPath id={`${id}-above`}>
          <rect x="0" y="0" width="400" height="300" />
        </clipPath>
      </defs>

      {full ? (
        <g className="bunny-body">
          {ground && <ellipse cx="200" cy="550" rx="150" ry="14" fill="rgba(18,21,27,0.08)" />}
          {FEET.map((f) => <ellipse key={f.cx} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} fill={C.paw} />)}
          <path d={TORSO} fill={`url(#${id}-b)`} />
          <path d={BELLY} fill="#4a515e" opacity="0.55" />
          <path d={BELT} fill={C.belt} />
          <path d={POUCH} fill="#2b3039" />
          <rect x="238" y="482" width="22" height="4" rx="2" fill={C.belt} />
          {/* arm holding the work ticket */}
          <line x1={SHOULDER_L.x} y1={SHOULDER_L.y} x2={HAND_L.x} y2={HAND_L.y} stroke="#2f343e" strokeWidth={ARM_W} strokeLinecap="round" />
          <g transform={`translate(${HAND_L.x - 18} ${HAND_L.y - 16}) rotate(${(TICKET.angle * 180) / Math.PI})`}>
            <rect x={-TICKET.w / 2} y={-TICKET.h / 2} width={TICKET.w} height={TICKET.h} rx="6" fill="#ffffff" stroke="#d6dae0" strokeWidth="2" />
            <rect x="-18" y="-22" width="28" height="5" rx="2.5" fill="#c3c8d0" />
            <rect x="-18" y="-10" width="36" height="5" rx="2.5" fill="#c3c8d0" />
            <path d="M-12 14 l7 7 l15 -16" fill="none" stroke="#3a4a00" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx={HAND_L.x} cy={HAND_L.y} r="19" fill="#3b414d" />
          {ears}
          <path d={HEAD} fill={`url(#${id}-b)`} />
          <path d={MASK} fill="#0a0c10" />
          {face}
          {/* waving arm */}
          <g className="bunny-wave">
            <line x1={SHOULDER_R.x} y1={SHOULDER_R.y} x2={wave.x} y2={wave.y} stroke="#2f343e" strokeWidth={ARM_W} strokeLinecap="round" />
            <circle cx={wave.x} cy={wave.y} r="19" fill="#3b414d" />
          </g>
        </g>
      ) : (
        <>
          {ground && <ellipse className="bunny-ground" cx="200" cy="300" rx="150" ry="30" fill="#d9dde3" />}
          <g clipPath={`url(#${id}-above)`}>
            <g className="bunny-body">
              {ears}
              <path d={HEAD} fill={`url(#${id}-b)`} />
              <path d={MASK} fill="#0a0c10" />
              {face}
            </g>
          </g>
          <g className="bunny-paws">
            {PAWS.map((p) => <ellipse key={p.cx} cx={p.cx} cy={p.cy} rx="32" ry="17" fill={C.paw} />)}
          </g>
        </>
      )}
    </svg>
  );
}
