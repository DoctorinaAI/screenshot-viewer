import { describe, expect, it } from "vitest";
import { formatFullDateTime, formatRelativeTime } from "./relative-time";

const NOW = new Date("2026-05-29T12:00:00Z");
const at = (iso: string) => new Date(iso);

describe("formatRelativeTime — past", () => {
  it("< 60s → seconds", () => {
    expect(formatRelativeTime(at("2026-05-29T11:59:30Z"), NOW)).toMatch(/30 seconds ago/);
  });

  it("< 60min → minutes", () => {
    expect(formatRelativeTime(at("2026-05-29T11:55:00Z"), NOW)).toMatch(/5 minutes ago/);
  });

  it("same day, hours → hours", () => {
    expect(formatRelativeTime(at("2026-05-29T10:00:00Z"), NOW)).toMatch(/2 hours ago/);
  });

  it("previous day → yesterday", () => {
    expect(formatRelativeTime(at("2026-05-28T10:00:00Z"), NOW)).toMatch(/yesterday/i);
  });

  it("< 7 days → weekday", () => {
    // 2026-05-25 was a Monday
    expect(formatRelativeTime(at("2026-05-25T10:00:00Z"), NOW)).toBe("Monday");
  });

  it("this year, older → day + month", () => {
    expect(formatRelativeTime(at("2026-01-15T10:00:00Z"), NOW)).toBe("15 January");
  });

  it("previous year → day + short month + year", () => {
    expect(formatRelativeTime(at("2024-10-12T10:00:00Z"), NOW)).toBe("12 Oct 2024");
  });
});

describe("formatRelativeTime — future", () => {
  it("< 60s → in seconds", () => {
    expect(formatRelativeTime(at("2026-05-29T12:00:30Z"), NOW)).toMatch(/in 30 seconds/);
  });

  it("same day → in N hours", () => {
    expect(formatRelativeTime(at("2026-05-29T14:00:00Z"), NOW)).toMatch(/in 2 hours/);
  });

  it("next day → tomorrow", () => {
    expect(formatRelativeTime(at("2026-05-30T10:00:00Z"), NOW)).toMatch(/tomorrow/i);
  });
});

describe("formatFullDateTime", () => {
  it("formats day-month-year-time", () => {
    expect(formatFullDateTime(at("2026-05-29T12:30:00Z"))).toMatch(/29 May 2026/);
  });
});
