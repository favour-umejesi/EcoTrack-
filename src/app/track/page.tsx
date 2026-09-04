"use client";
import Link from "next/link";
import { Icon, Paper, Sketch, Stamp } from "@/components/Bits";
import LineChart from "@/components/LineChart";
import CountUp from "@/components/CountUp";
import { useSession } from "@/components/Session";
import { CHANGES, HISTORY, POINTS_MONTH, STREAK } from "@/data/mock";

export default function Track() {
  const { mode } = useSession();
  const last = HISTORY[HISTORY.length - 1], first = HISTORY[0];
  const since = Math.round(((last.kg - first.kg) / first.kg) * 100);
  const total = POINTS_MONTH.reduce((s, p) => s + p.pts, 0);
  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="row between" style={{ alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 className="fell rv" style={{ fontSize: 36 }}>Eight months of progress</h1>
          <p className="bd soft" style={{ margin: "4px 0 0" }}>Compared with yourself, not with strangers.</p>
        </div>
        <Link href="/calculator" className="btn"><Icon name="calendar" size={16} /> Log this week</Link>
      </div>
      {mode === "guest" && <p className="hand rust" style={{ margin: "0 0 16px", transform: "rotate(-1deg)" }}>this is a sample ledger. sign in and yours will fill in week by week.</p>}
      <div className="cols" style={{ gridTemplateColumns: "minmax(0, 800px) 360px", gap: 40 }}>
        <div className="stack" style={{ gap: 28 }}>
          <div className="row" style={{ gap: 24, alignItems: "flex-start" }}>
            <Tile label="This month" big={<CountUp value={last.kg} />} unit="kg CO₂e" note="August, from four weekly logs" rot={-1} />
            <Tile label="Since your first month" big={<>{since >= 0 ? "+" : "−"}<CountUp value={Math.abs(since)} />%</>} note="Lower than January, mostly electricity" rot={0.8} tone="dark" />
            <Tile label="Logging streak" big={<CountUp value={STREAK.weeks} duration={600} />} unit="weeks" note="A busy week will not reset you." rot={-0.6} hand="1 grace skip left this month" />
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="kicker" style={{ fontSize: 11 }}>Monthly footprint, kg CO₂e</span>
            <LineChart data={HISTORY} />
          </div>
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <Paper rot={0.6} style={{ padding: "16px 18px" }}>
            <h2 className="fell" style={{ fontSize: 20, marginBottom: 6 }}>What changed since July</h2>
            {CHANGES.map((c) => (
              <div key={c.name} className="row" style={{ gap: 10, padding: "10px 0", flexWrap: "nowrap" }}>
                <Icon name={c.icon} size={16} color="var(--ink-soft)" />
                <div className="stack" style={{ gap: 1, flex: 1 }}><span className="bd" style={{ fontSize: 15 }}>{c.name}</span><span className="ty" style={{ fontSize: 10 }}>{c.note}</span></div>
                <Stamp tone={c.good ? "moss" : "soft"} sm>{c.delta}</Stamp>
              </div>
            ))}
          </Paper>
          <Paper tone="dark" rot={-0.8} style={{ padding: "16px 18px" }}>
            <div className="row between" style={{ alignItems: "flex-end", paddingBottom: 6 }}><h2 className="fell" style={{ fontSize: 20 }}>Points this month</h2><span className="fell rust" style={{ fontSize: 24 }}>+{total}</span></div>
            {POINTS_MONTH.map((p) => (
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
