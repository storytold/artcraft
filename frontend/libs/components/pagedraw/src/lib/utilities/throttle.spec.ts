import { throttleAccepts } from "./throttle";

const INTERVAL = 1000 / 60;

// Feeds events every `stepMs` for `durationMs` on a fake clock (starting, like
// `performance.now()`, well after zero); returns the accepted times.
const burst = (stepMs: number, durationMs: number): number[] => {
  const last = { current: -1 };
  const accepted: number[] = [];
  for (let now = 1000; now <= 1000 + durationMs; now += stepMs) {
    if (throttleAccepts(last, now, INTERVAL)) {
      accepted.push(now);
    }
  }
  return accepted;
};

describe("throttleAccepts", () => {
  it("lets moves through while the pointer keeps moving at twice the throttle rate", () => {
    // Events every 8 ms against a ~16.7 ms throttle: every third gets through (one per 24 ms),
    // where resetting the timer on dropped events let only the first one through.
    const accepted = burst(8, 480);
    expect(accepted.length).toBeGreaterThan(1);
    expect(accepted).toHaveLength(21);
  });

  it("never accepts two events closer than the interval", () => {
    const accepted = burst(3, 500);
    for (let i = 1; i < accepted.length; i++) {
      expect(accepted[i] - accepted[i - 1]).toBeGreaterThanOrEqual(INTERVAL);
    }
  });

  it("accepts every event slower than the interval", () => {
    expect(burst(20, 200)).toHaveLength(11);
  });
});
