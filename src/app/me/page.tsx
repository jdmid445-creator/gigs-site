"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/Providers";
import GigRow, { SlipGig } from "@/components/Slip";
import { api, ago } from "@/lib/client";

type Me = {
  wallet: string | null;
  isReferee: boolean;
  profile: { handle: string | null; bio: string; x_handle: string | null; skills: string[] } | null;
  gigs: (SlipGig & { poster: string; worker: string | null; updated_at: string })[];
  applied: { gig_id: string; created_at: string; gigs: { id: string; title: string; status: string; worker: string | null } | null }[];
};

export default function MyGigs() {
  const { wallet, signIn, setPickerOpen, loading } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [handle, setHandle] = useState("");
  const [xh, setXh] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!wallet) return;
    api<Me>("/api/me").then((m) => {
      setMe(m);
      setHandle(m.profile?.handle ?? "");
      setXh(m.profile?.x_handle ?? "");
      setBio(m.profile?.bio ?? "");
      setSkills((m.profile?.skills ?? []).join(", "));
    });
  }, [wallet]);

  if (loading) return <div className="page container"><p className="muted">Loading…</p></div>;
  if (!wallet)
    return (
      <div className="page container">
        <div className="page-head">
          <div>
            <h1>Your gigs</h1>
            <p className="lede">Sign in with your wallet to see gigs you posted and work you&apos;re doing.</p>
          </div>
          <button className="btn btn-ink" onClick={() => signIn().catch(() => setPickerOpen(true))}>Sign in</button>
        </div>
      </div>
    );

  const posted = me?.gigs.filter((g) => g.poster === wallet) ?? [];
  const working = me?.gigs.filter((g) => g.worker === wallet && g.poster !== wallet && g.status !== "open" && g.status !== "hiring") ?? [];
  const pending = me?.applied.filter((a) => a.gigs && (a.gigs.status === "open" || a.gigs.status === "hiring")) ?? [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await api("/api/profile", {
        handle, x_handle: xh, bio,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10),
      });
      setMsg("Profile saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="page container">
      <div className="page-head">
        <div>
          <h1>Your gigs</h1>
          <p className="lede">Work you&apos;re doing, gigs you posted, and the profile posters see when you apply.</p>
        </div>
        <Link className="btn btn-soft" href={`/u/${wallet}`}>View public profile</Link>
      </div>
      <div className="split">
        <div className="stack">
          {me?.isReferee && <div className="notice">You&apos;re the referee. <Link className="inline-link" href="/admin">Open the dispute queue</Link></div>}
          <div className="board">
            <div className="board-head"><h2 className="panel-title">Work you&apos;re doing</h2></div>
            {working.length ? <div className="gig-list">{working.map((g) => <GigRow key={g.id} gig={g} meta={<span>updated {ago(g.updated_at)}</span>} />)}</div>
              : <div className="empty"><p className="muted">Nothing yet.</p><Link className="btn btn-soft btn-sm" href="/#board">Find a gig</Link></div>}
          </div>
          {pending.length > 0 && (
            <div className="panel pad">
              <h2 className="panel-title">Applications waiting</h2>
              {pending.map((a) => (
                <Link key={a.gig_id} href={`/gigs/${a.gig_id}`} className="item">
                  <span style={{ fontWeight: 500 }}>{a.gigs!.title}</span>
                  <span className="hint">Applied {ago(a.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="board">
            <div className="board-head"><h2 className="panel-title">Gigs you posted</h2></div>
            {posted.length ? <div className="gig-list">{posted.map((g) => <GigRow key={g.id} gig={g} meta={<span>updated {ago(g.updated_at)}</span>} />)}</div>
              : <div className="empty"><p className="muted">You haven&apos;t posted anything.</p><Link className="btn btn-ink btn-sm" href="/post">Post a gig</Link></div>}
          </div>
        </div>

        <aside className="stack sticky">
          <form className="card tool" onSubmit={save}>
            <div className="tool-head"><h2 className="tool-title">Your profile</h2></div>
            <div className="pane">
              <label className="label" htmlFor="h">Handle</label>
              <input id="h" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" />
            </div>
            <div className="pane">
              <label className="label" htmlFor="x">X account</label>
              <input id="x" className="input" value={xh} onChange={(e) => setXh(e.target.value)} placeholder="@you" />
            </div>
            <div className="pane">
              <label className="label" htmlFor="s">Skills</label>
              <input id="s" className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Logos, Motion, Threads" />
              <span className="hint">Separate with commas</span>
            </div>
            <div className="pane">
              <label className="label" htmlFor="b">About you</label>
              <textarea id="b" className="textarea" style={{ minHeight: 96 }} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            {msg && <p className="ok">{msg}</p>}
            {err && <p className="error">{err}</p>}
            <button className="btn btn-ink btn-block">Save profile</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
