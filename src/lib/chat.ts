import "server-only";
import { db } from "./db";
import type { Gig } from "./db";
import { HttpError } from "./auth";
import { REFEREE } from "./config";

/** Statuses where the hired worker and the poster have a standing thread. */
export const HIRED = new Set(["funded", "submitted", "paid", "refunded"]);
/** Never let anyone ask for these in chat; this is how wallets get drained. */
export const SCAM = /\b(seed ?phrase|secret ?phrase|recovery ?phrase|private ?key|mnemonic|12 ?words|24 ?words)\b/i;

export function tableMissing(e: { code?: string; message?: string } | null) {
  return !!e && (e.code === "42P01" || e.code === "PGRST205" || e.code === "42703" || e.code === "PGRST204"
    || (/messages|peer/.test(e.message ?? "") && /(does not exist|could not find)/i.test(e.message ?? "")));
}

async function applied(gigId: string, wallet: string) {
  const { count } = await db().from("applications").select("applicant", { count: "exact", head: true }).eq("gig_id", gigId).eq("applicant", wallet);
  return (count ?? 0) > 0;
}
async function threadExists(gigId: string, peer: string) {
  const { count, error } = await db().from("messages").select("id", { count: "exact", head: true }).eq("gig_id", gigId).eq("peer", peer);
  if (tableMissing(error)) throw new HttpError(503, "Messages aren't switched on yet");
  return (count ?? 0) > 0;
}

/**
 * Who may read and write the thread between a gig's poster and `peer`.
 * - Anyone signed in can message the poster about an open gig, and keep talking if they applied or were hired.
 * - The poster can talk to anyone who wrote first, applied, or was hired.
 * - The referee can read and write the hired worker's thread once a dispute is opened.
 * Threads show wallets and @handles only. Nobody's email, phone or socials are needed.
 */
export async function chatAccess(gig: Gig, wallet: string, peerParam: string | null) {
  const open = gig.status === "open" || gig.status === "hiring";
  if (wallet === gig.poster) {
    const peer = peerParam || gig.worker;
    if (!peer) throw new HttpError(400, "Pick a conversation");
    if (peer === gig.poster) throw new HttpError(400, "That's you");
    const hired = peer === gig.worker && HIRED.has(gig.status);
    if (!hired && !(await applied(gig.id, peer)) && !(await threadExists(gig.id, peer)))
      throw new HttpError(403, "You can message people who applied or wrote to you about this gig");
    return { peer, role: "poster" as const };
  }
  if (REFEREE && wallet === REFEREE && (!peerParam || peerParam !== wallet)) {
    const peer = gig.worker;
    if (!peer || (peerParam && peerParam !== peer)) throw new HttpError(403, "The referee can only read the hired worker's thread");
    const { count } = await db().from("disputes").select("id", { count: "exact", head: true }).eq("gig_id", gig.id);
    if (!count) throw new HttpError(403, "The referee can read messages only after a dispute is opened");
    return { peer, role: "referee" as const };
  }
  const peer = wallet;
  const hired = wallet === gig.worker && HIRED.has(gig.status);
  if (!open && !hired && !(await applied(gig.id, wallet)) && !(await threadExists(gig.id, wallet)))
    throw new HttpError(403, "This gig isn't taking messages any more");
  return { peer, role: hired ? ("worker" as const) : ("seller" as const) };
}
