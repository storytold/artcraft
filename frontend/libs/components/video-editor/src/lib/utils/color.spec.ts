import { describe, expect, it } from "vitest";
import { parseColorInput } from "./color";

describe("parseColorInput hex", () => {
  it("accepts the valid CSS hex lengths 3, 4, 6 and 8", () => {
    for (const hex of ["fff", "abcd", "ff8800", "ff880080"]) {
      expect(parseColorInput({ input: hex, format: "hex" })).toBe(hex);
    }
  });

  it("rejects 5 and 7 digit input, which is not a colour", () => {
    expect(parseColorInput({ input: "12345", format: "hex" })).toBeNull();
    expect(parseColorInput({ input: "1234567", format: "hex" })).toBeNull();
  });

  it("rejects too short and too long input", () => {
    expect(parseColorInput({ input: "ff", format: "hex" })).toBeNull();
    expect(parseColorInput({ input: "123456789", format: "hex" })).toBeNull();
  });
});
