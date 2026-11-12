import Link from "next/link";
import Bunny from "@/components/Bunny";

export default function NotFound() {
  return (
    <div className="page container">
      <div className="lost">
        <Bunny size={170} id="gigs-404" title="GIGS looking around" />
        <h1 className="page-title">This page hopped off</h1>
        <p className="muted">The link might be old, or the gig was removed.</p>
        <Link className="btn btn-ink" href="/">Back to the board</Link>
      </div>
    </div>
  );
}
