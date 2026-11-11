import Link from "next/link";
import WalletButton from "./WalletButton";
import { SITE_NAME } from "@/lib/config";
import Logo from "./Logo";

export function Mark() {
  return <Logo size={22} />;
}

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
          <Link href="/how-it-works" className="hide-sm">How it works</Link>
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
