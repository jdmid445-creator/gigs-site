import Link from "next/link";
import Avatar from "@/components/Avatar";
import Bunny from "@/components/Bunny";
import { getLeaderboard } from "@/lib/profiles";
import { SITE_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = {
  title: `Leaderboard | ${SITE_NAME}`,
  description: "Who earns the most through escrowed gigs, and who pays out the most",
};

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
const money = (n: number) => (n >= 100 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(2)}`);

type Entry = { wallet: string; handle: string | null; usd: number; done: number };

function Board({ title, sub, rows, noun }: { title: string; sub: string; rows: Entry[]; noun: string }) {
  return (
    <section className="panel pad">
      <div>
        <h2 className="panel-title">{title}</h2>
        <p className="hint" style={{ marginTop: 4 }}>{sub}</p>
      </div>
      {rows.length === 0 ? (
        <div className="empty" style={{ margin: 0 }}>
          <Bunny size={96} id={`gigs-lb-${noun}`} mood="sleep" title="" />
          <p className="muted">Nobody yet. The first paid gig puts someone here.</p>
        </div>
      ) : (
        <ol className="ranks">
          {rows.map((r, i) => (
            <li key={r.wallet}>
              <Link href={`/u/${r.handle ?? r.wallet}`}>
                <span className="rank">{i + 1}</span>
                <Avatar wallet={r.wallet} size={32} />
                <span className="rank-name">
                  <strong>{r.handle ? `@${r.handle}` : short(r.wallet)}</strong>
                  <span>{r.done} {noun}{r.done === 1 ? "" : "s"}</span>
                </span>
                <span className="rank-usd">{money(r.usd)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function Leaderboard() {
  const { workers, posters, solPrice } = await getLeaderboard();
  return (
    <div className="page container">
      <div className="page-head">
        <div>
          <h1>Leaderboard</h1>
          <p className="lede">
            Only gigs paid out of escrow count. SOL is valued at today&apos;s price{solPrice ? ` ($${solPrice.toFixed(2)})` : ""}.
          </p>
        </div>
        <a href="/post" className="btn btn-ink">Post a gig</a>
      </div>
      <div className="lb">
        <Board title="Top earners" sub="Workers ranked by what they've been paid" rows={workers} noun="gig" />
        <Board title="Top posters" sub="Posters ranked by what they've paid out" rows={posters} noun="payout" />
      </div>
    </div>
  );
}
