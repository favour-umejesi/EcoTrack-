"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Paper, Sketch, Stamp, Tag } from "@/components/Bits";
import CountUp from "@/components/CountUp";
import { ACTIONS, compareToAverage, compute, fmtKg, fmtT, type Inputs } from "@/lib/engine";
import { ACTION_LABELS, ALMANAC, ALMANAC_FALLBACK, NOTES, parseInputs, STORAGE_KEY } from "@/data/mock";
import { useSession } from "@/components/Session";
import { useHydrated, useLocalValue } from "@/lib/store";
import { toggleAction } from "@/db/actions";

export default function InsightsView({ memberInputs, title, adopted, member }: { memberInputs: Inputs | null; title: string; adopted: string[]; member: boolean }) {
  const router = useRouter();
  const { ready } = useSession();
  const hydrated = useHydrated();
  const saved = useLocalValue(STORAGE_KEY, "");
  const i: Inputs = memberInputs ?? parseInputs(saved);
  // People arrive here from "See my insights". With nothing logged anywhere there is nothing to show, so send them to log something.
  const nothingToShow = hydrated && ready && !memberInputs && !saved;
  useEffect(() => { if (nothingToShow) router.replace("/calculator"); }, [nothingToShow, router]);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; sources: string[] } | null>(null);
  const [added, setAdded] = useState<string[]>(adopted);
  const [adoptError, setAdoptError] = useState("");
  const toggle = async (key: string) => {
    if (!member) { router.push("/sign-in?next=/insights"); return; }
    setAdoptError("");
    const r = await toggleAction(key);
    if (!r.ok) { setAdoptError(r.error); return; }
    setAdded((a) => (r.adopted ? [...a.filter((x) => x !== key), key] : a.filter((x) => x !== key)));
  };
  const r = compute(i);
  const cmp = compareToAverage(r.totalKg, i.country);
  const max = Math.max(...r.lines.map((l) => l.kg), 1);
  const notes = r.lines.slice(0, 3).map((l) => NOTES.find((n) => n.category === l.key)).filter(Boolean) as typeof NOTES;
  const ask = () => setAnswer(ALMANAC.find((a) => a.match.test(q)) ?? ALMANAC_FALLBACK);
  if (nothingToShow) return null;

  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="cols cols--insights" style={{ gap: 48 }}>
        <div className="stack" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 16 }}>
            <h1 className="fell rv" style={{ fontSize: 36 }}>{title}</h1>
            <Stamp rot={-6}>Estimate</Stamp>
          </div>
          <p className="bd soft" style={{ margin: 0 }}>Every figure here is what you logged, multiplied by a published factor. <Link href="/calculator" className="link">Edit answers</Link>.</p>
          <div className="row" style={{ alignItems: "flex-end", gap: 14 }}>
            <span className="fell" style={{ fontSize: "clamp(52px, 14vw, 78px)", lineHeight: 1 }}><CountUp value={r.totalKg} format={fmtT} /></span>
            <div className="stack" style={{ gap: 2, maxWidth: 420 }}>
              <span className="bd" style={{ fontSize: 18 }}>tonnes CO₂e a year, at this pace</span>
              <span className="ty" style={{ fontSize: 10 }}>likely between {fmtT(r.lowKg)} and {fmtT(r.highKg)} t: every factor is an average with a spread around it</span>
              <span className="bd soft" style={{ fontSize: 15 }}>{cmp.text}</span>
              <span className="ty" style={{ fontSize: 10 }}>Our World in Data, per-capita CO₂{cmp.avg.year ? ` (${cmp.avg.year})` : ""}. Grid: {r.grid.label}{r.grid.year ? ` (${r.grid.year}, Ember)` : ""}. Factor set {r.factorSet}.</span>
              {r.grid.level !== "country" && <span className="hand rust" style={{ fontSize: 16 }}>no grid figure for this country yet, so the {r.grid.label} stands in.</span>}
            </div>
          </div>
          <span className="kicker">Where it comes from</span>
          <div className="stack" style={{ gap: 8 }}>
            {r.lines.map((l, k) => (
              <div key={l.key} className="row" style={{ gap: 12, height: 26, flexWrap: "nowrap" }}>
                <span className="ty bar-label" style={{ width: 110, textAlign: "right", flex: "0 0 auto" }}>{l.label}</span>
                <span style={{ flex: "0 1 330px", minWidth: 0 }}><span className="ink-bar" style={{ display: "block", width: `${Math.max(2, Math.round((l.kg / max) * 100))}%`, height: 16, background: "var(--ink)", opacity: 0.85, borderRadius: 1 }} /></span>
                <span className="bd" style={{ fontSize: 15, whiteSpace: "nowrap" }}><CountUp value={l.kg} format={fmtKg} duration={1100} /> kg</span>
                {k === 0 && <span className="hand rust hide-narrow" style={{ fontSize: 18 }}>biggest driver</span>}
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
          {adoptError && <p className="bd rust" style={{ margin: 0, fontSize: 13 }}>{adoptError}</p>}
          {!member && <p className="ty" style={{ margin: 0, fontSize: 10 }}>Sign in to adopt an action and keep score.</p>}
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
                    <button className={`btn btn--sm ${isAdded ? "" : "btn--outline"}`} onClick={() => toggle(n.action)}>{isAdded ? "Added" : "Add"}</button>
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
