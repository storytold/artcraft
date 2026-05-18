// Single platform-abstraction surface the host (artcraft Tauri app or
// any future web host) injects into PageScene. Mirrors the shape of
// PageDrawAdapter — methods for Tauri-specific generation/upload, slot
// renderers for host-owned modals, and optional event hooks for
// telemetry / error surfacing / tab persistence.
//
// The library itself has zero Tauri imports. Everything platform-
// specific is on this interface; the adapter is constructed in the
// host wrapper and passed to <PageScene adapter={adapter} />.

import type { ReactNode } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import type {
  CommonAspectRatio,
  CommonResolution,
  ImageModel,
} from "@storyteller/model-list";
import type { GenerationProvider } from "@storyteller/api-enums";
import type { UploadImageArgs } from "@storyteller/common";
import type {
  FilterEngineCategories,
  FilterMediaType,
  ToastTypes,
} from "./enums";
import type { MediaInfo } from "./models/mediaInfo";
import type { Pagination, PaginationInfinite } from "./models/pagination";

// ─── Generation ────────────────────────────────────────────────────────

export interface PageSceneGenerateRequest {
  model?: ImageModel;
  provider?: GenerationProvider;
  prompt?: string;
  imageMediaTokens?: string[];
  sceneImageMediaToken?: string;
  imageCount?: number;
  aspectRatio?: CommonAspectRatio;
  resolution?: CommonResolution;
  frontendCaller?: string;
  frontendSubscriberId?: string;
}

// ─── Media listing (AssetMenu) ─────────────────────────────────────────

export interface ListMediaFilesQuery {
  pageSize: number;
  pageIndex?: number;        // user-list pagination
  cursor?: string;           // featured-list infinite pagination
  filterEngineCategories: FilterEngineCategories[];
  filterMediaTypes?: FilterMediaType[];
}

export interface ListUserMediaFilesResult {
  success: boolean;
  data?: MediaInfo[];
  pagination?: Pagination;
  errorMessage?: string;
}

export interface ListFeaturedMediaFilesResult {
  success: boolean;
  data?: MediaInfo[];
  pagination?: PaginationInfinite;
  errorMessage?: string;
}

// ─── Scene I/O ─────────────────────────────────────────────────────────

export interface PageSceneSavePayload {
  saveJson: string;
  sceneTitle: string;
  sceneToken?: string;
  sceneThumbnail: Blob | undefined;
}

// ─── Adapter ───────────────────────────────────────────────────────────

export interface PageSceneAdapter {
  // Generation enqueue. Same shape as PageDrawAdapter.enqueueEditImage.
  enqueueGeneration(
    req: PageSceneGenerateRequest,
  ): Promise<{ status: string }>;

  // Scene I/O — replaces the previous engine/api_manager.ts +
  // engine/api_fetchers.ts. The host owns all HTTP / FetchProxy
  // plumbing.
  saveScene(payload: PageSceneSavePayload): Promise<string>;
  loadScene(token: string): Promise<unknown>;
  // Wraps Tauri-flavored CORS-bypassed fetches. Used by Scene's GLTF
  // loader paths that resolve CDN URLs the browser can't fetch directly.
  // Accepts an optional AbortSignal so the scene loader can cancel
  // in-flight asset downloads when its load is superseded (rapid tab
  // switches, applyJson during loadScene). Adapters that can't honor
  // cancellation may ignore the signal — the lib's ticket guard still
  // protects state correctness.
  fetchAsset(
    url: string,
    init?: { signal?: AbortSignal },
  ): Promise<Response>;

  // Hosts. Engine builds CDN URLs (`${cdnOrigin}${bucket_path}`) and
  // API URLs (`${apiSchemeAndHost}/v1/...`); the host supplies both.
  getCdnOrigin(): string;
  getApiSchemeAndHost(): string;
  getCurrentUserToken?(): string | undefined;

  // Compose a CDN URL for a bucket path with optional width/quality
  // resize hints. Wraps the host's BucketConfig.getCdnUrl. AssetMenu
  // uses this to build asset thumbnails at small sizes.
  getCdnUrl(bucketPath: string, width?: number, quality?: number): string;

  // Paginated media-file listing — backs AssetMenu's "My objects" tab.
  // Wraps the host's MediaFilesApi.ListUserMediaFiles.
  listUserMediaFiles(
    query: ListMediaFilesQuery,
  ): Promise<ListUserMediaFilesResult>;

  // Cursor-paginated featured listing — backs AssetMenu's "Featured"
  // tabs (skybox, character, location, etc.). Wraps the host's
  // MediaFilesApi.ListFeaturedMediaFiles.
  listFeaturedMediaFiles(
    query: ListMediaFilesQuery,
  ): Promise<ListFeaturedMediaFilesResult>;

  // Toast notifications. Wraps the host's addToast / react-hot-toast
  // pipeline; the lib stays free of toast-library imports.
  showToast(level: ToastTypes, message: string): void;

  // Resolve a media_file_token to its CDN URL. Wraps the host's
  // MediaFilesApi.GetMediaFileByToken. Used by Scene's asset loaders
  // when they only have the token, not the full URL.
  getMediaUrlByToken(token: string): Promise<string>;

  // Resolve many tokens in one batch. Used by the scene loader to warm
  // a URL cache up front so it can fire all asset downloads in parallel
  // instead of doing an N+1 metadata roundtrip. Optional: when absent
  // the lib falls back to Promise.all of getMediaUrlByToken.
  // Hosts that wrap MediaFilesApi can implement this with
  // ListMediaFilesByTokens (GET /v1/media_files/batch).
  getMediaUrlsByTokens?(tokens: string[]): Promise<Record<string, string>>;

  // Visual viewport dimensions. Used by DnD asset-drop hit-testing
  // to detect "is this drop over the 3D canvas?" — the artcraft host
  // wires its `pageWidth`/`pageHeight` signals through; web hosts
  // without those signals can omit, and the lib falls back to
  // window.innerWidth/innerHeight.
  getViewportSize?(): { width: number; height: number };

  // Slot renders for host-owned UI. The library renders these inside
  // its own AssetMenu / scene-load modal containers — same shape as
  // PageDrawAdapter.renderBaseImageSelector.
  renderAssetBrowser(props: {
    onAssetSelect: (asset: {
      mediaToken: string;
      name: string;
      kind: string;
    }) => void;
  }): ReactNode;
  renderSceneLoader(props: {
    onSceneSelect: (token: string) => void;
  }): ReactNode;

  // "Upload your own model" host modal. Rendered from inside the lib's
  // AssetModal — the lib owns the trigger button + modal control state,
  // the host owns the actual upload UI (file picker, validation,
  // progress, splat conversion, etc.).
  renderAssetUploader(props: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (category: FilterEngineCategories) => void;
    title: string;
    titleIcon: IconDefinition;
  }): ReactNode;

  // Image upload modal — distinct from renderAssetUploader because
  // image-plane uploads use a different host pipeline (image
  // processing, no GLB/splat conversion). Triggered from Controls3D.
  renderImageUploader(props: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title: string;
    titleIcon: IconDefinition;
  }): ReactNode;

  // Splat (.spz) upload modal — triggered from Controls3D for the
  // gaussian-splat upload path.
  renderSplatUploader(props: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title: string;
    titleIcon: IconDefinition;
  }): ReactNode;

  // Upload an image File and emit upload-progress states. Wraps the
  // host's UploadImageMedia / UploadModalMedia.uploadImage pipeline.
  // Used by PromptBox3D for reference-image uploads. Signature
  // matches @storyteller/common's UploadImageArgs so it can pass
  // through to PromptBox3D.uploadImage as-is.
  uploadImage(args: UploadImageArgs): Promise<void>;

  // Upload an image-plane keyed by an existing media token. Used by
  // the gallery-drop handler when the user drags a non-3D gallery
  // item onto the 3D scene. Wraps host's uploadPlaneFromMediaToken.
  uploadPlaneFromMediaToken(args: {
    title: string;
    mediaToken: string;
    progressCallback: UploadImageArgs["progressCallback"];
  }): Promise<void>;

  // Cross-page navigation hook. Today the lib only needs one
  // destination ("create 3D model from image"), so it's a single
  // named action; add more as the lib grows page-aware UI. Tauri host
  // implements via useTabStore.setActiveTab; web host via router push.
  navigateToImageTo3D(): void;

  // Auth/logout — the SettingsModal in Controls3D needs a logout
  // callback. Tauri host: setLogoutStates. Web host: web auth flow.
  performLogout(): void;

  // Open the host's signup/login modal. Called when an anonymous
  // visitor clicks a feature that requires an account (Save, Generate,
  // Upload, "My Library"). Tauri host leaves it undefined — its user
  // is always signed in. Webapp host wires this to its auth modal.
  promptSignup?(reason?: string): void;

  // Open the host's New-Scene chooser (e.g. webapp's splash modal). When
  // defined, the lib's File > New Scene item delegates here instead of
  // showing its inline confirm dialog. Tauri host leaves it undefined and
  // keeps the existing behavior.
  onRequestNewSceneSelector?(): void;

  // Roll the current editor session back to the original scene the
  // host loaded. Called when the user confirms the destructive Reset
  // modal in the File menu. Implementations typically pull the
  // original scene JSON from a host-side cache and feed it back
  // through `editor.applyJson(json)`. When undefined the Reset menu
  // item is hidden — Tauri leaves it off; webapp wires it to its
  // per-token cache's stored `original` snapshot.
  resetToOriginal?(): Promise<void> | void;

  // Optional event hooks — telemetry, host-side modals, tab title sync.
  onSelectionChange?(
    sel: { uuid: string; assetType: string } | null,
  ): void;
  onSceneDirty?(dirty: boolean): void;
  onError?(err: { title: string; message: string }): void;
  onSceneSaved?(token: string): void;
  // Wraps the host's `signalScene(...)` so the artcraft TopBar (and
  // other app-wide consumers) keeps seeing scene title/owner/dirty
  // state without the lib importing the host signal.
  onSceneTitleChange?(meta: {
    title: string;
    token?: string;
    ownerToken?: string;
    isModified: boolean;
  }): void;
  onEnqueueMeta?(meta: {
    prompt: string;
    refImageUrls: string[];
    modelType: string;
    timestamp: number;
  }): void;

  // Tab-cache integration. The host (artcraft useTabStore) reads/
  // writes the serialized scene JSON between tab switches; the library
  // is single-instance and tab-agnostic.
  cacheJsonString?: string;
  onSceneSerialized?(json: string): void;

  // Initial scene to load on mount (the route param in artcraft).
  initialSceneToken?: string;
}
