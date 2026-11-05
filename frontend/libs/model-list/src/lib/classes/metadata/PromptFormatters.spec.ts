import { describe, expect, it } from "vitest";
import { formatAspectRatio, formatDuration, formatResolution } from "./PromptFormatters.js";

describe("formatAspectRatio", () => {
  it("turns API enum values into short labels", () => {
    expect(formatAspectRatio("wide_sixteen_by_nine")).toBe("16:9");
    expect(formatAspectRatio("tall_nine_by_sixteen")).toBe("9:16");
    expect(formatAspectRatio("square_hd")).toBe("Square (HD)");
    expect(formatAspectRatio("auto_4k")).toBe("Auto (4K)");
  });

  it("passes unknown values through unchanged so new API values still display", () => {
    expect(formatAspectRatio("something_new")).toBe("something_new");
    expect(formatAspectRatio("")).toBe("");
  });
});

describe("formatResolution", () => {
  it("turns API enum values into labels", () => {
    expect(formatResolution("half_k")).toBe("0.5K");
    expect(formatResolution("four_k")).toBe("4K");
    expect(formatResolution("ten_eighty_p")).toBe("1080p");
  });

  it("passes unknown values through unchanged", () => {
    expect(formatResolution("eight_k")).toBe("eight_k");
  });
});

describe("formatDuration", () => {
  it("appends an s suffix", () => {
    expect(formatDuration(5)).toBe("5s");
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(2.5)).toBe("2.5s");
  });
});
