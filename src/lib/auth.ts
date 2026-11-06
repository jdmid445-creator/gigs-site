import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { SITE_NAME } from "./config";

const COOKIE = "session";
const enc = new TextEncoder();

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters)");
  return enc.encode(s);
}

export function signInMessage(wallet: string, nonce: string, host: string) {
  return [
    `${host} wants you to sign in to ${SITE_NAME} with your Solana account:`,
    wallet,
    "",
    "This only proves you own this wallet. It does not send a transaction or cost anything.",
    "",
    `Nonce: ${nonce}`,
  ].join("\n");
}

/** A short-lived signed challenge so we don't need to store nonces. */
export async function issueChallenge(wallet: string, host: string) {
  new PublicKey(wallet); // validates
  const nonce = crypto.randomUUID();
  const token = await new SignJWT({ wallet, nonce, host })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .setSubject("challenge")
    .sign(secret());
  return { token, message: signInMessage(wallet, nonce, host) };
}

export async function verifyChallenge(token: string, signatureB58: string) {
  const { payload } = await jwtVerify(token, secret(), { subject: "challenge" });
  const wallet = String(payload.wallet);
  const message = signInMessage(wallet, String(payload.nonce), String(payload.host));
  const ok = nacl.sign.detached.verify(
    enc.encode(message),
    bs58.decode(signatureB58),
    new PublicKey(wallet).toBytes()
  );
  if (!ok) throw new Error("Signature does not match wallet");
  return wallet;
}

export async function startSession(wallet: string) {
  const jwt = await new SignJWT({ wallet })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject("session")
    .sign(secret());
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in wallet, or null. */
export async function currentWallet(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c, secret(), { subject: "session" });
    return String(payload.wallet);
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireWallet() {
  const w = await currentWallet();
  if (!w) throw new HttpError(401, "Sign in with your wallet first");
  return w;
}
