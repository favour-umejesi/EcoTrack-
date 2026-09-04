"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import CountUp from "@/components/CountUp";
import { ACTIONS, compareToAverage, compute, fmtKg, fmtT, type Inputs } from "@/lib/engine";
import { ACTION_LABELS, ALMANAC, ALMANAC_FALLBACK, NOTES, parseInputs, STORAGE_KEY } from "@/data/mock";
import { useLocalValue } from "@/lib/store";

export default function Insights() {
  const i: Inputs = parseInputs(useLocalValue(STORAGE_KEY, ""));
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; sources: string[] } | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const r = compute(i);
  const cmp = compareToAverage(r.totalKg, i.country);
  const max = Math.max(...r.lines.map((l) => l.kg), 1);
  const notes = r.lines.slice(0, 3).map((l) => NOTES.find((n) => n.category === l.key)).filter(Boolean) as typeof NOTES;
  const ask = () => setAnswer(ALMANAC.find((a) => a.match.test(q)) ?? ALMANAC_FALLBACK);

  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="cols cols--insights" style={{ gap: 48 }}>
        <div className="stack" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 16 }}>
            <h1 className="fell rv" style={{ fontSize: 36 }}>Ledger for August 2026</h1>
            <Stamp rot={-6}>Estimate</Stamp>
          </div>
          <p className="bd soft" style={{ margin: 0 }}>Every figure here is what you logged, multiplied by a published factor. <Link href="/calculator" className="link">Edit answers</Link>.</p>
          <div className="row" style={{ alignItems: "flex-end", gap: 14 }}>
            <span className="fell" style={{ fontSize: 78, lineHeight: 1 }}><CountUp value={r.totalKg} format={fmtT} /></span>
            <div className="stack" style={{ gap: 2, maxWidth: 420 }}>
              <span className="bd" style={{ fontSize: 18 }}>tonnes CO₂e a year, at this pace</span>
              <span className="bd soft" style={{ fontSize: 15 }}>{cmp.text}</span>
              <span className="ty" style={{ fontSize: 10 }}>Our World in Data, per-capita CO₂, 2023 (illustrative). Grid factor: {r.grid.label}.</span>
              {r.grid.level !== "country" && <span className="hand rust" style={{ fontSize: 16 }}>no grid figure for this country yet, so the {r.grid.label} stands in.</span>}
            </div>
          </div>
          <span className="kicker">Where it comes from</span>
          <div className="stack" style={{ gap: 8 }}>
            {r.lines.map((l, k) => (
              <div key={l.key} className="row" style={{ gap: 12, height: 26, flexWrap: "nowrap" }}>
                <span className="ty" style={{ width: 110, textAlign: "right" }}>{l.label}</span>
                <span className="ink-bar" style={{ width: Math.max(6, Math.round((l.kg / max) * 330)), height: 16, background: "var(--ink)", opacity: 0.85, borderRadius: 1 }} />
                <span className="bd" style={{ fontSize: 15 }}><CountUp value={l.kg} format={fmtKg} duration={1100} /> kg</span>
                {k === 0 && <span className="hand rust" style={{ fontSize: 18 }}>biggest driver</span>}
              </div>
            ))}
          </div>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            <span className="kicker">Ask the Climate Almanac</span>
            <div className="row" style={{ gap: 12, alignItems: "flex-end", flexWrap: "nowrap" }}>
              <Icon name="pencil" size={16} color="var(--ink-soft)" />
              <label className="blank" style={{ flex: 1 }}>
                <input className="hand" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="is it better to take the train or fly from London to Paris?" style={{ fontFamily: "var(--font-hand)", fontSize: 20, color: "var(--ink-soft)" }} />
              </label>
              <button className="btn btn--sm" onClick={ask}>Ask</button>
            </div>
            <span className="ty" style={{ fontSize: 10 }}>answers cite their sources and never invent numbers.</span>
            {answer && (
              <Paper tone="dark" rot={0.6} tape="tc" style={{ marginTop: 10 }}>
                <p className="bd" style={{ margin: 0, fontSize: 15 }}>{answer.answer}</p>
                {answer.sources.map((s) => <p key={s} className="row bd soft" style={{ margin: "8px 0 0", fontSize: 12, gap: 6 }}><Icon name="book" size={13} color="var(--ink-soft)" /> {s}</p>)}
                {answer.sources.length > 0 && <span style={{ position: "absolute", top: 14, right: 16 }}><Stamp tone="moss" sm>Cited</Stamp></span>}
              </Paper>
            )}
          </div>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <h2 className="fell" style={{ fontSize: 24 }}>Field notes from the science</h2>
          {notes.map((n, k) => {
            const saving = ACTIONS[n.action](i);
            const isAdded = added.includes(n.action);
            return (
              <Paper key={n.category} tone={k % 2 ? "dark" : "light"} rot={k % 2 ? 1 : -1} pin style={{ padding: 16 }}>
                <div className="stack" style={{ gap: 8 }}>
                  <div className="row between"><span className="kicker" style={{ fontSize: 11, letterSpacing: 2 }}>{n.kicker}</span><Stamp tone="moss" sm>Cited</Stamp></div>
                  <p className="bd" style={{ margin: 0, fontSize: 14 }}>{n.text}</p>
                  <p className="row bd soft" style={{ margin: 0, fontSize: 12, gap: 6, flexWrap: "nowrap", alignItems: "flex-start" }}><Icon name="book" size={13} color="var(--ink-soft)" /> {n.source}</p>
                  {n.where && <div className="row" style={{ gap: 8 }}><span className="ty">where to look:</span>{n.where.map((w, j) => <Tag key={w} rot={j % 2 ? 1.5 : -2}>{w}</Tag>)}</div>}
                  <div className="row between" style={{ gap: 8 }}>
                    <span className="hand moss" style={{ fontSize: 17 }}>try {ACTION_LABELS[n.action]}, about {fmtKg(saving)} kg a year</span>
                    <button className={`btn btn--sm ${isAdded ? "" : "btn--outline"}`} onClick={() => setAdded((a) => a.includes(n.action) ? a.filter((x) => x !== n.action) : [...a, n.action])}>{isAdded ? "Added" : "Add"}</button>
                  </div>
                </div>
              </Paper>
            );
          })}
        </div>
      </div>
      <Sketch name="recycle" x={600} bottom={40} w={120} rot={-6} />
      <Sketch name="cup" x={700} y={110} w={44} rot={8} />
    </main>
  );
}
