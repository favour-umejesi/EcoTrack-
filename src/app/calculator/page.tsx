"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Icon, Paper, Section, Select, Sketch } from "@/components/Bits";
import CountryPicker from "@/components/CountryPicker";
import { defaultUnits, fromKm, fromLpgKg, fromNgM3, LPG_UNITS, NG_UNITS, tidy, toKm, toLpgKg, toNgM3, UNIT_LABEL, type DistanceUnit, type GasUnit, type LpgUnit, type NgUnit } from "@/lib/units";
import { useSession } from "@/components/Session";
import CountUp from "@/components/CountUp";
import { compute, fmtKg, fmtT, FACTOR_SET, type Inputs, type Mode } from "@/lib/engine";
import { parseInputs, STORAGE_KEY } from "@/data/mock";
import { useLocalValue, writeKey } from "@/lib/store";

const MODES: [Mode, string, string][] = [["car", "Car", "car"], ["bus", "Bus", "bus"], ["train", "Train", "train"], ["bike", "Bike", "bike"], ["walk", "Walk", "walk"]];

export default function Calculator() {
  const router = useRouter();
  const { mode } = useSession();
  const saved = useLocalValue(STORAGE_KEY, "");
  const [i, setI] = useState<Inputs>(() => parseInputs(saved));
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) => setI((p) => ({ ...p, [k]: v }));
  const num = (k: keyof Inputs) => (v: string) => set(k, Number(v) as never);
  const r = compute(i);
  const setCountry = (c: string) => { const u = defaultUnits(c); setI((p) => ({ ...p, country: c, distanceUnit: u.distance, gasUnit: p.gasType === "lpg" ? u.lpg : u.ng })); };
  const setGasType = (t: Inputs["gasType"]) => { const u = defaultUnits(i.country); setI((p) => ({ ...p, gasType: t, gasUnit: t === "lpg" ? u.lpg : u.ng, gasQty: 0 })); };
  const gasShown = i.gasType === "lpg" ? fromLpgKg(i.gasQty, i.gasUnit as LpgUnit) : fromNgM3(i.gasQty, i.gasUnit as NgUnit);
  const setGasShown = (v: string) => set("gasQty", i.gasType === "lpg" ? toLpgKg(Number(v), i.gasUnit as LpgUnit) : toNgM3(Number(v), i.gasUnit as NgUnit));
  const gasUnits: GasUnit[] = i.gasType === "lpg" ? LPG_UNITS : NG_UNITS;

  return (
    <main className="page ruled rel" style={{ minHeight: "calc(100vh - 84px)" }}>
      <div className="cols cols--2" style={{ gap: 56 }}>
        <div className="stack" style={{ gap: 16 }}>
          <div className="row between" style={{ alignItems: "flex-end", gap: 24 }}>
            <div>
              <h1 className="fell rv" style={{ fontSize: 34 }}>What does a typical week look like?</h1>
              <p className="bd soft" style={{ margin: "4px 0 0" }}>Rough numbers are fine. You can refine them any time.</p>
            </div>
            <CountryPicker value={i.country} onChange={setCountry} width={270} />
          </div>

          <Section numeral="I." title="Getting around" />
          <div className="row" style={{ gap: 8 }}>
            {MODES.map(([m, l, ic]) => (
              <button key={m} className={`seg ${i.mode === m ? "seg--on" : ""}`} onClick={() => set("mode", m)}><Icon name={ic} size={15} /> {l}</button>
            ))}
          </div>
          <div className="row" style={{ gap: 28 }}>
            <Field label="Daily commute distance, both ways" value={tidy(fromKm(i.commuteKm, i.distanceUnit))} unit={UNIT_LABEL[i.distanceUnit]} onChange={(v) => set("commuteKm", toKm(Number(v), i.distanceUnit))} width={250} />
            <div className="row" style={{ gap: 6, alignSelf: "flex-end", paddingBottom: 6 }}>
              {(["km", "mi"] as DistanceUnit[]).map((u) => <button key={u} className={`seg ${i.distanceUnit === u ? "seg--on" : ""}`} style={{ padding: "4px 9px", fontSize: 10 }} onClick={() => set("distanceUnit", u)}>{UNIT_LABEL[u]}</button>)}
            </div>
            {i.mode === "car" && <Select label="Fuel" value={i.fuel} options={[["petrol", "Petrol"], ["diesel", "Diesel"], ["electric", "Electric"]]} onChange={(v) => set("fuel", v as Inputs["fuel"])} width={200} />}
          </div>

          <Section numeral="II." title="At home" />
          <div className="row" style={{ gap: 28 }}>
            <Field label="Electricity each month" value={i.electricityKwh} unit="kWh" onChange={num("electricityKwh")} width={230} />
            <Field label="Cooking gas each month" value={tidy(gasShown)} unit={UNIT_LABEL[i.gasUnit]} onChange={setGasShown} width={200} />
            <Select label="Gas unit" value={i.gasUnit} options={gasUnits.map((u) => [u, UNIT_LABEL[u]] as [string, string])} onChange={(v) => set("gasUnit", v as GasUnit)} width={130} />
            <Select label="Gas type" value={i.gasType} options={[["lpg", "LPG bottle"], ["natural", "Piped natural gas"]]} onChange={(v) => setGasType(v as Inputs["gasType"])} width={190} />
          </div>

          <Section numeral="III." title="Food and travel" />
          <div className="row" style={{ gap: 28 }}>
            <Field label="Meat meals each week" value={i.meatMeals} unit="meals" onChange={num("meatMeals")} width={230} />
            <Field label="Flights in the last 12 months" value={i.flights} unit="flights" onChange={num("flights")} width={230} />
            <div className="stack" style={{ gap: 4 }}>
              <Select label="Typical flight" value={i.flightClass} options={[["short", "Short flight"], ["medium", "Medium flight"], ["long", "Long flight"]]} onChange={(v) => set("flightClass", v as Inputs["flightClass"])} width={200} />
              <span className="ty" style={{ fontSize: 10 }}>short is under 3 hours, medium 3 to 6, long over 6</span>
            </div>
          </div>

          <Section numeral="IV." title="What you wear" />
          <div className="row" style={{ gap: 28, alignItems: "flex-end" }}>
            <Field label="New clothing items this month" value={i.clothingItems} unit="items" onChange={num("clothingItems")} width={250} />
            <Field label="Of which second-hand" value={i.secondhandItems} unit="items" onChange={num("secondhandItems")} width={220} />
            <p className="hand rust" style={{ margin: 0, maxWidth: 250, transform: "rotate(-2deg)" }}>second-hand counts for almost nothing. that&apos;s the point.</p>
          </div>
        </div>

        <div className="rel">
          <Paper tone="dark" rot={-1.5} pin style={{ padding: 22 }}>
            <div className="stack" style={{ gap: 10 }}>
              <span className="ty ty-u" style={{ letterSpacing: 3, fontSize: 11 }}>Running total</span>
              <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
                <span className="fell" style={{ fontSize: 54, lineHeight: 1 }}><CountUp value={r.totalKg} format={fmtT} duration={700} /></span>
                <span className="bd" style={{ fontSize: 16 }}>tonnes CO₂e a year</span>
              </div>
              {r.lines.map((l) => (
                <div key={l.key} className="ledger-row">
                  <span className="ty">{l.label}</span><span className="lead" /><span className="bd" style={{ fontSize: 15 }}><CountUp value={l.kg} format={fmtKg} duration={700} /></span>
                </div>
              ))}
              <div className="rule" />
              <div className="row" style={{ gap: 8, alignItems: "flex-start", flexWrap: "nowrap" }}>
                <Icon name="book" size={14} color="var(--ink-soft)" />
                <p className="bd soft" style={{ fontSize: 13, margin: 0 }}>Factors: {FACTOR_SET.sources.join("; ")}. Factor set {FACTOR_SET.version}. Grid: {r.grid.label}{r.grid.level !== "country" ? ", used because there is no country figure yet" : ""}.</p>
              </div>
              <button className="btn btn--wide" style={{ padding: 14 }} onClick={() => { writeKey(STORAGE_KEY, JSON.stringify(i)); router.push("/insights"); }}>See my insights</button>
            </div>
          </Paper>
          {mode === "guest" && <p className="hand soft" style={{ margin: "36px 12px 0", transform: "rotate(-3deg)", maxWidth: 330 }}>you&apos;re a guest. this page lives only in your browser; sign in to keep it.</p>}
        </div>
      </div>
      <Sketch name="bulb" x={770} y={320} w={50} rot={-8} />
      <Sketch name="plane" x={480} y={680} w={150} rot={4} />
      <Sketch name="bag" x={720} y={640} w={58} rot={10} />
    </main>
  );
}
