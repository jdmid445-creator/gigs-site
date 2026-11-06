"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/Providers";
import Slip from "@/components/Slip";
import { CATEGORIES, MIN_AMOUNT, FEE_BPS } from "@/lib/config";
import { api } from "@/lib/client";
import { toBase, Currency } from "@/lib/money";

export default function PostGig() {
  const router = useRouter();
  const { wallet, signIn, setPickerOpen } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [currency, setCurrency] = useState<Currency>("SOL");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  let preview = "0";
  try {
    preview = amount ? toBase(amount, currency).toString() : "0";
  } catch {}

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!wallet) {
      try { await signIn(); } catch { setPickerOpen(true); }
      return;
    }
    setBusy(true);
    try {
      const { gig } = await api<{ gig: { id: string } }>("/api/gigs", {
        title, description, category, currency, amount, deadline_days: days,
      });
      router.push(`/gigs/${gig.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="wrap gig-grid">
        <form className="form" onSubmit={submit}>
          <h1>Post a gig</h1>
          <p className="muted">
            Nothing leaves your wallet now. When you hire someone, you sign once to lock the budget in a vault
            shared by you, the worker and a referee.
          </p>

          <div className="field">
            <label htmlFor="title">What do you need done?</label>
            <input id="title" className="input" maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Logo for a Solana token, white background, 3 options" required />
          </div>

          <div className="field">
            <label htmlFor="desc">Details</label>
            <textarea id="desc" className="textarea" maxLength={4000} value={description}
              onChange={(e) => setDescription(e.target.value)} required
              placeholder={"What to deliver, the format and size, references you like, and what counts as done."} />
            <span className="hint">Be specific about what “done” means. That&apos;s what the referee checks if there&apos;s a dispute.</span>
          </div>

          <div className="field">
            <label htmlFor="cat">Category</label>
            <select id="cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="amt">Budget</label>
              <input id="amt" className="input" inputMode="decimal" value={amount}
                onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                placeholder={currency === "SOL" ? "2.5" : "250"} required />
              <span className="hint">Minimum {MIN_AMOUNT[currency]} {currency}</span>
            </div>
            <div className="field">
              <label>Paid in</label>
              <div className="seg" role="group" aria-label="Currency">
                {(["SOL", "USDC"] as const).map((c) => (
                  <button type="button" key={c} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="days">Deadline</label>
              <select id="days" className="select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[1, 2, 3, 5, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          </div>

          <p className="hint muted small">
            Not allowed: dangerous stunts, harassment, adult content, anything illegal, and wallet or market manipulation.
            {FEE_BPS > 0 && ` A ${FEE_BPS / 100}% fee is taken from the payout when the job is paid.`}
          </p>
          {err && <p className="error">{err}</p>}
          <div>
            <button className="btn blue" disabled={busy}>
              {busy ? "Posting…" : wallet ? "Post gig" : "Sign in to post"}
            </button>
          </div>
        </form>

        <aside className="side">
          <span className="muted small">How it shows on the board</span>
          <Slip
            href={false}
            gig={{
              id: "preview",
              title: title || "Your gig title",
              category,
              currency,
              amount: preview,
              deadline_days: days,
              status: "open",
              created_at: new Date().toISOString(),
            }}
            meta={<span>{days}d deadline</span>}
          />
        </aside>
      </div>
    </div>
  );
}
