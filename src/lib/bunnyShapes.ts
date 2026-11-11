// GIGS's shapes, front view, in a 400-wide space.
// Peeking: the edge he peeks over is y = 300. Full body: he stands with his feet at y ≈ 548.
// Shared by the SVG mascot and the dot-matrix hero, so both are the same bunny.
export const EAR_L = "M150 168 C124 120 114 52 134 26 C154 2 182 40 186 100 C188 130 186 150 182 166 Z";
export const EAR_L_IN = "M156 150 C140 112 134 64 146 46 C158 30 170 66 172 104 C173 124 171 140 168 150 Z";
export const EAR_R = "M218 166 C214 120 226 64 254 40 C268 28 284 34 282 52 C280 72 262 122 248 172 Z";
export const EAR_R_IN = "M228 150 C228 116 238 78 256 58 C264 50 272 54 270 64 C266 84 254 120 244 154 Z";
export const HEAD = "M200 132 C282 132 322 190 322 262 C322 326 276 354 200 354 C124 354 78 326 78 262 C78 190 118 132 200 132 Z";
export const MASK = "M200 192 C246 192 276 222 276 256 C276 290 244 310 200 310 C156 310 124 290 124 256 C124 222 154 192 200 192 Z";
export const NOSE = "M187 266 C187 260 213 260 213 266 C213 272 205 278 200 278 C195 278 187 272 187 266 Z";
export const EYES = [
  { cx: 174, cy: 240 },
  { cx: 226, cy: 240 },
];
export const PAWS = [
  { cx: 128, cy: 302 },
  { cx: 272, cy: 302 },
];

/* ---- full body ---- */
export const TORSO = "M200 316 C266 316 298 362 300 424 C302 488 266 530 200 530 C134 530 98 488 100 424 C102 362 134 316 200 316 Z";
export const BELLY = "M200 380 C236 380 254 408 254 446 C254 484 232 508 200 508 C168 508 146 484 146 446 C146 408 164 380 200 380 Z";
export const BELT = "M102 452 C144 470 256 470 298 452 L296 478 C254 496 146 496 104 478 Z";
export const POUCH = "M232 476 h34 a6 6 0 0 1 6 6 v24 a10 10 0 0 1 -10 10 h-26 a10 10 0 0 1 -10 -10 v-24 a6 6 0 0 1 6 -6 Z";
export const FEET = [
  { cx: 148, cy: 534, rx: 50, ry: 20 },
  { cx: 252, cy: 534, rx: 50, ry: 20 },
];
/** Arms are thick round strokes from the shoulder to the hand. */
export const ARM_W = 34;
export const SHOULDER_L = { x: 118, y: 372 };
export const SHOULDER_R = { x: 282, y: 372 };
export const HAND_L = { x: 92, y: 452 }; // holding the work ticket
/** Right arm waves: angle in radians from straight down (0) to up and out. */
export function handR(angle: number) {
  const len = 124;
  return { x: SHOULDER_R.x + Math.sin(angle) * len, y: SHOULDER_R.y + Math.cos(angle) * len };
}
/** The work ticket in his left hand, in its own frame centered on the hand. */
export const TICKET = { w: 56, h: 70, angle: -0.18 };

export const COLORS = {
  eye: "#c9f23d",
  belt: "#c9f23d",
  nose: "#ff8fb8",
  teeth: "#f4f5f7",
  paw: "#4a515e",
};
