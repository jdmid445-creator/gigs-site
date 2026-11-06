import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db, logEvent } from "@/lib/db";
import { getGig, roleOf, syncGig, updateGig } from "@/lib/gigs";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  const gig = await syncGig(await getGig(id));
  const role = roleOf(gig, wallet);
  if (role !== "poster" && role !== "worker") throw new HttpError(403, "Only the poster or worker can open a dispute");
  if (gig.status !== "funded" && gig.status !== "submitted") throw new HttpError(400, "Only gigs in escrow can be disputed");
  if (gig.disputed) throw new HttpError(409, "There's already an open dispute");
  const { reason } = z
    .object({ reason: z.string().trim().min(20, "Explain what went wrong in a sentence or two").max(2000) })
    .parse(await req.json());

  await db().from("disputes").insert({ gig_id: id, opened_by: wallet, reason });
  await updateGig(id, { disputed: true });
  await logEvent(id, wallet, "disputed");
  return json({ ok: true });
});
