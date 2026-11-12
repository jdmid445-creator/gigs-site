import Link from "next/link";
import Logo from "./Logo";
import CopyCA from "./CopyCA";
import { SITE_NAME, X_URL, CLUSTER } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <span className="brand small-brand"><Logo size={22} /> {SITE_NAME}</span>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/#board">Gigs</Link>
          <Link href="/post">Post a gig</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/docs">Docs</Link>
          {X_URL && <a href={X_URL} target="_blank" rel="noopener noreferrer">X</a>}
        </nav>
        <CopyCA />
      </div>
      <p className="container fine-print">
        Escrow runs on Squads vaults on Solana.{CLUSTER === "devnet" ? " This is the test network: no real money moves." : ""} Not affiliated with Squads. Not financial advice.
      </p>
    </footer>
  );
}
