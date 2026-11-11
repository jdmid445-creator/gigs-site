import Link from "next/link";
import DotBunny from "@/components/DotBunny";
import Board from "@/components/Board";
import QuickPost from "@/components/QuickPost";
import LiveFeed from "@/components/LiveFeed";
import Reveal from "@/components/Reveal";
import Bunny from "@/components/Bunny";
import HeroDemo from "@/components/HeroDemo";

const HOPS = [
  { t: "Lock", where: "when you hire", d: "One signature creates a Squads vault for you, the worker and a referee, and moves the budget in." },
  { t: "Deliver", where: "by the worker", d: "They send the work and sign the payout. That's the first of two signatures." },
  { t: "Release", where: "two of three", d: "You sign and it pays out. If you two disagree, the referee casts the deciding vote." },
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

export default function Home() {
  return (
    <>
      <Reveal />
      <section className="hero">
        <DotBunny className="hero-dots" />
        <div className="wrap hero-inner" data-copy>
          <h1 className="hero-title">
            <span className="rise" style={{ "--d": "80ms" } as React.CSSProperties}>Crypto work,</span>
            <span className="rise" style={{ "--d": "180ms" } as React.CSSProperties}>paid from a locked vault.</span>
          </h1>
          <div className="hero-side rise" style={{ "--d": "320ms" } as React.CSSProperties}>
            <p>Post a job for design, edits, threads or code. The budget waits in a 2-of-3 vault until the work is done, so nobody can run off with it.</p>
            <div className="hero-actions">
              <Link href="/post" className="btn primary">Post a gig</Link>
              <Link href="#board" className="btn line">Find work</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="desk wrap" aria-label="Post a gig">
        <aside className="desk-side" id="how">
          <h2 className="side-title">One vault, three signers</h2>
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

      <section id="board" className="section wrap" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Work that&apos;s already paid for</h2>
          <p className="sec-lede">Every gig here is a budget waiting to be locked. Apply, get hired, and the money is in the vault before you start.</p>
        </div>
        <Board />
      </section>

      <section id="live" className="section wrap" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Every payout, out in the open</h2>
          <p className="sec-lede">New gigs, locked budgets and payouts as they happen. Only real activity from the board.</p>
        </div>
        <LiveFeed />
      </section>

      <section className="section wrap" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Watch a vault pay out</h2>
          <p className="sec-lede">Two of three signatures move the money. Click the card to play it again.</p>
        </div>
        <div className="demo-wrap"><HeroDemo /></div>
      </section>

      <section className="section wrap" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Hiring in crypto, compared</h2>
          <p className="sec-lede">What it usually takes to pay someone for work, and what changes when the budget is locked first.</p>
        </div>
        <div className="card compare">
          <table>
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

      <section className="section wrap" data-reveal>
        <div className="sec-head">
          <h2 className="h2">Questions</h2>
          <p className="sec-lede">More detail in the <Link href="/how-it-works" className="inline-link">docs</Link>.</p>
        </div>
        <div className="card faq">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}<span className="plus" aria-hidden /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section wrap" data-reveal>
        <div className="card cta">
          <div className="cta-copy">
            <h2 className="cta-title">Somebody out there can do it.</h2>
            <p>Post the job, pick who you like, and pay them from a vault they can see is full.</p>
            <Link href="/post" className="btn primary">Post a gig</Link>
          </div>
          <Bunny full size={220} id="gigs-cta" title="GIGS waving" ground={false} />
        </div>
      </section>
    </>
  );
}
