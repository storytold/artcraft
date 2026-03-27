import { ModelCreator } from "src/index.js";
import { Model, ModelKind } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";
import { GenerationProvider } from "@storyteller/api-enums";
import { CommonAspectRatio } from "./properties/CommonAspectRatio.js";
import { CommonResolution } from "./properties/CommonResolution.js";

export class ImageModel extends Model {
  // Typescript type discriminator property
  // Since Vite minification and class name mangling can break instanceof checks,
  // we have a type discriminator property to check against.
  override readonly kind: ModelKind = "image_model";

  // Maximum number of images that can be generated at once
  readonly maxGenerationCount: number;

  // Default number of images that can be generated at once
  readonly defaultGenerationCount: number;

  // If set, use this instead of `maxGenerationCount`.
  readonly predefinedGenerationCounts?: number[];

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

  // Whether the model can be used for angle editing
  // If true, it'll be on the "angles" editing page.
  readonly canEditAngles: boolean;

  // Whether the model supports changing resolution (e.g. 1k, 2k, 4k)
  readonly canChangeResolution: boolean;

  // Whether the model supports changing aspect ratio
  readonly canChangeAspectRatio: boolean;

  // Aspect ratios supported by this model
  // (This is a new field that will take time to roll out and replace the old aspect ratios)
  readonly aspectRatios: CommonAspectRatio[];

  readonly resolutions: CommonResolution[];

  // Aspect ratio to use as default when nothing is selected.
  // Otherwise, use `aspectRatios[0]` as default.
  readonly defaultAspectRatio?: CommonAspectRatio;

  // Resolution to use as default when nothing is selected.
  // Otherwise, use `resolutions[0]` as default.
  readonly defaultResolution?: CommonResolution;

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
    predefinedGenerationCounts?: number[];
    canEditImages?: boolean;
    usesInpaintingMask?: boolean;
    editingIsInpainting?: boolean;
    canUseImagePrompt?: boolean;
    maxImagePromptCount?: number;
    canTextToImage?: boolean;
    canEditAngles?: boolean;
    canChangeResolution?: boolean;
    canChangeAspectRatio?: boolean;
    tags?: ModelTag[];
    progressBarTime?: number;
    providers?: GenerationProvider[];
    aspectRatios?: CommonAspectRatio[];
    resolutions?: CommonResolution[];
    defaultAspectRatio?: CommonAspectRatio;
    defaultResolution?: CommonResolution;
    maxPromptLength?: number;
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
    this.predefinedGenerationCounts = args.predefinedGenerationCounts;
    this.canEditImages = args.canEditImages ?? false;
    this.usesInpaintingMask = args.usesInpaintingMask ?? false;
    this.editingIsInpainting = args.editingIsInpainting ?? false;
    this.canUseImagePrompt = args.canUseImagePrompt ?? false;
    this.maxImagePromptCount = Math.max(0, args.maxImagePromptCount ?? 1);
    this.canTextToImage = args.canTextToImage === false ? false : true; // Default to true !
    this.canEditAngles = args.canEditAngles ?? false;
    this.canChangeResolution = args.canChangeResolution ?? false;
    this.canChangeAspectRatio = args.canChangeAspectRatio ?? false;
    this.aspectRatios = args.aspectRatios ?? [];
    this.resolutions = args.resolutions ?? [];
    this.defaultAspectRatio = args.defaultAspectRatio ?? (args.aspectRatios && args.aspectRatios.length > 0 ? args.aspectRatios[0] : undefined);
    this.defaultResolution = args.defaultResolution ?? (args.resolutions && args.resolutions.length > 0 ? args.resolutions[0] : undefined);
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

  // Rolling out new aspect ratio controls to models.
  // If we have them set on the model, we can use the new UI controls.
  supportsNewAspectRatio(): boolean {
    return this.canChangeAspectRatio 
      && this.aspectRatios 
      && this.aspectRatios.length > 0;
  }

  // Rolling out new resolution controls to models.
  // If we have them set on the model, we can use the new UI controls.
  supportsNewResolution(): boolean {
    return this.canChangeResolution 
      && this.resolutions 
      && this.resolutions.length > 0;
  }

  // Return whether the count of generations is valid for this model
  isValidGenerationCount(count: number): boolean {
    if (this.predefinedGenerationCounts) {
      return this.predefinedGenerationCounts.includes(count);
    } else {
      return count >= 1 && count <= this.maxGenerationCount;
    }
  }
}
