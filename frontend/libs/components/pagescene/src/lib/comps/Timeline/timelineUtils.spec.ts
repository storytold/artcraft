import { describe, expect, it } from "vitest";
import {
  formatTimecode,
  formatTimecodeFrames,
  fractionToTime,
  quantizeToFrame,
  timeToFraction,
} from "./timelineUtils";

describe("formatTimecode", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTimecode(0)).toBe("0:00");
    expect(formatTimecode(10)).toBe("0:10");
    expect(formatTimecode(65)).toBe("1:05");
    expect(formatTimecode(600)).toBe("10:00");
  });

  it("drops fractions and clamps negatives to zero", () => {
    expect(formatTimecode(59.9)).toBe("0:59");
    expect(formatTimecode(-5)).toBe("0:00");
  });
});

describe("formatTimecodeFrames", () => {
  it("appends a zero-padded frame count", () => {
    expect(formatTimecodeFrames(0, 30)).toBe("0:00:00");
    expect(formatTimecodeFrames(3 + 20 / 30, 30)).toBe("0:03:20");
    expect(formatTimecodeFrames(1 / 24, 24)).toBe("0:00:01");
  });

  it("rolls frames over into seconds", () => {
    expect(formatTimecodeFrames(1, 30)).toBe("0:01:00");
    expect(formatTimecodeFrames(59 / 30, 30)).toBe("0:01:29");
  });

  it("clamps negative times to zero", () => {
    expect(formatTimecodeFrames(-2, 30)).toBe("0:00:00");
  });
});

describe("quantizeToFrame", () => {
  it("snaps to the nearest frame boundary", () => {
    expect(quantizeToFrame(0.51, 10)).toBeCloseTo(0.5);
    expect(quantizeToFrame(0.56, 10)).toBeCloseTo(0.6);
    expect(quantizeToFrame(1, 30)).toBe(1);
  });
});

describe("timeToFraction / fractionToTime", () => {
  it("maps time into 0..1 and clamps", () => {
    expect(timeToFraction(5, 10)).toBe(0.5);
    expect(timeToFraction(-1, 10)).toBe(0);
    expect(timeToFraction(20, 10)).toBe(1);
  });

  it("returns 0 for a zero or negative duration (no divide by zero)", () => {
    expect(timeToFraction(5, 0)).toBe(0);
    expect(timeToFraction(5, -3)).toBe(0);
  });

  it("maps a fraction back to time and clamps", () => {
    expect(fractionToTime(0.25, 8)).toBe(2);
    expect(fractionToTime(-1, 8)).toBe(0);
    expect(fractionToTime(2, 8)).toBe(8);
  });
});
