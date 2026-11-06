"use client";
import { VersionedTransaction } from "@solana/web3.js";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  return data as T;
}

type Signer = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

/** Ask the wallet to sign a server-built transaction, then relay it. Returns the signature. */
export async function signAndSend(b64: string, signTransaction: Signer) {
  const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  const signed = await signTransaction(tx);
  const bytes = signed.serialize();
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const { sig } = await api<{ sig: string }>("/api/send", { tx: btoa(bin) });
  return sig;
}

export function short(addr: string, n = 4) {
  return addr.length > 2 * n + 1 ? `${addr.slice(0, n)}…${addr.slice(-n)}` : addr;
}

export function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function friendlyWalletError(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return "You cancelled it in your wallet.";
  return m;
}
