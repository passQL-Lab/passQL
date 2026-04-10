import { describe, it, expect } from "vitest";
import { getLevel, buildDayMap, getLast30Days } from "./HeatmapCalendar";

describe("getLevel", () => {
  it("returns 0 for 0 problems", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("returns 1 for exactly 1 problem", () => {
    expect(getLevel(1)).toBe(1);
  });

  it("returns 2 for 2-3 problems", () => {
    expect(getLevel(2)).toBe(2);
    expect(getLevel(3)).toBe(2);
  });

  it("returns 3 for 4-5 problems", () => {
    expect(getLevel(4)).toBe(3);
    expect(getLevel(5)).toBe(3);
  });

  it("returns 4 for 6+ problems", () => {
    expect(getLevel(6)).toBe(4);
    expect(getLevel(10)).toBe(4);
    expect(getLevel(100)).toBe(4);
  });
});

describe("buildDayMap", () => {
  it("returns empty map for empty entries", () => {
    const map = buildDayMap([]);
    expect(map.size).toBe(0);
  });

  it("maps date to solvedCount", () => {
    const map = buildDayMap([
      { date: "2026-04-01", solvedCount: 3, correctCount: 2 },
      { date: "2026-04-02", solvedCount: 5, correctCount: 4 },
    ]);
    expect(map.get("2026-04-01")).toBe(3);
    expect(map.get("2026-04-02")).toBe(5);
  });

  it("returns undefined for missing dates", () => {
    const map = buildDayMap([
      { date: "2026-04-01", solvedCount: 1, correctCount: 1 },
    ]);
    expect(map.get("2026-04-02")).toBeUndefined();
  });
});

describe("getLast30Days", () => {
  it("returns exactly 30 days", () => {
    const days = getLast30Days();
    expect(days).toHaveLength(30);
  });

  it("ends with today", () => {
    const days = getLast30Days();
    const today = new Date().toISOString().slice(0, 10);
    expect(days[29]).toBe(today);
  });

  it("starts 29 days ago", () => {
    const days = getLast30Days();
    const expected = new Date();
    expected.setDate(expected.getDate() - 29);
    expect(days[0]).toBe(expected.toISOString().slice(0, 10));
  });

  it("returns dates in ascending order", () => {
    const days = getLast30Days();
    for (let i = 1; i < days.length; i++) {
      expect(days[i] > days[i - 1]).toBe(true);
    }
  });

  it("returns YYYY-MM-DD format strings", () => {
    const days = getLast30Days();
    for (const day of days) {
      expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
