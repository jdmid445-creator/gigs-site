import { z } from "zod";
import { handle, json, looksBlocked } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db, logEvent } from "@/lib/db";
import { getGig } from "@/lib/gigs";
import { REFEREE } from "@/lib/config";

type Ctx = { params: Promise<{ id: string }> };

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  const gig = await getGig(id);
  const b = z
    .object({
      pitch: z.string().trim().min(20, "Write at least a sentence or two about why you're a fit").max(1500),
      portfolio: z.string().trim().url("Portfolio must be a link").max(300).optional().or(z.literal("")),
    })
    .parse(await req.json());

  if (gig.status !== "open" && gig.status !== "hiring") throw new HttpError(400, "This gig isn't taking applications");
  if (wallet === gig.poster) throw new HttpError(400, "You can't apply to your own gig");
  if (REFEREE && wallet === REFEREE) throw new HttpError(400, "The referee wallet can't apply to gigs");
  if (looksBlocked(b.pitch)) throw new HttpError(400, "That text isn't allowed");

  const { error } = await db()
    .from("applications")
    .insert({ gig_id: id, applicant: wallet, pitch: b.pitch, portfolio: b.portfolio || null });
  if (error?.code === "23505") throw new HttpError(409, "You already applied");
  if (error) throw error;
  await logEvent(id, wallet, "applied");
  return json({ ok: true });
});
