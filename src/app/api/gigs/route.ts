import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { handle, json, looksBlocked } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db, logEvent, Gig } from "@/lib/db";
import { CATEGORIES, MAX_AMOUNT, MIN_AMOUNT, USDC_MINT } from "@/lib/config";
import { toBase, fromBase } from "@/lib/money";
import { connection } from "@/lib/escrow";
import { publicGig } from "@/lib/gigs";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: Request) => {
  const u = new URL(req.url);
  const category = u.searchParams.get("category");
  const status = u.searchParams.get("status") || "open";
  let q = db().from("gigs").select("*").eq("hidden", false).order("created_at", { ascending: false }).limit(60);
  if (status === "open") q = q.in("status", ["open", "hiring"]);
  else if (status === "active") q = q.in("status", ["funded", "submitted"]);
  else if (status === "done") q = q.eq("status", "paid");
  if (category && (CATEGORIES as readonly string[]).includes(category)) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;

  const stats = await db().from("gigs").select("amount,currency,status").in("status", ["funded", "submitted", "paid"]);
  const totals = { lockedSol: 0, lockedUsdc: 0, paidCount: 0 };
  for (const g of stats.data ?? []) {
    if (g.status === "paid") totals.paidCount++;
    else if (g.currency === "SOL") totals.lockedSol += fromBase(g.amount, "SOL");
    else totals.lockedUsdc += fromBase(g.amount, "USDC");
  }
  return json({ gigs: (data as Gig[]).map(publicGig), totals });
});

const Body = z.object({
  title: z.string().trim().min(6, "Title is too short").max(90),
  description: z.string().trim().min(30, "Describe the job in a bit more detail").max(4000),
  category: z.enum(CATEGORIES),
  currency: z.enum(["SOL", "USDC"]),
  amount: z.string(),
  deadline_days: z.number().int().min(1).max(60),
});

export const POST = handle(async (req: Request) => {
  const poster = await requireWallet();
  const b = Body.parse(await req.json());
  if (looksBlocked(b.title, b.description))
    throw new HttpError(400, "This gig looks like something we don't allow (dangerous stunts, harassment, adult or illegal work, or scams).");

  const amount = toBase(b.amount, b.currency);
  const human = fromBase(amount, b.currency);
  if (human < MIN_AMOUNT[b.currency]) throw new HttpError(400, `Minimum budget is ${MIN_AMOUNT[b.currency]} ${b.currency}`);
  if (human > MAX_AMOUNT[b.currency]) throw new HttpError(400, `Maximum budget is ${MAX_AMOUNT[b.currency]} ${b.currency}`);

  // Make sure the poster can actually fund it, so the board isn't full of fake budgets.
  const c = connection();
  const owner = new PublicKey(poster);
  if (b.currency === "SOL") {
    const bal = BigInt(await c.getBalance(owner));
    if (bal < amount + 10_000_000n) throw new HttpError(400, "Your wallet doesn't hold enough SOL to fund this gig (plus ~0.01 SOL for fees)");
  } else {
    const bal = await c
      .getTokenAccountBalance(getAssociatedTokenAddressSync(USDC_MINT, owner, true))
      .catch(() => null);
    if (BigInt(bal?.value.amount ?? "0") < amount) throw new HttpError(400, "Your wallet doesn't hold enough USDC to fund this gig");
  }

  const { count } = await db()
    .from("gigs")
    .select("id", { count: "exact", head: true })
    .eq("poster", poster)
    .in("status", ["open", "hiring"]);
  if ((count ?? 0) >= 10) throw new HttpError(429, "You already have 10 open gigs. Hire or cancel some first.");

  const { data, error } = await db()
    .from("gigs")
    .insert({ ...b, amount: amount.toString(), poster })
    .select("*")
    .single();
  if (error) throw error;
  await logEvent(data.id, poster, "posted");
  return json({ gig: publicGig(data as Gig) });
});
