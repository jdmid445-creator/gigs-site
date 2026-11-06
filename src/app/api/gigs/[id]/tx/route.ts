import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { getGig, syncGig, roleOf } from "@/lib/gigs";
import { buildApproveTx, buildExecuteTx, buildProposalTx, proposalState } from "@/lib/escrow";

type Ctx = { params: Promise<{ id: string }> };

const Action = z.enum([
  "request_pay",     // worker: propose payout to self (+ approve)          → 1/2
  "approve_pay",     // poster: approve payout + execute                     → paid
  "request_refund",  // poster: propose refund to self (+ approve)          → 1/2
  "approve_refund",  // worker: agree to refund + execute                    → refunded
  "referee_pay",     // referee: tiebreak vote on payout
  "referee_refund",  // referee: tiebreak vote on refund
  "execute_pay",     // anyone in the deal: run an approved payout
  "execute_refund",  // anyone in the deal: run an approved refund
]);
export type TxAction = z.infer<typeof Action>;

const reusable = (s: string) => s === "none" || s === "rejected" || s === "cancelled";

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const wallet = await requireWallet();
  const { id } = await ctx.params;
  const { action } = z.object({ action: Action }).parse(await req.json());
  const gig = await syncGig(await getGig(id));
  const role = roleOf(gig, wallet);
  if (gig.status !== "funded" && gig.status !== "submitted")
    throw new HttpError(400, "This gig isn't in escrow right now");

  const relIdx = gig.release_index ? BigInt(gig.release_index) : null;
  const refIdx = gig.refund_index ? BigInt(gig.refund_index) : null;
  const rel = await proposalState(gig, relIdx);
  const ref = await proposalState(gig, refIdx);
  const need = (ok: boolean, msg: string) => { if (!ok) throw new HttpError(403, msg); };

  switch (action) {
    case "request_pay": {
      need(role === "worker", "Only the hired worker can request payment");
      if (!reusable(rel.state)) throw new HttpError(409, "Payment was already requested");
      const r = await buildProposalTx(gig, "release", wallet);
      return json(r);
    }
    case "request_refund": {
      need(role === "poster", "Only the poster can request a refund");
      if (!reusable(ref.state)) throw new HttpError(409, "A refund was already requested");
      const r = await buildProposalTx(gig, "refund", wallet);
      return json(r);
    }
    case "approve_pay": {
      need(role === "poster", "Only the poster can approve payment");
      if (rel.state !== "active" || !relIdx) throw new HttpError(409, "There's no payment request to approve");
      return json({ tx: await buildApproveTx(gig, relIdx, wallet, true) });
    }
    case "approve_refund": {
      need(role === "worker", "Only the worker can agree to a refund");
      if (ref.state !== "active" || !refIdx) throw new HttpError(409, "There's no refund request to approve");
      return json({ tx: await buildApproveTx(gig, refIdx, wallet, true) });
    }
    case "referee_pay":
    case "referee_refund": {
      need(role === "referee", "Only the referee can do this");
      if (!gig.disputed) throw new HttpError(409, "The referee only steps in on disputed gigs");
      const pay = action === "referee_pay";
      const st = pay ? rel : ref;
      const idx = pay ? relIdx : refIdx;
      if (st.state !== "active" || !idx)
        throw new HttpError(409, pay ? "The worker hasn't requested payment yet" : "The poster hasn't requested a refund yet");
      return json({ tx: await buildApproveTx(gig, idx, wallet, false) });
    }
    case "execute_pay":
    case "execute_refund": {
      need(role === "worker" || role === "poster", "Only the poster or worker can do this");
      const pay = action === "execute_pay";
      const st = pay ? rel : ref;
      const idx = pay ? relIdx : refIdx;
      if (st.state !== "approved" || !idx) throw new HttpError(409, "That isn't approved yet");
      return json({ tx: await buildExecuteTx(gig, idx, wallet) });
    }
  }
});
