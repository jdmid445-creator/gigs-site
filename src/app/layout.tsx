import type { Metadata, Viewport } from "next";
import "@fontsource-variable/schibsted-grotesk";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `${SITE_NAME}: crypto gigs with escrow`,
  description:
    "Hire people for crypto work: design, edits, threads, code, community. The budget is locked in a 2-of-3 vault and released when the work is done.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E8EDF2",
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
              <span>{SITE_NAME}</span>
              <a href="/how-it-works">How escrow works</a>
              <a href="https://squads.so" target="_blank" rel="noreferrer">Vaults by Squads</a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
