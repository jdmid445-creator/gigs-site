import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/geist";
import "./globals.css";
import Providers from "@/components/Providers";
import Header, { Mark } from "@/components/Header";
import CopyCA from "@/components/CopyCA";
import { SITE_NAME, CLUSTER } from "@/lib/config";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  twitter: { card: "summary_large_image" },
  title: `${SITE_NAME}: crypto gigs with escrow`,
  description:
    "Hire people for crypto work: design, edits, threads, code, community. The budget is locked in a 2-of-3 vault and released when the work is done.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2f2ef",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="wrap footer-row">
              <Link href="/" className="brand"><Mark />{SITE_NAME}</Link>
              <nav className="footer-links" aria-label="Footer">
                <Link href="/#board">Gigs</Link>
                <Link href="/leaderboard">Leaderboard</Link>
                <Link href="/how-it-works">Docs</Link>
                <a href="https://squads.so" target="_blank" rel="noreferrer">Squads</a>
              </nav>
              <CopyCA />
            </div>
            <p className="wrap fine-print">
              Escrow runs on Squads vaults on Solana.{CLUSTER === "devnet" ? " This is the test network: no real money moves." : ""} Not financial advice.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
