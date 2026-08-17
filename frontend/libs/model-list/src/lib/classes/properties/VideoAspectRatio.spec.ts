// @vitest-environment jsdom

import { CommonAspectRatio } from "./CommonAspectRatio.js";
import { SizeIconOption } from "../metadata/SizeOption.js";
import {
  resolveVideoAspectRatio,
  resolveVideoAspectRatioOption,
} from "./VideoAspectRatio.js";
import { buildVideoModelsFromListing } from "../../loader/buildModelsFromListing.js";

const options = [
  {
    textLabel: "21:9",
    tauriValue: CommonAspectRatio.WideTwentyOneByNine,
    icon: SizeIconOption.Landscape16x9,
  },
  {
    textLabel: "16:9",
    tauriValue: CommonAspectRatio.WideSixteenByNine,
    icon: SizeIconOption.Landscape16x9,
  },
];

describe("resolveVideoAspectRatio", () => {
  it("preserves a current selection that remains valid", () => {
    expect(
      resolveVideoAspectRatio(
        {
          sizeOptions: options,
          defaultAspectRatio: CommonAspectRatio.WideSixteenByNine,
        },
        "21:9",
      ),
    ).toBe("21:9");
  });

  it("uses the declared default instead of assuming the first option", () => {
    expect(
      resolveVideoAspectRatio(
        {
          sizeOptions: options,
          defaultAspectRatio: CommonAspectRatio.WideSixteenByNine,
        },
        "4:3",
      ),
    ).toBe("16:9");
    expect(
      resolveVideoAspectRatioOption(
        {
          sizeOptions: options,
          defaultAspectRatio: CommonAspectRatio.WideSixteenByNine,
        },
        "4:3",
      )?.tauriValue,
    ).toBe(CommonAspectRatio.WideSixteenByNine);
  });

  it("falls back to the first option when the default is missing or invalid", () => {
    expect(resolveVideoAspectRatio({ sizeOptions: options }, null)).toBe(
      "21:9",
    );
    expect(
      resolveVideoAspectRatio(
        { sizeOptions: options, defaultAspectRatio: "future_ratio" },
        null,
      ),
    ).toBe("21:9");
  });

  it("returns null when the model has no aspect-ratio options", () => {
    expect(resolveVideoAspectRatio({ sizeOptions: [] }, "16:9")).toBeNull();
  });

  it("hydrates a valid server default without reordering the options", () => {
    const [model] = buildVideoModelsFromListing(
      [],
      [
        {
          model: "fictional_video",
          aspect_ratio_options: [
            CommonAspectRatio.WideTwentyOneByNine,
            CommonAspectRatio.WideSixteenByNine,
          ],
          aspect_ratio_default: CommonAspectRatio.WideSixteenByNine,
        },
      ],
      ["fictional_video"],
    );

    expect(model.sizeOptions.map((option) => option.textLabel)).toEqual([
      "21:9",
      "16:9",
    ]);
    expect(model.defaultAspectRatio).toBe(CommonAspectRatio.WideSixteenByNine);
    expect(resolveVideoAspectRatio(model, "4:3")).toBe("16:9");
  });

  it("drops a declared default that is not a supported enum value", () => {
    const [model] = buildVideoModelsFromListing(
      [],
      [
        {
          model: "fictional_video",
          aspect_ratio_options: [CommonAspectRatio.WideSixteenByNine],
          aspect_ratio_default: "future_ratio",
        },
      ],
      ["fictional_video"],
    );

    expect(model.defaultAspectRatio).toBeUndefined();
    expect(resolveVideoAspectRatio(model, null)).toBe("16:9");
  });
});
