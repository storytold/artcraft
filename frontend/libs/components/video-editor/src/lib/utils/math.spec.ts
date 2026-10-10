import { evaluateMathExpression } from "./math";

describe("property arithmetic decimal operands", () => {
  it.each([
    [".5 * 100", 50],
    ["2 + .25", 2.25],
    ["(-.5 + 1) * 40", 20],
    [".5 / .25", 2],
  ])("evaluates %s", (input, result) => {
    expect(evaluateMathExpression({ input: String(input) })).toBe(result);
  });

  it.each([".", "1..2", ".5.5", "1 + .", "2 / 0", "1 +", "2 3", "alert(1)"])("rejects malformed expression %s", (input) => {
    expect(evaluateMathExpression({ input: String(input) })).toBeNull();
  });

  it.each([["2 * (3 + 4)", 14], ["-2 + 3", 1], ["0.5 * 100", 50], ["1. + 2", 3]])("preserves %s", (input, result) => {
    expect(evaluateMathExpression({ input: String(input) })).toBe(result);
  });
});
