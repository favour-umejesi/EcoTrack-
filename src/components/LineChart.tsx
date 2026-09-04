"use client";
import { useState } from "react";
import { Paper } from "./Bits";

export default function LineChart({ data, baselineLabel = "your January baseline" }: { data: { month: string; kg: number }[]; baselineLabel?: string }) {
  const W = 800, H = 270, L = 60, R = 30, T = 30, B = 40;
  const vals = data.map((d) => d.kg);
  const lo = Math.floor((Math.min(...vals) - 40) / 50) * 50, hi = Math.ceil((Math.max(...vals) + 40) / 50) * 50;
  const px = (k: number) => L + (k * (W - L - R)) / (data.length - 1);
  const py = (v: number) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const [hover, setHover] = useState<number>(data.length - 1);
  const d = vals.map((v, k) => `${k ? "L" : "M"}${px(k).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const grid: number[] = []; for (let g = lo; g <= hi; g += 50) grid.push(g);
  const base = vals[0];
  const h = data[hover];
  const delta = Math.round(((h.kg - base) / base) * 100);
  return (
    <div className="rel draw" style={{ width: W }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHover(data.length - 1)} style={{ display: "block", overflow: "visible" }}>
        {grid.map((g) => <text key={g} x={L - 10} y={py(g) + 4} textAnchor="end" className="ty" fontSize="10" fill="var(--ink-soft)" style={{ fontFamily: "var(--font-type)" }}>{g}</text>)}
        <line x1={L} x2={W - R} y1={py(base)} y2={py(base)} stroke="var(--ink)" strokeWidth="1.5" opacity="0.45" />
        <text x={L + 6} y={py(base) - 8} textAnchor="start" fontSize="10" fill="var(--ink-soft)" style={{ fontFamily: "var(--font-type)", letterSpacing: 1 }}>{baselineLabel}</text>
        {data.map((p, k) => <text key={p.month} x={px(k)} y={H - 12} textAnchor="middle" fontSize="10" fill="var(--ink-soft)" style={{ fontFamily: "var(--font-type)" }}>{p.month}</text>)}
        <path className="line" pathLength={1} d={d} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((p, k) => (
          <g key={p.month}>
            <circle className="pt" cx={px(k)} cy={py(p.kg)} r={k === hover ? 6 : 4} fill={k === hover ? "var(--rust)" : "var(--ink)"} stroke="var(--paper)" strokeWidth="2" />
            <rect x={px(k) - 30} y={T} width={60} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(k)} />
          </g>
        ))}
        <line className="pt" x1={px(hover)} x2={px(hover)} y1={T} y2={H - B} stroke="var(--rust)" strokeWidth="1" opacity="0.6" />
      </svg>
      <div className="chart-tip tip" style={{ left: Math.min(px(hover) - 230, W - 240), top: py(h.kg) - 96 }}>
        <Paper tone="dark" rot={-2} style={{ padding: "8px 12px" }}>
          <span className="ty" style={{ display: "block", fontSize: 10 }}>{h.month} 2026</span>
          <span className="bd" style={{ fontSize: 14 }}>{h.kg} kg CO₂e, {delta >= 0 ? "+" : "−"}{Math.abs(delta)}% vs January</span>
        </Paper>
      </div>
    </div>
  );
}
