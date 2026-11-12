import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GigRow from "@/components/Slip";
import Avatar from "@/components/Avatar";
import Bunny from "@/components/Bunny";
import { getUserPage, resolveUser } from "@/lib/profiles";
import { explorerAccount, SITE_NAME } from "@/lib/config";
import { Gig } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
const money = (n: number) => (n === 0 ? "$0" : n >= 100 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(2)}`);
const num = (n: number, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d });
const ago = (iso: string) => {
  const d = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const wallet = await resolveUser(id);
  if (!wallet) return { title: `Not found | ${SITE_NAME}` };
  const { profile, stats } = await getUserPage(wallet);
  const name = profile?.handle ? `@${profile.handle}` : short(wallet);
  return {
    title: `${name} | ${SITE_NAME}`,
    description: `${stats.done} gigs done, ${money(stats.earnedUsd)} earned through escrow on ${SITE_NAME}`,
    twitter: { card: "summary_large_image" },
  };
}

function Rating({ value }: { value: number }) {
  return (
    <span className="rating" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={value >= i - 0.25 ? "on" : ""} />)}
    </span>
  );
}

const row = (g: Gig) => ({ ...g, status: g.status === "hiring" ? "open" : g.status });

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  const wallet = await resolveUser(id);
  if (!wallet) notFound();
  const { profile, stats, worked, posted, reviews } = await getUserPage(wallet);
  const name = profile?.handle ? `@${profile.handle}` : short(wallet);
  const nothing = !profile && !worked.length && !posted.length;

  return (
    <div className="page container">
      <div className="page-head">
        <div>
          <div className="profile-id">
            <Avatar wallet={wallet} size={64} />
            <div>
              <h1>{name}</h1>
              <p className="byline" style={{ marginTop: 8 }}>
                <a href={explorerAccount(wallet)} target="_blank" rel="noreferrer">{profile?.handle ? short(wallet) : "View on Solscan"}</a>
                {profile?.x_handle && <a href={`https://x.com/${profile.x_handle}`} target="_blank" rel="noreferrer">@{profile.x_handle} on X</a>}
                {profile && <span>Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>}
              </p>
            </div>
          </div>
          {profile?.bio && <p className="lede" style={{ marginTop: 18 }}>{profile.bio}</p>}
          {profile?.skills?.length ? <div className="chipline" style={{ marginTop: 14 }}>{profile.skills.map((s) => <span key={s} className="pill">{s}</span>)}</div> : null}
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <dl className="panel stats">
            <div><dt>Gigs done</dt><dd>{stats.done}</dd></div>
            <div><dt>Earned</dt><dd>{money(stats.earnedUsd)}</dd>
              <span className="hint">{[stats.earnedSol && `${num(stats.earnedSol)} SOL`, stats.earnedUsdc && `${num(stats.earnedUsdc, 0)} USDC`].filter(Boolean).join(" and ") || "Nothing yet"}</span></div>
            <div><dt>Rating</dt><dd>{stats.rating ? stats.rating.toFixed(1) : "None yet"}</dd>
              <span className="hint">{stats.reviews ? `${stats.reviews} review${stats.reviews > 1 ? "s" : ""}` : "No reviews yet"}</span></div>
            <div><dt>Paid out as poster</dt><dd>{money(stats.paidOutUsd)}</dd>
              <span className="hint">{stats.posted} gig{stats.posted === 1 ? "" : "s"} posted</span></div>
          </dl>

          {nothing && (
            <div className="panel">
              <div className="empty" style={{ margin: 6 }}>
                <Bunny size={110} id="gigs-user-empty" mood="sleep" title="" />
                <h3>Nothing here yet</h3>
                <p className="muted">This wallet hasn&apos;t posted or finished a gig.</p>
              </div>
            </div>
          )}

          {worked.length > 0 && (
            <div className="board">
              <div className="board-head"><h2 className="panel-title">Work</h2></div>
              <div className="gig-list">{worked.slice(0, 10).map((g) => <GigRow key={g.id} gig={row(g)} meta={<span>{ago(g.updated_at)}</span>} />)}</div>
            </div>
          )}
          {posted.length > 0 && (
            <div className="board">
              <div className="board-head"><h2 className="panel-title">Posted</h2></div>
              <div className="gig-list">{posted.slice(0, 10).map((g) => <GigRow key={g.id} gig={row(g)} meta={<span>{ago(g.created_at)}</span>} />)}</div>
            </div>
          )}
        </div>

        <aside className="stack sticky">
          <div className="panel pad">
            <h2 className="panel-title">Reviews</h2>
            {stats.rating !== null && (
              <div className="rating-big"><b>{stats.rating.toFixed(1)}</b><Rating value={stats.rating} /></div>
            )}
            {reviews.length === 0 && <p className="hint">Reviews show up here after a gig is paid out.</p>}
            <ul className="reviews">
              {reviews.map((r) => (
                <li key={r.gig_id + r.author}>
                  <div className="item-top">
                    <Rating value={r.rating} />
                    <span className="hint">{ago(r.created_at)}</span>
                  </div>
                  {r.body && <p>{r.body}</p>}
                  <span className="hint">
                    <Link className="inline-link" href={`/u/${r.author}`}>{r.authorHandle ? `@${r.authorHandle}` : short(r.author)}</Link>
                    {r.gigTitle && <>{" on "}<Link className="inline-link" href={`/gigs/${r.gig_id}`}>{r.gigTitle}</Link></>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {stats.completion !== null && (
            <p className="hint preview-note">
              {Math.round(stats.completion * 100)}% of escrowed gigs paid out, the rest refunded
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
