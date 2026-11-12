"use client";
import Link from "next/link";
import { Currency, amountShort } from "@/lib/money";
import { UsdHint } from "./usePrices";

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "open" },
  hiring: { label: "Open", cls: "open" },
  funded: { label: "Locked", cls: "locked" },
  submitted: { label: "Delivered", cls: "locked" },
  paid: { label: "Paid", cls: "paid" },
  refunded: { label: "Refunded", cls: "" },
  cancelled: { label: "Closed", cls: "" },
  disputed: { label: "Disputed", cls: "warn" },
};

export function Stamp({ status, disputed }: { status: string; disputed?: boolean }) {
  const s = disputed && (status === "funded" || status === "submitted") ? STATUS.disputed : STATUS[status] ?? STATUS.open;
  return <span className={`status ${s.cls}`}>{s.label}</span>;
}

export const amountParts = amountShort;

export type SlipGig = {
  id: string;
  title: string;
  category: string;
  currency: Currency;
  amount: string;
  deadline_days: number;
  status: string;
  disputed?: boolean;
  created_at: string;
};

/** One gig as a row on the board: title and details on the left, budget and status on the right. */
export default function GigRow({ gig, meta, href = true }: { gig: SlipGig; meta?: React.ReactNode; href?: boolean }) {
  const inner = (
    <>
      <div className="gig-main">
        <div className="gig-title">{gig.title}</div>
        <div className="gig-meta">
          <span>{gig.category}</span>
          {meta}
        </div>
      </div>
      <div className="gig-amt">
        {amountParts(gig.amount, gig.currency)}<small>{gig.currency}</small>
        <UsdHint amount={gig.amount} currency={gig.currency} />
      </div>
      <Stamp status={gig.status} disputed={gig.disputed} />
    </>
  );
  return href ? (
    <Link href={`/gigs/${gig.id}`} className="gig-row">{inner}</Link>
  ) : (
    <div className="gig-row">{inner}</div>
  );
}
