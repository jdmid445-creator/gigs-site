// A small dot pattern made from a wallet address, so every person has their own mark.
// Mirrored 5×5 grid of dots, the same signature dots used for vault signatures.
function bits(wallet: string) {
  let h = 2166136261;
  for (let i = 0; i < wallet.length; i++) { h ^= wallet.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out: boolean[] = [];
  for (let i = 0; i < 15; i++) { out.push(((h >>> i) & 1) === 1); }
  return out;
}

export default function Avatar({ wallet, size = 40 }: { wallet: string; size?: number }) {
  const b = bits(wallet);
  const dots: { x: number; y: number }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      if (!b[y * 3 + x]) continue;
      dots.push({ x, y });
      if (x < 2) dots.push({ x: 4 - x, y });
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="avatar" aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--sunk)" />
      {dots.map((d, i) => <circle key={i} cx={8 + d.x * 6} cy={8 + d.y * 6} r="2.2" fill="var(--ink)" />)}
    </svg>
  );
}
