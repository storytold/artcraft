import { ModelCreator } from "src/index.js";
import { Model, ModelKind } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";

export class VideoModel extends Model {
  // Typescript type discriminator property
  // Since Vite minification and class name mangling can break instanceof checks,
  // we have a type discriminator property to check against.
  override readonly kind: ModelKind = "video_model";

  // Whether the model supports image starting frames
  readonly startFrame: boolean;

  // Whether the model supports image ending frames
  readonly endFrame: boolean;

  constructor(args: {
    id: string;
    tauriId: string;
    fullName: string;
    category: ModelCategory;
    creator: ModelCreator;
    selectorName: string;
    selectorDescription: string;
    selectorBadges: string[];
    startFrame: boolean;
    endFrame: boolean;
    tags?: ModelTag[];
  }) {
    super(args);
    this.startFrame = args.startFrame;
    this.endFrame = args.endFrame;
  } 
}
