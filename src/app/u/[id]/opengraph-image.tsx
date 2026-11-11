import { ImageResponse } from "next/og";
import { Card, OG_SIZE, ogFonts, og } from "@/lib/og";
import { getUserPage, resolveUser } from "@/lib/profiles";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "A profile on Gigs";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fonts = await ogFonts();
  const wallet = await resolveUser(id);
  if (!wallet) return new ImageResponse(<Card><div style={{ fontSize: 64, fontWeight: 500 }}>Profile not found</div></Card>, { ...size, fonts });
  const { profile, stats } = await getUserPage(wallet);
  const name = profile?.handle ? `@${profile.handle}` : `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
  const facts: [string, string][] = [
    [String(stats.done), stats.done === 1 ? "gig done" : "gigs done"],
    [money(stats.earnedUsd), "earned"],
    [stats.rating ? stats.rating.toFixed(1) : "–", stats.reviews ? `rating, ${stats.reviews} reviews` : "no reviews yet"],
  ];
  return new ImageResponse(
    (
      <Card mood={stats.done > 0 ? "happy" : "idle"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 80, fontWeight: 500, letterSpacing: -2.4, lineHeight: 1 }}>{name}</div>
          {profile?.skills?.length ? (
            <div style={{ fontSize: 28, color: og.MUTED }}>{profile.skills.slice(0, 4).join(", ")}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          {facts.map(([v, l]) => (
            <div key={l} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: -1.5, lineHeight: 1 }}>{v}</span>
              <span style={{ fontSize: 22, color: og.MUTED }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
    ),
    { ...size, fonts }
  );
}
