import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { logEvent } from "@/lib/db";
import { getGig, syncGig, updateGig } from "@/lib/gigs";

type Ctx = { params: Promise<{ id: string }> };

/** Close a gig nobody has been hired for yet. Funded gigs go through the refund flow instead. */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  let gig = await getGig(id);
  if (wallet !== gig.poster) throw new HttpError(403, "Only the poster can cancel");
  if (gig.status === "hiring") gig = await syncGig(gig);
  if (gig.status !== "open" && gig.status !== "hiring")
    throw new HttpError(400, "This gig is funded. Request a refund instead.");
  if (gig.status === "hiring" && Date.now() - new Date(gig.updated_at).getTime() < 120_000)
    throw new HttpError(409, "A hire transaction may still land. Try again in 2 minutes.");
  await updateGig(id, { status: "cancelled" });
  await logEvent(id, wallet, "cancelled");
  return json({ ok: true });
});
