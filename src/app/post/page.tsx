"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/Providers";
import GigRow from "@/components/Slip";
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

  // Prefill from the quick-post card on the homepage
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("title")) setTitle(q.get("title")!.slice(0, 90));
    if (q.get("amount")) setAmount(q.get("amount")!);
    if (q.get("currency") === "USDC" || q.get("currency") === "SOL") setCurrency(q.get("currency") as Currency);
    const c = q.get("category");
    if (c && (CATEGORIES as readonly string[]).includes(c)) setCategory(c);
  }, []);

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
    <div className="page container">
      <div className="page-head">
        <div>
          <h1>Post a gig</h1>
          <p className="lede">Nothing leaves your wallet yet. When you hire someone, you sign once to lock the budget in a vault shared by you, the worker and a referee.</p>
        </div>
      </div>
      <div className="split">
        <form className="card tool" onSubmit={submit}>
          <div className="pane">
            <label className="label" htmlFor="title">What do you need done?</label>
            <input id="title" className="input" maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Logo for a Solana token, white background, 3 options" required />
          </div>

          <div className="pane">
            <label className="label" htmlFor="desc">Details</label>
            <textarea id="desc" className="textarea" maxLength={4000} value={description}
              onChange={(e) => setDescription(e.target.value)} required
              placeholder="What to deliver, the format and size, references you like, and what counts as done." />
            <span className="hint">Spell out what &ldquo;done&rdquo; means. It&apos;s what the referee checks if there&apos;s a dispute.</span>
          </div>

          <div className="pane two">
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

          <div className="pane">
            <div className="pane-top">
              <label className="label" htmlFor="amt">Budget</label>
              <span className="note">Minimum {MIN_AMOUNT[currency]} {currency}</span>
            </div>
            <div className="pane-row">
              <input id="amt" className="big-input" inputMode="decimal" value={amount}
                onChange={(e) => setAmount(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
                placeholder={currency === "SOL" ? "2.5" : "250"} required />
              <div className="toggle" role="group" aria-label="Currency">
                {(["SOL", "USDC"] as const).map((c) => (
                  <button type="button" key={c} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <dl className="rows">
            <div><dt>Leaves your wallet</dt><dd>Only when you hire</dd></div>
            <div><dt>Held in</dt><dd>A 2 of 3 Squads vault</dd></div>
            <div><dt>Fee</dt><dd>{FEE_BPS > 0 ? `${FEE_BPS / 100}% of the payout` : "None"}</dd></div>
          </dl>
          {err && <p className="error">{err}</p>}
          <button className="btn btn-ink btn-block" disabled={busy}>
            {busy ? "Posting…" : wallet ? "Post gig" : "Sign in to post"}
          </button>
          <p className="hint" style={{ textAlign: "center", padding: "4px 8px 2px" }}>
            No stunts, harassment, adult content, illegal work, or wallet and market manipulation.
          </p>
        </form>

        <aside className="stack sticky">
          <div className="board">
            <div className="gig-list">
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
          </div>
          <p className="hint preview-note">This is how your gig shows up on the board.</p>
          <div className="desk-side" style={{ marginTop: 0 }}>
            <h2 className="side-title">After you post</h2>
            <ol className="hops">
              <li><span className="hop-n">1</span><span><strong>Workers apply</strong><span className="hop-d">Each sends a pitch and a portfolio link.</span></span></li>
              <li><span className="hop-n">2</span><span><strong>You hire one</strong><span className="hop-d">One signature locks the budget in a 2 of 3 vault.</span></span></li>
              <li><span className="hop-n">3</span><span><strong>Work in, money out</strong><span className="hop-d">You and the worker both approve the payout.</span></span></li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
