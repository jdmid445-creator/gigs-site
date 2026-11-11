import Link from "next/link";
import WalletButton from "./WalletButton";
import { SITE_NAME, CLUSTER } from "@/lib/config";
import Bunny from "./Bunny";

export function Mark({ id = "gigs-logo" }: { id?: string }) {
  return <Bunny size={34} id={id} crop ground={false} title="" />;
}

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-row">
        <Link href="/" className="brand">
          <Mark />
          {SITE_NAME}
          {CLUSTER === "devnet" && <span className="net" title="Test network: no real money moves">Devnet</span>}
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
