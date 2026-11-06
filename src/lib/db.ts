import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Server-only Supabase client (service role). Never import this from a client component. */
export function db() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Database is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export type GigStatus = "open" | "hiring" | "funded" | "submitted" | "paid" | "refunded" | "cancelled";

export interface Gig {
  id: string;
  poster: string;
  title: string;
  description: string;
  category: string;
  currency: "SOL" | "USDC";
  amount: string; // bigint as string
  deadline_days: number;
  status: GigStatus;
  worker: string | null;
  create_key: string | null;
  multisig: string | null;
  vault: string | null;
  release_index: string | null;
  refund_index: string | null;
  disputed: boolean;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export async function logEvent(gigId: string, actor: string | null, kind: string, tx?: string) {
  await db().from("events").insert({ gig_id: gigId, actor, kind, tx: tx ?? null });
}
