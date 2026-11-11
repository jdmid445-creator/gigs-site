// GIGS, the mascot: a bunny peeking over the edge of whatever card he's guarding.
// Same family as the Parallax mole: gradient body, dark face mask, lime eyes, pink nose.

export type Mood = "idle" | "happy" | "sleep";

export default function Bunny({
  size = 160,
  id = "gigs",
  mood = "idle",
  title = "GIGS the bunny",
  ground = true,
  crop = false,
}: {
  size?: number;
  id?: string;
  mood?: Mood;
  title?: string;
  ground?: boolean;
  /** Tight crop around the head for logo / favicon use. */
  crop?: boolean;
}) {
  const vb = crop ? "70 14 260 300" : "0 0 400 400";
  return (
    <svg role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true}
      width={size} height={size} viewBox={vb} xmlns="http://www.w3.org/2000/svg" className={`bunny mood-${mood}`}>
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
      {ground && <ellipse className="bunny-ground" cx="200" cy="300" rx="150" ry="30" fill="#d9dde3" />}
      <g clipPath={`url(#${id}-above)`}>
        <g className="bunny-body">
          <g className="bunny-ear-l">
            <path d="M150 168 C124 120 114 52 134 26 C154 2 182 40 186 100 C188 130 186 150 182 166 Z" fill={`url(#${id}-e)`} />
            <path d="M156 150 C140 112 134 64 146 46 C158 30 170 66 172 104 C173 124 171 140 168 150 Z" fill="#ff8fb8" />
          </g>
          <g className="bunny-ear-r">
            <path d="M218 166 C214 120 226 64 254 40 C268 28 284 34 282 52 C280 72 262 122 248 172 Z" fill={`url(#${id}-e)`} />
            <path d="M228 150 C228 116 238 78 256 58 C264 50 272 54 270 64 C266 84 254 120 244 154 Z" fill="#ff8fb8" />
          </g>
          <path d="M200 132 C282 132 322 190 322 262 C322 326 276 354 200 354 C124 354 78 326 78 262 C78 190 118 132 200 132 Z" fill={`url(#${id}-b)`} />
          <path d="M200 192 C246 192 276 222 276 256 C276 290 244 310 200 310 C156 310 124 290 124 256 C124 222 154 192 200 192 Z" fill="#0a0c10" />
          {mood === "idle" && (
            <g className="bunny-eyes">
              <ellipse className="bunny-eye" cx="174" cy="240" rx="10" ry="16" fill="#c9f23d" />
              <ellipse className="bunny-eye" cx="226" cy="240" rx="10" ry="16" fill="#c9f23d" />
            </g>
          )}
          {mood === "happy" && (
            <g fill="none" stroke="#c9f23d" strokeWidth="7" strokeLinecap="round">
              <path d="M162 246 Q174 228 186 246" />
              <path d="M214 246 Q226 228 238 246" />
            </g>
          )}
          {mood === "sleep" && (
            <g fill="none" stroke="#c9f23d" strokeWidth="6" strokeLinecap="round">
              <path d="M163 240 Q174 250 185 240" />
              <path d="M215 240 Q226 250 237 240" />
            </g>
          )}
          <path d="M187 266 C187 260 213 260 213 266 C213 272 205 278 200 278 C195 278 187 272 187 266 Z" fill="#ff8fb8" />
          <rect x="190.5" y="281" width="9" height="12" rx="2.5" fill="#f4f5f7" />
          <rect x="200.5" y="281" width="9" height="12" rx="2.5" fill="#f4f5f7" />
          <ellipse className="bunny-cheek" cx="152" cy="268" rx="11" ry="5.5" fill="#ff8fb8" />
          <ellipse className="bunny-cheek" cx="248" cy="268" rx="11" ry="5.5" fill="#ff8fb8" />
        </g>
      </g>
      <g className="bunny-paws">
        <ellipse cx="128" cy="302" rx="32" ry="17" fill="#4a515e" />
        <ellipse cx="272" cy="302" rx="32" ry="17" fill="#4a515e" />
      </g>
    </svg>
  );
}
