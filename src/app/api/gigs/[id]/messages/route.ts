import { z } from "zod";
import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGig, roleOf } from "@/lib/gigs";
import type { Gig } from "@/lib/db";

function tableMissing(e: { code?: string; message?: string } | null) {
  return !!e && (e.code === "42P01" || e.code === "PGRST205" || /messages/.test(e.message ?? "") && /(does not exist|could not find)/i.test(e.message ?? ""));
}

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const OPEN_FOR_CHAT = new Set(["funded", "submitted", "paid", "refunded"]);
/** Never let anyone ask for these in chat; this is how wallets get drained. */
const SCAM = /\b(seed ?phrase|secret ?phrase|recovery ?phrase|private ?key|mnemonic|12 ?words|24 ?words)\b/i;

/** The poster and the hired worker can always talk once the budget is locked. The referee joins only after a dispute. */
async function participant(id: string) {
  const wallet = await requireWallet();
  const gig: Gig = await getGig(id);
  const role = roleOf(gig, wallet);
  if (!gig.worker || !OPEN_FOR_CHAT.has(gig.status)) throw new HttpError(400, "Messages open once someone is hired and the budget is locked");
  if (role === "referee") {
    const { count } = await db().from("disputes").select("id", { count: "exact", head: true }).eq("gig_id", id);
    if (!count) throw new HttpError(403, "The referee can read messages only after a dispute is opened");
  } else if (role !== "poster" && role !== "worker") {
    throw new HttpError(403, "Only the poster and the worker can see these messages");
  }
  return { wallet, gig, role };
}

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await participant(id);
  const { data, error } = await db()
    .from("messages").select("id,sender,body,created_at").eq("gig_id", id).order("created_at").limit(500);
  if (tableMissing(error)) throw new HttpError(503, "Messages aren't switched on yet");
  if (error) throw error;
  return json({ messages: data ?? [] });
});

export const POST = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { wallet } = await participant(id);
  const { body } = z
    .object({ body: z.string().trim().min(1, "Write a message first").max(2000, "Keep it under 2000 characters") })
    .parse(await req.json());
  if (SCAM.test(body)) throw new HttpError(400, "Never share or ask for a seed phrase or private key. Nobody on Gigs will ever need it.");

  // light flood guard: at most 20 messages a minute per sender per gig
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db().from("messages").select("id", { count: "exact", head: true })
    .eq("gig_id", id).eq("sender", wallet).gte("created_at", since);
  if ((count ?? 0) >= 20) throw new HttpError(429, "Slow down a little");

  const { data, error } = await db().from("messages").insert({ gig_id: id, sender: wallet, body }).select("id,sender,body,created_at").single();
  if (tableMissing(error)) throw new HttpError(503, "Messages aren't switched on yet");
  if (error) throw error;
  return json({ message: data });
});
