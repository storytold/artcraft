import { ModelCreator } from "src/index.js";
import { Model, ModelKind } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";
import { GenerationProvider } from "@storyteller/api-enums";

export class Object3DModel extends Model {
  override readonly kind: ModelKind = "3d_object_model";

  constructor(args: {
    id: string;
    tauriId: string;
    fullName: string;
    category: ModelCategory;
    creator: ModelCreator;
    selectorName: string;
    selectorDescription: string;
    selectorBadges: string[];
    tags?: ModelTag[];
    providers?: GenerationProvider[];
    progressBarTime?: number;
    maxPromptLength?: number;
  }) {
    super(args);
  }
}
