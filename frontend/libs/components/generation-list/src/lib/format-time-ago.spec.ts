import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatTimeAgo } from "./format-time-ago";

// Freeze "now" so every case is deterministic; each case is expressed as "N seconds before now".
const NOW = new Date("2026-01-01T12:00:00Z").getTime();
const ago = (seconds: number) => new Date(NOW - seconds * 1000);

describe("formatTimeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("says 'just now' for the last 45 seconds", () => {
    expect(formatTimeAgo(ago(0))).toBe("just now");
    expect(formatTimeAgo(ago(44))).toBe("just now");
  });

  it("treats future dates and invalid input as 'just now' instead of throwing", () => {
    expect(formatTimeAgo(new Date(NOW + 60_000))).toBe("just now");
    expect(formatTimeAgo("not a date")).toBe("just now");
  });

  it("uses singular and plural units correctly", () => {
    expect(formatTimeAgo(ago(60))).toBe("1 minute ago");
    expect(formatTimeAgo(ago(5 * 60))).toBe("5 minutes ago");
    expect(formatTimeAgo(ago(3600))).toBe("1 hour ago");
    expect(formatTimeAgo(ago(3 * 3600))).toBe("3 hours ago");
    expect(formatTimeAgo(ago(86400))).toBe("1 day ago");
    expect(formatTimeAgo(ago(2 * 86400))).toBe("2 days ago");
  });

  it("moves up through weeks, months and years", () => {
    expect(formatTimeAgo(ago(7 * 86400))).toBe("1 week ago");
    expect(formatTimeAgo(ago(30 * 86400))).toBe("1 month ago");
    expect(formatTimeAgo(ago(90 * 86400))).toBe("3 months ago");
    expect(formatTimeAgo(ago(365 * 86400))).toBe("1 year ago");
    expect(formatTimeAgo(ago(3 * 365 * 86400))).toBe("3 years ago");
  });

  it("accepts ISO strings, epoch milliseconds and Date objects alike", () => {
    const iso = ago(5 * 60).toISOString();
    expect(formatTimeAgo(iso)).toBe("5 minutes ago");
    expect(formatTimeAgo(NOW - 5 * 60 * 1000)).toBe("5 minutes ago");
    expect(formatTimeAgo(ago(5 * 60))).toBe("5 minutes ago");
  });
});
