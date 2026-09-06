"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Paper, Sketch, Stamp } from "@/components/Bits";
import { authClient } from "@/lib/auth/client";
import { savePersona } from "@/db/actions";
import { deleteMyAccount, exportMyData } from "@/db/account-actions";
import { CHARACTERS, PERSONA_NAMES } from "@/data/mock";
import { attempt, explain } from "@/lib/auth/errors";
import type { Streak } from "@/lib/rules";

type Props = {
  persona: { displayName: string; character: string };
  memberSince: string;
  points: { date: string; what: string; pts: number }[];
  lifetime: number;
  streak: Streak;
  adopted: { action: string; label: string; since: string }[];
  moderator: boolean;
};

export default function ProfileView({ persona, memberSince, points, lifetime, streak, adopted, moderator }: Props) {
  const router = useRouter();
  const [character, setCharacter] = useState(persona.character);
  const [name, setName] = useState(persona.displayName);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = name.trim() !== persona.displayName || character !== persona.character;
  const icon = CHARACTERS.find(([c]) => c === character)?.[1] ?? "sprout";

  const save = async () => {
    setBusy(true);
    setNote(null);
    const r = await savePersona({ displayName: name, character });
    if (r.ok) {
      const { error } = await attempt(authClient.updateUser({ name: r.displayName }));
      setNote(error ? { ok: false, text: "Saved your character, but the name in the corner did not update. Reload to see it." } : { ok: true, text: "Saved" });
    } else setNote({ ok: false, text: r.error });
    setBusy(false);
  };

  // Change password
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNote, setPwNote] = useState<{ ok: boolean; text: string } | null>(null);
  const changePassword = async () => {
    setPwNote(null);
    if (pw.next.length < 8) { setPwNote({ ok: false, text: "Use at least eight characters." }); return; }
    if (pw.next !== pw.again) { setPwNote({ ok: false, text: "The two new passwords do not match." }); return; }
    setPwBusy(true);
    const { error } = await attempt(authClient.changePassword({ currentPassword: pw.current, newPassword: pw.next, revokeOtherSessions: true }));
    setPwBusy(false);
    if (error) { setPwNote({ ok: false, text: explain(error) }); return; }
    setPw({ current: "", next: "", again: "" });
    setPwNote({ ok: true, text: "Changed" });
  };

  // Export and delete
  const [dataBusy, setDataBusy] = useState(false);
  const [dataNote, setDataNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const exportData = async () => {
    setDataBusy(true);
    setDataNote("");
    const r = await exportMyData();
    setDataBusy(false);
    if (!r.ok) { setDataNote(r.error); return; }
    const url = URL.createObjectURL(new Blob([r.json], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `ecotrack-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };
  const deleteAccount = async () => {
    setDataBusy(true);
    setDataNote("");
    const r = await deleteMyAccount();
    if (!r.ok) { setDataBusy(false); setDataNote(r.error); return; }
    await authClient.signOut();
    router.push("/");
  };

  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <h1 className="fell rv" style={{ fontSize: 36 }}>Your character</h1>
      <p className="bd soft" style={{ margin: "4px 0 28px" }}>This is how the community sees you. Your email and login never appear anywhere.</p>
      <div className="cols" style={{ gridTemplateColumns: "400px minmax(0, 760px)", gap: 44 }}>
        <div className="stack" style={{ gap: 24 }}>
          <Paper rot={-1} pin style={{ padding: "20px 22px" }}>
            <div className="stack" style={{ gap: 14 }}>
              <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
                <span style={{ width: 64, height: 64, borderRadius: "50%", background: "url(/textures/kraft3.jpg) center / cover", boxShadow: "inset 0 0 0 1.5px var(--ink)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={icon} size={30} /></span>
                <div><div className="fell" style={{ fontSize: 28 }}>{name.trim() || "Unnamed"}</div><span className="ty" style={{ fontSize: 10 }}>Member since {memberSince}</span></div>
              </div>
              <label className="field"><span className="ty">Display name</span><span className="blank"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /><button type="button" className="ty" onClick={() => setName(PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)])}>shuffle</button></span></label>
              <span className="ty ty-u" style={{ fontSize: 11 }}>Choose a character</span>
              <div className="row" style={{ gap: 10 }}>
                {CHARACTERS.map(([c, ic], k) => (
                  <button type="button" key={c} onClick={() => setCharacter(c)} aria-label={c} aria-pressed={c === character} style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2, background: `url(/textures/${c === character ? "kraft3" : "paper-dark3"}.jpg) center / cover`, boxShadow: `inset 0 0 0 ${c === character ? 2 : 1}px var(${c === character ? "--rust" : "--ink"}), 1px 2px 4px rgba(0,0,0,.27)`, transform: `rotate(${k % 2 ? 2 : -2}deg)` }}><Icon name={ic} size={22} /></button>
                ))}
              </div>
              <div className="row" style={{ gap: 12 }}>
                <button className="btn btn--sm" onClick={save} disabled={busy || !dirty || name.trim().length < 2}>{busy ? "Saving" : "Save"}</button>
                {note && (note.ok ? <Stamp tone="moss" sm rot={-3}>{note.text}</Stamp> : <span className="bd rust" style={{ fontSize: 13 }}>{note.text}</span>)}
              </div>
              <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}><Stamp tone="moss" sm>Anonymous, on</Stamp><span className="bd soft" style={{ fontSize: 13 }}>Posts, adoptions and streaks show this name and character, nothing else.</span></div>
            </div>
          </Paper>
          <Paper tone="dark" rot={0.7} style={{ padding: "18px 22px" }}>
            <h2 className="fell" style={{ fontSize: 20, marginBottom: 10 }}>Change password</h2>
            <div className="stack" style={{ gap: 12 }}>
              <label className="field"><span className="ty">Current password</span><span className="blank"><input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></span></label>
              <label className="field"><span className="ty">New password</span><span className="blank"><input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} minLength={8} /></span></label>
              <label className="field"><span className="ty">Once more</span><span className="blank"><input type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} minLength={8} /></span></label>
              <div className="row" style={{ gap: 12 }}>
                <button className="btn btn--outline btn--sm" onClick={changePassword} disabled={pwBusy || !pw.current || !pw.next}>{pwBusy ? "Changing" : "Change password"}</button>
                {pwNote && (pwNote.ok ? <Stamp tone="moss" sm rot={-3}>{pwNote.text}</Stamp> : <span className="bd rust" style={{ fontSize: 13 }}>{pwNote.text}</span>)}
              </div>
              <span className="ty" style={{ fontSize: 10 }}>Other devices are signed out when it changes.</span>
            </div>
          </Paper>
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
            <Paper rot={0.8} style={{ width: 370, padding: "16px 18px" }}>
              <div className="row between" style={{ alignItems: "flex-end" }}><h2 className="fell" style={{ fontSize: 20 }}>Logging streak</h2><span className="fell rust" style={{ fontSize: 24 }}>{streak.weeks} {streak.weeks === 1 ? "week" : "weeks"}</span></div>
              <div className="row" style={{ gap: 8, margin: "10px 0" }}>
                {streak.pattern.map((s, k) => <span key={k} title={s} style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: s === "done" ? "var(--ink)" : "transparent", boxShadow: s === "done" ? "none" : `inset 0 0 0 1.5px var(${s === "grace" ? "--rust" : s === "now" ? "--moss-deep" : "--chalk-soft"})` }}>{s === "done" && <Icon name="check" size={14} color="var(--chalk)" />}</span>)}
              </div>
              <p className="bd soft" style={{ margin: 0, fontSize: 13 }}>The last eight weeks. A red ring is a grace skip; you get one a month, so life can happen. {streak.weeks === 0 && <Link href="/calculator" className="link">Log this week</Link>}</p>
            </Paper>
            <Paper tone="dark" rot={-0.6} style={{ width: 370, padding: "16px 18px" }}>
              <div className="row between" style={{ alignItems: "flex-end" }}><h2 className="fell" style={{ fontSize: 20 }}>Actions you adopted</h2><span className="fell moss" style={{ fontSize: 24 }}>{adopted.length}</span></div>
              {adopted.length === 0 && <p className="bd soft" style={{ margin: "8px 0 0", fontSize: 13 }}>Nothing adopted yet. <Link href="/insights" className="link">The insights page</Link> suggests some, sized to your own numbers.</p>}
              {adopted.map((a) => <div key={a.action} className="ledger-row" style={{ padding: "6px 0" }}><span className="bd" style={{ fontSize: 14 }}>{a.label}</span><span className="lead" /><span className="ty" style={{ fontSize: 10 }}>since {a.since}</span></div>)}
            </Paper>
          </div>
          <Paper rot={0.4} style={{ padding: "16px 18px" }}>
            <div className="row between" style={{ alignItems: "flex-end", paddingBottom: 6 }}><h2 className="fell" style={{ fontSize: 20 }}>Points</h2><span className="ty" style={{ fontSize: 10 }}>{lifetime.toLocaleString("en-GB")} lifetime</span></div>
            {points.length === 0 && <p className="bd soft" style={{ margin: "6px 0 0", fontSize: 14 }}>Points arrive when you log a week, adopt an action, share with the community or finish a challenge. They only ever go up.</p>}
            {points.map((p, k) => <div key={k} className="row" style={{ gap: 12, padding: "7px 0", flexWrap: "nowrap", borderBottom: "1px solid rgba(43,42,38,.2)" }}><span className="ty" style={{ width: 64, fontSize: 10, flex: "0 0 auto" }}>{p.date}</span><span className="bd" style={{ flex: 1, fontSize: 14 }}>{p.what}</span><span className="bd moss" style={{ width: 40, textAlign: "right", fontSize: 14 }}>+{p.pts}</span></div>)}
          </Paper>
          <Paper tone="dark" rot={-0.4} style={{ padding: "14px 18px" }}>
            <div className="row wrap-narrow" style={{ gap: 14, flexWrap: "nowrap" }}>
              <Icon name="shield" size={20} color="var(--moss-deep)" />
              <p className="bd" style={{ margin: 0, fontSize: 13, flex: 1 }}>We keep your weekly logs, this character, your points and anything you share, and nothing else. Both are yours to take or remove.</p>
              <button className="btn btn--outline btn--sm" onClick={exportData} disabled={dataBusy}><Icon name="download" size={14} /> Export</button>
              {!confirmDelete && <button className="ty rust link" style={{ fontSize: 10 }} onClick={() => setConfirmDelete(true)}>delete account</button>}
            </div>
            {confirmDelete && (
              <div className="row" style={{ gap: 12, marginTop: 12, alignItems: "center" }}>
                <span className="bd rust" style={{ fontSize: 13 }}>This removes your logs, points, posts and login for good. There is no undo.</span>
                <button className="btn btn--sm" style={{ background: "var(--rust)" }} onClick={deleteAccount} disabled={dataBusy}>{dataBusy ? "Deleting" : "Yes, delete everything"}</button>
                <button className="ty link" style={{ fontSize: 10 }} onClick={() => setConfirmDelete(false)}>keep my account</button>
              </div>
            )}
            {dataNote && <p className="bd rust" style={{ margin: "8px 0 0", fontSize: 13 }}>{dataNote}</p>}
          </Paper>
          {moderator && <p className="ty" style={{ margin: 0, fontSize: 10 }}>You are a moderator. <Link href="/community/review" className="link">Review reports</Link>.</p>}
        </div>
      </div>
      <Sketch name="hand-plant" right={80} bottom={30} w={90} rot={6} />
      <Sketch name="cup" x={96} bottom={140} w={46} rot={-6} />
    </main>
  );
}
