import Link from "next/link";
import DotBunny from "@/components/DotBunny";
import HeroDemo from "@/components/HeroDemo";
import Board from "@/components/Board";

export default function Home() {
  return (
    <>
      <section className="hero">
        <DotBunny className="hero-dots" />
        <div className="hero-copy rise" data-copy>
          <h1>Crypto gigs with the money already locked</h1>
          <p className="lede">
            Post a job for design, edits, threads or code. The budget waits in a 2-of-3 vault until the work is done.
          </p>
          <div className="hero-actions">
            <Link href="/post" className="btn primary">Post a gig</Link>
            <Link href="#board" className="text-btn">Browse gigs</Link>
          </div>
        </div>
      </section>
      <Board />
      <section className="explain" id="how">
        <div className="wrap explain-grid">
          <div>
            <h2>How a gig pays out</h2>
            <p className="lede">Every gig gets its own Squads vault. Any two of the three people on it can move the money, and nobody can move it alone.</p>
            <ol className="steps">
              <li><div><b>The poster hires and locks the budget</b><span>One signature creates the vault and funds it</span></div></li>
              <li><div><b>The worker delivers and signs</b><span>Their signature is the first of the two needed</span></div></li>
              <li><div><b>The poster signs and it pays out</b><span>If they disagree, the referee casts the deciding vote</span></div></li>
            </ol>
          </div>
          <HeroDemo />
        </div>
      </section>
    </>
  );
}
