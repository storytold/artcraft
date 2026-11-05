import { describe, expect, it } from "vitest";
import { GradientParser, parseGradient } from "./parser";

// Spec for the hand-written CSS gradient parser that the canvas painter uses when exporting a background.
// Each test feeds one CSS string and checks the syntax tree that comes back, or the error for a malformed string.

const parse = (code: string) => parseGradient({ code });

describe("linear gradients", () => {
  it("parses an angle and two named colours", () => {
    const [gradient] = parse("linear-gradient(45deg, red, blue)");
    expect(gradient.type).toBe("linear-gradient");
    expect(gradient.orientation).toEqual({ type: "angular", value: "45" });
    expect(gradient.colorStops.map((stop) => stop.value)).toEqual(["red", "blue"]);
  });

  it("has no orientation when the first argument is a colour", () => {
    const [gradient] = parse("linear-gradient(red, blue)");
    expect(gradient.orientation).toBeUndefined();
  });

  it("parses a side or corner", () => {
    expect(parse("linear-gradient(to right, red, blue)")[0].orientation).toEqual({ type: "directional", value: "right" });
    expect(parse("linear-gradient(to top left, red, blue)")[0].orientation).toEqual({ type: "directional", value: "top left" });
  });

  it("parses a negative angle and radians", () => {
    expect(parse("linear-gradient(-45deg, red, blue)")[0].orientation).toEqual({ type: "angular", value: "-45" });
    expect(parse("linear-gradient(1.5rad, red, blue)")[0].orientation).toEqual({ type: "angular", value: "1.5" });
  });

  it("parses repeating gradients and vendor prefixes", () => {
    expect(parse("repeating-linear-gradient(red, blue)")[0].type).toBe("repeating-linear-gradient");
    expect(parse("-webkit-linear-gradient(red, blue)")[0].type).toBe("linear-gradient");
  });

  it("is case insensitive for the function name", () => {
    expect(parse("LINEAR-GRADIENT(red, blue)")[0].type).toBe("linear-gradient");
  });
});

describe("colour stops", () => {
  it("parses percentage, pixel and em lengths", () => {
    const [gradient] = parse("linear-gradient(red 0%, green 10.5px, blue 2em)");
    expect(gradient.colorStops.map((stop) => stop.length)).toEqual([
      { type: "%", value: "0" },
      { type: "px", value: "10.5" },
      { type: "em", value: "2" },
    ]);
  });

  it("parses hex, rgb, rgba, hsl, hsla and var colours", () => {
    const [gradient] = parse(
      "linear-gradient(#ff0000, rgb(1, 2, 3), rgba(1, 2, 3, 0.5), hsl(120, 50%, 40%), hsla(120, 50%, 40%, .5), var(--brand))",
    );
    expect(gradient.colorStops.map((stop) => ({ type: stop.type, value: stop.value }))).toEqual([
      { type: "hex", value: "ff0000" },
      { type: "rgb", value: ["1", "2", "3"] },
      { type: "rgba", value: ["1", "2", "3", "0.5"] },
      { type: "hsl", value: ["120", "50", "40"] },
      { type: "hsla", value: ["120", "50", "40", ".5"] },
      { type: "var", value: "--brand" },
    ]);
  });

  it("keeps a calc() length as its raw text", () => {
    const [gradient] = parse("linear-gradient(red calc(10% + (2px * 3)), blue)");
    expect(gradient.colorStops[0].length).toEqual({ type: "calc", value: "10% + (2px * 3)" });
  });

  it("accepts whitespace and newlines between tokens", () => {
    const [gradient] = parse("linear-gradient(\n  90deg,\n  red 0%,\n  blue 100%\n)");
    expect(gradient.colorStops).toHaveLength(2);
  });
});

describe("radial gradients", () => {
  it("parses a circle with an extent keyword and position", () => {
    const [gradient] = parse("radial-gradient(circle closest-side at 10% 20%, red, blue)");
    expect(gradient.type).toBe("radial-gradient");
    expect(gradient.orientation).toEqual([
      {
        type: "shape",
        value: "circle",
        style: { type: "extent-keyword", value: "closest-side" },
        at: { type: "position", value: { x: { type: "%", value: "10" }, y: { type: "%", value: "20" } } },
      },
    ]);
  });

  it("parses a bare position as the default radial shape", () => {
    const [gradient] = parse("radial-gradient(at center, red, blue)");
    expect(gradient.orientation).toEqual([
      { type: "default-radial", at: { type: "position", value: { x: { type: "position-keyword", value: "center" }, y: undefined } } },
    ]);
  });

  it("has no orientation when the first argument is a colour", () => {
    expect(parse("radial-gradient(red, blue)")[0].orientation).toBeUndefined();
  });
});

describe("whole input", () => {
  it("parses a comma separated list of gradients", () => {
    const list = parse("linear-gradient(red, blue), radial-gradient(green, black)");
    expect(list.map((gradient) => gradient.type)).toEqual(["linear-gradient", "radial-gradient"]);
  });

  it("ignores surrounding whitespace and one trailing semicolon", () => {
    expect(parse("  linear-gradient(red, blue);  ")).toHaveLength(1);
  });

  it("is exposed as GradientParser.parse too", () => {
    expect(GradientParser.parse({ code: "linear-gradient(red, blue)" })).toHaveLength(1);
  });

  it("can parse again after an earlier parse failed part way", () => {
    expect(() => parse("linear-gradient(red,")).toThrow();
    expect(parse("linear-gradient(red, blue)")).toHaveLength(1);
  });
});

describe("malformed input", () => {
  it.each([
    ["linear-gradient red, blue)", "Missing ("],
    ["linear-gradient(red, blue", "Missing )"],
    ["linear-gradient(red,, blue)", "Expected color definition"],
    ["linear-gradient(red, )", "Expected color definition"],
    ["linear-gradient(45deg red, blue)", "Missing comma before color stops"],
    ["linear-gradient(red, blue) junk", "Invalid input not EOF"],
    ["linear-gradient(hsl(50%, 10%, 10%), blue)", "not a percentage"],
    ["linear-gradient(hsl(120, 50, 40), blue)", "Expected percentage value"],
    ["linear-gradient(red calc(1px", "Missing closing parenthesis in calc()"],
    ["linear-gradient(red calc(1px, blue)", "Missing )"],
    ["radial-gradient(at , red)", "Missing positioning value"],
  ])("rejects %s", (code, message) => {
    expect(() => parse(code)).toThrow(message);
  });
});
