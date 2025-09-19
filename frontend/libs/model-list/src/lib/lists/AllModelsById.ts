import { Model } from "../classes/Model.js";
import { ALL_MODELS_LIST } from "./AllModels.js";

export const ALL_MODELS_BY_ID : Map<string, Model> = new Map(
  ALL_MODELS_LIST.map((model) => [model.id, model])
);

if (ALL_MODELS_BY_ID.size !== ALL_MODELS_LIST.length) {
  throw new Error("All models must have unique IDs");
}
