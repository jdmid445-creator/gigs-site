"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/Providers";
import GigRow from "@/components/Slip";
import GuardBunny from "@/components/GuardBunny";
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
      <div className="wrap">
        <div className="gig-grid">
          <form className="panel form has-guard" onSubmit={submit}>
            <GuardBunny variant="post" intro="Say what “done” means. Saves a fight later" />
            <div style={{ display: "grid", gap: 10 }}>
              <h1>Post a gig</h1>
              <p className="muted">
                Nothing leaves your wallet yet. When you hire someone, you sign once to lock the budget in a vault shared by
                you, the worker and a referee.
              </p>
            </div>

            <div className="field">
              <label htmlFor="title">What do you need done?</label>
              <input id="title" className="input" maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Logo for a Solana token, white background, 3 options" required />
            </div>

            <div className="field">
              <label htmlFor="desc">Details</label>
              <textarea id="desc" className="textarea" maxLength={4000} value={description}
                onChange={(e) => setDescription(e.target.value)} required
                placeholder="What to deliver, the format and size, references you like, and what counts as done." />
              <span className="hint">Spell out what “done” means. It&apos;s what the referee checks if there&apos;s a dispute.</span>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="cat">Category</label>
                <select id="cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="days">Deadline</label>
                <select id="days" className="select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[1, 2, 3, 5, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""} after hiring</option>)}
                </select>
              </div>
            </div>

            <div className="row" style={{ alignItems: "start" }}>
              <div className="field">
                <label htmlFor="amt">Budget</label>
                <div className="amount-input">
                  <input id="amt" className="input" inputMode="decimal" value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                    placeholder={currency === "SOL" ? "2.5" : "250"} required />
                  <span>{currency}</span>
                </div>
                <span className="hint">Minimum {MIN_AMOUNT[currency]} {currency}</span>
              </div>
              <div className="field">
                <label>Pay in</label>
                <div className="seg" role="group" aria-label="Currency">
                  {(["SOL", "USDC"] as const).map((c) => (
                    <button type="button" key={c} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {err && <p className="error">{err}</p>}
            <div className="row" style={{ alignItems: "center" }}>
              <button className="btn primary" style={{ flex: "0 0 auto" }} disabled={busy}>
                {busy ? "Posting…" : wallet ? "Post gig" : "Sign in to post"}
              </button>
              <span className="hint" style={{ flex: "1 1 240px" }}>
                No stunts, harassment, adult content, illegal work, or wallet and market manipulation.
                {FEE_BPS > 0 && ` ${FEE_BPS / 100}% is taken from the payout when the job is paid.`}
              </span>
            </div>
          </form>

          <aside className="side">
            <div className="list">
              <GigRow
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
                meta={<span>{days} day deadline</span>}
              />
            </div>
            <p className="hint" style={{ padding: "0 8px" }}>This is how your gig shows up on the board.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
