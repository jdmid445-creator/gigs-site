import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_NAME } from "@/lib/config";

// Self-hosted and preloaded, with size-matched fallbacks, so text never jumps when the real font arrives.
const geist = localFont({ src: "./fonts/geist-latin-wght-normal.woff2", weight: "100 900", variable: "--font-geist", display: "swap", preload: true, adjustFontFallback: "Arial" });
const figtree = localFont({
  src: [{ path: "./fonts/figtree-latin-500-normal.woff2", weight: "500" }, { path: "./fonts/figtree-latin-600-normal.woff2", weight: "600" }],
  variable: "--font-figtree", display: "swap", preload: true, adjustFontFallback: "Arial",
});
const instrument = localFont({
  src: [{ path: "./fonts/instrument-sans-latin-400-normal.woff2", weight: "400" }, { path: "./fonts/instrument-sans-latin-500-normal.woff2", weight: "500" }],
  variable: "--font-instrument", display: "swap", preload: true, adjustFontFallback: "Arial",
});

/** Holds the opening rise-in until the real fonts are ready (never longer than 1.2s), so the headline animates in already in its final font. */
const FONTS_READY = `(function(){var d=document.documentElement,done=function(){d.classList.add('fonts-ready')};try{if(document.fonts&&document.fonts.ready){document.fonts.ready.then(done)}else{done()}}catch(e){done()}setTimeout(done,1200)})();`;

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
    <html lang="en" className={`${geist.variable} ${figtree.variable} ${instrument.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FONTS_READY }} />
      </head>
      <body>
        <Providers>
          <a href="#main" className="sr-only">Skip to content</a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
