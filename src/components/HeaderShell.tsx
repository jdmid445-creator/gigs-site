"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Sits at the top with no background. Scrolling down slides it away; scrolling up brings it back
 * on a frosted band, so page content never runs underneath the logo or buttons.
 */
export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last.current;
        setScrolled(y > 8);
        if (y < 80) setHidden(false);
        else if (dy > 6) setHidden(true);
        else if (dy < -6) setHidden(false);
        last.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${hidden ? " is-hidden" : ""}`}
      onFocusCapture={() => setHidden(false)}>
      {children}
    </header>
  );
}
