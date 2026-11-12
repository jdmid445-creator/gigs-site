import Link from "next/link";
import Tickets from "@/components/Tickets";
import Board from "@/components/Board";
import QuickPost from "@/components/QuickPost";
import LiveFeed from "@/components/LiveFeed";
import Reveal from "@/components/Reveal";
import Bunny from "@/components/Bunny";
import Finder from "@/components/Finder";
import VaultCard from "@/components/VaultCard";

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

const Arrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17L17 7M9 7h8v8" /></svg>
);

/** A thin ring that fades from nothing at the top to a hairline at the bottom. */
function Ring({ size, className, up = false }: { size: number; className: string; up?: boolean }) {
  return (
    <svg className={`ring ${className}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} fill="none" stroke={`url(#${up ? "ringUp" : "ringDown"})`} strokeWidth="1" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="home">
      <Reveal />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id="ringDown" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stopColor="#111318" stopOpacity="0" /><stop offset="1" stopColor="#111318" stopOpacity=".22" /></linearGradient>
          <linearGradient id="ringUp" x1="0" y1="1" x2="0" y2="0"><stop offset=".45" stopColor="#111318" stopOpacity="0" /><stop offset="1" stopColor="#111318" stopOpacity=".22" /></linearGradient>
        </defs>
      </svg>

      <section className="vh">
        <div className="vh-pane vh-left">
          <h1 className="display vh-title">
            <span className="rise" style={{ "--d": "60ms" } as React.CSSProperties}>Crypto work,</span>
            <span className="rise" style={{ "--d": "140ms" } as React.CSSProperties}>paid from</span>
            <span className="rise" style={{ "--d": "220ms" } as React.CSSProperties}>a vault.</span>
          </h1>
          <p className="vh-lede rise" style={{ "--d": "320ms" } as React.CSSProperties}>
            Hire anyone for design, edits, threads or code. The budget waits in a 2 of 3 vault until the work is done.
          </p>
          <div className="vh-cta rise" style={{ "--d": "400ms" } as React.CSSProperties}>
            <Link href="/post" className="cta-split"><span className="cta-label">Post a gig</span><span className="cta-arrow"><Arrow /></span></Link>
            <Link href="#board" className="sq-soft">Find work</Link>
          </div>
        </div>
        <div className="vh-pane vh-right">
          <Tickets pane className="stream vh-stream" />
          <VaultCard />
        </div>
      </section>

      <section id="how" className="section container">
        <h2 className="display big-title" data-reveal>Money you<br />can see</h2>
        <div className="rcards" data-reveal>
          <article className="rcard">
            <Ring size={440} className="ring-a" />
            <span className="rtag rtag-a">2 of 3</span>
            <div className="plate" aria-hidden>
              <div className="plate-well">
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#111318" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.4" fill="#111318" /></svg>
              </div>
            </div>
            <h3 className="display rcard-title">Nobody holds<br />it alone</h3>
            <p className="rcard-desc">Every gig gets its own Squads vault. Two of three signatures move it, us included.</p>
          </article>

          <article className="rcard">
            <svg className="arc" viewBox="0 0 400 200" aria-hidden>
              <path id="arcPath" d="M20 190 A180 180 0 0 1 380 190" fill="none" stroke="url(#ringDown)" strokeWidth="1" />
              <path d="M20 190 A180 180 0 0 1 380 190" fill="none" stroke="#111318" strokeOpacity=".1" strokeWidth="1" />
              <circle r="5" fill="#111318"><animateMotion dur="3.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".6 0 .4 1"><mpath href="#arcPath" /></animateMotion></circle>
            </svg>
            <span className="rtag rtag-from">Poster</span>
            <span className="rtag rtag-to">Worker</span>
            <h3 className="display rcard-title">Paid the moment<br />it&apos;s done</h3>
            <p className="rcard-desc">They deliver, you both sign, and the vault sends the budget straight to their wallet.</p>
          </article>

          <article className="rcard">
            <Ring size={460} className="ring-o" />
            <Ring size={250} className="ring-i" />
            <span className="rtag rtag-c">SOL or USDC</span>
            <div className="badge" aria-hidden>
              <div className="badge-in">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#111318" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </div>
            </div>
            <h3 className="display rcard-title">Any online<br />crypto work</h3>
            <p className="rcard-desc">Design, video, threads, code, community and research. Nothing in person, nothing risky.</p>
          </article>
        </div>

        <div className="find-card" data-reveal>
          <h3 className="display">Find work<br />that&apos;s paid for</h3>
          <Finder />
        </div>
      </section>

      <section className="section container" aria-label="Post a gig">
        <div className="duo" data-reveal>
          <div className="duo-left">
            <h2 className="display duo-title">Post a gig<br />in a minute</h2>
            <ol className="steps3">
              {HOPS.map((h, i) => (
                <li key={h.t}><span className="n">{i + 1}</span><span><strong>{h.t}</strong><span>{h.d}</span></span></li>
              ))}
            </ol>
          </div>
          <div className="duo-right"><QuickPost /></div>
        </div>
      </section>

      <section id="board" className="section container" data-reveal>
        <div className="head-c">
          <h2 className="display big-title">Work that&apos;s<br />paid for</h2>
          <p className="lede">Every gig here has a budget waiting to be locked. Apply, get hired, and the money is in the vault before you start.</p>
        </div>
        <Board />
      </section>

      <section id="live" className="section container" data-reveal>
        <div className="head-c">
          <h2 className="display big-title">Out in<br />the open</h2>
          <p className="lede">New gigs, locked budgets and payouts as they happen. Only real activity from the board.</p>
        </div>
        <LiveFeed />
      </section>

      <section className="section container" data-reveal>
        <div className="head-c">
          <h2 className="display big-title">Hiring,<br />compared</h2>
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
        <div className="end">
          <div className="end-copy">
            <h2 className="display end-title">Somebody out<br />there can do it.</h2>
            <p>Post the job, pick who you like, and pay them from a vault they can see is full. Posting is free.</p>
            <Link href="/post" className="cta-split"><span className="cta-label">Post a gig</span><span className="cta-arrow"><Arrow /></span></Link>
          </div>
          <div className="end-art">
            <Bunny full size={190} id="gigs-cta" title="GIGS waving" ground={false} />
          </div>
        </div>
      </section>
    </div>
  );
}
