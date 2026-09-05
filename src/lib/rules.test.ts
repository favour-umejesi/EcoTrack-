import { describe, expect, it } from "vitest";
import { changes, monthlyTotals, streak, weekStart, type WeekLog } from "./rules";

const log = (weekStart: string, annualKg: number, lines: [string, number][] = []): WeekLog => ({ weekStart, annualKg, lines: lines.map(([key, kg]) => ({ key, label: key, kg })) });
const sat = new Date("2026-09-05T15:00:00Z"); // a Saturday; its week starts Monday 2026-08-31

describe("weekStart", () => {
  it("returns the Monday of the UTC week", () => {
    expect(weekStart(sat)).toBe("2026-08-31");
    expect(weekStart(new Date("2026-08-31T00:00:00Z"))).toBe("2026-08-31");
    expect(weekStart(new Date("2026-09-06T23:59:59Z"))).toBe("2026-08-31");
    expect(weekStart(new Date("2026-09-07T00:00:00Z"))).toBe("2026-09-07");
  });
});

describe("monthlyTotals", () => {
  it("averages the weeks in a month and divides the annual pace by twelve", () => {
    const m = monthlyTotals([log("2026-08-03", 3600, [["food", 1200]]), log("2026-08-10", 4800, [["food", 2400]]), log("2026-09-07", 2400)]);
    expect(m.map((x) => [x.key, x.kg, x.weeks])).toEqual([["2026-08", 350, 2], ["2026-09", 200, 1]]);
    expect(m[0].byCategory.food.kg).toBe(150);
    expect(m[0].month).toBe("Aug");
  });
});

describe("changes", () => {
  it("compares the last two months per category, biggest movers first, down is good", () => {
    const m = monthlyTotals([
      log("2026-07-06", 0, [["electricity", 1200], ["commute", 1200], ["food", 600]]),
      log("2026-08-03", 0, [["electricity", 600], ["commute", 1200], ["food", 660]]),
    ]);
    expect(changes(m)).toEqual([
      { key: "electricity", name: "electricity", deltaPct: -50, good: true },
      { key: "food", name: "food", deltaPct: 10, good: false },
    ]);
  });
  it("needs two months", () => expect(changes(monthlyTotals([log("2026-08-03", 100)]))).toEqual([]));
});

describe("streak", () => {
  it("is zero with nothing logged, and this week shows as now", () => {
    expect(streak([], sat)).toEqual({ weeks: 0, graceLeft: true, pattern: ["miss", "miss", "miss", "miss", "miss", "miss", "miss", "now"] });
  });
  it("counts consecutive weeks back from this week", () => {
    expect(streak(["2026-08-31", "2026-08-24", "2026-08-17"], sat).weeks).toBe(3);
  });
  it("does not break when this week is not logged yet", () => {
    const s = streak(["2026-08-24", "2026-08-17"], sat);
    expect(s.weeks).toBe(2);
    expect(s.pattern.slice(-3)).toEqual(["done", "done", "now"]);
  });
  it("forgives one missed week a month when the streak continues beyond it", () => {
    const s = streak(["2026-08-31", "2026-08-17", "2026-08-10"], sat);
    expect(s.weeks).toBe(3);
    expect(s.pattern.slice(-4)).toEqual(["done", "done", "grace", "done"]); // 10 Aug, 17 Aug, (24 Aug skipped), 31 Aug
    expect(s.graceLeft).toBe(false); // the grace was spent on the week of 24 Aug, and this week (31 Aug) is still August
  });
  it("charges the grace to the month the skipped week is in", () => {
    const s = streak(["2026-09-07", "2026-08-24"], new Date("2026-09-12T12:00:00Z"));
    expect(s.weeks).toBe(2);
    expect(s.pattern.slice(-3)).toEqual(["done", "grace", "done"]);
    expect(s.graceLeft).toBe(true); // the skipped week of 31 Aug spent August's grace; September's is untouched
    expect(streak(["2026-09-14", "2026-08-31"], new Date("2026-09-19T12:00:00Z")).graceLeft).toBe(false); // gap week of 7 Sep spends September's
  });
  it("breaks on a second miss in the same month or a two-week gap", () => {
    expect(streak(["2026-08-31", "2026-08-17", "2026-08-03"], sat).weeks).toBe(2);
    expect(streak(["2026-08-31", "2026-08-10"], sat).weeks).toBe(1);
  });
  it("does not spend grace on a gap with nothing beyond it", () => {
    const s = streak(["2026-08-31"], sat);
    expect(s.weeks).toBe(1);
    expect(s.pattern.slice(-2)).toEqual(["miss", "done"]);
  });
});
