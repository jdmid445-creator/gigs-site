import Link from "next/link";
import { fromBase, Currency } from "@/lib/money";

export const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "" },
  hiring: { label: "Open", cls: "" },
  funded: { label: "Locked", cls: "" },
  submitted: { label: "Delivered", cls: "" },
  paid: { label: "Paid", cls: "paid" },
  refunded: { label: "Refunded", cls: "grey" },
  cancelled: { label: "Closed", cls: "grey" },
  disputed: { label: "Disputed", cls: "warn" },
};

export function Stamp({ status, disputed, className = "" }: { status: string; disputed?: boolean; className?: string }) {
  const s = disputed && (status === "funded" || status === "submitted") ? STATUS.disputed : STATUS[status] ?? STATUS.open;
  return <span className={`stamp ${s.cls} ${className}`}>{s.label}</span>;
}

export function amountParts(amount: string, currency: Currency) {
  const n = fromBase(amount, currency);
  return n.toLocaleString("en-US", { maximumFractionDigits: currency === "SOL" ? (n < 1 ? 3 : 2) : 0 });
}

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

export default function Slip({ gig, meta, href = true }: { gig: SlipGig; meta?: React.ReactNode; href?: boolean }) {
  const inner = (
    <>
      <div className="slip-body">
        <span className="slip-cat">{gig.category}</span>
        <span className="slip-title">{gig.title}</span>
        <div className="slip-meta">
          <Stamp status={gig.status} disputed={gig.disputed} />
          {meta}
        </div>
      </div>
      <div className="slip-stub">
        <span className="slip-amount">{amountParts(gig.amount, gig.currency)}</span>
        <span className="slip-cur">{gig.currency}</span>
      </div>
    </>
  );
  return href ? (
    <Link href={`/gigs/${gig.id}`} className="slip">
      {inner}
    </Link>
  ) : (
    <div className="slip">{inner}</div>
  );
}
