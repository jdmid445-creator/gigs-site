import { handle, json } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { REFEREE } from "@/lib/config";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const wallet = await requireWallet();
  if (!REFEREE || wallet !== REFEREE) throw new HttpError(403, "Referee only");
  const [disputes, reports, hidden] = await Promise.all([
    db()
      .from("disputes")
      .select("id,gig_id,opened_by,reason,created_at,gigs(id,title,poster,worker,amount,currency,status)")
      .is("resolution", null)
      .order("created_at"),
    db().from("reports").select("gig_id,reporter,reason,created_at,gigs(id,title,hidden,status)").order("created_at", { ascending: false }).limit(100),
    db().from("gigs").select("id,title,status").eq("hidden", true).limit(100),
  ]);
  return json({ disputes: disputes.data ?? [], reports: reports.data ?? [], hidden: hidden.data ?? [] });
});
