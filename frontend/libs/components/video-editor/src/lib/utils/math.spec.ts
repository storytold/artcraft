import { describe, expect, it } from "vitest";
import {
  clamp,
  clampRound,
  evaluateMathExpression,
  formatNumberForDisplay,
  getFractionDigitsForStep,
  isNearlyEqual,
  snapToStep,
} from "./math";

describe("clamp / clampRound", () => {
  it("keeps a value inside [min, max]", () => {
    expect(clamp({ value: 5, min: 0, max: 10 })).toBe(5);
    expect(clamp({ value: -3, min: 0, max: 10 })).toBe(0);
    expect(clamp({ value: 42, min: 0, max: 10 })).toBe(10);
  });

  it("clampRound clamps first, then rounds", () => {
    expect(clampRound({ value: 4.6, min: 0, max: 10 })).toBe(5);
    expect(clampRound({ value: 10.4, min: 0, max: 10 })).toBe(10);
  });
});

describe("getFractionDigitsForStep", () => {
  it("counts decimal places", () => {
    expect(getFractionDigitsForStep({ step: 1 })).toBe(0);
    expect(getFractionDigitsForStep({ step: 0.25 })).toBe(2);
  });

  it("understands exponent notation", () => {
    expect(getFractionDigitsForStep({ step: 1e-7 })).toBe(7);
  });
});

describe("snapToStep", () => {
  it("snaps to the nearest step without float noise", () => {
    expect(snapToStep({ value: 0.34, step: 0.1 })).toBe(0.3);
    expect(snapToStep({ value: 7, step: 5 })).toBe(5);
    expect(snapToStep({ value: 8, step: 5 })).toBe(10);
  });

  it("returns the value unchanged for a zero or negative step", () => {
    expect(snapToStep({ value: 3.3, step: 0 })).toBe(3.3);
    expect(snapToStep({ value: 3.3, step: -1 })).toBe(3.3);
  });
});

describe("isNearlyEqual", () => {
  it("uses a default epsilon of 0.0001", () => {
    expect(isNearlyEqual({ leftValue: 1, rightValue: 1.00005 })).toBe(true);
    expect(isNearlyEqual({ leftValue: 1, rightValue: 1.001 })).toBe(false);
  });

  it("accepts a custom epsilon", () => {
    expect(isNearlyEqual({ leftValue: 1, rightValue: 1.4, epsilon: 0.5 })).toBe(true);
  });
});

describe("formatNumberForDisplay", () => {
  it("trims trailing zeros", () => {
    expect(formatNumberForDisplay({ value: 1.5 })).toBe("1.5");
    expect(formatNumberForDisplay({ value: 2 })).toBe("2");
  });

  it("keeps a fixed number of digits when asked", () => {
    expect(formatNumberForDisplay({ value: 1.5, fractionDigits: 3 })).toBe("1.500");
  });

  it("never prints negative zero", () => {
    expect(formatNumberForDisplay({ value: -0.0000001, maxFractionDigits: 2 })).toBe("0");
    expect(formatNumberForDisplay({ value: -0.4, fractionDigits: 0 })).toBe("0");
  });

  it("respects the minimum fraction digits", () => {
    expect(formatNumberForDisplay({ value: 3, minFractionDigits: 2 })).toBe("3.00");
  });
});

describe("evaluateMathExpression", () => {
  const evaluate = (input: string) => evaluateMathExpression({ input });

  it("does basic arithmetic with the right precedence", () => {
    expect(evaluate("1 + 2 * 3")).toBe(7);
    expect(evaluate("(1 + 2) * 3")).toBe(9);
    expect(evaluate("10 / 4")).toBe(2.5);
    expect(evaluate("10 - 3 - 2")).toBe(5);
  });

  it("supports unary minus and decimals", () => {
    expect(evaluate("-5 + 2")).toBe(-3);
    expect(evaluate("2 * -3")).toBe(-6);
    expect(evaluate("0.5 + 0.25")).toBe(0.75);
  });

  it("returns null for division by zero", () => {
    expect(evaluate("1 / 0")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(evaluate("")).toBeNull();
    expect(evaluate("1 +")).toBeNull();
    expect(evaluate("(1 + 2")).toBeNull();
    expect(evaluate("1 2")).toBeNull();
    expect(evaluate("1.2.3")).toBeNull();
  });

  it("rejects anything that is not arithmetic, so it can never run code", () => {
    expect(evaluate("alert(1)")).toBeNull();
    expect(evaluate("2 ** 3")).toBeNull();
    expect(evaluate("1; 2")).toBeNull();
  });
});
