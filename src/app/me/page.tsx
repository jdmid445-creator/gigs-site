"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/components/Providers";
import Slip, { SlipGig } from "@/components/Slip";
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

  if (loading) return <div className="page"><div className="wrap"><p className="muted">Loading…</p></div></div>;
  if (!wallet)
    return (
      <div className="page"><div className="wrap" style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <h1>Your gigs</h1>
        <p className="muted">Sign in with your wallet to see gigs you posted and work you&apos;re doing.</p>
        <button className="btn" onClick={() => signIn().catch(() => setPickerOpen(true))}>Sign in</button>
      </div></div>
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
    <div className="page">
      <div className="wrap gig-grid">
        <div style={{ display: "grid", gap: 30 }}>
          <h1>Your gigs</h1>
          {me?.isReferee && <div className="notice">You&apos;re the referee. <Link href="/admin">Open the dispute queue</Link></div>}
          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ fontSize: 20 }}>Work you&apos;re doing</h2>
            {working.length ? working.map((g) => <Slip key={g.id} gig={g} meta={<span>updated {ago(g.updated_at)}</span>} />)
              : <p className="muted">Nothing yet. <Link href="/#board">Find a gig</Link></p>}
          </section>
          {pending.length > 0 && (
            <section style={{ display: "grid", gap: 8 }}>
              <h2 style={{ fontSize: 20 }}>Applications waiting</h2>
              {pending.map((a) => (
                <Link key={a.gig_id} href={`/gigs/${a.gig_id}`} className="small">{a.gigs!.title} · applied {ago(a.created_at)}</Link>
              ))}
            </section>
          )}
          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ fontSize: 20 }}>Gigs you posted</h2>
            {posted.length ? posted.map((g) => <Slip key={g.id} gig={g} meta={<span>updated {ago(g.updated_at)}</span>} />)
              : <p className="muted">You haven&apos;t posted anything. <Link href="/post">Post a gig</Link></p>}
          </section>
        </div>

        <aside className="side">
          <form className="panel" onSubmit={save}>
            <h2 style={{ fontSize: 18 }}>Your profile</h2>
            <p className="muted small">Posters see this when you apply.</p>
            <div className="field"><label htmlFor="h">Handle</label><input id="h" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourname" /></div>
            <div className="field"><label htmlFor="x">X account</label><input id="x" className="input" value={xh} onChange={(e) => setXh(e.target.value)} placeholder="@you" /></div>
            <div className="field"><label htmlFor="s">Skills</label><input id="s" className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Logos, Motion, Threads" /><span className="hint">Separate with commas</span></div>
            <div className="field"><label htmlFor="b">About you</label><textarea id="b" className="textarea" style={{ minHeight: 90 }} maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
            {msg && <p className="ok">{msg}</p>}
            {err && <p className="error">{err}</p>}
            <div><button className="btn">Save profile</button></div>
          </form>
        </aside>
      </div>
    </div>
  );
}
