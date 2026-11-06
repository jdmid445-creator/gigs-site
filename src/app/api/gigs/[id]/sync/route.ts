import { handle, json } from "@/lib/api";
import { getGig, publicGig, syncGig } from "@/lib/gigs";

type Ctx = { params: Promise<{ id: string }> };

/** Anyone can ask us to re-read the chain for a gig (harmless: it only reflects on-chain truth). */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const gig = await syncGig(await getGig(id));
  return json({ gig: publicGig(gig) });
});
