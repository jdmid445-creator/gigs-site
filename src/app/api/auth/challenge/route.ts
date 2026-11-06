import { z } from "zod";
import { handle, json } from "@/lib/api";
import { issueChallenge } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const { wallet } = z.object({ wallet: z.string().min(32).max(44) }).parse(await req.json());
  const host = new URL(req.url).host;
  return json(await issueChallenge(wallet, host));
});
