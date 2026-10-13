import { describe, expect, it } from "vitest";
import {
  buildImageModelsFromListing,
  CommonAspectRatio,
} from "@storyteller/model-list";
import { editAspectRatioFields } from "./editAspectRatio";

const LANDSCAPE = { width: 1600, height: 1200 };

const [NANO_BANANA_PRO, GPT_IMAGE_1P5, FUTURE_MODEL] = buildImageModelsFromListing(
  [],
  [
    {
      model: "nano_banana_pro",
      aspect_ratio_options: ["auto", "square", "wide_four_by_three"],
    },
    {
      model: "gpt_image_1p5",
      aspect_ratio_options: ["square", "wide", "tall"],
    },
    { model: "future_edit_model" },
  ],
);

describe("editAspectRatioFields", () => {
  describe("a ratio picked by the user", () => {
    it.each(["wide", "tall", "square"])("is sent as picked (%s)", (picked) => {
      const fields = editAspectRatioFields(picked, NANO_BANANA_PRO, LANDSCAPE);
      expect(fields.aspectRatio).toBe(picked);
      expect(fields.commonAspectRatio).toBeUndefined();
    });

    it("is left unset when nothing is picked", () => {
      const fields = editAspectRatioFields(undefined, NANO_BANANA_PRO, LANDSCAPE);
      expect(fields.aspectRatio).toBeUndefined();
      expect(fields.commonAspectRatio).toBeUndefined();
    });
  });

  describe("auto", () => {
    it("asks a model that has an auto option for it", () => {
      const fields = editAspectRatioFields("auto", NANO_BANANA_PRO, LANDSCAPE);
      expect(fields.commonAspectRatio).toBe(CommonAspectRatio.Auto);
    });

    it("asks other models for the listed ratio closest to the base image", () => {
      expect(
        editAspectRatioFields("auto", GPT_IMAGE_1P5, { width: 1920, height: 1080 })
          .commonAspectRatio,
      ).toBe(CommonAspectRatio.Wide);
      expect(
        editAspectRatioFields("auto", GPT_IMAGE_1P5, { width: 1080, height: 1920 })
          .commonAspectRatio,
      ).toBe(CommonAspectRatio.Tall);
    });

    it("never sends the word auto itself", () => {
      for (const model of [NANO_BANANA_PRO, GPT_IMAGE_1P5, FUTURE_MODEL, undefined]) {
        expect(editAspectRatioFields("auto", model, LANDSCAPE).aspectRatio).toBeUndefined();
      }
    });

    it("sends no ratio when the model has no aspect ratio control", () => {
      expect(
        editAspectRatioFields("auto", FUTURE_MODEL, LANDSCAPE).commonAspectRatio,
      ).toBeUndefined();
      expect(
        editAspectRatioFields("auto", undefined, LANDSCAPE).commonAspectRatio,
      ).toBeUndefined();
    });
  });
});
