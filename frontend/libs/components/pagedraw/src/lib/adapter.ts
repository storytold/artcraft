import type { ReactNode } from "react";
import type { ImageModel } from "@storyteller/model-list";
import type { GenerationProvider } from "@storyteller/api-enums";
import type { UploadMediaFn } from "@storyteller/api";
import type { BaseSelectorImage } from "./types";

export interface PageDrawEditRequest {
  model?: ImageModel;
  provider?: GenerationProvider;
  canvasImageMediaToken?: string;
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

/**
 * Platform seam for pagedraw session persistence (server project documents of
 * type `editor_2d` on the web). All methods are non-throwing: failures come
 * back as `success: false` / null so a flaky network can never tear down the
 * sync controller. Mirrors the moodboard persistence adapter so the two can
 * later share an extracted `@storyteller/autosave` core.
 */
export interface PageDrawPersistenceAdapter {
  /** Current account id, or null when signed out. Must be cheap/synchronous. */
  getUserId(): string | null;
  /** Subscribe to login-state changes; returns an unsubscribe. */
  subscribeAuthState(onChange: () => void): () => void;

  /** Upload a local image file, returning its durable media token. */
  uploadMedia(file: File): Promise<string | null>;

  /** Create a new server project row. Returns the new project token. */
  createProject(params: {
    documentJson: string;
    name: string;
  }): Promise<{ success: boolean; token?: string; errorMessage?: string }>;

  /** Overwrite an existing project document (and its title). */
  updateProject(params: {
    token: string;
    documentJson: string;
    name: string;
  }): Promise<{ success: boolean; errorMessage?: string }>;

  /**
   * Fetch a project's row metadata. `updatedAt` is the multi-device conflict
   * base revision — it must reflect the latest server write.
   */
  getProjectInfo(token: string): Promise<{
    success: boolean;
    updatedAt?: string;
    title?: string | null;
  }>;

  /** Fetch the project's JSON document body. */
  loadProjectDocument(token: string): Promise<{
    success: boolean;
    documentJson?: string;
  }>;

  /** List the user's pagedraw projects, newest first. */
  listProjects(): Promise<{
    success: boolean;
    projects?: { token: string; name: string; updatedAt: string }[];
  }>;

  /** Delete a project row. */
  deleteProject(token: string): Promise<boolean>;

  /** Resolve media tokens to displayable URLs (missing tokens omitted). */
  resolveMediaUrls(tokens: string[]): Promise<Record<string, string>>;
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

  /**
   * Optional server persistence for sessions. When absent (e.g. the Tauri
   * host today), the sync controller is never initialized and pagedraw
   * behaves exactly as before.
   */
  persistence?: PageDrawPersistenceAdapter;
}
