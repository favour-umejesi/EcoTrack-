import { describe, expect, it } from "vitest";
import { ACTIONS, compareToAverage, compute, resolveAverage, resolveGrid, type Inputs } from "./engine";
import { fromNgM3, toKm, toLpgKg } from "./units";

const base: Inputs = {
  country: "gb", mode: "car", fuel: "petrol", commuteKm: 30, electricityKwh: 260, gasQty: 12, gasType: "lpg",
  meatMeals: 5, flights: 2, flightClass: "short", clothingItems: 3, secondhandItems: 1, distanceUnit: "mi", gasUnit: "kg",
};
const zero: Inputs = { ...base, commuteKm: 0, electricityKwh: 0, gasQty: 0, meatMeals: 0, flights: 0, clothingItems: 0, secondhandItems: 0 };

describe("engine golden values (illustrative factor set)", () => {
  it("zero in, zero out", () => {
    const r = compute(zero);
    expect(r.totalKg).toBe(0);
    r.lines.forEach((l) => expect(l.kg).toBe(0));
  });
  it("matches hand-computed lines for the sample profile", () => {
    const r = compute(base);
    const kg = Object.fromEntries(r.lines.map((l) => [l.key, l.kg]));
    expect(kg.commute).toBe(1173);      // 30 km × 230 days × 0.17
    expect(kg.electricity).toBe(624);   // 260 × 12 × 0.20 (UK grid)
    expect(kg.gas).toBe(423);           // 12 kg × 12 × 2.94
    expect(kg.food).toBe(910);          // 5 × 52 × 3.5
    expect(kg.flights).toBe(360);       // 2 × 900 km × 0.20 (under 3 hours)
    expect(kg.clothing).toBe(366);      // 2 new × 12 × 15 + 1 second-hand × 12 × 0.5
    expect(r.totalKg).toBe(3856);
    expect(r.biggest.key).toBe("commute");
  });
  it("is monotonic: more of an activity never lowers the total", () => {
    const more = compute({ ...base, commuteKm: 60 }).totalKg;
    expect(more).toBeGreaterThan(compute(base).totalKg);
    expect(compute({ ...base, secondhandItems: 3 }).totalKg).toBeLessThan(compute(base).totalKg);
  });
  it("a long flight costs far more than a short hop, and the class is about length not borders", () => {
    const short = compute({ ...zero, flights: 1, flightClass: "short" }).totalKg;
    const long = compute({ ...zero, flights: 1, flightClass: "long" }).totalKg;
    expect(long).toBeGreaterThan(short * 5);
  });
  it("bike and walk cost nothing to commute", () => {
    expect(compute({ ...base, mode: "bike" }).lines.find((l) => l.key === "commute")?.kg).toBe(0);
  });
});

describe("location resolution: country, then continent, then world", () => {
  it("uses the country figure when it exists", () => {
    expect(resolveGrid("gb")).toMatchObject({ value: 0.2, level: "country" });
  });
  it("falls back to the continent for a country without a figure", () => {
    expect(resolveGrid("et")).toMatchObject({ level: "continent", label: "Africa average" });
    expect(resolveAverage("et")).toMatchObject({ level: "continent" });
    expect(compareToAverage(1000, "et").text).toContain("no country figure yet");
  });
  it("falls back to the world for an unknown code", () => {
    expect(resolveGrid("zz").level).toBe("world");
  });
  it("a Kenyan and a South African kilowatt-hour are not the same", () => {
    const ke = compute({ ...base, country: "ke" }).lines.find((l) => l.key === "electricity")!.kg;
    const za = compute({ ...base, country: "za" }).lines.find((l) => l.key === "electricity")!.kg;
    expect(za).toBeGreaterThan(ke * 5);
  });
});

describe("units convert at the edge, engine stays metric", () => {
  it("miles to kilometres", () => { expect(toKm(10, "mi")).toBeCloseTo(16.09, 2); });
  it("gallons of propane to kilograms", () => { expect(toLpgKg(1, "gal")).toBeCloseTo(1.93, 2); });
  it("ccf to cubic metres round-trips", () => { expect(fromNgM3(2.832, "ccf")).toBeCloseTo(1, 5); });
});

describe("action savings use the user's own numbers", () => {
  it("two bus days a week", () => { expect(ACTIONS.twoBusDays(base)).toBe(193); }); // 30 × 230 × 0.4 × (0.17 − 0.10)
  it("thrifting two of three new items", () => { expect(ACTIONS.thriftTwoOfThree(base)).toBe(232); }); // 2 × 12 × 2/3 × 14.5
  it("no commute saving when already on the bus", () => { expect(ACTIONS.twoBusDays({ ...base, mode: "bus" })).toBe(0); });
});
