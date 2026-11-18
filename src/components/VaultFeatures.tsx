import Logo from "./Logo";

// "How the vault works": three cards, each with a small coded object above its copy.

const KEYHOLE = "M12 5a3.6 3.6 0 0 0-1.7 6.77L9.4 19h5.2l-.9-7.23A3.6 3.6 0 0 0 12 5z";
const BOLT = "M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z";

// One ring per card, same size and centre in all three, so the cards read as a set.
function Ring() {
  return (
    <svg className="vf-ring" viewBox="0 0 300 300" aria-hidden>
      <circle cx="150" cy="150" r="149.5" fill="none" stroke="url(#ringDown)" />
      <circle cx="150" cy="150" r="100" fill="none" stroke="url(#ringDown)" />
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
            <Ring />
            <span className="vf-tag vf-tag-top">Poster, worker, referee</span>
            <div className="vf-keyplate">
              <div className="vf-well">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={KEYHOLE} /></svg>
              </div>
            </div>
          </div>
          <h3 className="vf-card-title">Two of three<br />keys</h3>
          <p className="vf-card-desc">Every gig gets its own Squads vault. Any two signers move the money, and nobody can move it alone, us included.</p>
        </article>

        <article className="vf-card vf-card-mid" data-reveal>
          <div className="vf-art">
            <Ring />
            <span className="vf-tag vf-tag-l">Vault</span>
            <span className="vf-tag vf-tag-r">Wallet</span>
            <span className="vf-node" aria-hidden />
            <div className="vf-coin" aria-hidden><Logo size={40} /></div>
          </div>
          <h3 className="vf-card-title">Paid on<br />delivery</h3>
          <p className="vf-card-desc">They deliver and sign, you sign, and the budget goes straight to their wallet. A referee breaks ties.</p>
        </article>

        <article className="vf-card" data-reveal>
          <div className="vf-art">
            <Ring />
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
