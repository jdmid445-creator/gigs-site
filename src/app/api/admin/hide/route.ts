import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { REFEREE } from "@/lib/config";
import { updateGig } from "@/lib/gigs";
import { logEvent } from "@/lib/db";

export const POST = handle(async (req: Request) => {
  const wallet = await requireWallet();
  if (!REFEREE || wallet !== REFEREE) throw new HttpError(403, "Referee only");
  const { id, hidden } = z.object({ id: z.string().uuid(), hidden: z.boolean() }).parse(await req.json());
  await updateGig(id, { hidden });
  await logEvent(id, wallet, hidden ? "hidden_by_referee" : "restored_by_referee");
  return json({ ok: true });
});
