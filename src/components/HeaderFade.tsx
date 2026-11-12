"use client";

import { useEffect } from 'react';

// Fades the header out while you scroll down the page and brings it back when you scroll up.
// Once you're past the hero it comes back on a frosted strip, so it never sits on top of content.
export default function HeaderFade() {
  useEffect(() => {
    const el = document.querySelector('.site-header');
    if (!el) return;
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const down = y > last + 4;
      const up = y < last - 4;
      if (y < 80) el.classList.remove('is-away', 'is-solid');
      else {
        if (down) el.classList.add('is-away');
        else if (up) el.classList.remove('is-away');
        el.classList.add('is-solid');
      }
      if (down || up) last = y;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    // Focusing a link in the header always shows it.
    const onFocus = () => el.classList.remove('is-away');
    window.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('focusin', onFocus);
    update();
    return () => { window.removeEventListener('scroll', onScroll); el.removeEventListener('focusin', onFocus); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
