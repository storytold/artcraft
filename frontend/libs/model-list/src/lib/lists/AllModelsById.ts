import { Model } from "../classes/Model.js";
import { ALL_MODELS_LIST } from "./AllModels.js";

export const ALL_MODELS_BY_ID: Map<string, Model> = new Map(
  ALL_MODELS_LIST.map((model) => [model.id, model])
);

if (ALL_MODELS_BY_ID.size !== ALL_MODELS_LIST.length) {
  throw new Error("All models must have unique IDs");
}

const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/\./g, "_").trim();

// Index models by both id and tauriId, normalized so backend variants like
// `kling_1.6_pro` resolve to `kling_1_6_pro`.
const ALL_MODELS_BY_KEY: Map<string, Model> = (() => {
  const map = new Map<string, Model>();
  for (const model of ALL_MODELS_LIST) {
    map.set(normalizeKey(model.id), model);
    if (model.tauriId) map.set(normalizeKey(model.tauriId), model);
  }
  return map;
})();

export const findModelByKey = (
  key: string | null | undefined,
): Model | undefined => {
  if (!key) return undefined;
  return ALL_MODELS_BY_KEY.get(normalizeKey(key));
};
