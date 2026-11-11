import { ImageResponse } from "next/og";
import { Card, OG_SIZE, ogFonts, og } from "@/lib/og";
import { getGig } from "@/lib/gigs";
import { getPrices } from "@/lib/prices";
import { amountShort, fromBase } from "@/lib/money";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A gig on Gigs";

const STATUS: Record<string, [string, string]> = {
  open: ["Open", "budget"], hiring: ["Open", "budget"],
  funded: ["Locked", "locked in escrow"], submitted: ["Delivered", "locked in escrow"],
  paid: ["Paid", "paid out"], refunded: ["Refunded", "refunded"], cancelled: ["Closed", "budget"],
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [gig, prices] = await Promise.all([getGig(id).catch(() => null), getPrices()]);
  const fonts = await ogFonts();
  if (!gig || gig.hidden) {
    return new ImageResponse(<Card><div style={{ fontSize: 64, fontWeight: 500 }}>Gig not found</div></Card>, { ...size, fonts });
  }
  const [label, word] = STATUS[gig.status] ?? STATUS.open;
  const usd = gig.currency === "SOL" && prices.SOL ? fromBase(gig.amount, "SOL") * prices.SOL : null;
  const locked = gig.status === "funded" || gig.status === "submitted";
  const title = gig.title.length > 90 ? gig.title.slice(0, 88) + "…" : gig.title;

  return new ImageResponse(
    (
      <Card
        mood={gig.status === "paid" ? "happy" : "idle"}
        corner={
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 20, fontSize: 24, color: locked ? "#3a4a00" : og.INK }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: locked ? "#c9f23d" : gig.status === "paid" ? og.INK : "transparent", border: `2.5px solid ${locked ? "#3a4a00" : og.INK}` }} />
            {label}
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 26, color: og.MUTED }}>{gig.category}</div>
          <div style={{ fontSize: title.length > 50 ? 54 : 66, fontWeight: 500, letterSpacing: -1.6, lineHeight: 1.06, display: "flex" }}>{title}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 96, fontWeight: 500, letterSpacing: -3, lineHeight: 1 }}>{amountShort(gig.amount, gig.currency)}</span>
          <span style={{ fontSize: 36, fontWeight: 500 }}>{gig.currency}</span>
          <span style={{ fontSize: 26, color: og.MUTED, marginLeft: 8 }}>
            {usd ? `about $${Math.round(usd).toLocaleString("en-US")}, ${word}` : word}
          </span>
        </div>
      </Card>
    ),
    { ...size, fonts }
  );
}
