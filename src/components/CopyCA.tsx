"use client";
import { useState } from "react";
import { CA } from "@/lib/config";

/** The coin's contract address as a quiet pill: "CA: soon" until it launches, then click to copy. */
export default function CopyCA() {
  const [copied, setCopied] = useState(false);
  if (!CA) return <span className="ca-pill is-soon">CA: soon</span>;
  return (
    <button
      type="button"
      className="ca-pill"
      onClick={() => navigator.clipboard?.writeText(CA).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
      aria-label="Copy contract address"
    >
      {copied ? "Copied" : `CA: ${CA.slice(0, 4)}…${CA.slice(-4)}`}
    </button>
  );
}
