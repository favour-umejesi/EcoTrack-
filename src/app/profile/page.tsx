"use client";
import { useState } from "react";
import { Icon, Paper, Sketch, Stamp } from "@/components/Bits";
import { useSession } from "@/components/Session";
import { ADOPTED, CHARACTERS, PERSONA_NAMES, POINTS_LEDGER, STREAK } from "@/data/mock";

export default function Profile() {
  const { persona } = useSession();
  const [character, setCharacter] = useState(persona.character);
  const [name, setName] = useState(persona.name);
  const icon = CHARACTERS.find(([c]) => c === character)?.[1] ?? "sprout";
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <h1 className="fell rv" style={{ fontSize: 36 }}>Your character</h1>
      <p className="bd soft" style={{ margin: "4px 0 28px" }}>This is how the community sees you. Your email and login never appear anywhere.</p>
      <div className="cols" style={{ gridTemplateColumns: "400px minmax(0, 760px)", gap: 44 }}>
        <Paper rot={-1} pin style={{ padding: "20px 22px" }}>
          <div className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
              <span style={{ width: 64, height: 64, borderRadius: "50%", background: "url(/textures/kraft3.jpg) center / cover", boxShadow: "inset 0 0 0 1.5px var(--ink)", display: "grid", placeItems: "center" }}><Icon name={icon} size={30} /></span>
              <div><div className="fell" style={{ fontSize: 28 }}>{name}</div><span className="ty" style={{ fontSize: 10 }}>Member since March 2026</span></div>
            </div>
            <label className="field"><span className="ty">Display name</span><span className="blank"><input value={name} onChange={(e) => setName(e.target.value)} /><button className="ty" onClick={() => setName(PERSONA_NAMES[Math.floor(Math.random() * PERSONA_NAMES.length)])}>shuffle</button></span></label>
            <span className="ty ty-u" style={{ fontSize: 11 }}>Choose a character</span>
            <div className="row" style={{ gap: 10 }}>
              {CHARACTERS.map(([c, ic], k) => (
                <button key={c} onClick={() => setCharacter(c)} aria-label={c} style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 2, background: `url(/textures/${c === character ? "kraft3" : "paper-dark3"}.jpg) center / cover`, boxShadow: `inset 0 0 0 ${c === character ? 2 : 1}px var(${c === character ? "--rust" : "--ink"}), 1px 2px 4px rgba(0,0,0,.27)`, transform: `rotate(${k % 2 ? 2 : -2}deg)` }}><Icon name={ic} size={22} /></button>
              ))}
            </div>
            <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}><Stamp tone="moss" sm>Anonymous, on</Stamp><span className="bd soft" style={{ fontSize: 13 }}>Posts, adoptions and streaks show this name and character, nothing else.</span></div>
          </div>
        </Paper>
        <div className="stack" style={{ gap: 18 }}>
          <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
            <Paper rot={0.8} style={{ width: 370, padding: "16px 18px" }}>
              <div className="row between" style={{ alignItems: "flex-end" }}><h2 className="fell" style={{ fontSize: 20 }}>Logging streak</h2><span className="fell rust" style={{ fontSize: 24 }}>{STREAK.weeks} weeks</span></div>
              <div className="row" style={{ gap: 8, margin: "10px 0" }}>
                {STREAK.pattern.map((s, k) => <span key={k} style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: s === "done" ? "var(--ink)" : "transparent", boxShadow: s === "done" ? "none" : `inset 0 0 0 1.5px var(${s === "grace" ? "--rust" : "--ink"})` }}>{s === "done" && <Icon name="check" size={14} color="var(--chalk)" />}</span>)}
              </div>
              <p className="bd soft" style={{ margin: 0, fontSize: 13 }}>The red ring is a grace skip you used in week 4. You get one a month, so life can happen.</p>
            </Paper>
            <Paper tone="dark" rot={-0.6} style={{ width: 370, padding: "16px 18px" }}>
              <div className="row between" style={{ alignItems: "flex-end" }}><h2 className="fell" style={{ fontSize: 20 }}>Actions you adopted</h2><span className="fell moss" style={{ fontSize: 24 }}>{ADOPTED.length}</span></div>
              {ADOPTED.map(([a, s]) => <div key={a} className="ledger-row" style={{ padding: "6px 0" }}><span className="bd" style={{ fontSize: 14 }}>{a}</span><span className="lead" /><span className="ty" style={{ fontSize: 10 }}>{s}</span></div>)}
            </Paper>
          </div>
          <Paper rot={0.4} style={{ padding: "16px 18px" }}>
            <div className="row between" style={{ alignItems: "flex-end", paddingBottom: 6 }}><h2 className="fell" style={{ fontSize: 20 }}>Points</h2><span className="ty" style={{ fontSize: 10 }}>1,240 lifetime</span></div>
            {POINTS_LEDGER.map((p) => <div key={p.date + p.what} className="row" style={{ gap: 12, padding: "7px 0", flexWrap: "nowrap", borderBottom: "1px solid rgba(43,42,38,.2)" }}><span className="ty" style={{ width: 64, fontSize: 10 }}>{p.date}</span><span className="bd" style={{ flex: 1, fontSize: 14 }}>{p.what}</span><span className="bd moss" style={{ width: 40, textAlign: "right", fontSize: 14 }}>+{p.pts}</span></div>)}
          </Paper>
          <Paper tone="dark" rot={-0.4} style={{ padding: "14px 18px" }}>
            <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
              <Icon name="shield" size={20} color="var(--moss-deep)" />
              <p className="bd" style={{ margin: 0, fontSize: 13, flex: 1 }}>We keep your weekly logs and this character, and nothing else. Both are yours to take or remove.</p>
              <button className="btn btn--outline btn--sm"><Icon name="download" size={14} /> Export</button>
              <button className="ty rust link" style={{ fontSize: 10 }}>delete account</button>
            </div>
          </Paper>
        </div>
      </div>
      <Sketch name="hand-plant" right={80} bottom={30} w={90} rot={6} />
      <Sketch name="cup" x={96} bottom={140} w={46} rot={-6} />
    </main>
  );
}
