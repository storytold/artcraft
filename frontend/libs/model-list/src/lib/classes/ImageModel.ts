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

  // For editing models, is "editing" == "inpainting"?
  // Examples of "true" are "flux dev juggernaut"
  // Examples of "false" are "nano_banana_pro", which is just "editing".
  readonly editingIsInpainting: boolean;

  // Whether this model supports additional image prompts (reference images)
  readonly canUseImagePrompt: boolean;

  // Maximum number of image prompts that can be attached
  readonly maxImagePromptCount: number;

  // Whether the model can be used for text-to-image
  // If true, it'll be displayed on the text-to-image page.
  readonly canTextToImage: boolean;

  // Whether the model supports changing resolution (e.g. 1k, 2k, 4k)
  readonly canChangeResolution: boolean;

  // Whether the model supports changing aspect ratio
  readonly canChangeAspectRatio: boolean;

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
    editingIsInpainting?: boolean;
    canUseImagePrompt?: boolean;
    maxImagePromptCount?: number;
    canTextToImage?: boolean;
    canChangeResolution?: boolean;
    canChangeAspectRatio?: boolean;
    tags?: ModelTag[];
    progressBarTime?: number;
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
    this.editingIsInpainting = args.editingIsInpainting ?? false;
    this.canUseImagePrompt = args.canUseImagePrompt ?? false;
    this.maxImagePromptCount = Math.max(0, args.maxImagePromptCount ?? 1);
    this.canTextToImage = args.canTextToImage === false ? false : true; // Default to true !
    this.canChangeResolution = args.canChangeResolution ?? false;
    this.canChangeAspectRatio = args.canChangeAspectRatio ?? false;
  }

  // If the model is a "Nano Banana"-type model, we may want to enable certain features. 
  // For example, in the editor, we may want to use the marker.
  // TODO: Rather than "isNanoBananaModel()", we should have: "enableEditorMarker" as it's 
  // more semantic.
  isNanoBananaModel(): boolean {
    switch(this.id) {
      case "gemini_25_flash":
      case "nano_banana":
      case "nano_banana_pro":
        return true;
      default:
        return false;
    }
  }
}
