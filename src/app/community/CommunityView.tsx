"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import { CATEGORIES, RULES } from "@/data/mock";
import type { ChallengeView, FeedPost } from "@/db/community-queries";
import { completeChallenge, deletePost, joinChallenge, reportPost, toggleReaction } from "@/db/community-actions";
import { photoUrl } from "@/lib/photo-url";

type Props = { posts: FeedPost[]; challenge: ChallengeView; member: boolean; moderator: boolean };

const ago = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  return `${Math.floor(d / 30)} months ago`;
};

export default function CommunityView({ posts: initial, challenge: initialChallenge, member, moderator }: Props) {
  const router = useRouter();
  const [cat, setCat] = useState("All");
  const [posts, setPosts] = useState(initial);
  const [challenge, setChallenge] = useState(initialChallenge);
  const [note, setNote] = useState("");
  const shown = posts.filter((p) => cat === "All" || p.category === cat);

  const react = async (id: string, kind: "helpful" | "did_it") => {
    setNote("");
    const r = await toggleReaction(id, kind);
    if (!r.ok) { setNote(r.error); return; }
    setPosts((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      const delta = r.on ? 1 : -1;
      return { ...p, reacted: { ...p.reacted, [kind]: r.on }, helpful: kind === "helpful" ? p.helpful + delta : p.helpful, didIt: kind === "did_it" ? p.didIt + delta : p.didIt };
    }));
  };
  const remove = async (id: string) => {
    const r = await deletePost(id);
    if (!r.ok) { setNote(r.error); return; }
    setPosts((ps) => ps.filter((p) => p.id !== id));
  };
  const join = async () => { const r = await joinChallenge(challenge.id); if (r.ok) setChallenge({ ...challenge, mine: "joined", joined: challenge.joined + 1 }); else setNote(r.error); };
  const done = async () => { const r = await completeChallenge(challenge.id); if (r.ok) { setChallenge({ ...challenge, mine: "done", done: challenge.done + 1, joined: challenge.mine === "none" ? challenge.joined + 1 : challenge.joined }); router.refresh(); } else setNote(r.error); };

  return (
    <main className="page rel" style={{ minHeight: "calc(100vh - 84px)", background: "url(/textures/kraft3.jpg) center / cover", paddingLeft: 72 }}>
      <div className="row between" style={{ alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ maxWidth: 760 }}>
          <h1 className="fell rv" style={{ fontSize: "clamp(34px, 4.5vw, 46px)" }}>Community ledger</h1>
          <p className="bd soft" style={{ fontSize: 18, margin: "8px 0 0" }}>Real things members did, with a photo of the work and the estimated impact. Adopt one and it counts toward your points.</p>
        </div>
        <Link href="/community/new" className="btn"><Icon name="plus" size={16} /> Share what you did</Link>
      </div>
      <div className="row" style={{ gap: 10, marginBottom: 28 }}>
        {CATEGORIES.map((c, k) => <Tag key={c} paper on={c === cat} rot={k % 2 ? 1.5 : -1.5} onClick={() => setCat(c)}>{c}</Tag>)}
      </div>
      {note && <p className="bd rust" style={{ margin: "0 0 16px", fontSize: 13 }}>{note}</p>}
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 1fr) 400px", gap: 48 }}>
        <div className="stack" style={{ gap: 40 }}>
          {shown.length === 0 && <p className="hand soft" style={{ fontSize: 22 }}>nothing pinned under {cat} yet. be the first.</p>}
          {shown.map((p, k) => <PostCard key={p.id} post={p} k={k} member={member} moderator={moderator} onReact={react} onRemove={remove} onNote={setNote} />)}
        </div>
        <div className="stack" style={{ gap: 28 }}>
          <Paper tone="dark" rot={-1.5} pin style={{ padding: "16px 18px" }}>
            <span className="kicker" style={{ fontSize: 11, letterSpacing: 2 }}>This week&apos;s challenge</span>
            <h2 className="fell" style={{ fontSize: 26, margin: "6px 0" }}>{challenge.title}</h2>
            <p className="bd" style={{ margin: 0, fontSize: 15 }}>{challenge.text}</p>
            <div className="row between" style={{ marginTop: 10, gap: 10 }}>
              <span className="ty" style={{ fontSize: 10 }}>{challenge.joined} joined, {challenge.done} done</span>
              {challenge.mine === "none" && <button className="btn btn--sm" onClick={join} disabled={!member}>Join</button>}
              {challenge.mine === "joined" && <button className="btn btn--sm btn--outline" onClick={done}><Icon name="check" size={13} /> I did it</button>}
              {challenge.mine === "done" && <Stamp tone="moss" sm rot={-3}>Done, +30</Stamp>}
            </div>
          </Paper>
          <Paper rot={1} tape="tc" style={{ padding: "16px 18px" }}>
            <h2 className="fell" style={{ fontSize: 22, marginBottom: 8 }}>House rules</h2>
            {RULES.map(([ic, t]) => <p key={t} className="row bd" style={{ margin: "6px 0", gap: 8, fontSize: 14, flexWrap: "nowrap", alignItems: "flex-start" }}><Icon name={ic} size={14} color="var(--moss-deep)" /> {t}</p>)}
            {moderator && <p className="ty" style={{ margin: "10px 0 0", fontSize: 10 }}><Link href="/community/review" className="link">Review reports</Link></p>}
          </Paper>
        </div>
      </div>
      <Sketch name="cup" x={760} y={150} w={46} rot={8} opacity={0.7} />
      <Sketch name="bag" right={60} bottom={30} w={80} rot={-10} opacity={0.7} />
    </main>
  );
}

function PostCard({ post: p, k, member, moderator, onReact, onRemove, onNote }: { post: FeedPost; k: number; member: boolean; moderator: boolean; onReact: (id: string, kind: "helpful" | "did_it") => void; onRemove: (id: string) => void; onNote: (s: string) => void }) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const photo = p.photos[0];
  const sendReport = async () => {
    const r = await reportPost(p.id, reason);
    if (!r.ok) { onNote(r.error); return; }
    setReported(true);
    setReporting(false);
  };
  return (
    <div className="row post-row" style={{ gap: 32, alignItems: "flex-start", flexDirection: k % 2 ? "row-reverse" : "row", flexWrap: "nowrap" }}>
      {photo && (
        <Paper tone="print" rot={k % 2 ? 2 : -2.5} pin style={{ width: 380, flex: "0 0 380px" }}>
          <img src={photoUrl(photo.id)} alt={photo.alt} width={photo.width} height={photo.height} style={{ width: 356, height: 254, objectFit: "cover" }} />
          <span className="ty" style={{ display: "block", marginTop: 10, fontSize: 10 }}>{p.persona.name}, {ago(p.createdAt)}</span>
          {p.photos.length > 1 && <span className="ty" style={{ position: "absolute", right: 12, bottom: 8, fontSize: 10 }}>+{p.photos.length - 1} more</span>}
        </Paper>
      )}
      <Paper rot={k % 2 ? -0.8 : 1} tape={k % 2 ? undefined : "both"} pin={k % 2 === 1} style={{ flex: 1, padding: "16px 18px" }}>
        <div className="stack" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8 }}><Tag>{p.persona.name}</Tag><Tag on rot={-2}>{p.category}</Tag><span className="ty" style={{ fontSize: 10 }}>{ago(p.createdAt)}</span>{p.mine && <Stamp tone="soft" sm>Yours</Stamp>}</div>
          <h2 className="fell" style={{ fontSize: 22 }}>{p.title}</h2>
          <p className="bd" style={{ margin: 0, fontSize: 14, whiteSpace: "pre-line" }}>{p.body}</p>
          {p.impactKg > 0 && <div><Stamp tone="moss" sm>about {p.impactKg} kg CO₂e {p.impactKg > 100 ? "a year" : "avoided"}</Stamp></div>}
          <div className="row" style={{ gap: 8 }}>
            <button className={`btn btn--sm ${p.reacted.did_it ? "" : "btn--outline"}`} onClick={() => onReact(p.id, "did_it")} disabled={!member}><Icon name="check" size={13} /> I did this too ({p.didIt})</button>
            <button className={`btn btn--sm ${p.reacted.helpful ? "" : "btn--outline"}`} onClick={() => onReact(p.id, "helpful")} disabled={!member}>Helpful ({p.helpful})</button>
            <span style={{ flex: 1 }} />
            {(p.mine || moderator) && !confirmRemove && <button className="ty link" style={{ fontSize: 10 }} onClick={() => setConfirmRemove(true)}>remove</button>}
            {confirmRemove && <><button className="ty rust link" style={{ fontSize: 10 }} onClick={() => onRemove(p.id)}>yes, remove</button><button className="ty link" style={{ fontSize: 10 }} onClick={() => setConfirmRemove(false)}>keep</button></>}
            {!p.mine && !reported && !reporting && <button className="ty link" style={{ fontSize: 10 }} onClick={() => setReporting(true)} disabled={!member}>report</button>}
            {reported && <span className="ty" style={{ fontSize: 10 }}>reported, thank you</span>}
          </div>
          {reporting && (
            <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
              <label className="field" style={{ flex: 1 }}><span className="ty">What looks off?</span><span className="blank"><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="a few words is enough" /></span></label>
              <button className="btn btn--sm" onClick={sendReport} disabled={reason.trim().length < 3}>Send</button>
              <button className="ty link" style={{ fontSize: 10 }} onClick={() => setReporting(false)}>cancel</button>
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
}
