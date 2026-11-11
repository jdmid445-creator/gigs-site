"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "@/components/Providers";
import { Stamp, amountParts } from "@/components/Slip";
import GuardBunny from "@/components/GuardBunny";
import Bunny from "@/components/Bunny";
import { api, ago, friendlyWalletError, short, signAndSend } from "@/lib/client";
import { explorerAccount, explorerTx, squadsVaultUrl } from "@/lib/config";
import { Currency, fromBase } from "@/lib/money";

type Proposal = { state: "none" | "active" | "approved" | "executed" | "rejected" | "cancelled"; approved: string[] } | null;
type Data = {
  gig: {
    id: string; poster: string; title: string; description: string; category: string; currency: Currency;
    amount: string; deadline_days: number; status: string; worker: string | null; multisig: string | null;
    vault: string | null; disputed: boolean; created_at: string; hiring?: string;
  };
  role: "visitor" | "poster" | "worker" | "referee";
  me: string | null;
  poster: { handle?: string; x_handle?: string } | null;
  events: { kind: string; actor: string | null; tx: string | null; created_at: string }[];
  applications: { applicant: string; pitch: string; portfolio: string | null; created_at: string }[] | null;
  applicantProfiles: { wallet: string; handle?: string; x_handle?: string; skills?: string[] }[];
  submissions: { note: string; link: string | null; created_at: string }[] | null;
  disputes: { opened_by: string; reason: string; resolution: string | null; created_at: string }[] | null;
  applied: boolean;
  release: Proposal;
  refund: Proposal;
  feeBps: number;
};

const EVENT_TEXT: Record<string, string> = {
  posted: "Posted",
  applied: "Someone applied",
  funded: "Budget locked in the vault",
  hired: "Worker hired",
  requested_payment: "Work delivered, payment requested",
  requested_refund: "Poster asked for a refund",
  approve_pay: "Poster approved payment",
  approve_refund: "Worker agreed to the refund",
  referee_pay: "Referee voted to pay the worker",
  referee_refund: "Referee voted to refund the poster",
  execute_pay: "Payout sent",
  execute_refund: "Refund sent",
  paid: "Paid out",
  refunded: "Refunded",
  disputed: "Dispute opened",
  cancelled: "Closed by the poster",
};

export default function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { wallet, signIn, setPickerOpen } = useSession();
  const { signTransaction, publicKey } = useWallet();
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [msg, setMsg] = useState("");
  // Form drafts live here so they survive the inner components re-mounting while a request runs.
  const drafts = useRef<Record<string, string>>({});
  const useDraft = (key: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [v, setV] = useState(drafts.current[key] ?? "");
    return [v, (x: string) => { drafts.current[key] = x; setV(x); }] as const;
  };

  const load = useCallback(async () => {
    try {
      setD(await api<Data>(`/api/gigs/${id}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [id]);
  useEffect(() => { load(); }, [load, wallet]);

  async function ensureSigner() {
    if (!wallet) {
      try { await signIn(); } catch { setPickerOpen(true); }
      return false;
    }
    if (!signTransaction || !publicKey || publicKey.toBase58() !== wallet) {
      setPickerOpen(true);
      setActionErr("Connect the same wallet you signed in with.");
      return false;
    }
    return true;
  }

  /** Server builds → wallet signs → we relay → server reads the chain and updates the gig. */
  async function run(action: string, opts: { path?: string; body?: object; confirm?: object; done?: string } = {}) {
    setActionErr(""); setMsg("");
    if (!(await ensureSigner())) return;
    setBusy(action);
    try {
      const built = await api<{ tx: string; index?: string }>(opts.path ?? `/api/gigs/${id}/tx`, opts.body ?? { action });
      const sig = await signAndSend(built.tx, signTransaction!);
      setMsg("Sent. Waiting for Solana to confirm…");
      await api(`/api/gigs/${id}/confirm`, { action, sig, index: built.index, ...(opts.confirm || {}) });
      setMsg(opts.done ?? "Done.");
      await load();
    } catch (e) {
      setMsg("");
      setActionErr(friendlyWalletError(e));
      await load();
    } finally {
      setBusy("");
    }
  }

  async function post(path: string, body: object, done: string) {
    setActionErr(""); setMsg("");
    if (!wallet) { await ensureSigner(); return; }
    setBusy(path);
    try {
      await api(path, body);
      setMsg(done);
      await load();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  if (err) return <div className="page"><div className="wrap"><h1>Gig not found</h1><p className="muted" style={{ marginTop: 12 }}>{err}</p><p style={{ marginTop: 20 }}><Link className="btn" href="/">Back to the board</Link></p></div></div>;
  if (!d) return <div className="page"><div className="wrap"><p className="muted">Loading…</p></div></div>;

  const g = d.gig;
  const amt = `${amountParts(g.amount, g.currency)} ${g.currency}`;
  const payout = d.feeBps > 0 ? fromBase((BigInt(g.amount) * BigInt(10_000 - d.feeBps)) / 10_000n, g.currency) : null;
  const inEscrow = g.status === "funded" || g.status === "submitted";

  return (
    <div className="page">
      <div className="wrap">
        <Link href="/#board" className="back">All gigs</Link>
        <div className="gig-grid">
          <div style={{ display: "grid", gap: 22 }}>
            <div className="panel gig-head has-guard">
              <GuardBunny
                variant="gig"
                mood={g.status === "paid" ? "happy" : "idle"}
                intro={
                  g.status === "paid" ? "Paid out. Nice work."
                  : g.status === "submitted" ? "Work's in. Check it, then sign."
                  : inEscrow ? "Budget's locked. I'm watching it."
                  : g.status === "open" ? "Money stays with the poster until someone's hired."
                  : ""
                }
              />
              <div className="head-row">
                <Stamp status={g.status} disputed={g.disputed} />
                <span className="tag">{g.category}</span>
              </div>
              <h1>{g.title}</h1>
              <p className="gig-desc">{g.description}</p>
              <p className="muted small">
                Posted {ago(g.created_at)} by {d.poster?.handle ? `@${d.poster.handle}` : short(g.poster)}
                {d.poster?.x_handle && <> (<a href={`https://x.com/${d.poster.x_handle}`} target="_blank" rel="noreferrer">X</a>)</>}
              </p>
            </div>

            <ActionPanel />

            {d.submissions && d.submissions.length > 0 && (
              <div className="panel">
                <h2>Delivered work</h2>
                {d.submissions.map((s, i) => (
                  <div key={i} className="app">
                    <p className="gig-desc">{s.note}</p>
                    {s.link && <a href={s.link} target="_blank" rel="noreferrer nofollow">{s.link}</a>}
                    <span className="muted small">{ago(s.created_at)}</span>
                  </div>
                ))}
              </div>
            )}

            {d.disputes && d.disputes.length > 0 && (
              <div className="panel">
                <h2>Dispute</h2>
                {d.disputes.map((x, i) => (
                  <div key={i} className="app">
                    <span className="muted small">
                      Opened by {x.opened_by === g.poster ? "the poster" : "the worker"} {ago(x.created_at)}
                      {x.resolution && `, resolved: ${x.resolution}`}
                    </span>
                    <p className="gig-desc">{x.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="side">
            <div className="panel">
              <div className="budget"><b>{amountParts(g.amount, g.currency)}</b><span>{g.currency}</span></div>
              {payout !== null && <span className="muted small">Worker receives {payout.toLocaleString("en-US", { maximumFractionDigits: 4 })} {g.currency} after the {d.feeBps / 100}% fee</span>}
              <dl className="facts">
                <div><dt>Deadline</dt><dd>{g.deadline_days} days after hiring</dd></div>
                <div><dt>Poster</dt><dd><a href={explorerAccount(g.poster)} target="_blank" rel="noreferrer">{short(g.poster)}</a></dd></div>
                {g.worker && <div><dt>Worker</dt><dd><a href={explorerAccount(g.worker)} target="_blank" rel="noreferrer">{short(g.worker)}</a></dd></div>}
                {g.vault && <div><dt>Vault</dt><dd><a href={explorerAccount(g.vault)} target="_blank" rel="noreferrer">{short(g.vault)}</a></dd></div>}
                {g.multisig && <div><dt>Vault rules</dt><dd><a href={squadsVaultUrl(g.multisig)} target="_blank" rel="noreferrer">2 of 3 on Squads</a></dd></div>}
              </dl>
            </div>
            {g.worker && g.multisig && <Signers />}
            <div className="panel">
              <h2>History</h2>
              <ol className="timeline">
                {d.events.map((e, i) => (
                  <li key={i} className="done">
                    <span>
                      {EVENT_TEXT[e.kind] ?? e.kind}
                      <br />
                      <span className="when">{ago(e.created_at)}</span>
                      {e.tx && <>{"  "}<a href={explorerTx(e.tx)} target="_blank" rel="noreferrer">View transaction</a></>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {d.role === "visitor" && wallet && g.status === "open" && <ReportLink />}
          </aside>
        </div>
      </div>
    </div>
  );

  /* ---------------- vault signers ---------------- */

  function Signers() {
    const rel = d!.release, ref = d!.refund;
    const active = rel && rel.state !== "none" ? { p: rel, label: "payout" } : ref && ref.state !== "none" ? { p: ref, label: "refund" } : null;
    const signed = (w: string | null) => !!(w && active?.p?.approved.includes(w));
    const people = [
      { who: "Poster", addr: g.poster },
      { who: "Worker", addr: g.worker },
      { who: "Referee", addr: null as string | null },
    ];
    return (
      <div className="panel">
        <h2>Signatures</h2>
        <ul className="signers">
          {people.map((x) => {
            const on = x.who === "Referee" ? !!active?.p?.approved.some((a) => a !== g.poster && a !== g.worker) : signed(x.addr);
            return (
              <li key={x.who} className={`signer ${on ? "on" : ""}`}>
                <span className={`sig ${on ? "on" : ""}`} />
                <span className="who">{x.who}</span>
                <span className="what">{on ? `Signed ${active!.label}` : x.addr ? short(x.addr) : "Votes in disputes"}</span>
              </li>
            );
          })}
        </ul>
        <span className="hint">
          {active?.p?.state === "executed" ? `The ${active.label} went through.` : active ? `${active.p!.approved.length} of 2 signatures on the ${active.label}.` : "Any 2 of these 3 can release the budget."}
        </span>
      </div>
    );
  }

  /* ---------------- role-specific actions ---------------- */

  function Feedback() {
    return (
      <>
        {msg && <p className="ok">{msg}</p>}
        {actionErr && <p className="error" style={{ whiteSpace: "pre-wrap" }}>{actionErr}</p>}
      </>
    );
  }

  function ActionPanel() {
    const rel = d!.release, ref = d!.refund;
    const role = d!.role;

    if (g.status === "paid")
      return <div className="panel"><div className="notice good"><Bunny size={84} id="gigs-paid" mood="happy" title="GIGS celebrating" />Paid. The vault sent {amt} to the worker.</div></div>;
    if (g.status === "refunded")
      return <div className="panel"><div className="notice">Refunded. The budget went back to the poster.</div></div>;
    if (g.status === "cancelled")
      return <div className="panel"><div className="notice">The poster closed this gig. Nobody was hired.</div></div>;

    // ---------- open ----------
    if (g.status === "open" || g.status === "hiring") {
      if (role === "poster") return <PosterHiring />;
      if (role === "referee") return <div className="panel"><p className="muted">You&apos;re the referee, so you can&apos;t apply to gigs.</p></div>;
      return <ApplyBox />;
    }

    // ---------- in escrow ----------
    if (!inEscrow) return null;

    if (role === "visitor")
      return <div className="panel"><p className="muted">Someone was hired and {amt} is locked in the vault.</p></div>;

    const blocks: React.ReactNode[] = [];
    const executeBtn = (kind: "pay" | "refund") => (
      <button className="btn primary" disabled={!!busy} onClick={() => run(`execute_${kind}`, { done: kind === "pay" ? "Paid out." : "Refunded." })}>
        {busy === `execute_${kind}` ? "Sending…" : kind === "pay" ? "Send the payout" : "Send the refund"}
      </button>
    );

    if (rel?.state === "approved" && role !== "referee")
      blocks.push(<div key="ex-pay" className="notice good">Payment has 2 of 3 approvals. Anyone in the deal can send it now. {executeBtn("pay")}</div>);
    if (ref?.state === "approved" && role !== "referee")
      blocks.push(<div key="ex-ref" className="notice">The refund has 2 of 3 approvals. Anyone in the deal can send it now. {executeBtn("refund")}</div>);

    if (role === "worker") {
      if (!rel || rel.state === "none" || rel.state === "rejected" || rel.state === "cancelled") blocks.push(<DeliverBox key="deliver" />);
      else if (rel.state === "active") blocks.push(<p key="w8" className="muted">You requested payment. Waiting for the poster to approve{g.disputed ? " or the referee to decide" : ""}.</p>);
      if (ref?.state === "active")
        blocks.push(
          <div key="refreq" className="notice warn">
            The poster asked for a refund. If you agree, approve it and the budget goes back to them. If you don&apos;t, open a dispute.
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn line" disabled={!!busy} onClick={() => run("approve_refund", { done: "Refunded." })}>
                {busy === "approve_refund" ? "Check your wallet…" : "Agree and refund"}
              </button>
            </div>
          </div>
        );
    }

    if (role === "poster") {
      if (rel?.state === "active")
        blocks.push(
          <div key="approve" className="notice good">
            The worker delivered and requested {amt}. Check the work below, then approve to pay them.
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" disabled={!!busy} onClick={() => run("approve_pay", { done: "Paid. Thanks for using escrow." })}>
                {busy === "approve_pay" ? "Check your wallet…" : `Approve and pay ${amt}`}
              </button>
            </div>
          </div>
        );
      else if (!rel || rel.state === "none") blocks.push(<p key="wait" className="muted">{short(g.worker!)} is working on it. You&apos;ll approve payment once they deliver.</p>);
      if (!ref || ref.state === "none" || ref.state === "rejected" || ref.state === "cancelled")
        blocks.push(
          <div key="refund">
            <button className="text-btn" disabled={!!busy} onClick={() => run("request_refund", { done: "Refund requested. The worker or the referee has to agree." })}>
              {busy === "request_refund" ? "Check your wallet…" : "Request a refund"}
            </button>
            <span className="hint" style={{ display: "block" }}>Needs the worker to agree, or the referee after a dispute.</span>
          </div>
        );
      else if (ref.state === "active") blocks.push(<p key="refw" className="muted small">You requested a refund. Waiting for the worker{g.disputed ? " or the referee" : ""}.</p>);
    }

    if (role === "referee") blocks.push(<RefereeBox key="ref" />);
    if ((role === "poster" || role === "worker") && !g.disputed) blocks.push(<DisputeBox key="disp" />);
    if (g.disputed && role !== "referee")
      blocks.push(<div key="d" className="notice warn">A dispute is open. The referee will review the gig, the delivered work and both sides, then vote.</div>);

    return <div className="panel">{blocks}<Feedback /></div>;
  }

  function PosterHiring() {
    const apps = d!.applications ?? [];
    const profs = Object.fromEntries(d!.applicantProfiles.map((p) => [p.wallet, p]));
    return (
      <div className="panel">
        <h2>Applicants ({apps.length})</h2>
        {g.hiring && (
          <div className="notice">
            You started hiring {short(g.hiring)}. If you signed, it confirms in a few seconds.{" "}
            <button className="text-btn" onClick={() => post(`/api/gigs/${id}/sync`, {}, "Checked the vault.")}>Check again</button>
          </div>
        )}
        {apps.length === 0 && <p className="muted">No applicants yet. Share the link on X to get some eyes on it.</p>}
        <div className="apps">
          {apps.map((a) => {
            const p = profs[a.applicant];
            return (
              <div className="app" key={a.applicant}>
                <div className="app-top">
                  <strong>
                    {p?.handle ? `@${p.handle}` : short(a.applicant)}
                    {p?.x_handle && <>{" "}<a href={`https://x.com/${p.x_handle}`} target="_blank" rel="noreferrer">X</a></>}
                  </strong>
                  <button className="btn primary" disabled={!!busy}
                    onClick={() => run("hire", { path: `/api/gigs/${id}/hire`, body: { applicant: a.applicant }, done: `Hired. ${amt} is locked in the vault.` })}>
                    {busy === "hire" ? "Check your wallet…" : `Hire and lock ${amt}`}
                  </button>
                </div>
                <p className="gig-desc">{a.pitch}</p>
                {a.portfolio && <a href={a.portfolio} target="_blank" rel="noreferrer nofollow" className="small">{a.portfolio}</a>}
                {p?.skills?.length ? <div className="row" style={{ gap: 6 }}>{p.skills.map((s) => <span key={s} className="tag" style={{ flex: "0 0 auto" }}>{s}</span>)}</div> : null}
              </div>
            );
          })}
        </div>
        <p className="muted small">
          Hiring creates a vault for you, the worker and the referee, and locks {amt} in it. Creating the vault has a small
          one-time account cost, which your wallet shows before you sign.
        </p>
        <div>
          <button className="text-btn" disabled={!!busy} onClick={() => { if (confirm("Close this gig? Applicants will see it as closed.")) post(`/api/gigs/${id}/cancel`, {}, "Gig closed."); }}>
            Close this gig
          </button>
        </div>
        <Feedback />
      </div>
    );
  }

  function ApplyBox() {
    const [pitch, setPitch] = useDraft("pitch");
    const [portfolio, setPortfolio] = useDraft("portfolio");
    if (d!.applied) return <div className="panel"><div className="notice">You applied. If the poster hires you, the budget gets locked and this page shows your next step.</div></div>;
    return (
      <div className="panel">
        <h2>Apply for this gig</h2>
        <div className="field">
          <label htmlFor="pitch">Why you?</label>
          <textarea id="pitch" className="textarea" style={{ minHeight: 110 }} value={pitch} onChange={(e) => setPitch(e.target.value)}
            placeholder="Similar work you've done, how you'd approach it, how fast you can deliver." />
        </div>
        <div className="field">
          <label htmlFor="pf">Portfolio link (optional)</label>
          <input id="pf" className="input" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://x.com/you/status/…" />
        </div>
        <div>
          <button className="btn primary" disabled={!!busy}
            onClick={() => post(`/api/gigs/${id}/apply`, { pitch, portfolio }, "Applied.")}>
            {wallet ? (busy ? "Sending…" : "Apply") : "Sign in to apply"}
          </button>
        </div>
        <Feedback />
      </div>
    );
  }

  function DeliverBox() {
    const [note, setNote] = useDraft("note");
    const [link, setLink] = useDraft("link");
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h2>Deliver the work</h2>
        <p className="muted small">{amt} is locked for you. Once you deliver, you approve the payout to yourself and the poster signs the second approval.</p>
        <div className="field">
          <label htmlFor="note">What you delivered</label>
          <textarea id="note" className="textarea" style={{ minHeight: 100 }} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="link">Link to the files</label>
          <input id="link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Google Drive, Dropbox, GitHub…" />
        </div>
        <div>
          <button className="btn primary" disabled={!!busy || note.trim().length < 3}
            onClick={() => run("request_pay", { confirm: { note, link }, done: "Delivered. Waiting for the poster to approve." })}>
            {busy === "request_pay" ? "Check your wallet…" : "Deliver and request payment"}
          </button>
        </div>
      </div>
    );
  }

  function DisputeBox() {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useDraft("reason");
    if (!open) return <div><button className="text-btn" onClick={() => setOpen(true)}>Something wrong? Open a dispute</button></div>;
    return (
      <div className="field">
        <label htmlFor="reason">What went wrong?</label>
        <textarea id="reason" className="textarea" style={{ minHeight: 90 }} value={reason} onChange={(e) => setReason(e.target.value)} />
        <span className="hint">The referee reads this, the gig description and the delivered work, then votes to pay the worker or refund the poster.</span>
        <div><button className="btn line" disabled={!!busy} onClick={() => post(`/api/gigs/${id}/dispute`, { reason }, "Dispute opened.")}>Open dispute</button></div>
      </div>
    );
  }

  function RefereeBox() {
    const rel = d!.release, ref = d!.refund;
    if (!g.disputed) return <p className="muted">You&apos;re the referee on this vault. You can only vote once someone opens a dispute.</p>;
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <h2>Referee decision</h2>
        <p className="muted small">Your vote is the 2nd signature on whichever side you pick. Then the winning party sends the funds.</p>
        <div className="row">
          <button className="btn primary" disabled={!!busy || rel?.state !== "active"} onClick={() => run("referee_pay", { done: "Voted to pay the worker." })}>
            Pay the worker
          </button>
          <button className="btn line" disabled={!!busy || ref?.state !== "active"} onClick={() => run("referee_refund", { done: "Voted to refund the poster." })}>
            Refund the poster
          </button>
        </div>
        {rel?.state !== "active" && <p className="muted small">“Pay” unlocks once the worker requests payment.</p>}
        {ref?.state !== "active" && <p className="muted small">“Refund” unlocks once the poster requests a refund.</p>}
      </div>
    );
  }

  function ReportLink() {
    const [sent, setSent] = useState(false);
    if (sent) return <p className="muted small">Reported. Thanks.</p>;
    return (
      <button className="text-btn small" onClick={async () => {
        const reason = prompt("What's wrong with this listing?");
        if (!reason) return;
        await api(`/api/gigs/${id}/report`, { reason }).catch(() => {});
        setSent(true);
      }}>Report this listing</button>
    );
  }
}
