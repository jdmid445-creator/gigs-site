import { z } from "zod";
import { handle, json } from "@/lib/api";
import { requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGig, updateGig } from "@/lib/gigs";

type Ctx = { params: Promise<{ id: string }> };

/** Report a listing. Three separate reports hide it automatically until the referee reviews it. */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  const gig = await getGig(id);
  const { reason } = z.object({ reason: z.string().trim().min(3).max(500) }).parse(await req.json());
  await db().from("reports").upsert({ gig_id: id, reporter: wallet, reason }, { onConflict: "gig_id,reporter" });
  const { count } = await db().from("reports").select("id", { count: "exact", head: true }).eq("gig_id", id);
  if ((count ?? 0) >= 3 && !gig.hidden && (gig.status === "open" || gig.status === "hiring"))
    await updateGig(id, { hidden: true });
  return json({ ok: true });
});
