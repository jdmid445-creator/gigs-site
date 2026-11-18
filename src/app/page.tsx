import Link from "next/link";
import Board from "@/components/Board";
import QuickPost from "@/components/QuickPost";
import LiveFeed from "@/components/LiveFeed";
import Reveal from "@/components/Reveal";
import Bunny from "@/components/Bunny";
import Finder from "@/components/Finder";
import VaultHero from "@/components/VaultHero";
import VaultFeatures from "@/components/VaultFeatures";

const HOPS = [
  { t: "Post", d: "Say what you need, the deadline and the budget. Nothing leaves your wallet yet." },
  { t: "Hire", d: "Pick someone. One signature moves the budget into a vault for you, them and a referee." },
  { t: "Pay", d: "They deliver and sign, you sign, and the vault pays them. A referee breaks ties." },
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
    <div className="home">
      <Reveal />

      <VaultHero />

      <VaultFeatures />

      <section className="section container" aria-label="Search open gigs">
        <div className="find-card" data-reveal>
          <h2 className="display find-title">Search open gigs</h2>
          <div className="find-box"><Finder /></div>
        </div>
      </section>

      <section className="section container" aria-label="Post a gig">
        <div className="post-panel" data-reveal>
          <div className="head-c">
            <h2 className="display big-title">Post a gig in a minute</h2>
          </div>
          <ol className="steps3">
            {HOPS.map((h, i) => (
              <li key={h.t}><span className="n">{i + 1}</span><strong>{h.t}</strong><span>{h.d}</span></li>
            ))}
          </ol>
          <div className="post-tool"><QuickPost /></div>
        </div>
      </section>

      <section id="board" className="section container" data-reveal>
        <div className="head-c">
          <h2 className="display big-title">Work that&apos;s paid for</h2>
          <p className="lede">Every gig here has a budget waiting to be locked. Apply, get hired, and the money is in the vault before you start.</p>
        </div>
        <Board />
      </section>

      <section id="live" className="section container" data-reveal>
        <div className="head-c">
          <h2 className="display big-title">Out in the open</h2>
          <p className="lede">New gigs, locked budgets and payouts as they happen. Only real activity from the board.</p>
        </div>
        <LiveFeed />
      </section>

      <section className="section container" data-reveal>
        <div className="head-c">
          <h2 className="display big-title">Hiring, compared</h2>
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
        <div className="head-c">
          <h2 className="display big-title">Questions</h2>
          <p className="lede">More detail in the <Link href="/docs" className="inline-link">docs</Link></p>
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
        <div className="end">
          <Bunny full size={150} id="gigs-cta" title="GIGS waving" ground={false} />
          <h2 className="display end-title">Somebody out there<br />can do it</h2>
          <p>Post the job, pick who you like, and pay them from a vault they can see is full. Posting is free.</p>
          <Link href="/post" className="btn-go">Post a gig</Link>
        </div>
      </section>
    </div>
  );
}
