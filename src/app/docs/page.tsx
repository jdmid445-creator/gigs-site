import Link from "next/link";
import { SITE_NAME, FEE_BPS } from "@/lib/config";

export const metadata = { title: `Docs | ${SITE_NAME}`, description: `How ${SITE_NAME} escrow works: 2 of 3 Squads vaults, disputes, what's allowed and fees.` };

const SECTIONS = [
  ["overview", "Overview"],
  ["flow", "A gig, start to finish"],
  ["vault", "The vault"],
  ["disputes", "Disputes"],
  ["profiles", "Profiles and reviews"],
  ["allowed", "What's allowed"],
  ["fees", "Fees"],
];

export default function Docs() {
  return (
    <div className="container docs">
      <nav className="docs-nav" aria-label="Docs">
        <p>Docs</p>
        {SECTIONS.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
      </nav>
      <article className="docs-body">
        <h1 id="overview">How {SITE_NAME} works</h1>
        <p>
          {SITE_NAME} is a job board for online crypto work. People post gigs with a budget in SOL or USDC, workers apply,
          and the budget is held in escrow until the work is delivered.
        </p>
        <p>
          The escrow isn&apos;t our wallet. Every gig gets its own Squads vault on Solana that needs two of three signatures
          to move: the poster&apos;s, the worker&apos;s and the referee&apos;s. No single person can take the money, us included.
        </p>

        <h2 id="flow">A gig, start to finish</h2>
        <ul className="docs-steps">
          <li><b>Post</b><span>Poster</span>Lists the job, deadline and budget. Nothing leaves their wallet yet.</li>
          <li><b>Apply</b><span>Workers</span>Send a pitch and a portfolio link.</li>
          <li><b>Hire</b><span>Poster</span>One signature creates the vault and locks the full budget in it.</li>
          <li><b>Deliver</b><span>Worker</span>Submits the work and approves the payout to themselves (1 of 2).</li>
          <li><b>Pay</b><span>Poster</span>Approves the payout (2 of 2). The vault sends the money to the worker.</li>
        </ul>

        <h2 id="vault">The vault</h2>
        <p>
          Vaults are created with <a href="https://squads.so" target="_blank" rel="noreferrer">Squads</a>, the audited multisig most
          Solana teams use for their treasuries. Each one is set to two of three signers with no admin, so the signers can never
          be changed. You can open any gig&apos;s vault on Squads or Solscan from its page.
        </p>
        <p>The referee key can only vote. It can&apos;t start a payment and can&apos;t move funds on its own.</p>

        <h2 id="disputes">Disputes</h2>
        <p>
          If the poster doesn&apos;t approve delivered work, or the worker disappears, either side can open a dispute. The referee
          reads the gig description, the delivered work and both explanations, then signs whichever side is right: payment to the
          worker or a refund to the poster. That vote is the second signature, and the winning side sends the funds.
        </p>
        <p>A clear description of what &ldquo;done&rdquo; means is the best protection for both sides.</p>

        <h2 id="profiles">Profiles and reviews</h2>
        <p>
          Every wallet has a public profile built from finished gigs: what it earned, what it paid out, and reviews left by the other
          side once a gig is paid. Only paid-out gigs count toward the <Link href="/leaderboard">leaderboard</Link>.
        </p>

        <h2 id="allowed">What&apos;s allowed</h2>
        <p>
          Online work only: design, video and motion, writing and threads, development and bots, community management, engagement
          and research. No dangerous stunts, harassment, adult content, illegal work, or wallet and market manipulation. Listings
          that get reported are reviewed and removed.
        </p>

        <h2 id="fees">Fees</h2>
        <p>
          {FEE_BPS > 0 ? `${SITE_NAME} takes ${FEE_BPS / 100}% from each completed payout. Refunds are free. ` : `${SITE_NAME} doesn't take a fee right now. `}
          Solana network fees are a fraction of a cent. Creating a vault also has a small one-time account cost, which your wallet
          shows before you sign.
        </p>
        <p style={{ marginTop: 28 }}><Link className="btn btn-ink" href="/post" style={{ textDecoration: "none", color: "#fff" }}>Post a gig</Link></p>
      </article>
    </div>
  );
}
