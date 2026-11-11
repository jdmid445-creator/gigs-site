import Link from "next/link";
import HeroDemo from "@/components/HeroDemo";
import Board from "@/components/Board";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="rise">
            <h1>Crypto work with the money already locked</h1>
            <p className="lede">
              Post a job for design, edits, threads or code. The budget sits in a vault shared by you, the worker and a
              referee, and two of the three have to sign before it moves.
            </p>
            <div className="hero-actions">
              <Link href="/post" className="btn primary">Post a gig</Link>
              <Link href="#board" className="btn line">Browse gigs</Link>
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>
      <Board />
    </>
  );
}
