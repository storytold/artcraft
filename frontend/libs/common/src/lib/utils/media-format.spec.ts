import { describe, expect, it } from "vitest";
import { formatAspectRatio, formatDuration, formatResolution } from "./media-format";

describe("media-format", () => {
  it("turns aspect ratio ids into display labels", () => {
    expect(formatAspectRatio("wide_sixteen_by_nine")).toBe("16:9");
    expect(formatAspectRatio("tall_nine_by_sixteen")).toBe("9:16");
    expect(formatAspectRatio("square_hd")).toBe("Square (HD)");
  });

  it("returns an unknown aspect ratio id unchanged rather than hiding it", () => {
    expect(formatAspectRatio("some_new_ratio")).toBe("some_new_ratio");
  });

  it("turns resolution ids into display labels", () => {
    expect(formatResolution("one_k")).toBe("1K");
    expect(formatResolution("ten_eighty_p")).toBe("1080p");
    expect(formatResolution("half_k")).toBe("0.5K");
  });

  it("returns an unknown resolution id unchanged", () => {
    expect(formatResolution("eight_k")).toBe("eight_k");
  });

  it("formats durations in seconds", () => {
    expect(formatDuration(5)).toBe("5s");
    expect(formatDuration(0)).toBe("0s");
  });
});
