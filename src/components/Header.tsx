import Link from "next/link";
import WalletButton from "./WalletButton";
import CopyCA from "./CopyCA";
import Logo from "./Logo";
import HeaderFade from "./HeaderFade";
import InboxButton from "./InboxButton";
import { SITE_NAME, X_URL } from "@/lib/config";

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="site-header">
      <HeaderFade />
      <div className="container header-row">
        <Link href="/" className="brand" aria-label={`${SITE_NAME} home`}>
          <Logo size={26} />
          <span>{SITE_NAME}</span>
        </Link>
        <nav className="seg" aria-label="Main">
          <Link href="/#board">Gigs</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="header-end">
          {X_URL && (
            <a href={X_URL} className="icon-btn" target="_blank" rel="noopener noreferrer" aria-label={`${SITE_NAME} on X`}>
              <XIcon />
            </a>
          )}
          <CopyCA />
          <InboxButton />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
