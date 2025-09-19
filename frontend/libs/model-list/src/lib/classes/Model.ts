import { ModelCreator } from "./metadata/ModelCreator.js";
import { ModelCategory, ModelConfig } from "../legacy/ModelConfig.js";
import { ModelTag } from "./metadata/ModelTag.js";

export type ModelKind = "model" | "image_model" | "video_model";

// NB: Do not create instances of this class directly, use subclasses.
export class Model {
  // Typescript type discriminator property
  // Since Vite minification and class name mangling can break instanceof checks,
  // we have a type discriminator property to check against.
  readonly kind: ModelKind = "model";

  // A unique frontend-only string for the model
  readonly id: string;

  // A unique identifier that Tauri uses for the model (this 
  // might differ from our backend or other systems)
  readonly tauriId: string;

  // A long name for the model that might need to be abbreviated.
  readonly fullName: string;

  // The type of model (image, video, etc.)
  // TODO: Not sure that this is used for anything
  readonly category: ModelCategory;

  // What company made the model.
  readonly creator: ModelCreator;

  // Name for the selector
  readonly selectorName: string;

  // Description for the selector
  readonly selectorDescription: string;

  // Labels for the selector
  readonly selectorBadges: string[];

  // A list of filterable "capabilities" that can be used to filter models.
  readonly tags: ModelTag[];

  protected constructor(args: {
    id: string;
    tauriId: string;
    fullName: string;
    category: ModelCategory;
    creator: ModelCreator;
    selectorName: string;
    selectorDescription: string;
    selectorBadges: string[];
    tags?: ModelTag[];
  }) {
    this.id = args.id;
    this.tauriId = args.tauriId;
    this.fullName = args.fullName;
    this.category = args.category;
    this.creator = args.creator;
    this.selectorName = args.selectorName;
    this.selectorDescription = args.selectorDescription;
    this.selectorBadges = args.selectorBadges;
    this.tags = args.tags ?? [];
  }

  toLegacyBadges() : { label: string }[] {
    return this.selectorBadges.map((b) => ({ label: b }));
  }

  // TODO: This is a method to support migration. Kill it after we no longer need it.
  toLegacyModelConfig(): ModelConfig {
    return {
      id: this.id,
      label: this.selectorName,
      description: this.selectorDescription,
      badges: this.toLegacyBadges(),
      category: this.category,
      info: {
        name: this.fullName,
        tauri_id: this.tauriId,
        creator: this.creator,
      },
      capabilities: {
        maxGenerationCount: 9, // NB: Sentinel value to detect continued use
        defaultGenerationCount: 9, // NB: Sentinel value to detect continued use
      },
      tags: [],
    };
  }
}
