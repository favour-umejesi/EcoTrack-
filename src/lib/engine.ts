/**
 * Pure calculation engine. No framework, no database.
 * Every number the UI shows comes from here: quantity × factor × annualisation.
 * Factors are ILLUSTRATIVE placeholders in the shape the real, generated factor set will have.
 */
export type Mode = "car" | "bus" | "train" | "bike" | "walk";
export type Fuel = "petrol" | "diesel" | "electric";
export type GasType = "lpg" | "natural";
/** Flights are classed by length, not by whether they cross a border: a short hop can be international and a long haul can be domestic. */
export type FlightClass = "short" | "medium" | "long";
import { COUNTRY_BY_CODE, type Continent } from "@/data/countries";
import type { DistanceUnit, GasUnit } from "@/lib/units";

export type Inputs = {
  country: string;
  mode: Mode;
  fuel: Fuel;
  commuteKm: number;        // per commute day, both directions
  electricityKwh: number;   // per month
  gasQty: number;           // kg of LPG or m³ of natural gas, per month
  gasType: GasType;
  meatMeals: number;        // per week
  flights: number;          // per 12 months
  flightClass: FlightClass;
  clothingItems: number;    // new items per month
  secondhandItems: number;  // of which second-hand
  distanceUnit: DistanceUnit; // how the user prefers to see distance; storage stays in km
  gasUnit: GasUnit;           // how the user prefers to see gas; storage stays in kg or m³
};

export const FACTOR_SET = {
  version: "2025 (illustrative)",
  sources: [
    "UK Government greenhouse gas conversion factors 2025",
    "Ember electricity data 2025",
    "Poore and Nemecek, Science 2018, via Our World in Data",
    "Levi Strauss jeans life-cycle assessment 2015",
  ],
  commuteDaysPerYear: 230,
  carPerKm: { petrol: 0.17, diesel: 0.17, electric: 0.05 } as Record<Fuel, number>,
  busPerKm: 0.1,
  trainPerKm: 0.035,
  /** Country grid intensities, kg CO₂e per kWh. The generated factor set covers every country in Ember's data; these are samples. */
  gridPerKwh: { gb: 0.2, fr: 0.05, de: 0.35, us: 0.37, cn: 0.55, in: 0.7, ng: 0.43, ca: 0.12, au: 0.55, jp: 0.45, za: 0.9, ke: 0.1, br: 0.1, no: 0.03, pl: 0.65, mx: 0.4, id: 0.7, eg: 0.45, gh: 0.35 } as Record<string, number>,
  /** Fallback when a country is missing from the set. Illustrative continent averages, then the world. */
  gridByContinent: { Africa: 0.45, Asia: 0.55, Europe: 0.28, "North America": 0.38, "South America": 0.2, Oceania: 0.5 } as Record<Continent, number>,
  gridWorld: 0.48,
  lpgPerKg: 2.94,
  naturalGasPerM3: 2.0,
  meatMealKg: 3.5,
  /** Representative one-way distance per class: under 3 hours, 3 to 6 hours, over 6 hours. */
  flightKm: { short: 900, medium: 3000, long: 7500 } as Record<FlightClass, number>,
  /** Per passenger-km, economy. Short flights emit more per km because take-off and climb dominate. */
  flightPerKm: { short: 0.2, medium: 0.15, long: 0.15 } as Record<FlightClass, number>,
  clothingNewKg: 15,
  clothingSecondhandKg: 0.5,
};

/** Per-capita CO₂ averages in tonnes, illustrative, in the shape of the Our World in Data series. */
export const COUNTRY_AVERAGES: Record<string, { name: string; tonnes: number }> = {
  gb: { name: "United Kingdom", tonnes: 4.7 },
  us: { name: "United States", tonnes: 14.3 },
  fr: { name: "France", tonnes: 4.1 },
  de: { name: "Germany", tonnes: 7.1 },
  ca: { name: "Canada", tonnes: 14.0 },
  au: { name: "Australia", tonnes: 14.5 },
  jp: { name: "Japan", tonnes: 8.0 },
  cn: { name: "China", tonnes: 8.4 },
  in: { name: "India", tonnes: 2.1 },
  ng: { name: "Nigeria", tonnes: 0.6 },
  za: { name: "South Africa", tonnes: 6.7 }, br: { name: "Brazil", tonnes: 2.2 }, ke: { name: "Kenya", tonnes: 0.4 }, mx: { name: "Mexico", tonnes: 3.7 }, id: { name: "Indonesia", tonnes: 2.6 }, eg: { name: "Egypt", tonnes: 2.3 }, gh: { name: "Ghana", tonnes: 0.7 }, no: { name: "Norway", tonnes: 7.5 }, pl: { name: "Poland", tonnes: 7.7 },
  world: { name: "the world", tonnes: 4.7 },
};
export const CONTINENT_AVERAGES: Record<Continent, number> = { Africa: 1.0, Asia: 4.7, Europe: 6.5, "North America": 10.0, "South America": 2.5, Oceania: 10.0 };

export type Resolved = { value: number; label: string; level: "country" | "continent" | "world" };
/** Country first, then its continent, then the world. The label says which was used so the UI can be honest about it. */
export function resolveGrid(country: string): Resolved {
  if (F.gridPerKwh[country] !== undefined) return { value: F.gridPerKwh[country], label: COUNTRY_BY_CODE[country]?.name ?? country, level: "country" };
  const c = COUNTRY_BY_CODE[country]?.continent;
  if (c) return { value: F.gridByContinent[c], label: `${c} average`, level: "continent" };
  return { value: F.gridWorld, label: "world average", level: "world" };
}
export function resolveAverage(country: string): Resolved & { name: string } {
  const a = COUNTRY_AVERAGES[country];
  if (a) return { value: a.tonnes, label: a.name, name: a.name, level: "country" };
  const c = COUNTRY_BY_CODE[country]?.continent;
  if (c) return { value: CONTINENT_AVERAGES[c], label: `${c} average`, name: `${c}`, level: "continent" };
  return { value: COUNTRY_AVERAGES.world.tonnes, label: "world average", name: "the world", level: "world" };
}

export type Category = "commute" | "electricity" | "gas" | "food" | "flights" | "clothing";
export type Line = { key: Category; label: string; kg: number; note?: string };
export type Result = { totalKg: number; lines: Line[]; biggest: Line; factorSet: string; grid: Resolved };

const F = FACTOR_SET;

export function compute(i: Inputs): Result {
  const g = resolveGrid(i.country); const grid = g.value;
  const perKm = i.mode === "car" ? (i.fuel === "electric" ? grid * 0.17 : F.carPerKm[i.fuel]) : i.mode === "bus" ? F.busPerKm : i.mode === "train" ? F.trainPerKm : 0;
  const commute = i.commuteKm * F.commuteDaysPerYear * perKm;
  const electricity = i.electricityKwh * 12 * grid;
  const gas = i.gasQty * 12 * (i.gasType === "lpg" ? F.lpgPerKg : F.naturalGasPerM3);
  const food = i.meatMeals * 52 * F.meatMealKg;
  const flights = i.flights * F.flightKm[i.flightClass] * F.flightPerKm[i.flightClass];
  const newItems = Math.max(0, i.clothingItems - i.secondhandItems);
  const clothing = newItems * 12 * F.clothingNewKg + Math.min(i.secondhandItems, i.clothingItems) * 12 * F.clothingSecondhandKg;
  const raw: Line[] = [
    { key: "commute", label: "Commute", kg: commute },
    { key: "electricity", label: "Electricity", kg: electricity },
    { key: "flights", label: "Flights", kg: flights },
    { key: "food", label: "Food", kg: food },
    { key: "clothing", label: "Clothing", kg: clothing },
    { key: "gas", label: "Cooking gas", kg: gas },
  ];
  const lines = raw.map((l) => ({ ...l, kg: Math.round(l.kg) })).sort((a, b) => b.kg - a.kg);
  const totalKg = lines.reduce((s, l) => s + l.kg, 0);
  return { totalKg, lines, biggest: lines[0], factorSet: F.version, grid: g };
}

/** Savings formulas for catalog actions, in kg per year, computed from the user's own inputs. */
export const ACTIONS = {
  twoBusDays: (i: Inputs) => {
    if (i.mode !== "car") return 0;
    const carKm = F.carPerKm[i.fuel];
    return Math.round(i.commuteKm * F.commuteDaysPerYear * (2 / 5) * (carKm - F.busPerKm));
  },
  meatFreeDay: (i: Inputs) => Math.round((i.meatMeals / 7) * 52 * F.meatMealKg),
  thriftTwoOfThree: (i: Inputs) => Math.round(Math.max(0, i.clothingItems - i.secondhandItems) * 12 * (2 / 3) * (F.clothingNewKg - F.clothingSecondhandKg)),
  laundryOffPeak: (i: Inputs) => Math.round(i.electricityKwh * 12 * 0.15 * 0.25 * resolveGrid(i.country).value),
};

export const fmtKg = (kg: number) => kg.toLocaleString("en-GB");
export const fmtT = (kg: number) => (kg / 1000).toFixed(1);

export function compareToAverage(totalKg: number, country: string) {
  const avg = resolveAverage(country);
  const pct = Math.round(((totalKg / 1000 - avg.value) / avg.value) * 100);
  const who = avg.level === "country" ? `the ${avg.name} average` : avg.level === "continent" ? `the ${avg.name} average (no country figure yet)` : "the world average";
  return { avg, pct, text: pct >= 0 ? `About ${pct}% above ${who} of ${avg.value} t per person.` : `About ${Math.abs(pct)}% below ${who} of ${avg.value} t per person.` };
}
