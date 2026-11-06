import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler so thrown HttpErrors / validation errors become clean JSON. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError) return json({ error: e.issues[0]?.message || "Invalid input" }, 400);
      console.error(e);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      return json({ error: msg.length > 300 ? "Something went wrong" : msg }, 500);
    }
  };
}

/** Very small blocklist for things that are never allowed (dangerous stunts, harassment, illegal). */
const BLOCKED = [
  /\b(kill|suicide|self[- ]?harm|overdose|shoot|stab|bomb|arson|set .* on fire)\b/i,
  /\b(dox+|doxx|swat+ing|home address of)\b/i,
  /\b(nude|nudes|onlyfans|porn|sex(ual)?)\b/i,
  /\b(tattoo)\b/i,
  /\b(drugs?|cocaine|meth|fentanyl)\b/i,
  /\b(seed phrase|private key|drain(er)?|rug ?pull|wash trad(e|ing)|bundl(e|ing) wallets?)\b/i,
];
export function looksBlocked(...texts: string[]) {
  const t = texts.join(" \n ");
  return BLOCKED.some((r) => r.test(t));
}
