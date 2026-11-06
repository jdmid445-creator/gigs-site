import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, startSession, verifyChallenge } from "@/lib/auth";
import { db } from "@/lib/db";

export const POST = handle(async (req: Request) => {
  const { token, signature } = z
    .object({ token: z.string(), signature: z.string() })
    .parse(await req.json());
  let wallet: string;
  try {
    wallet = await verifyChallenge(token, signature);
  } catch {
    throw new HttpError(401, "Sign-in failed. Try again.");
  }
  await startSession(wallet);
  await db().from("profiles").upsert({ wallet }, { onConflict: "wallet", ignoreDuplicates: true });
  return json({ wallet });
});
