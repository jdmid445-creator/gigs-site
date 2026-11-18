import Bunny from "./Bunny";

/**
 * The hero's one moment: a gig ticket printed like a work order, stamped PAID,
 * with the lime coin resting on it. Example content, not live data.
 */
export default function PaidTicket() {
  return (
    <figure className="pt" aria-label="Example gig ticket: logo for a Solana token, 2.5 SOL, stamped paid">
      <div className="pt-paper">
        <div className="pt-head">
          <span className="pt-brand">GIGS</span>
          <span className="pt-no">Work order 0412</span>
        </div>
        <p className="pt-title">Logo for a Solana token, 3 options</p>
        <dl className="pt-rows">
          <div><dt>Budget</dt><dd>2.5 SOL</dd></div>
          <div><dt>Due</dt><dd>Friday</dd></div>
          <div><dt>Held in</dt><dd>2 of 3 vault</dd></div>
          <div><dt>Signed</dt><dd>Poster, worker</dd></div>
        </dl>
        <div className="pt-code" aria-hidden />
        <span className="pt-stamp" aria-hidden>
          <b>Paid</b>
          <small>2 of 3 signed</small>
        </span>
      </div>
      <span className="pt-coin" aria-hidden>
        <span className="pt-coin-face"><Bunny size={58} id="gigs-coin" title="" ground={false} /></span>
      </span>
    </figure>
  );
}
