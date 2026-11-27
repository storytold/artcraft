// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildImageModelsFromListing } from "../loader/buildModelsFromListing.js";
import {
  autoAspectRatio,
  matchSourceAspectRatio,
} from "./matchSourceAspectRatio.js";
import { CommonAspectRatio as Ratio } from "./properties/CommonAspectRatio.js";

// Same lists the API serves for these models.
const NANO_BANANA_PRO = [
  Ratio.Auto,
  Ratio.Square,
  Ratio.WideFiveByFour,
  Ratio.WideFourByThree,
  Ratio.WideThreeByTwo,
  Ratio.WideSixteenByNine,
  Ratio.WideTwentyOneByNine,
  Ratio.TallFourByFive,
  Ratio.TallThreeByFour,
  Ratio.TallTwoByThree,
  Ratio.TallNineBySixteen,
];
const SEEDREAM_4 = [
  Ratio.Auto2k,
  Ratio.Auto4k,
  Ratio.Square,
  Ratio.SquareHd,
  Ratio.WideFourByThree,
  Ratio.WideSixteenByNine,
  Ratio.TallThreeByFour,
  Ratio.TallNineBySixteen,
];
const FLUX_PRO_1P1 = [
  Ratio.Square,
  Ratio.WideFourByThree,
  Ratio.WideSixteenByNine,
  Ratio.TallThreeByFour,
  Ratio.TallNineBySixteen,
];
const GPT_IMAGE_1P5 = [Ratio.Square, Ratio.Wide, Ratio.Tall];

describe("matchSourceAspectRatio", () => {
  describe("models with an auto option", () => {
    it.each([
      ["square", 1024, 1024],
      ["landscape", 1920, 1080],
      ["portrait", 1080, 1920],
      ["an unlisted shape", 2400, 1000],
    ])("asks for auto with a %s source", (_name, width, height) => {
      expect(matchSourceAspectRatio(model(NANO_BANANA_PRO), width, height)).toBe(
        Ratio.Auto,
      );
    });

    it("asks for auto when the source size is unknown", () => {
      expect(matchSourceAspectRatio(model(NANO_BANANA_PRO), 0, 0)).toBe(Ratio.Auto);
    });

    it("prefers plain auto over the auto variants that pick a resolution", () => {
      const options = [Ratio.Auto4k, Ratio.Auto2k, Ratio.Auto, Ratio.Square];
      expect(matchSourceAspectRatio(model(options), 1920, 1080)).toBe(Ratio.Auto);
    });

    it.each([
      [SEEDREAM_4, Ratio.Auto2k],
      [[Ratio.Auto4k, Ratio.Square], Ratio.Auto4k],
      [[Ratio.Square, Ratio.Auto3k, Ratio.Auto4k], Ratio.Auto3k],
    ])("falls back to the auto variant a model lists (%#)", (options, expected) => {
      expect(matchSourceAspectRatio(model(options), 1920, 1080)).toBe(expected);
    });
  });

  describe("models without an auto option", () => {
    it.each([
      // [options, width, height, expected]
      [FLUX_PRO_1P1, 1024, 1024, Ratio.Square],
      [FLUX_PRO_1P1, 1200, 900, Ratio.WideFourByThree],
      [FLUX_PRO_1P1, 900, 1200, Ratio.TallThreeByFour],
      [FLUX_PRO_1P1, 1920, 1080, Ratio.WideSixteenByNine],
      [FLUX_PRO_1P1, 1080, 1920, Ratio.TallNineBySixteen],
      // 3:2 sits between 4:3 and 16:9; 4:3 is nearer
      [FLUX_PRO_1P1, 3000, 2000, Ratio.WideFourByThree],
      [FLUX_PRO_1P1, 2000, 3000, Ratio.TallThreeByFour],
      // beyond the widest and tallest options
      [FLUX_PRO_1P1, 4000, 1000, Ratio.WideSixteenByNine],
      [FLUX_PRO_1P1, 1000, 4000, Ratio.TallNineBySixteen],
      // not quite square
      [FLUX_PRO_1P1, 1000, 1040, Ratio.Square],
      // shapes are compared as ratios, not differences: 1.16 is nearer 4:3 than 1:1
      [FLUX_PRO_1P1, 1160, 1000, Ratio.WideFourByThree],
      [FLUX_PRO_1P1, 1000, 1160, Ratio.TallThreeByFour],
    ])("picks the closest listed ratio (%#)", (options, width, height, expected) => {
      expect(matchSourceAspectRatio(model(options), width, height)).toBe(expected);
    });

    it("scales the source before comparing, so size does not matter", () => {
      const small = matchSourceAspectRatio(model(FLUX_PRO_1P1), 40, 30);
      const large = matchSourceAspectRatio(model(FLUX_PRO_1P1), 4000, 3000);
      expect(small).toBe(Ratio.WideFourByThree);
      expect(large).toBe(small);
    });

    it("breaks ties toward the option listed first", () => {
      expect(
        matchSourceAspectRatio(model([Ratio.Square, Ratio.SquareHd]), 512, 512),
      ).toBe(Ratio.Square);
      expect(
        matchSourceAspectRatio(model([Ratio.SquareHd, Ratio.Square]), 512, 512),
      ).toBe(Ratio.SquareHd);
    });

    it.each([
      [1024, 1024, Ratio.Square],
      [1920, 1080, Ratio.Wide],
      [1080, 1920, Ratio.Tall],
    ])("reads wide and tall as 3:2 and 2:3 (%ix%i)", (width, height, expected) => {
      expect(matchSourceAspectRatio(model(GPT_IMAGE_1P5), width, height)).toBe(
        expected,
      );
    });

    it("uses square, wide and tall for a model that lists no ratios", () => {
      const unlisted = model([]);
      expect(matchSourceAspectRatio(unlisted, 1000, 1000)).toBe(Ratio.Square);
      expect(matchSourceAspectRatio(unlisted, 1600, 900)).toBe(Ratio.Wide);
      expect(matchSourceAspectRatio(unlisted, 900, 1600)).toBe(Ratio.Tall);
    });

    it("skips options this build does not know", () => {
      const future = "future_aspect" as Ratio;
      expect(
        matchSourceAspectRatio(model([future, Ratio.WideFourByThree]), 1600, 900),
      ).toBe(Ratio.WideFourByThree);
      expect(matchSourceAspectRatio(model([future]), 1600, 900)).toBeUndefined();
    });

    it.each([
      [0, 1080],
      [1920, 0],
      [-1920, 1080],
      [Number.NaN, 1080],
      [Number.POSITIVE_INFINITY, 1080],
    ])("returns nothing for an unusable source size (%f x %f)", (width, height) => {
      expect(matchSourceAspectRatio(model(FLUX_PRO_1P1), width, height)).toBeUndefined();
    });
  });

  describe("models that cannot change aspect ratio", () => {
    it("leaves the choice to the model, even when ratios are listed", () => {
      const fixed = model(NANO_BANANA_PRO, { canChangeAspectRatio: false });
      expect(matchSourceAspectRatio(fixed, 1920, 1080)).toBeUndefined();
    });

    it("leaves the choice to the model when none is selected yet", () => {
      expect(matchSourceAspectRatio(undefined, 1920, 1080)).toBeUndefined();
    });
  });

  describe("models built from the API listing", () => {
    it.each([
      ["nano_banana_pro", ["auto", "square", "wide_sixteen_by_nine"], Ratio.Auto],
      ["seedream_4", ["auto_2k", "auto_4k", "square"], Ratio.Auto2k],
      ["flux_pro_1p1", ["square", "wide_four_by_three", "tall_three_by_four"], Ratio.WideFourByThree],
    ])("%s keeps the source shape using the ratios the API lists", (id, aspectRatioOptions, expected) => {
      const [hydrated] = buildImageModelsFromListing([], [
        { model: id, aspect_ratio_options: aspectRatioOptions },
      ]);
      expect(matchSourceAspectRatio(hydrated, 1200, 900)).toBe(expected);
    });

    it("sends nothing for a model the API gives no ratios", () => {
      const [hydrated] = buildImageModelsFromListing([], [{ model: "future_edit_model" }]);
      expect(matchSourceAspectRatio(hydrated, 1200, 900)).toBeUndefined();
    });
  });
});

describe("autoAspectRatio", () => {
  it.each([
    [NANO_BANANA_PRO, Ratio.Auto],
    [SEEDREAM_4, Ratio.Auto2k],
    [FLUX_PRO_1P1, undefined],
    [GPT_IMAGE_1P5, undefined],
  ])("finds the option that works the shape out from the source (%#)", (options, expected) => {
    expect(autoAspectRatio(model(options))).toBe(expected);
  });

  it("finds nothing for a model that cannot change aspect ratio", () => {
    expect(
      autoAspectRatio(model(NANO_BANANA_PRO, { canChangeAspectRatio: false })),
    ).toBeUndefined();
    expect(autoAspectRatio(undefined)).toBeUndefined();
  });
});

function model(
  aspectRatios: Ratio[],
  overrides: { canChangeAspectRatio?: boolean } = {},
) {
  return { canChangeAspectRatio: true, aspectRatios, ...overrides };
}
