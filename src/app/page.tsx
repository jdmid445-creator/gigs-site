import Link from "next/link";
import Tickets from "@/components/Tickets";
import Board from "@/components/Board";
import QuickPost from "@/components/QuickPost";
import LiveFeed from "@/components/LiveFeed";
import Reveal from "@/components/Reveal";
import Bunny from "@/components/Bunny";
import Finder from "@/components/Finder";
import { CATEGORIES } from "@/lib/config";

const HOPS = [
  { t: "Post", where: "free", d: "Say what you need, the deadline and the budget. Nothing leaves your wallet yet." },
  { t: "Hire", where: "one signature", d: "Pick someone. Their budget moves into a vault shared by you, them and a referee." },
  { t: "Pay", where: "two of three", d: "They deliver and sign, you sign, and the vault pays them. A referee breaks ties." },
];

const COMPARE = [
  ["Where the money waits", "In the poster's wallet, or with a middleman", "In a vault nobody can empty alone"],
  ["Worker knows they'll get paid", "On trust", "The budget is visibly locked first"],
  ["If the work never shows", "Chase a refund", "Refund signed by the worker or referee"],
  ["If you disagree", "Argue in DMs", "A referee casts the deciding vote"],
  ["Track record", "Screenshots", "Profiles built from paid-out gigs"],
];

const FAQ = [
  ["Do you ever hold the money?", "No. Each gig gets its own Squads vault with three signers: the poster, the worker and a referee. Any two can move the money, so no single person can take it, us included. The referee key can only vote, never start a payment."],
  ["When does the budget leave my wallet?", "Only when you hire someone. Posting a gig and reading applications costs nothing. Hiring is one signature that creates the vault and locks the budget in it."],
  ["What happens in a dispute?", "Either side can open one from the gig page. The referee reads the gig description, the delivered work and both explanations, then signs the payout or the refund. That vote is the second signature."],
  ["What kind of work is allowed?", "Online crypto work: design, video, writing and threads, code and bots, community, raids and research. No stunts, harassment, adult content, illegal work, or wallet and market manipulation."],
  ["What can I get paid in?", "SOL or USDC. The poster picks when they post, and the amount locked is the amount paid out, minus any platform fee shown up front."],
];

const Tick = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#161616" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

export default function Home() {
  return (
    <>
      <Reveal />
      <section className="hero">
        <Tickets />
        <div className="container hero-inner">
          <h1 className="hero-title">
            <span className="rise" style={{ "--d": "80ms" } as React.CSSProperties}>Crypto work,</span>
            <span className="rise" style={{ "--d": "180ms" } as React.CSSProperties}>paid from a locked vault.</span>
          </h1>
          <div className="hero-side rise" style={{ "--d": "320ms" } as React.CSSProperties}>
            <p>Hire anyone for design, edits, threads or code. The budget waits in a 2 of 3 vault until the work is done, so nobody can run off with it.</p>
            <div className="hero-actions">
              <Link href="/post" className="btn btn-ink">Post a gig</Link>
              <Link href="#board" className="btn btn-soft">Find work</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="desk container" aria-label="Post a gig">
        <aside className="desk-side">
          <h2 className="side-title">One vault, three steps</h2>
          <ol className="hops">
            {HOPS.map((h, i) => (
              <li key={h.t}>
                <span className="hop-n">{i + 1}</span>
                <span>
                  <strong>{h.t}</strong> <span className="hop-where">{h.where}</span>
                  <span className="hop-d">{h.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
        <div className="desk-main">
          <QuickPost />
        </div>
        <aside className="desk-side">
          <h2 className="side-title">Right now</h2>
          <LiveFeed compact limit={5} />
          <a href="#live" className="side-link">Everything that happened</a>
        </aside>
      </section>

      <section id="how" className="section container">
        <div className="sec-head" data-reveal>
          <h2 className="h2">The money is locked before the work starts</h2>
          <p className="lede">Every gig gets its own vault on Squads. Two of three signatures move it, and you can open it on-chain from the gig page.</p>
        </div>
        <div className="mosaic" data-reveal>
          <div className="tile t-toast" aria-label="A payout notification">
            <div className="toast">
              <span className="toast-ic">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <span>
                <b>Payout sent</b>
                <span>The vault paid the worker. Both of you signed.</span>
              </span>
              <time>just now</time>
            </div>
          </div>

          <div className="tile t-lock">
            <h3><em>Lock</em> the budget.<br />Then start the work.</h3>
            <p>One signature when you hire. The worker sees a full vault before they lift a finger.</p>
            <div className="win win-back" aria-hidden>
              <div className="win-bar"><i /><i /><i /></div>
              <div className="win-body">
                <span className="win-title">Logo for a Solana token, 3 options</span>
                <span className="win-line" style={{ width: "80%" }} />
                <span className="win-line" style={{ width: "56%" }} />
              </div>
            </div>
            <div className="win win-front" aria-hidden>
              <div className="win-bar"><i /><i /><i /></div>
              <div className="win-body">
                <span className="label">Locked in the vault</span>
                <span className="win-amt">2.5<small>SOL</small></span>
                <span className="win-line" style={{ width: "64%" }} />
              </div>
            </div>
            <span className="float-pill pill-locked" aria-hidden><span className="tick"><Tick /></span>Budget locked</span>
            <span className="float-pill pill-sig" aria-hidden>Signatures<span className="sig-dots"><i /><i /><i className="off" /></span></span>
            <svg className="cursor" width="30" height="35" viewBox="0 0 24 28" aria-hidden><path d="M3 2l17 11.5-7.4 1.4 4.3 8.2-3.3 1.7-4.3-8.2L3.6 22z" fill="#fff" stroke="#2b2b2b" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          </div>

          <div className="tile t-sigs">
            <span className="chip-tag">The vault</span>
            <h3>2 of 3</h3>
            <p>signatures move the money. Nobody can take it alone, us included.</p>
            <ul className="signs">
              <li className="is-signed"><span className="sig" /><b>Worker</b><span>Signed</span></li>
              <li className="is-signed"><span className="sig" /><b>Poster</b><span>Signed</span></li>
              <li><span className="sig" /><b>Referee</b><span>Only in disputes</span></li>
            </ul>
          </div>

          <div className="tile t-cats">
            <h3>Online crypto<br />work only.</h3>
            <p>Nothing in person, nothing risky.</p>
            <span className="cat-chip is-tilt" aria-hidden>{CATEGORIES[1]}</span>
            <div className="cat-chips">
              {CATEGORIES.filter((_, i) => i !== 1).map((c) => <span key={c} className="cat-chip">{c}</span>)}
            </div>
          </div>

          <div className="tile t-search">
            <h3>Find work<br />that&apos;s paid for</h3>
            <Finder />
          </div>
        </div>
      </section>

      <section id="board" className="section container" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Work that&apos;s already paid for</h2>
          <p className="lede">Every gig here has a budget waiting to be locked. Apply, get hired, and the money is in the vault before you start.</p>
        </div>
        <Board />
      </section>

      <section id="live" className="section container" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Every payout, out in the open</h2>
          <p className="lede">New gigs, locked budgets and payouts as they happen. Only real activity from the board.</p>
        </div>
        <LiveFeed />
      </section>

      <section className="section container" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Hiring in crypto, compared</h2>
          <p className="lede">What it usually takes to pay someone for work, and what changes when the budget is locked first.</p>
        </div>
        <div className="panel table-wrap">
          <table className="compare-table">
            <thead>
              <tr><th scope="col"><span className="sr-only">Question</span></th><th scope="col">The usual way</th><th scope="col">With Gigs</th></tr>
            </thead>
            <tbody>
              {COMPARE.map(([k, a, b]) => (
                <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section container" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Questions</h2>
          <p className="lede">More detail in the <Link href="/docs" className="inline-link">docs</Link>.</p>
        </div>
        <div className="panel faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}<span className="plus" aria-hidden /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section container" data-reveal>
        <div className="cta panel">
          <Bunny full size={150} id="gigs-cta" title="GIGS waving" ground={false} />
          <h2 className="cta-title">Somebody out there can do it.</h2>
          <p className="lede">Post the job, pick who you like, and pay them from a vault they can see is full. Posting is free.</p>
          <Link href="/post" className="btn btn-ink">Post a gig</Link>
        </div>
      </section>
    </>
  );
}
