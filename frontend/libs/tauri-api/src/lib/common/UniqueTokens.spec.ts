import { describe, expect, it } from "vitest";
import { uniqueTokens } from "./UniqueTokens";

describe("uniqueTokens", () => {
  it("removes duplicates (the backend rejects a batch with repeated tokens)", () => {
    expect(uniqueTokens(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("keeps first-seen order", () => {
    expect(uniqueTokens(["z", "a", "z"])).toEqual(["z", "a"]);
  });

  it("handles an empty list and does not mutate its input", () => {
    expect(uniqueTokens([])).toEqual([]);
    const input = ["a", "a"];
    uniqueTokens(input);
    expect(input).toEqual(["a", "a"]);
  });
});
