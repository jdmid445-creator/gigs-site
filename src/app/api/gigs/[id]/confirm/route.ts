import { z } from "zod";
import { handle, json, looksBlocked } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db, logEvent } from "@/lib/db";
import { getGig, publicGig, roleOf, syncGig, updateGig } from "@/lib/gigs";
import { confirmSignature, proposalState, verifyProposal } from "@/lib/escrow";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
  action: z.string(),
  sig: z.string().min(40).max(100),
  index: z.string().regex(/^\d+$/).optional(),
  note: z.string().trim().max(2000).optional(),
  link: z.string().trim().url().max(500).optional().or(z.literal("")),
});

/**
 * Called after the wallet sends a transaction. We wait for it on-chain, then read the
 * chain ourselves to decide what changed. Nothing here trusts the browser's claim.
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  const b = Body.parse(await req.json());
  let gig = await getGig(id);
  const role = roleOf(gig, wallet);

  let landed = false;
  for (let i = 0; i < 8 && !landed; i++) {
    landed = await confirmSignature(b.sig);
    if (!landed) await new Promise((r) => setTimeout(r, 1500));
  }
  if (!landed) throw new HttpError(202, "Still confirming on-chain. Refresh in a moment.");

  if (b.action === "hire") {
    if (wallet !== gig.poster) throw new HttpError(403, "Not your gig");
    gig = await syncGig(gig);
    if (gig.status === "funded") await logEvent(id, wallet, "hired", b.sig);
  } else if (b.action === "request_pay" || b.action === "request_refund") {
    const kind = b.action === "request_pay" ? "release" : "refund";
    if (kind === "release" && role !== "worker") throw new HttpError(403, "Not the worker");
    if (kind === "refund" && role !== "poster") throw new HttpError(403, "Not the poster");
    if (!b.index) throw new HttpError(400, "Missing proposal index");
    const idx = BigInt(b.index);
    const v = await verifyProposal(gig, kind, idx);
    if (!v.ok) throw new HttpError(400, v.reason);
    const st = await proposalState(gig, idx);
    if (!st.approved.includes(wallet)) throw new HttpError(400, "Your approval isn't on that proposal");

    if (kind === "release") {
      if (b.note && looksBlocked(b.note)) throw new HttpError(400, "That text isn't allowed");
      gig = await updateGig(id, { release_index: b.index, status: "submitted" });
      await db().from("submissions").insert({ gig_id: id, worker: wallet, note: b.note || "Work delivered", link: b.link || null });
      await logEvent(id, wallet, "requested_payment", b.sig);
    } else {
      gig = await updateGig(id, { refund_index: b.index });
      await logEvent(id, wallet, "requested_refund", b.sig);
    }
  } else {
    await logEvent(id, wallet, b.action, b.sig);
    gig = await syncGig(gig);
  }
  return json({ gig: publicGig(gig) });
});
