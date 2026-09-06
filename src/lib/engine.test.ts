import { describe, expect, it } from "vitest";
import { ACTIONS, compareToAverage, compute, normalise, resolveAverage, resolveGrid, type Inputs } from "./engine";
import { GRID } from "@/data/grid.generated";
import { COUNTRIES } from "@/data/countries";
import { fromNgM3, toKm, toLpgKg } from "./units";

const gb = GRID.gb.g / 1000; // kg CO2e per kWh, from the generated Ember data
const base: Inputs = {
  country: "gb", household: 1, mode: "car", fuel: "petrol", carSize: "medium", commuteKm: 30, commuteDays: 5,
  electricityKwh: 260, gasQty: 12, gasType: "lpg", heatingType: "gas", heatingQty: 500, diet: "average",
  flights: 2, flightClass: "short", cabin: "economy", clothingItems: 3, secondhandItems: 1, distanceUnit: "mi", gasUnit: "kg",
};
const zero: Inputs = { ...base, commuteKm: 0, electricityKwh: 0, gasQty: 0, heatingQty: 0, diet: "vegan", flights: 0, clothingItems: 0, secondhandItems: 0 };
const line = (i: Partial<Inputs>, key: string) => compute(i).lines.find((l) => l.key === key)!.kg;

describe("engine golden values (DESNZ 2025, Scarborough 2023, Ember, Levi's/Farrant)", () => {
  it("nothing logged means only the diet remains", () => {
    const r = compute(zero);
    expect(r.lines.filter((l) => l.key !== "food").every((l) => l.kg === 0)).toBe(true);
    expect(line(zero, "food")).toBe(Math.round(2.47 * 365));
  });
  it("matches hand-computed lines for the sample profile", () => {
    const r = compute(base);
    const kg = Object.fromEntries(r.lines.map((l) => [l.key, l.kg]));
    expect(kg.commute).toBe(Math.round(30 * 5 * 46 * 0.17474));       // medium petrol car, DESNZ 2025
    expect(kg.electricity).toBe(Math.round(260 * 12 * gb));             // UK grid from Ember
    expect(kg.gas).toBe(Math.round(12 * 12 * 2.93936));                 // LPG per kg
    expect(kg.heating).toBe(Math.round(500 * 12 * 0.18296));            // natural gas per kWh, gross CV
    expect(kg.food).toBe(Math.round(7.04 * 365));                        // medium meat-eater
    expect(kg.flights).toBe(Math.round(2 * 1484 * 0.12576));             // short-haul economy with radiative forcing
    expect(kg.clothing).toBe(Math.round(2 * 12 * 20 + 1 * 12 * 5.5));    // new and second-hand garments
    expect(r.totalKg).toBe(r.lines.reduce((s, l) => s + l.kg, 0));
    expect(r.factorSet).toBe("2025.1");
  });
  it("shares the home bills across the household but not the diet", () => {
    const two = { ...base, household: 2 };
    expect(line(two, "electricity")).toBe(Math.round(line(base, "electricity") / 2));
    expect(line(two, "heating")).toBe(Math.round(line(base, "heating") / 2));
    expect(line(two, "food")).toBe(line(base, "food"));
  });
  it("carries an uncertainty band around every line and the total", () => {
    const r = compute(base);
    r.lines.forEach((l) => { expect(l.low).toBeLessThanOrEqual(l.kg); expect(l.high).toBeGreaterThanOrEqual(l.kg); });
    expect(r.lowKg).toBeLessThan(r.totalKg);
    expect(r.highKg).toBeGreaterThan(r.totalKg);
  });
  it("is monotonic: more of an activity never lowers the total", () => {
    expect(compute({ ...base, commuteKm: 60 }).totalKg).toBeGreaterThan(compute(base).totalKg);
    expect(compute({ ...base, secondhandItems: 3 }).totalKg).toBeLessThan(compute(base).totalKg);
    expect(compute({ ...base, diet: "vegan" }).totalKg).toBeLessThan(compute({ ...base, diet: "high_meat" }).totalKg);
  });
  it("a long business-class flight costs far more than a short economy hop", () => {
    const short = line({ ...zero, flights: 1, flightClass: "short" }, "flights");
    const long = line({ ...zero, flights: 1, flightClass: "long", cabin: "business" }, "flights");
    expect(long).toBeGreaterThan(short * 5);
  });
  it("premium economy on a short flight falls back to economy, since DESNZ has no such row", () => {
    expect(line({ ...zero, flights: 1, cabin: "premium" }, "flights")).toBe(line({ ...zero, flights: 1, cabin: "economy" }, "flights"));
  });
  it("an electric car uses the person's own grid, so it is cleaner in France than in Poland", () => {
    const fr = line({ ...base, country: "fr", fuel: "electric" }, "commute");
    const pl = line({ ...base, country: "pl", fuel: "electric" }, "commute");
    expect(fr).toBeLessThan(pl / 3);
  });
  it("bike and walk cost nothing to commute; electric heating counts inside electricity", () => {
    expect(line({ ...base, mode: "bike" }, "commute")).toBe(0);
    const r = compute({ ...base, heatingType: "heatpump", heatingQty: 400 });
    expect(r.lines.find((l) => l.key === "heating")).toMatchObject({ kg: 0, note: "counted in electricity" });
  });
});

describe("older logs still compute", () => {
  it("fills missing fields with defaults and maps meat meals onto a diet", () => {
    expect(normalise({ meatMeals: 0 }).diet).toBe("vegetarian");
    expect(normalise({ meatMeals: 2 }).diet).toBe("low_meat");
    expect(normalise({ meatMeals: 5 }).diet).toBe("average");
    expect(normalise({ meatMeals: 12 }).diet).toBe("high_meat");
    expect(normalise({ household: 0 }).household).toBe(1);
    expect(compute({ country: "gb", electricityKwh: 100 } as Partial<Inputs>).totalKg).toBeGreaterThan(0);
  });
});

describe("location resolution: country, then continent, then world", () => {
  it("uses the country figure when it exists", () => {
    expect(resolveGrid("gb")).toMatchObject({ value: gb, level: "country" });
    expect(resolveGrid("fr").value).toBeLessThan(0.1);
    expect(resolveGrid("pl").value).toBeGreaterThan(0.4);
  });
  it("falls back to the continent for a country Ember does not cover", () => {
    const uncovered = COUNTRIES.find((c) => !GRID[c.code]);
    expect(uncovered).toBeDefined();
    expect(resolveGrid(uncovered!.code)).toMatchObject({ level: "continent", label: `${uncovered!.continent} average` });
  });
  it("falls back to the world for an unknown code", () => {
    expect(resolveGrid("zz").level).toBe("world");
    expect(resolveAverage("zz").level).toBe("world");
  });
  it("compares against real per-capita figures", () => {
    expect(resolveAverage("us").value).toBeGreaterThan(10);
    expect(resolveAverage("in").value).toBeLessThan(3);
    expect(compareToAverage(1000, "gb").text).toMatch(/below the United Kingdom average/);
  });
});

describe("units convert at the edge, engine stays metric", () => {
  it("miles to kilometres", () => { expect(toKm(10, "mi")).toBeCloseTo(16.09, 2); });
  it("gallons of propane to kilograms", () => { expect(toLpgKg(1, "gal")).toBeCloseTo(1.93, 2); });
  it("ccf to cubic metres round-trips", () => { expect(fromNgM3(2.832, "ccf")).toBeCloseTo(1, 5); });
});

describe("action savings use the user's own numbers", () => {
  it("two bus days a week", () => { expect(ACTIONS.twoBusDays(base)).toBe(Math.round(30 * 2 * 46 * (0.17474 - 0.10385))); });
  it("one meat-free day a week, from a medium meat-eater", () => { expect(ACTIONS.meatFreeDay(base)).toBe(Math.round((7.04 - 4.16) * 52)); });
  it("nothing to save for a vegetarian", () => { expect(ACTIONS.meatFreeDay({ ...base, diet: "vegetarian" })).toBe(0); });
  it("thrifting two of three new items", () => { expect(ACTIONS.thriftTwoOfThree(base)).toBe(232); });
  it("no commute saving when already on the bus", () => { expect(ACTIONS.twoBusDays({ ...base, mode: "bus" })).toBe(0); });
  it("a heat pump beats a gas boiler on the UK grid", () => { expect(ACTIONS.heatPump(base)).toBe(Math.round(500 * 12 * (0.18296 - gb / 2.8))); });
});
