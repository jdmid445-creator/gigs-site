import "server-only";
import { PublicKey } from "@solana/web3.js";
import { db, Gig, logEvent } from "./db";
import { HttpError } from "./auth";
import { proposalState, verifyFunded } from "./escrow";
import { REFEREE } from "./config";

export async function getGig(id: string): Promise<Gig> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Gig not found");
  const { data, error } = await db().from("gigs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Gig not found");
  return data as Gig;
}

export async function updateGig(id: string, patch: Partial<Gig>) {
  const { data, error } = await db()
    .from("gigs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Gig;
}

export function roleOf(gig: Gig, wallet: string | null) {
  if (!wallet) return "visitor" as const;
  if (wallet === gig.poster) return "poster" as const;
  if (gig.worker && wallet === gig.worker && gig.status !== "open" && gig.status !== "hiring") return "worker" as const;
  if (REFEREE && wallet === REFEREE) return "referee" as const;
  return "visitor" as const;
}

/**
 * Re-reads the chain and moves the gig forward. The chain is the source of truth:
 * we never mark something funded / paid / refunded because a browser said so.
 */
export async function syncGig(gig: Gig): Promise<Gig> {
  if (gig.status === "hiring" && gig.multisig && gig.worker) {
    const v = await verifyFunded(gig, gig.worker, gig.multisig);
    if (v.ok) {
      gig = await updateGig(gig.id, { status: "funded" });
      await logEvent(gig.id, gig.poster, "funded");
    }
  }

  if (gig.status === "funded" || gig.status === "submitted") {
    const rel = await proposalState(gig, gig.release_index ? BigInt(gig.release_index) : null);
    const ref = await proposalState(gig, gig.refund_index ? BigInt(gig.refund_index) : null);
    if (rel.state === "executed") {
      gig = await updateGig(gig.id, { status: "paid", disputed: false });
      await logEvent(gig.id, null, "paid");
      await resolveDispute(gig.id, "paid");
    } else if (ref.state === "executed") {
      gig = await updateGig(gig.id, { status: "refunded", disputed: false });
      await logEvent(gig.id, null, "refunded");
      await resolveDispute(gig.id, "refunded");
    }
  }
  return gig;
}

async function resolveDispute(gigId: string, resolution: "paid" | "refunded") {
  await db()
    .from("disputes")
    .update({ resolution, resolved_at: new Date().toISOString() })
    .eq("gig_id", gigId)
    .is("resolution", null);
}

export function assertWallet(s: string) {
  try {
    return new PublicKey(s).toBase58();
  } catch {
    throw new HttpError(400, "Invalid wallet address");
  }
}

/** Public shape of a gig (hides vault plumbing that isn't useful to visitors). */
export function publicGig(g: Gig) {
  return {
    id: g.id,
    poster: g.poster,
    title: g.title,
    description: g.description,
    category: g.category,
    currency: g.currency,
    amount: g.amount,
    deadline_days: g.deadline_days,
    status: g.status === "hiring" ? "open" : g.status,
    worker: g.status === "open" || g.status === "hiring" ? null : g.worker,
    multisig: g.status === "open" || g.status === "hiring" ? null : g.multisig,
    vault: g.status === "open" || g.status === "hiring" ? null : g.vault,
    disputed: g.disputed,
    created_at: g.created_at,
  };
}
export type PublicGig = ReturnType<typeof publicGig>;
