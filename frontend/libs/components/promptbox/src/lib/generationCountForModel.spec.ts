import { expect, it } from "vitest";
import { IMAGE_MODELS_BY_ID } from "@storyteller/model-list";
import { generationCountForModel } from "./generationCountForModel";

// Max 4, default 1.
const NANO_BANANA_PRO = IMAGE_MODELS_BY_ID.get("nano_banana_pro")!;

it("keeps a remembered count while the model is still resolving", () => {
  expect(generationCountForModel(undefined, 2)).toBe(2);
});

it("keeps a count the model supports instead of its default", () => {
  expect(generationCountForModel(NANO_BANANA_PRO, 2)).toBe(2);
});

it("falls back to the model default for an unsupported count", () => {
  expect(generationCountForModel(NANO_BANANA_PRO, 9)).toBe(
    NANO_BANANA_PRO.defaultGenerationCount,
  );
});
