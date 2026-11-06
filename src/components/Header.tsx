import Link from "next/link";
import WalletButton from "./WalletButton";
import { SITE_NAME, CLUSTER } from "@/lib/config";

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href="/" className="brand">
          <Mark />
          {SITE_NAME}
        </Link>
        <nav className="nav">
          <Link href="/#board">Find work</Link>
          <Link href="/post">Post a gig</Link>
          <Link href="/how-it-works">How it works</Link>
        </nav>
        <WalletButton />
      </div>
      {CLUSTER === "devnet" && (
        <div className="devnet-bar">Test mode: this site runs on Solana devnet, so no real money moves.</div>
      )}
    </header>
  );
}

/** Placeholder mark: a ticket stub. Swap for the real logo once it's made. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <path
        d="M3 4h16v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6z"
        fill="var(--ink)"
      />
      <path d="M8 4v14" stroke="var(--paper)" strokeWidth="1.4" strokeDasharray="2 2" />
    </svg>
  );
}
