import Link from "next/link";
import HeroDemo from "@/components/HeroDemo";
import Board from "@/components/Board";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>Hire people for crypto work. Pay when it&apos;s done.</h1>
            <p className="lede">
              Post a job for design, edits, threads, code or community work. The budget is locked in a
              vault that needs two of three signatures to move, so nobody runs off with it, us included.
            </p>
            <div className="hero-actions">
              <Link href="/post" className="btn blue">Post a gig</Link>
              <Link href="#board" className="btn line">Find work</Link>
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>
      <Board />
    </>
  );
}
