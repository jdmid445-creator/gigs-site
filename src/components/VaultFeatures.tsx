import Logo from "./Logo";

// "How the vault works": three cards, each with a small coded object above its copy.

const KEY = "M15.5 7.5a3.5 3.5 0 1 1-3.08 5.16L5 20.08V17h2v-2h2v-2l2.42-2.42A3.5 3.5 0 0 1 15.5 7.5zM16.5 9.75h.01";
const BOLT = "M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z";

function Ring({ size, up = false, className }: { size: number; up?: boolean; className: string }) {
  return (
    <svg className={`vf-ring ${className}`} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} fill="none" stroke={`url(#${up ? "ringUp" : "ringDown"})`} />
    </svg>
  );
}

export default function VaultFeatures() {
  return (
    <section id="how" className="vf container" aria-labelledby="vf-title">
      <h2 id="vf-title" className="vf-title" data-reveal>How the<br />vault works</h2>
      <div className="vf-grid">
        <article className="vf-card" data-reveal>
          <div className="vf-art">
            <Ring size={420} className="vf-ring-a" />
            <span className="vf-tag vf-tag-top">Poster, worker, referee</span>
            <div className="vf-keyplate">
              <div className="vf-well">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={KEY} /></svg>
              </div>
            </div>
          </div>
          <h3 className="vf-card-title">Two of three<br />keys</h3>
          <p className="vf-card-desc">Every gig gets its own Squads vault. Any two signers move the money, and nobody can move it alone, us included.</p>
        </article>

        <article className="vf-card vf-card-mid" data-reveal>
          <div className="vf-art">
            <Ring size={420} up className="vf-ring-b" />
            <span className="vf-tag vf-tag-l">Vault</span>
            <span className="vf-tag vf-tag-r">Their wallet</span>
            <span className="vf-node" aria-hidden />
            <div className="vf-coin" aria-hidden><Logo size={40} /></div>
          </div>
          <h3 className="vf-card-title">Paid on<br />delivery</h3>
          <p className="vf-card-desc">They deliver and sign, you sign, and the budget goes straight to their wallet. A referee breaks ties.</p>
        </article>

        <article className="vf-card" data-reveal>
          <div className="vf-art">
            <Ring size={420} className="vf-ring-a" />
            <Ring size={230} className="vf-ring-c" />
            <span className="vf-tag vf-tag-top">Paid gigs only</span>
            <div className="vf-badge">
              <div className="vf-badge-in">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={BOLT} /></svg>
              </div>
            </div>
            <div className="vf-rep" aria-hidden>
              <span className="vf-rep-top"><Logo size={14} /> Profile</span>
              <span className="vf-rep-n">12 paid</span>
              <span className="vf-rep-bar"><i /></span>
            </div>
          </div>
          <h3 className="vf-card-title">A record<br />that pays</h3>
          <p className="vf-card-desc">Every payout adds to a public profile, so the next client can see what you have delivered before they hire.</p>
        </article>
      </div>
    </section>
  );
}
