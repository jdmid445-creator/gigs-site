import Link from "next/link";
import WalletButton from "./WalletButton";
import CopyCA from "./CopyCA";
import Logo from "./Logo";
import { SITE_NAME, X_URL } from "@/lib/config";

export function Mark() {
  return <Logo size={24} />;
}

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href="/" className="brand" aria-label={`${SITE_NAME} home`}>
          <Mark />
          {SITE_NAME}
        </Link>
        <nav className="navpill" aria-label="Main">
          <Link href="/#board">Gigs</Link>
          <Link href="/#live">Live</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/how-it-works">Docs</Link>
        </nav>
        <div className="header-end">
          {X_URL && (
            <a href={X_URL} className="icon-btn" target="_blank" rel="noreferrer" aria-label={`${SITE_NAME} on X`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z" /></svg>
            </a>
          )}
          <CopyCA />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
