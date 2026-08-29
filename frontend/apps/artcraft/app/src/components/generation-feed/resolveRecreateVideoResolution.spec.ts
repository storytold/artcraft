import { resolveRecreateVideoResolution } from "./resolveRecreateVideoResolution.js";

describe("resolveRecreateVideoResolution", () => {
  it.each([
    "half_k",
    "four_eighty_p",
    "seven_twenty_p",
    "one_k",
    "ten_eighty_p",
    "two_k",
    "three_k",
    "four_k",
  ])("preserves the exact canonical value %s", (resolution) => {
    expect(
      resolveRecreateVideoResolution(resolution, ["1080p", resolution]),
    ).toBe(resolution);
  });

  it.each([
    ["four_eighty_p", "480p"],
    ["seven_twenty_p", "720p"],
    ["ten_eighty_p", "1080p"],
  ])("maps %s only to its matching display label", (canonical, label) => {
    expect(resolveRecreateVideoResolution(canonical, [label])).toBe(label);
  });

  it("keeps K-based values canonical and never conflates 1K with 1080p", () => {
    expect(resolveRecreateVideoResolution("one_k", ["1K"])).toBeNull();
    expect(resolveRecreateVideoResolution("two_k", ["2k"])).toBeNull();
    expect(resolveRecreateVideoResolution("one_k", ["1080p"])).toBeNull();
    expect(resolveRecreateVideoResolution("ten_eighty_p", ["1K"])).toBeNull();
  });

  it("fails closed for missing, unknown, or unsupported values", () => {
    expect(resolveRecreateVideoResolution(null, ["720p"])).toBeNull();
    expect(resolveRecreateVideoResolution("one_k", [])).toBeNull();
    expect(resolveRecreateVideoResolution("future_resolution", ["4K"]))
      .toBeNull();
  });
});
