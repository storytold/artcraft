import { describe, expect, it } from "vitest";
import { derivePendingStatus } from "./pending-status";

describe("derivePendingStatus progress", () => {
  it("is null when no progress is reported", () => {
    expect(derivePendingStatus().progressPercent).toBeNull();
  });

  it("rounds and clamps to 0..100", () => {
    expect(derivePendingStatus(41.6).progressPercent).toBe(42);
    expect(derivePendingStatus(-5).progressPercent).toBe(0);
    expect(derivePendingStatus(250).progressPercent).toBe(100);
    expect(derivePendingStatus(0).progressPercent).toBe(0);
  });
});

describe("derivePendingStatus time label", () => {
  it("says almost done from 95% regardless of the estimate", () => {
    expect(derivePendingStatus(95, 60_000).timeLabel).toBe("Almost done...");
    expect(derivePendingStatus(99).timeLabel).toBe("Almost done...");
    expect(derivePendingStatus(94, 5_000).timeLabel).toBe("~5s");
  });

  it("is null without a positive estimate", () => {
    expect(derivePendingStatus(10).timeLabel).toBeNull();
    expect(derivePendingStatus(10, 0).timeLabel).toBeNull();
    expect(derivePendingStatus(10, -1000).timeLabel).toBeNull();
  });

  it("rounds seconds up", () => {
    expect(derivePendingStatus(10, 1).timeLabel).toBe("~1s");
    expect(derivePendingStatus(10, 1_001).timeLabel).toBe("~2s");
    expect(derivePendingStatus(10, 59_000).timeLabel).toBe("~59s");
  });

  it("switches to minutes at 60 seconds and drops the seconds", () => {
    expect(derivePendingStatus(10, 60_000).timeLabel).toBe("~1m");
    expect(derivePendingStatus(10, 150_000).timeLabel).toBe("~2m");
  });

  it("shows hours, with minutes only when there are some", () => {
    expect(derivePendingStatus(10, 3_600_000).timeLabel).toBe("~1h");
    expect(derivePendingStatus(10, 3_600_000 + 5 * 60_000).timeLabel).toBe("~1h 5m");
    expect(derivePendingStatus(10, 2 * 3_600_000 + 30_000).timeLabel).toBe("~2h");
  });
});
