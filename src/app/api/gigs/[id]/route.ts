import { handle, json } from "@/lib/api";
import { currentWallet } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGig, publicGig, roleOf } from "@/lib/gigs";
import { proposalState } from "@/lib/escrow";
import { FEE_BPS } from "@/lib/config";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const gig = await getGig(id);
  const wallet = await currentWallet();
  const role = roleOf(gig, wallet);
  if (gig.hidden && role === "visitor") return json({ error: "Gig not found" }, 404);

  const [{ data: poster }, { data: events }, apps, subs, disp, myApp] = await Promise.all([
    db().from("profiles").select("wallet,handle,x_handle").eq("wallet", gig.poster).maybeSingle(),
    db().from("events").select("kind,actor,tx,created_at").eq("gig_id", id).order("created_at"),
    role === "poster" || role === "referee"
      ? db().from("applications").select("applicant,pitch,portfolio,created_at").eq("gig_id", id).order("created_at")
      : Promise.resolve({ data: null }),
    role !== "visitor"
      ? db().from("submissions").select("note,link,created_at").eq("gig_id", id).order("created_at")
      : Promise.resolve({ data: null }),
    role !== "visitor"
      ? db().from("disputes").select("opened_by,reason,resolution,created_at").eq("gig_id", id).order("created_at")
      : Promise.resolve({ data: null }),
    wallet
      ? db().from("applications").select("pitch").eq("gig_id", id).eq("applicant", wallet).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Who has already signed each proposal (so the UI knows which button to show).
  let release = null, refund = null;
  if (role !== "visitor" && gig.multisig) {
    [release, refund] = await Promise.all([
      proposalState(gig, gig.release_index ? BigInt(gig.release_index) : null),
      proposalState(gig, gig.refund_index ? BigInt(gig.refund_index) : null),
    ]);
  }

  let applicantProfiles: unknown[] = [];
  if (apps.data?.length) {
    const { data: profs } = await db()
      .from("profiles")
      .select("wallet,handle,x_handle,skills")
      .in("wallet", apps.data.map((a) => a.applicant));
    applicantProfiles = profs ?? [];
  }

  return json({
    gig: { ...publicGig(gig), hiring: gig.status === "hiring" && role === "poster" ? gig.worker : undefined },
    role,
    me: wallet,
    poster,
    events: events ?? [],
    applications: apps.data,
    applicantProfiles,
    submissions: subs.data,
    disputes: disp.data,
    applied: !!myApp.data,
    release,
    refund,
    feeBps: FEE_BPS,
  });
});
