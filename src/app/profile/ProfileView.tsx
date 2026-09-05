"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, Paper, Sketch, Stamp } from "@/components/Bits";
import { authClient } from "@/lib/auth/client";
import { savePersona } from "@/db/actions";
import { CHARACTERS, PERSONA_NAMES } from "@/data/mock";
import type { Streak } from "@/lib/rules";

type Props = {
  persona: { displayName: string; character: string };
  memberSince: string;
  points: { date: string; what: string; pts: number }[];
  lifetime: number;
  streak: Streak;
};

export default function ProfileView({ persona, memberSince, points, lifetime, streak }: Props) {
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
      // The nav reads the auth user's name, so keep it in step with the persona.
      const { error } = await authClient.updateUser({ name: r.displayName });
      setNote(error ? { ok: false, text: "Saved your character, but the name in the corner did not update. Reload to see it." } : { ok: true, text: "Saved" });
    } else setNote({ ok: false, text: r.error });
    setBusy(false);
  };

  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <h1 className="fell rv" style={{ fontSize: 36 }}>Your character</h1>
      <p className="bd soft" style={{ margin: "4px 0 28px" }}>This is how the community sees you. Your email and login never appear anywhere.</p>
      <div className="cols" style={{ gridTemplateColumns: "400px minmax(0, 760px)", gap: 44 }}>
        <Paper rot={-1} pin style={{ padding: "20px 22px" }}>
          <div className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
              <span style={{ width: 64, height: 64, borderRadius: "50%", background: "url(/textures/kraft3.jpg) center / cover", boxShadow: "inset 0 0 0 1.5px var(--ink)", display: "grid", placeItems: "center" }}><Icon name={icon} size={30} /></span>
              <div><div className="fell" style={{ fontSize: 28 }}>{name.trim() || "Unnamed"}</div><span className="ty" style={{ fontSize: 10 }}>Member since {memberSince}</span></div>
            </div>
            <label className="field"><span className="ty">Display name</span><span className="blank"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /><button type="button" className="ty" onClick={() => setName(PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)])}>shuffle</button></span></label>
            <span className="ty ty-u" style={{ fontSize: 11 }}>Choose a character</span>
            <div className="row" style={{ gap: 10 }}>
              {CHARACTERS.map(([c, ic], k) => (
                <button type="button" key={c} onClick={() => setCharacter(c)} aria-label={c} style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2, background: `url(/textures/${c === character ? "kraft3" : "paper-dark3"}.jpg) center / cover`, boxShadow: `inset 0 0 0 ${c === character ? 2 : 1}px var(${c === character ? "--rust" : "--ink"}), 1px 2px 4px rgba(0,0,0,.27)`, transform: `rotate(${k % 2 ? 2 : -2}deg)` }}><Icon name={ic} size={22} /></button>
              ))}
            </div>
            <div className="row" style={{ gap: 12 }}>
              <button className="btn btn--sm" onClick={save} disabled={busy || !dirty || name.trim().length < 2}>{busy ? "Saving" : "Save"}</button>
              {note && (note.ok ? <Stamp tone="moss" sm rot={-3}>{note.text}</Stamp> : <span className="bd rust" style={{ fontSize: 13 }}>{note.text}</span>)}
            </div>
            <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}><Stamp tone="moss" sm>Anonymous, on</Stamp><span className="bd soft" style={{ fontSize: 13 }}>Posts, adoptions and streaks show this name and character, nothing else.</span></div>
          </div>
        </Paper>
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
              <div className="row between" style={{ alignItems: "flex-end" }}><h2 className="fell" style={{ fontSize: 20 }}>Actions you adopted</h2><span className="fell moss" style={{ fontSize: 24 }}>0</span></div>
              <p className="bd soft" style={{ margin: "8px 0 0", fontSize: 13 }}>Nothing adopted yet. Adopting actions from the insights page arrives with the next phase.</p>
            </Paper>
          </div>
          <Paper rot={0.4} style={{ padding: "16px 18px" }}>
            <div className="row between" style={{ alignItems: "flex-end", paddingBottom: 6 }}><h2 className="fell" style={{ fontSize: 20 }}>Points</h2><span className="ty" style={{ fontSize: 10 }}>{lifetime.toLocaleString("en-GB")} lifetime</span></div>
            {points.length === 0 && <p className="bd soft" style={{ margin: "6px 0 0", fontSize: 14 }}>Points arrive when you log a week. They only ever go up.</p>}
            {points.map((p) => <div key={p.date + p.what} className="row" style={{ gap: 12, padding: "7px 0", flexWrap: "nowrap", borderBottom: "1px solid rgba(43,42,38,.2)" }}><span className="ty" style={{ width: 64, fontSize: 10 }}>{p.date}</span><span className="bd" style={{ flex: 1, fontSize: 14 }}>{p.what}</span><span className="bd moss" style={{ width: 40, textAlign: "right", fontSize: 14 }}>+{p.pts}</span></div>)}
          </Paper>
          <Paper tone="dark" rot={-0.4} style={{ padding: "14px 18px" }}>
            <div className="row wrap-narrow" style={{ gap: 14, flexWrap: "nowrap" }}>
              <Icon name="shield" size={20} color="var(--moss-deep)" />
              <p className="bd" style={{ margin: 0, fontSize: 13, flex: 1 }}>We keep your weekly logs and this character, and nothing else. Both are yours to take or remove.</p>
              <button className="btn btn--outline btn--sm" disabled title="Coming with the next phase"><Icon name="download" size={14} /> Export</button>
              <button className="ty rust link" disabled title="Coming with the next phase" style={{ fontSize: 10 }}>delete account</button>
            </div>
          </Paper>
        </div>
      </div>
      <Sketch name="hand-plant" right={80} bottom={30} w={90} rot={6} />
      <Sketch name="cup" x={96} bottom={140} w={46} rot={-6} />
    </main>
  );
}
