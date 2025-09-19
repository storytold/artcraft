import { ModelInfo } from "./ModelInfo.js";
import { ModelTag } from "../classes/metadata/ModelTag.js";

export type ModelCategory = "image" | "video";

// Centralized model capability definition
// For setting options for the model
// TODO: add more capabilities here - BFlat
export interface ModelCapabilities {
  maxGenerationCount: number;
  defaultGenerationCount?: number;
}

export interface ModelConfig {
  id: string;
  label: string; // UI label
  description?: string;
  badges?: { label: string }[];
  category: ModelCategory;
  info: ModelInfo;
  capabilities: ModelCapabilities;
  tags?: (ModelTag | string)[]; // optional tags, e.g. ["instructiveEdit"] - for filtering
}
