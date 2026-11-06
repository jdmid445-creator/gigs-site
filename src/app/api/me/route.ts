import { handle, json } from "@/lib/api";
import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { REFEREE } from "@/lib/config";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const wallet = await currentWallet();
  if (!wallet) return json({ wallet: null });
  const { data: profile } = await db().from("profiles").select("*").eq("wallet", wallet).maybeSingle();
  const { data: gigs } = await db()
    .from("gigs")
    .select("*")
    .or(`poster.eq.${wallet},worker.eq.${wallet}`)
    .order("updated_at", { ascending: false })
    .limit(100);
  const { data: applied } = await db()
    .from("applications")
    .select("gig_id, created_at, gigs(id,title,status,amount,currency,worker)")
    .eq("applicant", wallet)
    .order("created_at", { ascending: false })
    .limit(50);
  return json({ wallet, isReferee: !!REFEREE && wallet === REFEREE, profile, gigs: gigs ?? [], applied: applied ?? [] });
});
