import { z } from "zod";
import { handle, json, looksBlocked } from "@/lib/api";
import { HttpError, requireWallet } from "@/lib/auth";
import { db } from "@/lib/db";

const Body = z.object({
  handle: z.string().trim().regex(/^[a-zA-Z0-9_]{2,20}$/, "Handle: 2–20 letters, numbers or _").optional().or(z.literal("")),
  bio: z.string().trim().max(400).optional(),
  x_handle: z.string().trim().regex(/^@?[A-Za-z0-9_]{1,15}$/, "Invalid X handle").optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

export const POST = handle(async (req: Request) => {
  const wallet = await requireWallet();
  const b = Body.parse(await req.json());
  if (looksBlocked(b.bio || "", b.handle || "")) throw new HttpError(400, "That profile text isn't allowed");
  const { error } = await db()
    .from("profiles")
    .upsert({
      wallet,
      handle: b.handle || null,
      bio: b.bio ?? "",
      x_handle: b.x_handle ? b.x_handle.replace(/^@/, "") : null,
      skills: b.skills ?? [],
    });
  if (error?.code === "23505") throw new HttpError(409, "That handle is taken");
  if (error) throw error;
  return json({ ok: true });
});
