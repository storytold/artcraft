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
import type {
  CommonAspectRatio,
  CommonResolution,
  ImageModel,
} from "@storyteller/model-list";
import type { GenerationProvider } from "@storyteller/api-enums";

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
  fetchAsset(url: string): Promise<Response>;

  // Hosts. Engine builds CDN URLs (`${cdnOrigin}${bucket_path}`) and
  // API URLs (`${apiSchemeAndHost}/v1/...`); the host supplies both.
  getCdnOrigin(): string;
  getApiSchemeAndHost(): string;
  getCurrentUserToken?(): string | undefined;

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
