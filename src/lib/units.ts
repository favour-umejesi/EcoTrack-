/** Unit conversions. The engine only ever sees metric (km, kWh, kg of LPG, m³ of natural gas); the UI converts at the edge. */
export type DistanceUnit = "km" | "mi";
export type LpgUnit = "kg" | "l" | "gal";
export type NgUnit = "m3" | "ccf" | "therm";
export type GasUnit = LpgUnit | NgUnit;

export const KM_PER_MI = 1.609344;
/** Kilograms of LPG per unit. A litre of LPG weighs about 0.51 kg; a US gallon of propane about 1.93 kg. */
export const LPG_KG_PER: Record<LpgUnit, number> = { kg: 1, l: 0.51, gal: 1.93 };
/** Cubic metres of natural gas per unit. A ccf is 100 cubic feet; a therm is about 2.74 m³ of typical pipeline gas. */
export const NG_M3_PER: Record<NgUnit, number> = { m3: 1, ccf: 2.832, therm: 2.74 };

export const UNIT_LABEL: Record<DistanceUnit | GasUnit, string> = { km: "km", mi: "miles", kg: "kg", l: "litres", gal: "gallons", m3: "m³", ccf: "ccf", therm: "therms" };
export const LPG_UNITS: LpgUnit[] = ["kg", "l", "gal"];
export const NG_UNITS: NgUnit[] = ["m3", "ccf", "therm"];

/** Countries that still measure road distance in miles. */
const MILES = new Set(["us", "gb", "lr", "mm"]);
export function defaultUnits(country: string): { distance: DistanceUnit; lpg: LpgUnit; ng: NgUnit } {
  return { distance: MILES.has(country) ? "mi" : "km", lpg: country === "us" ? "gal" : "kg", ng: country === "us" ? "therm" : "m3" };
}

export const toKm = (v: number, u: DistanceUnit) => (u === "mi" ? v * KM_PER_MI : v);
export const fromKm = (km: number, u: DistanceUnit) => (u === "mi" ? km / KM_PER_MI : km);
export const toLpgKg = (v: number, u: LpgUnit) => v * LPG_KG_PER[u];
export const fromLpgKg = (kg: number, u: LpgUnit) => kg / LPG_KG_PER[u];
export const toNgM3 = (v: number, u: NgUnit) => v * NG_M3_PER[u];
export const fromNgM3 = (m3: number, u: NgUnit) => m3 / NG_M3_PER[u];
/** Show at most one decimal, and no trailing .0 */
export const tidy = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
