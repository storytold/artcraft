import { ModelCreator } from "src/index.js";
import { Model, ModelKind } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";
import { GenerationProvider } from "@storyteller/api-enums";

export class SplatModel extends Model {
  // Typescript type discriminator property
  // Since Vite minification and class name mangling can break instanceof checks,
  // we have a type discriminator property to check against.
  override readonly kind: ModelKind = "gaussian_model";


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
  }) {
    super(args);
  }
}
