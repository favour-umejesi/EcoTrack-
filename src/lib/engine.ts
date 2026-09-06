/**
 * The calculation engine. Every number the UI shows comes from here: quantity × published factor × annualisation.
 * Factors are transcribed with a citation each in src/data/factors.ts; grid intensities and per-capita averages are
 * generated from Ember and Our World in Data by scripts/build-factors.ts. The engine stays metric; units convert at the UI edge.
 */
import { COUNTRY_BY_CODE } from "@/data/countries";
import { FACTORS, FACTOR_VERSION } from "@/data/factors";
import { GRID, GRID_CONTINENT, GRID_WORLD } from "@/data/grid.generated";
import { PER_CAPITA, PER_CAPITA_CONTINENT, PER_CAPITA_WORLD } from "@/data/averages.generated";
import type { DistanceUnit, GasUnit } from "@/lib/units";

export type Mode = "car" | "bus" | "train" | "bike" | "walk";
export type Fuel = "petrol" | "diesel" | "hybrid" | "electric";
export type CarSize = "small" | "medium" | "large";
export type GasType = "lpg" | "natural";
export type HeatingType = "none" | "gas" | "oil" | "electric" | "heatpump" | "wood";
export type Diet = "vegan" | "vegetarian" | "pescatarian" | "low_meat" | "average" | "high_meat";
/** Flights are classed by length, not by whether they cross a border: a short hop can be international and a long haul can be domestic. */
export type FlightClass = "short" | "medium" | "long";
export type Cabin = "economy" | "premium" | "business";

export type Inputs = {
  country: string;
  household: number;          // people sharing the electricity, gas and heating bills
  mode: Mode;
  fuel: Fuel;
  carSize: CarSize;
  commuteKm: number;          // per commute day, both directions
  commuteDays: number;        // days a week
  electricityKwh: number;     // per month, whole home
  gasQty: number;             // cooking gas per month: kg of LPG or m³ of natural gas
  gasType: GasType;
  heatingType: HeatingType;
  heatingQty: number;         // per month: kWh of gas, litres of oil, kg of wood. Electric heating and heat pumps sit inside the electricity figure.
  diet: Diet;
  meatMeals?: number;         // legacy field from logs saved before the diet profile existed
  flights: number;            // one-way flights in the last 12 months
  flightClass: FlightClass;
  cabin: Cabin;
  clothingItems: number;      // new items per month
  secondhandItems: number;    // of which second-hand
  distanceUnit: DistanceUnit; // how the user prefers to see distance; storage stays in km
  gasUnit: GasUnit;           // how the user prefers to see gas; storage stays in kg or m³
};

/** A blank week: nothing pre-filled, so every number on screen is one the person typed. */
export const DEFAULT_INPUTS: Inputs = {
  country: "gb", household: 1, mode: "car", fuel: "petrol", carSize: "medium", commuteKm: 0, commuteDays: 5,
  electricityKwh: 0, gasQty: 0, gasType: "lpg", heatingType: "none", heatingQty: 0, diet: "average",
  flights: 0, flightClass: "short", cabin: "economy", clothingItems: 0, secondhandItems: 0, distanceUnit: "mi", gasUnit: "kg",
};

/** Fills in anything a log from an older version lacks, and maps the old meat-meals figure onto a diet profile. */
export function normalise(raw: Partial<Inputs> | null | undefined): Inputs {
  const i: Inputs = { ...DEFAULT_INPUTS, ...(raw ?? {}) };
  if (raw && !raw.diet && typeof raw.meatMeals === "number") {
    i.diet = raw.meatMeals <= 0 ? "vegetarian" : raw.meatMeals <= 3 ? "low_meat" : raw.meatMeals <= 7 ? "average" : "high_meat";
  }
  if (!(i.household >= 1)) i.household = 1;
  return i;
}

const WEEKS_PER_YEAR = 46; // 52 less about six weeks of leave and public holidays
const F = FACTORS;
const val = (c: { value: number | null }) => c.value ?? 0;

export const FACTOR_SET = {
  version: FACTOR_VERSION,
  sources: [
    "UK DESNZ greenhouse gas conversion factors 2025",
    `Ember yearly electricity data (${GRID_WORLD.year})`,
    "Scarborough et al. 2023, Nature Food (diets)",
    "Levi Strauss 501 life-cycle assessment 2015 and Farrant et al. 2010 (clothing)",
    `Our World in Data CO₂ per capita (${PER_CAPITA_WORLD.year})`,
  ],
};

export type Resolved = { value: number; label: string; level: "country" | "continent" | "world"; year?: number };

/** Grid intensity in kg CO₂e per kWh: the country's own figure, else its continent's, else the world's. */
export function resolveGrid(country: string): Resolved {
  const c = COUNTRY_BY_CODE[country];
  const g = GRID[country];
  if (c && g) return { value: g.g / 1000, label: c.name, level: "country", year: g.year };
  if (c) return { value: GRID_CONTINENT[c.continent] / 1000, label: `${c.continent} average`, level: "continent" };
  return { value: GRID_WORLD.g / 1000, label: "world average", level: "world", year: GRID_WORLD.year };
}

/** Per-capita CO₂ in tonnes a year, same fallback order. */
export function resolveAverage(country: string): Resolved & { name: string } {
  const c = COUNTRY_BY_CODE[country];
  const p = PER_CAPITA[country];
  if (c && p) return { value: p.t, label: c.name, name: c.name, level: "country", year: p.year };
  if (c) return { value: PER_CAPITA_CONTINENT[c.continent], label: `${c.continent} average`, name: c.continent, level: "continent" };
  return { value: PER_CAPITA_WORLD.t, label: "world average", name: "world", level: "world", year: PER_CAPITA_WORLD.year };
}

export type Category = "commute" | "electricity" | "heating" | "gas" | "food" | "flights" | "clothing";
export type Line = { key: Category; label: string; kg: number; low: number; high: number; note?: string };
export type Result = { totalKg: number; lowKg: number; highKg: number; lines: Line[]; biggest: Line; factorSet: string; grid: Resolved };

/** Rough uncertainty per category, as a fraction. Factors are averages; a person's true figure sits in a band around them. */
export const BAND: Record<Category, number> = { commute: 0.15, electricity: 0.1, heating: 0.15, gas: 0.1, food: 0.3, flights: 0.25, clothing: 0.5 };

/** kg CO₂e per km for the chosen way of getting to work. Electric cars use the person's own grid. */
export function commutePerKm(i: Inputs, grid: number): number {
  if (i.mode === "car") return i.fuel === "electric" ? val(F.carElectricKwhPerKm) * grid : val(F.car[i.carSize][i.fuel]);
  if (i.mode === "bus") return val(F.bus);
  if (i.mode === "train") return val(F.rail);
  return 0;
}

export function compute(raw: Partial<Inputs>): Result {
  const i = normalise(raw);
  const g = resolveGrid(i.country);
  const grid = g.value;
  const hh = i.household;
  const commute = i.commuteKm * i.commuteDays * WEEKS_PER_YEAR * commutePerKm(i, grid);
  const electricity = (i.electricityKwh * 12 * grid) / hh;
  const gas = (i.gasQty * 12 * (i.gasType === "lpg" ? val(F.lpgPerKg) : val(F.naturalGasPerM3))) / hh;
  const heatingPerUnit = i.heatingType === "gas" ? val(F.naturalGasPerKwh) : i.heatingType === "oil" ? val(F.heatingOilPerLitre) : i.heatingType === "wood" ? val(F.woodPerKg) : 0;
  const heating = (i.heatingQty * 12 * heatingPerUnit) / hh;
  const food = val(F.diet[i.diet]) * 365;
  // DESNZ has no premium-economy row for short flights, so premium falls back to economy there.
  const perPassengerKm = F.flight[i.flightClass][i.cabin].value ?? val(F.flight[i.flightClass].economy);
  const flights = i.flights * val(F.flightRepresentativeKm[i.flightClass]) * perPassengerKm;
  const newItems = Math.max(0, i.clothingItems - i.secondhandItems);
  const clothing = newItems * 12 * val(F.clothing.newItem) + Math.min(i.secondhandItems, i.clothingItems) * 12 * val(F.clothing.secondhandItem);
  const raw_: [Category, string, number, string?][] = [
    ["commute", "Commute", commute],
    ["electricity", "Electricity", electricity],
    ["heating", "Heating", heating, i.heatingType === "electric" || i.heatingType === "heatpump" ? "counted in electricity" : undefined],
    ["flights", "Flights", flights],
    ["food", "Food", food],
    ["clothing", "Clothing", clothing],
    ["gas", "Cooking gas", gas],
  ];
  const lines: Line[] = raw_
    .map(([key, label, kg, note]) => ({ key, label, kg: Math.round(kg), low: Math.round(kg * (1 - BAND[key])), high: Math.round(kg * (1 + BAND[key])), note }))
    .sort((a, b) => b.kg - a.kg);
  const sum = (k: "kg" | "low" | "high") => lines.reduce((s, l) => s + l[k], 0);
  return { totalKg: sum("kg"), lowKg: sum("low"), highKg: sum("high"), lines, biggest: lines[0], factorSet: FACTOR_VERSION, grid: g };
}

/** Savings formulas for catalog actions, in kg per year, computed from the user's own inputs. Never negative. */
export const ACTIONS = {
  twoBusDays: (raw: Partial<Inputs>) => {
    const i = normalise(raw);
    if (i.mode !== "car") return 0;
    const grid = resolveGrid(i.country).value;
    return Math.max(0, Math.round(i.commuteKm * Math.min(2, i.commuteDays) * WEEKS_PER_YEAR * (commutePerKm(i, grid) - val(F.bus))));
  },
  meatFreeDay: (raw: Partial<Inputs>) => {
    const i = normalise(raw);
    return Math.max(0, Math.round((val(F.diet[i.diet]) - val(F.diet.vegetarian)) * 52));
  },
  thriftTwoOfThree: (raw: Partial<Inputs>) => {
    const i = normalise(raw);
    return Math.max(0, Math.round(Math.max(0, i.clothingItems - i.secondhandItems) * 12 * (2 / 3) * (val(F.clothing.newItem) - val(F.clothing.secondhandItem))));
  },
  laundryOffPeak: (raw: Partial<Inputs>) => {
    const i = normalise(raw);
    return Math.max(0, Math.round((i.electricityKwh * 12 * 0.15 * 0.25 * resolveGrid(i.country).value) / i.household));
  },
  heatPump: (raw: Partial<Inputs>) => {
    const i = normalise(raw);
    if (i.heatingType !== "gas") return 0;
    const grid = resolveGrid(i.country).value;
    return Math.max(0, Math.round((i.heatingQty * 12 * (val(F.naturalGasPerKwh) - grid / val(F.heatPumpCop))) / i.household));
  },
};

export const fmtKg = (kg: number) => kg.toLocaleString("en-GB");
export const fmtT = (kg: number) => (kg / 1000).toFixed(1);

export function compareToAverage(totalKg: number, country: string) {
  const avg = resolveAverage(country);
  const pct = Math.round(((totalKg / 1000 - avg.value) / avg.value) * 100);
  const who = avg.level === "country" ? `the ${avg.name} average` : avg.level === "continent" ? `the ${avg.name} average (no country figure yet)` : "the world average";
  return { avg, pct, text: pct >= 0 ? `About ${pct}% above ${who} of ${avg.value.toFixed(1)} t per person.` : `About ${Math.abs(pct)}% below ${who} of ${avg.value.toFixed(1)} t per person.` };
}
