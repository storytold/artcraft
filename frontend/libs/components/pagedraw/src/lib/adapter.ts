import type { ReactNode } from "react";
import type { ImageModel } from "@storyteller/model-list";
import type { GenerationProvider } from "@storyteller/api-enums";
import type { UploadMediaFn } from "@storyteller/api";
import type { BaseSelectorImage } from "./types";

export interface PageDrawEditRequest {
  model?: ImageModel;
  provider?: GenerationProvider;
  sceneImageMediaToken?: string;
  imageMediaTokens?: string[];
  prompt?: string;
  disableSystemPrompt?: boolean;
  imageCount?: number;
  /** "auto" | "wide" | "tall" | "square" */
  aspectRatio?: string;
  /** "1k" | "2k" | "4k" */
  imageResolution?: string;
  frontendCaller?: string;
  frontendSubscriberId?: string;
}

export interface PageDrawInpaintRequest {
  model?: ImageModel;
  provider?: GenerationProvider;
  imageMediaToken?: string;
  maskImageRawBytes?: Uint8Array;
  prompt?: string;
  imageCount?: number;
  frontendCaller?: string;
  frontendSubscriberId?: string;
}

export interface PageDrawAdapter {
  /** Platform-specific edit-image enqueue (Tauri invoke or REST POST). */
  enqueueEditImage(req: PageDrawEditRequest): Promise<{ status: string }>;

  /** Platform-specific inpaint enqueue (Tauri invoke or REST POST). */
  enqueueInpaint(req: PageDrawInpaintRequest): Promise<{ status: string }>;

  /** Platform-specific background removal enqueue. */
  enqueueBgRemoval(base64Image: string, nodeId: string): Promise<void>;

  /** Platform's image upload function, compatible with PromptBox2D's uploadImage prop. */
  uploadImage?: UploadMediaFn;

  /** Renders the "no base image selected" state — upload card, gallery picker, etc. */
  renderBaseImageSelector(props: {
    onImageSelect: (image: BaseSelectorImage) => void;
    showLoading: boolean;
  }): ReactNode;

  /** Optional telemetry hook called just before an enqueue. */
  onEnqueueMeta?: (meta: {
    prompt: string;
    refImageUrls: string[];
    modelType: string;
    timestamp: number;
  }) => void;
}
