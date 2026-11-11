import type { Metadata } from "next";
import { getGig } from "@/lib/gigs";
import { SITE_NAME } from "@/lib/config";
import { amountShort } from "@/lib/money";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const gig = await getGig(id).catch(() => null);
  if (!gig || gig.hidden) return { title: `Gig not found | ${SITE_NAME}` };
  const amt = `${amountShort(gig.amount, gig.currency)} ${gig.currency}`;
  const locked = gig.status === "funded" || gig.status === "submitted";
  const description = `${gig.category}. ${amt} ${locked ? "locked in escrow" : "budget"}. ${gig.description.slice(0, 140)}`;
  return {
    title: `${gig.title} | ${SITE_NAME}`,
    description,
    openGraph: { title: gig.title, description, type: "article" },
    twitter: { card: "summary_large_image", title: gig.title, description },
  };
}

export default function GigLayout({ children }: Props) {
  return children;
}
