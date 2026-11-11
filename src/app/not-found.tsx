import Link from "next/link";
import Bunny from "@/components/Bunny";

export default function NotFound() {
  return (
    <div className="page">
      <div className="wrap lost">
        <Bunny size={200} id="gigs-404" title="GIGS looking around" />
        <h1>This page hopped off</h1>
        <p className="muted">The link might be old, or the gig was removed.</p>
        <Link className="btn primary" href="/">Back to the board</Link>
      </div>
    </div>
  );
}
