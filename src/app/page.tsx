import Link from "next/link";
import HeroDemo from "@/components/HeroDemo";
import Board from "@/components/Board";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>Crypto work with the money already locked.</h1>
            <p className="lede">
              Every gig&apos;s budget sits in its own vault shared by the poster, the worker and a referee. Two of the
              three have to sign before it moves, so nobody can pull it alone.
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
