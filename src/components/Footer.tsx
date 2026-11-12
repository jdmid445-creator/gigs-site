import Link from "next/link";
import Logo from "./Logo";
import CopyCA from "./CopyCA";
import { XIcon } from "./Header";
import { SITE_NAME, X_URL, CLUSTER } from "@/lib/config";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Board", links: [["Open gigs", "/#board"], ["Post a gig", "/post"], ["Leaderboard", "/leaderboard"], ["Your gigs", "/me"]] },
  { title: "Learn", links: [["How it works", "/docs"], ["The vault", "/docs#vault"], ["Disputes", "/docs#disputes"], ["Fees", "/docs#fees"]] },
  { title: "On-chain", links: [["Squads", "https://squads.so"], ["Solscan", "https://solscan.io"]] },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="foot-panel">
        <div className="container">
          <div className="foot-top">
            <div className="foot-brand">
              <Link href="/" className="brand"><Logo size={26} /> {SITE_NAME}</Link>
              <p>Hire anyone for crypto work and pay them from a vault nobody can empty alone.</p>
              <form className="foot-form" action="/post" method="get">
                <input name="title" maxLength={90} placeholder="What do you need done?" aria-label="What do you need done?" required />
                <button type="submit" className="btn btn-ink btn-sm">Start a gig</button>
              </form>
            </div>
            {COLS.map((c) => (
              <nav key={c.title} className="foot-col" aria-label={c.title}>
                <h4>{c.title}</h4>
                <ul>
                  {c.links.map(([t, href]) => (
                    <li key={t}>{href.startsWith("http") ? <a href={href} target="_blank" rel="noopener noreferrer">{t}</a> : <Link href={href}>{t}</Link>}</li>
                  ))}
                </ul>
              </nav>
            ))}
            <div className="foot-acc">
              {COLS.map((c) => (
                <details key={c.title}>
                  <summary>{c.title}<span className="plus" aria-hidden /></summary>
                  {c.links.map(([t, href]) => href.startsWith("http")
                    ? <a key={t} href={href} target="_blank" rel="noopener noreferrer">{t}</a>
                    : <Link key={t} href={href}>{t}</Link>)}
                </details>
              ))}
            </div>
          </div>
          <div className="foot-bottom">
            <span className="foot-copy">© {year} {SITE_NAME}</span>
            <div className="foot-end">
              {X_URL && <a href={X_URL} className="icon-btn" target="_blank" rel="noopener noreferrer" aria-label={`${SITE_NAME} on X`}><XIcon /></a>}
              <CopyCA />
            </div>
          </div>
          <p className="fine-print">
            Escrow runs on Squads vaults on Solana.{CLUSTER === "devnet" ? " This is the test network: no real money moves." : ""} Not affiliated with Squads. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
