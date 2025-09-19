import { ModelCreator } from "src/index.js";
import { Model, ModelKind } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";

export class ImageModel extends Model {
  // Typescript type discriminator property
  // Since Vite minification and class name mangling can break instanceof checks,
  // we have a type discriminator property to check against.
  override readonly kind: ModelKind = "image_model";

  // Maximum number of images that can be generated at once
  readonly maxGenerationCount: number;

  // Default number of images that can be generated at once
  readonly defaultGenerationCount: number;

  // Signals image editing models that focus on editing a single image.
  readonly canEditImages: boolean;

  // For inpainting models, does it require sending a mask?
  readonly usesInpaintingMask: boolean;

  // Whether this model supports additional image prompts (reference images)
  readonly canUseImagePrompt: boolean;

  // Maximum number of image prompts that can be attached
  readonly maxImagePromptCount: number;

  constructor(args: {
    id: string;
    tauriId: string;
    fullName: string;
    category: ModelCategory;
    creator: ModelCreator;
    selectorName: string;
    selectorDescription: string;
    selectorBadges: string[];
    maxGenerationCount: number;
    defaultGenerationCount: number;
    canEditImages?: boolean;
    usesInpaintingMask?: boolean;
    canUseImagePrompt?: boolean;
    maxImagePromptCount?: number;
    tags?: ModelTag[];
  }) {
    if (args.maxGenerationCount < 1) {
      throw new Error("maxGenerationCount must be at least 1");
    }
    if (args.defaultGenerationCount < 1) {
      throw new Error("defaultGenerationCount must be at least 1");
    }
    if (args.defaultGenerationCount > args.maxGenerationCount) {
      throw new Error(
        "defaultGenerationCount must be less than or equal to maxGenerationCount"
      );
    }
    super(args);
    this.maxGenerationCount = args.maxGenerationCount;
    this.defaultGenerationCount = args.defaultGenerationCount;
    this.canEditImages = args.canEditImages ?? false;
    this.usesInpaintingMask = args.usesInpaintingMask ?? false;
    this.canUseImagePrompt = args.canUseImagePrompt ?? false;
    this.maxImagePromptCount = Math.max(0, args.maxImagePromptCount ?? 1);
  }
}
