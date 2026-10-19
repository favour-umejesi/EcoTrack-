import { beforeEach, describe, expect, it } from "vitest";
import { allow, resetRateLimits } from "./ratelimit";

describe("allow", () => {
  beforeEach(resetRateLimits);

  it("lets `limit` hits through and refuses the next one", () => {
    const t = 1_000_000;
    expect(allow("u1", 3, 1000, t)).toBe(true);
    expect(allow("u1", 3, 1000, t + 1)).toBe(true);
    expect(allow("u1", 3, 1000, t + 2)).toBe(true);
    expect(allow("u1", 3, 1000, t + 3)).toBe(false);
  });

  it("forgets hits older than the window", () => {
    const t = 1_000_000;
    for (let k = 0; k < 3; k++) expect(allow("u1", 3, 1000, t + k)).toBe(true);
    expect(allow("u1", 3, 1000, t + 500)).toBe(false);
    expect(allow("u1", 3, 1000, t + 1001)).toBe(true);
  });

  it("keeps members apart", () => {
    const t = 1_000_000;
    for (let k = 0; k < 3; k++) allow("u1", 3, 1000, t);
    expect(allow("u1", 3, 1000, t)).toBe(false);
    expect(allow("u2", 3, 1000, t)).toBe(true);
  });
});
