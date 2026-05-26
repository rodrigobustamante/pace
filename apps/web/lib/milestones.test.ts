import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { daysUntilMilestone, sortMilestones } from "./milestones";

// Pin "today" to a fixed date so tests are deterministic
const TODAY = "2026-05-26";
const FIXED_NOW = new Date(`${TODAY}T00:00:00.000Z`).getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// daysUntilMilestone
// ---------------------------------------------------------------------------
describe("daysUntilMilestone", () => {
  it("returns 0 for today", () => {
    expect(daysUntilMilestone("2026-05-26")).toBe(0);
  });

  it("returns positive days for future dates", () => {
    expect(daysUntilMilestone("2026-05-27")).toBe(1);
    expect(daysUntilMilestone("2026-06-25")).toBe(30);
  });

  it("returns negative days for past dates", () => {
    expect(daysUntilMilestone("2026-05-25")).toBe(-1);
    expect(daysUntilMilestone("2026-04-26")).toBe(-30);
  });
});

// ---------------------------------------------------------------------------
// sortMilestones
// ---------------------------------------------------------------------------
describe("sortMilestones", () => {
  const m = (id: string, isoDate: string) => ({ id, targetDate: isoDate });

  it("places upcoming milestones before past ones", () => {
    const input = [
      m("past", "2026-05-01"),    // 25 days ago
      m("future", "2026-06-01"),  // 6 days ahead
    ];
    const result = sortMilestones(input);
    expect(result.map((x) => x.id)).toEqual(["future", "past"]);
  });

  it("sorts upcoming milestones nearest-first", () => {
    const input = [
      m("far", "2026-08-26"),    // 92 days
      m("near", "2026-05-30"),   // 4 days
      m("mid", "2026-06-26"),    // 31 days
    ];
    const result = sortMilestones(input);
    expect(result.map((x) => x.id)).toEqual(["near", "mid", "far"]);
  });

  it("sorts past milestones most-recent-first (oldest last)", () => {
    const input = [
      m("oldest", "2026-01-01"),  // ~145 days ago
      m("recent", "2026-05-25"), // 1 day ago
      m("month",  "2026-04-26"), // 30 days ago
    ];
    const result = sortMilestones(input);
    expect(result.map((x) => x.id)).toEqual(["recent", "month", "oldest"]);
  });

  it("puts today's milestone first among upcoming", () => {
    const input = [
      m("tomorrow", "2026-05-27"),
      m("today",    "2026-05-26"),
      m("yesterday","2026-05-25"),
    ];
    const result = sortMilestones(input);
    expect(result.map((x) => x.id)).toEqual(["today", "tomorrow", "yesterday"]);
  });

  it("does not mutate the original array", () => {
    const input = [m("b", "2026-06-01"), m("a", "2026-05-27")];
    const original = [...input];
    sortMilestones(input);
    expect(input).toEqual(original);
  });

  it("handles an empty array", () => {
    expect(sortMilestones([])).toEqual([]);
  });

  it("handles a single milestone", () => {
    const input = [m("only", "2026-07-01")];
    expect(sortMilestones(input)).toEqual(input);
  });

  it("handles mixed upcoming and past milestones in full order", () => {
    const input = [
      m("past-old",    "2026-03-01"), // ~86 days ago
      m("upcoming-2",  "2026-06-25"), // 30 days
      m("past-recent", "2026-05-20"), // 6 days ago
      m("upcoming-1",  "2026-05-28"), // 2 days
    ];
    const result = sortMilestones(input);
    expect(result.map((x) => x.id)).toEqual([
      "upcoming-1",
      "upcoming-2",
      "past-recent",
      "past-old",
    ]);
  });
});
