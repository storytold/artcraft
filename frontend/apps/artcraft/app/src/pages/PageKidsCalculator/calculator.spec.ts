import { describe, expect, it } from "vitest";
import {
  calculatorReducer,
  initialCalculatorState,
  type CalculatorAction,
} from "./calculator";

describe("calculatorReducer", () => {
  it("adds numbers and repeats the last operation when equals is pressed again", () => {
    const result = press([
      "7",
      { type: "operator", operator: "+" },
      "5",
      { type: "equals" },
    ]);
    expect(result.display).toBe("12");
    expect(result.expression).toBe("7 + 5 =");
    expect(calculatorReducer(result, { type: "equals" }).display).toBe("17");
  });

  it("chains operations from left to right", () => {
    const result = press([
      "8",
      { type: "operator", operator: "+" },
      "4",
      { type: "operator", operator: "×" },
      "2",
      { type: "equals" },
    ]);
    expect(result.display).toBe("24");
  });

  it("subtracts and divides, including negative results", () => {
    const difference = press([
      "8",
      { type: "operator", operator: "-" },
      "9",
      { type: "equals" },
    ]);
    const quotient = press([
      "2",
      "0",
      { type: "operator", operator: "÷" },
      "4",
      { type: "equals" },
    ]);
    expect(difference.display).toBe("-1");
    expect(quotient.display).toBe("5");
  });

  it("supports decimals, sign changes, percentages, and backspace", () => {
    const result = press([
      "1",
      { type: "decimal" },
      "2",
      { type: "sign" },
      { type: "backspace" },
    ]);
    expect(result.display).toBe("-1.");
    expect(calculatorReducer(result, { type: "percent" }).display).toBe("-0.01");
  });

  it("shows a friendly message for division by zero and recovers on clear", () => {
    const result = press([
      "9",
      { type: "operator", operator: "÷" },
      "0",
      { type: "equals" },
    ]);
    expect(result.message).toBe("Oops! We can't divide by zero.");
    expect(calculatorReducer(result, { type: "clear" })).toEqual(
      initialCalculatorState,
    );
  });

  it("starts a fresh number after a result and ignores repeated decimal keys", () => {
    const result = press([
      "2",
      { type: "operator", operator: "+" },
      "3",
      { type: "equals" },
      "4",
      { type: "decimal" },
      { type: "decimal" },
      "5",
    ]);
    expect(result.display).toBe("4.5");
  });

  it("limits the number of entered digits and explains the limit", () => {
    const result = press([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "1",
      "2",
      "3",
    ]);
    expect(result.display).toBe("123456789012");
    expect(result.message).toBe("That's a big number! Try up to 12 digits.");
  });
});

function press(actions: Array<string | CalculatorAction>) {
  return actions.reduce(
    (state, action) =>
      calculatorReducer(
        state,
        typeof action === "string"
          ? { type: "digit", digit: action }
          : action,
      ),
    initialCalculatorState,
  );
}
