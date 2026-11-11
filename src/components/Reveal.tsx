"use client";
import { useEffect } from "react";

/** Adds .is-in to [data-reveal] sections the first time they scroll into view. */
export default function Reveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -12% 0px" }
    );
    els.forEach((el) => io.observe(el));
    document.documentElement.classList.add("motion-ready");
    return () => io.disconnect();
  }, []);
  return null;
}
