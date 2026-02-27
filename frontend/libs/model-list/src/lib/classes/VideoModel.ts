import { ModelCreator } from "src/index.js";
import { Model, ModelKind } from "./Model.js";
import { ModelCategory } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";
import { SizeOption } from "./metadata/SizeOption.js";
import { GenerationProvider } from "@storyteller/api-enums";

export class VideoModel extends Model {
  // Typescript type discriminator property
  // Since Vite minification and class name mangling can break instanceof checks,
  // we have a type discriminator property to check against.
  override readonly kind: ModelKind = "video_model";

  // Whether the model supports image starting frames
  readonly startFrame: boolean;

  // Whether the model supports image ending frames
  readonly endFrame: boolean;

  // Whether the model requires an image
  readonly requiresImage: boolean;

  // The size options for the model
  readonly sizeOptions: SizeOption[];

  // Whether this model supports toggling generation with sound
  readonly generateWithSound?: boolean;

  // Available duration options in seconds (e.g. [4, 5, 6, 7, 8, 9])
  readonly durationOptions?: number[];

  // Default duration in seconds
  readonly defaultDuration?: number;

  // Whether the model supports multi-image reference mode
  readonly supportsReferenceMode?: boolean;

  // Maximum number of reference images in reference mode
  readonly maxReferenceImages?: number;

  // Available resolution options (e.g. ["480p", "720p"])
  readonly resolutionOptions?: string[];

  // Default resolution
  readonly defaultResolution?: string;

  // Whether the model supports the system prompt toggle (default true)
  readonly supportsSystemPrompt: boolean;

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
    requiresImage: boolean;
    tags?: ModelTag[];
    sizeOptions?: SizeOption[];
    progressBarTime?: number;
    generateWithSound?: boolean;
    providers?: GenerationProvider[];
    durationOptions?: number[];
    defaultDuration?: number;
    supportsReferenceMode?: boolean;
    maxReferenceImages?: number;
    resolutionOptions?: string[];
    defaultResolution?: string;
    supportsSystemPrompt?: boolean;
  }) {
    super(args);
    this.startFrame = args.startFrame;
    this.endFrame = args.endFrame;
    this.requiresImage = args.requiresImage;
    this.sizeOptions = args.sizeOptions ?? [];
    this.generateWithSound = args.generateWithSound || false;
    this.durationOptions = args.durationOptions;
    this.defaultDuration = args.defaultDuration;
    this.supportsReferenceMode = args.supportsReferenceMode;
    this.maxReferenceImages = args.maxReferenceImages;
    this.resolutionOptions = args.resolutionOptions;
    this.defaultResolution = args.defaultResolution;
    this.supportsSystemPrompt = args.supportsSystemPrompt ?? true;
  }
}
