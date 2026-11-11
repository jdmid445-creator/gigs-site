import { ImageResponse } from "next/og";
import { Card, OG_SIZE, ogFonts, og } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Gigs: crypto gigs with the money already locked";

export default async function Image() {
  return new ImageResponse(
    (
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: -2.5, lineHeight: 1.02, display: "flex", flexWrap: "wrap" }}>
            Crypto gigs with the money already locked
          </div>
          <div style={{ fontSize: 26, color: og.MUTED, lineHeight: 1.4 }}>
            Budgets wait in a 2-of-3 vault until the work is done
          </div>
        </div>
      </Card>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
