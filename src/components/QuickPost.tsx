"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, FEE_BPS, MIN_AMOUNT } from "@/lib/config";
import { Currency } from "@/lib/money";
import { usePrices, formatUsd } from "./usePrices";

/** The card in the middle of the desk: start a gig in three fields, finish on /post. */
export default function QuickPost() {
  const router = useRouter();
  const prices = usePrices();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("SOL");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);

  const n = Number(amount);
  const usd = !amount || !Number.isFinite(n) ? null : currency === "USDC" ? n : prices?.SOL ? n * prices.SOL : null;
  const ready = title.trim().length >= 6 && n >= MIN_AMOUNT[currency];

  function go(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ title: title.trim(), amount, currency, category });
    router.push(`/post?${q}`);
  }

  return (
    <form className="card tool" id="post" onSubmit={go}>
      <div className="tool-head">
        <h2 className="tool-title">Post a gig</h2>
        <span className="tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Paid from a vault
        </span>
      </div>

      <div className="pane">
        <div className="pane-top">
          <label className="label" htmlFor="qp-title">What do you need done?</label>
          <select className="select select-sm" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <input id="qp-title" className="input" maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Logo for a Solana token, 3 options" />
      </div>

      <div className="pane">
        <div className="pane-top">
          <label className="label" htmlFor="qp-amt">Budget</label>
          <span className="note">{usd !== null ? `About ${formatUsd(usd)}` : `Minimum ${MIN_AMOUNT[currency]} ${currency}`}</span>
        </div>
        <div className="pane-row">
          <input id="qp-amt" className="big-input" inputMode="decimal" placeholder="0.00" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))} />
          <div className="toggle" role="group" aria-label="Currency">
            {(["SOL", "USDC"] as const).map((c) => (
              <button type="button" key={c} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <dl className="rows">
        <div><dt>Held in</dt><dd>A 2 of 3 Squads vault</dd></div>
        <div><dt>Leaves your wallet</dt><dd>Only when you hire</dd></div>
        <div><dt>Fee</dt><dd>{FEE_BPS > 0 ? `${FEE_BPS / 100}% of the payout` : "None"}</dd></div>
      </dl>
      <button className="btn btn-ink btn-block" disabled={!ready}>{ready ? "Continue" : "Add a title and budget"}</button>
    </form>
  );
}
