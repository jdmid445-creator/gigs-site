"use client";
// When you last read each thread lives on this device, so the inbox can show unread dots without extra tables.
const KEY = "gigs:read";
export function readMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function markRead(gigId: string, at: string) {
  try {
    const m = readMap();
    if (!m[gigId] || m[gigId] < at) { m[gigId] = at; localStorage.setItem(KEY, JSON.stringify(m)); window.dispatchEvent(new Event("gigs:read")); }
  } catch { /* storage blocked: unread dots just stay */ }
}
export function isUnread(gigId: string, last: { sender: string; created_at: string } | null, me: string | null) {
  if (!last || last.sender === me) return false;
  const r = readMap()[gigId];
  return !r || r < last.created_at;
}
