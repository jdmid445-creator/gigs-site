import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGig } from "@/lib/gigs";
import { chatAccess, SCAM, tableMissing } from "@/lib/chat";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const peerOf = (req: Request) => new URL(req.url).searchParams.get("peer");

export const GET = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const wallet = await requireWallet();
  const gig = await getGig(id);
  const { peer, role } = await chatAccess(gig, wallet, peerOf(req));
  const { data, error } = await db()
    .from("messages").select("id,sender,body,created_at").eq("gig_id", id).eq("peer", peer).order("created_at").limit(500);
  if (tableMissing(error)) throw new HttpError(503, "Messages aren't switched on yet");
  if (error) throw error;
  return json({ messages: data ?? [], peer, role });
});

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const wallet = await requireWallet();
  const gig = await getGig(id);
  const { peer } = await chatAccess(gig, wallet, peerOf(req));
  const { body } = z
    .object({ body: z.string().trim().min(1, "Write a message first").max(2000, "Keep it under 2000 characters") })
    .parse(await req.json());
  if (SCAM.test(body)) throw new HttpError(400, "Never share or ask for a seed phrase or private key. Nobody on Gigs will ever need it.");

  // light flood guard: at most 20 messages a minute per sender per gig
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db().from("messages").select("id", { count: "exact", head: true })
    .eq("gig_id", id).eq("sender", wallet).gte("created_at", since);
  if ((count ?? 0) >= 20) throw new HttpError(429, "Slow down a little");

  const { data, error } = await db().from("messages").insert({ gig_id: id, peer, sender: wallet, body }).select("id,sender,body,created_at").single();
  if (tableMissing(error)) throw new HttpError(503, "Messages aren't switched on yet");
  if (error) throw error;
  return json({ message: data });
});
