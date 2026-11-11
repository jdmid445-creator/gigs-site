import { z } from "zod";
import { handle, json, looksBlocked } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGig, syncGig } from "@/lib/gigs";

type Ctx = { params: Promise<{ id: string }> };

/** After a payout, the poster reviews the worker and the worker reviews the poster. One each. */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  const gig = await syncGig(await getGig(id));
  if (gig.status !== "paid") throw new HttpError(400, "You can review once the gig is paid out");
  if (wallet !== gig.poster && wallet !== gig.worker) throw new HttpError(403, "Only the poster and worker can review this gig");
  const b = z
    .object({
      rating: z.number().int().min(1).max(5),
      body: z.string().trim().max(500).optional(),
    })
    .parse(await req.json());
  if (b.body && looksBlocked(b.body)) throw new HttpError(400, "That text isn't allowed");
  const subject = wallet === gig.poster ? gig.worker! : gig.poster;
  const { error } = await db().from("reviews").insert({ gig_id: id, author: wallet, subject, rating: b.rating, body: b.body ?? "" });
  if (error?.code === "23505") throw new HttpError(409, "You already reviewed this gig");
  if (error) throw error;
  return json({ ok: true });
});
