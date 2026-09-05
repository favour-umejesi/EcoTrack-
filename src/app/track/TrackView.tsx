"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWeeklyLog } from "@/db/actions";
import { dayLabel } from "@/lib/rules";
import { Icon, Paper, Sketch, Stamp } from "@/components/Bits";
import LineChart from "@/components/LineChart";
import CountUp from "@/components/CountUp";
import type { Change, Streak } from "@/lib/rules";

type Props = {
  history: { month: string; kg: number }[];
  latest: { kg: number; name: string; weeks: number } | null;
  sincePct: number | null;
  firstMonth: string | null;
  prevMonth: string | null;
  changes: Change[];
  streak: Streak;
  pointsMonth: { what: string; pts: number }[];
  thisWeek: string;
  thisWeekLogged: boolean;
};

const ICONS: Record<string, string> = { commute: "car", electricity: "zap", gas: "coffee", food: "sprout", flights: "bird", clothing: "pencil" };
const pct = (n: number) => `${n > 0 ? "+" : "−"}${Math.abs(n)}%`;

export default function TrackView({ history, latest, sincePct, firstMonth, prevMonth, changes, streak, pointsMonth, thisWeek, thisWeekLogged }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");
  const total = pointsMonth.reduce((s, p) => s + p.pts, 0);
  const removeWeek = async () => {
    setRemoving(true);
    setRemoveError("");
    const r = await deleteWeeklyLog(thisWeek);
    setRemoving(false);
    setConfirm(false);
    if (!r.ok) { setRemoveError(r.error); return; }
    router.refresh();
  };
  const months = history.length;
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="row between" style={{ alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="fell rv" style={{ fontSize: 36 }}>{months === 0 ? "Your ledger, first page" : months === 1 ? "Your first month" : `${months} months of progress`}</h1>
          <p className="bd soft" style={{ margin: "4px 0 0" }}>Compared with yourself, not with strangers.</p>
        </div>
        <Link href="/calculator" className="btn"><Icon name="calendar" size={16} /> {thisWeekLogged ? "Update this week" : "Log this week"}</Link>
      </div>
      {!thisWeekLogged && months > 0 && <p className="hand rust" style={{ margin: "0 0 16px", transform: "rotate(-1deg)" }}>this week is not logged yet. a quick pass through the calculator keeps the streak.</p>}
      {thisWeekLogged && (
        <p className="row bd soft" style={{ margin: "0 0 16px", fontSize: 13, gap: 10 }}>
          Week of {dayLabel(thisWeek)} is logged. Wrong numbers? Edit them in the calculator, or
          {!confirm && <button type="button" className="ty rust link" style={{ fontSize: 10 }} onClick={() => setConfirm(true)}>remove this week&apos;s log</button>}
          {confirm && <><span className="ty" style={{ fontSize: 10 }}>remove it for good?</span><button type="button" className="btn btn--outline btn--sm" disabled={removing} onClick={removeWeek}>{removing ? "Removing" : "Yes, remove"}</button><button type="button" className="ty link" style={{ fontSize: 10 }} onClick={() => setConfirm(false)}>keep it</button></>}
          {removeError && <span className="bd rust">{removeError}</span>}
        </p>
      )}
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 800px) 360px", gap: 40 }}>
        <div className="stack" style={{ gap: 28 }}>
          {months === 0 ? (
            <Paper tone="kraft" rot={-0.8} pin style={{ width: 520, padding: "22px 24px" }}>
              <span><Stamp tone="moss" rot={-4}>Blank</Stamp></span>
              <h2 className="fell" style={{ fontSize: 24, margin: "12px 0 6px" }}>Nothing logged yet</h2>
              <p className="bd" style={{ margin: 0, fontSize: 15 }}>Log a typical week and it lands here. Each month you log adds a point to the line, and the changes between months show up on the right.</p>
              <div style={{ marginTop: 14 }}><Link href="/calculator" className="btn btn--outline btn--sm">Log a week</Link></div>
            </Paper>
          ) : (
            <>
              <div className="row" style={{ gap: 24, alignItems: "flex-start" }}>
                <Tile label="This month" big={<CountUp value={latest!.kg} />} unit="kg CO₂e" note={`${latest!.name}, from ${latest!.weeks} weekly ${latest!.weeks === 1 ? "log" : "logs"}`} rot={-1} />
                <Tile
                  label="Since your first month"
                  big={sincePct === null ? "—" : <>{sincePct >= 0 ? "+" : "−"}<CountUp value={Math.abs(sincePct)} />%</>}
                  note={sincePct === null ? "Appears once a second month is logged." : `Compared with ${firstMonth}`}
                  rot={0.8}
                  tone="dark"
                />
                <Tile label="Logging streak" big={<CountUp value={streak.weeks} duration={600} />} unit={streak.weeks === 1 ? "week" : "weeks"} note="A busy week will not reset you." rot={-0.6} hand={streak.graceLeft ? "1 grace skip left this month" : "grace skip used this month"} />
              </div>
              <div className="stack" style={{ gap: 6 }}>
                <span className="kicker" style={{ fontSize: 11 }}>Monthly footprint, kg CO₂e</span>
                {months >= 2 ? <LineChart data={history} baselineLabel={`your ${firstMonth} baseline`} /> : <p className="hand soft" style={{ margin: "8px 0 0", transform: "rotate(-1deg)" }}>the line starts drawing once a second month is in.</p>}
              </div>
            </>
          )}
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <Paper rot={0.6} style={{ padding: "16px 18px" }}>
            <h2 className="fell" style={{ fontSize: 20, marginBottom: 6 }}>{prevMonth ? `What changed since ${prevMonth}` : "What changed"}</h2>
            {changes.length === 0 && <p className="bd soft" style={{ margin: "6px 0 0", fontSize: 14 }}>{prevMonth ? "Nothing moved by a whole percent." : "Comparisons appear after two months of logs."}</p>}
            {changes.map((c) => (
              <div key={c.key} className="row" style={{ gap: 10, padding: "10px 0", flexWrap: "nowrap" }}>
                <Icon name={ICONS[c.key] ?? "leaf"} size={16} color="var(--ink-soft)" />
                <div className="stack" style={{ gap: 1, flex: 1 }}><span className="bd" style={{ fontSize: 15 }}>{c.name}</span><span className="ty" style={{ fontSize: 10 }}>{c.good ? "Down, and it counts" : "Up. No points lost."}</span></div>
                <Stamp tone={c.good ? "moss" : "soft"} sm>{pct(c.deltaPct)}</Stamp>
              </div>
            ))}
          </Paper>
          <Paper tone="dark" rot={-0.8} style={{ padding: "16px 18px" }}>
            <div className="row between" style={{ alignItems: "flex-end", paddingBottom: 6 }}><h2 className="fell" style={{ fontSize: 20 }}>Points this month</h2><span className="fell rust" style={{ fontSize: 24 }}>+{total}</span></div>
            {pointsMonth.length === 0 && <p className="bd soft" style={{ margin: "6px 0 0", fontSize: 14 }}>Log this week to start earning.</p>}
            {pointsMonth.map((p) => (
              <div key={p.what} className="ledger-row" style={{ padding: "8px 0" }}><span className="bd" style={{ fontSize: 14 }}>{p.what}</span><span className="lead" /><span className="bd moss" style={{ fontSize: 14 }}>+{p.pts}</span></div>
            ))}
            <p className="hand soft" style={{ margin: "8px 0 0", fontSize: 16 }}>points only ever go up. a heavier month costs nothing.</p>
          </Paper>
        </div>
      </div>
      <Sketch name="leaf" right={60} bottom={40} w={120} rot={-12} />
      <Sketch name="bulb" x={96} bottom={30} w={50} rot={6} />
    </main>
  );
}

function Tile({ label, big, unit, note, rot, tone, hand }: { label: string; big: React.ReactNode; unit?: string; note: string; rot: number; tone?: "dark"; hand?: string }) {
  return (
    <Paper tone={tone} rot={rot} pin style={{ width: 250, padding: "14px 18px" }}>
      <span className="ty ty-u" style={{ fontSize: 10, letterSpacing: 2 }}>{label}</span>
      <div className="row" style={{ alignItems: "flex-end", gap: 8, marginTop: 4 }}><span className="fell" style={{ fontSize: 40, lineHeight: 1 }}>{big}</span>{unit && <span className="bd" style={{ fontSize: 15 }}>{unit}</span>}</div>
      <p className="bd soft" style={{ margin: "4px 0 0", fontSize: 13 }}>{note}</p>
      {hand && <p className="hand rust" style={{ margin: "4px 0 0", fontSize: 16 }}>{hand}</p>}
    </Paper>
  );
}
