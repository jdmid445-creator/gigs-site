import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/mona-sans/wdth.css";
import "./globals.css";
import Providers from "@/components/Providers";
import Header, { Mark } from "@/components/Header";
import { SITE_NAME, CLUSTER } from "@/lib/config";

export const metadata: Metadata = {
  title: `${SITE_NAME}: crypto work with escrow`,
  description:
    "Hire people for crypto work: design, edits, threads, code, community. The budget is locked in a 2-of-3 vault and released when the work is done.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eceef1",
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
              <span className="brand"><Mark />{SITE_NAME}</span>
              {CLUSTER === "devnet" && <span>Test network, no real money moves</span>}
              <Link href="/how-it-works">How escrow works</Link>
              <a href="https://squads.so" target="_blank" rel="noreferrer">Vaults by Squads</a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
