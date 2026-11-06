import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertWallet, getGig, syncGig, updateGig } from "@/lib/gigs";
import { buildHireTx } from "@/lib/escrow";

type Ctx = { params: Promise<{ id: string }> };

/** Poster picks an applicant → we return a transaction that creates the 2-of-3 vault and locks the budget. */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  let gig = await getGig(id);
  if (wallet !== gig.poster) throw new HttpError(403, "Only the poster can hire");
  const { applicant } = z.object({ applicant: z.string() }).parse(await req.json());
  const worker = assertWallet(applicant);

  if (gig.status === "hiring") {
    gig = await syncGig(gig); // maybe the previous attempt actually landed
    if (gig.status !== "hiring") throw new HttpError(409, "This gig is already funded");
    // An unsigned hire transaction stays valid for ~1–2 minutes. Don't build a second vault while
    // the first one could still land, or funds could go to a vault we aren't tracking.
    if (Date.now() - new Date(gig.updated_at).getTime() < 120_000)
      throw new HttpError(409, "Your last hire request is still pending. If you cancelled it in your wallet, try again in 2 minutes.");
  } else if (gig.status !== "open") {
    throw new HttpError(400, "This gig already has someone hired");
  }

  const { data: app } = await db()
    .from("applications")
    .select("id")
    .eq("gig_id", id)
    .eq("applicant", worker)
    .maybeSingle();
  if (!app) throw new HttpError(400, "That wallet hasn't applied to this gig");

  const built = await buildHireTx(gig, worker);
  await updateGig(id, {
    status: "hiring",
    worker,
    create_key: built.createKey,
    multisig: built.multisig,
    vault: built.vault,
    release_index: null,
    refund_index: null,
  });
  return json({ tx: built.tx, multisig: built.multisig, creationFeeLamports: built.creationFeeLamports });
});
