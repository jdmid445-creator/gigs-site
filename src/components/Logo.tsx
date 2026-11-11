import { EAR_L, EAR_R, HEAD, EYES } from "@/lib/bunnyShapes";

/** The GIGS mark: a flat bunny head in one color, eyes cut out. */
export default function Logo({ size = 22, title = "" }: { size?: number; title?: string }) {
  return (
    <svg width={size * (260 / 330)} height={size} viewBox="70 14 260 330" role={title ? "img" : undefined}
      aria-label={title || undefined} aria-hidden={title ? undefined : true} className="logo-mark">
      <mask id="gigs-logo-eyes">
        <rect x="0" y="0" width="400" height="400" fill="#fff" />
        {EYES.map((e) => <ellipse key={e.cx} cx={e.cx} cy={e.cy + 6} rx="13" ry="20" fill="#000" />)}
      </mask>
      <g fill="currentColor" mask="url(#gigs-logo-eyes)">
        <path d={EAR_L} />
        <path d={EAR_R} />
        <path d={HEAD} />
      </g>
    </svg>
  );
}
