// PageSceneAdapter implementation for the artcraft webapp.
//
// Mirrors the artcraft-website's adapter but plugs into the webapp's
// local session + toast helpers. Built once per <PageScene> mount via
// useMemo, keyed on `userToken` + `initialSceneToken` so signing in
// mid-session re-arms ownership-based UI gating without unmounting the
// editor.
//
// Anonymous-friendly: when there's no signed-in user, getCurrentUserToken
// returns undefined; the lib's read-only gating keeps Save hidden.

import { useMemo } from "react";
import {
  GetCdnOrigin,
  MediaFilesApi,
  MediaUploadApi,
  StorytellerApiHostStore,
  UploadImageMedia,
  UsersApi,
} from "@storyteller/api";
import type { PageSceneAdapter } from "@storyteller/ui-pagescene";
import {
  getActiveEditor,
  ToastTypes,
  usePageSceneStore,
} from "@storyteller/ui-pagescene";
import {
  UploadModal3D,
  UploadModalImage,
  UploadModalSplat,
  UploaderStates,
} from "@storyteller/ui-upload-modal";
import { showToast } from "../../components/toast/toast";
import { invalidateSession, useSessionStore } from "../../lib/session";
import { useSceneCacheStore } from "./scene-cache-store";

const apiHost = () =>
  StorytellerApiHostStore.getInstance().getApiSchemeAndHost();

// ─── Scene file IO ─────────────────────────────────────────────────────────

const saveSceneViaApi = async (
  saveJson: string,
  sceneTitle: string,
  sceneToken: string | undefined,
  sceneThumbnail: Blob | undefined,
): Promise<string> => {
  const blob = new Blob([saveJson], { type: "application/json" });
  const uploadApi = new MediaUploadApi();
  const uuid = crypto.randomUUID();
  const fileName = `${sceneTitle}.glb`;

  const uploadResp = sceneToken
    ? await uploadApi.UploadSavedScene({ blob, fileName, uuid, mediaToken: sceneToken })
    : await uploadApi.UploadNewScene({
        blob,
        fileName,
        uuid,
        maybe_title: sceneTitle,
      });

  if (!uploadResp.success || !uploadResp.data) {
    showToast("error", uploadResp.errorMessage ?? "Failed to save scene");
    return "";
  }

  const newToken = uploadResp.data;
  // Cover image is best-effort and the backend treats it as an
  // independent mutation — kick it off in the background so the save
  // spinner dismisses immediately after the scene JSON lands.
  if (sceneThumbnail) {
    void uploadCoverImageInBackground(uploadApi, newToken, sceneThumbnail);
  }
  return newToken;
};

const uploadCoverImageInBackground = async (
  uploadApi: MediaUploadApi,
  sceneToken: string,
  sceneThumbnail: Blob,
): Promise<void> => {
  try {
    const coverResp = await uploadApi.UploadImage({
      blob: sceneThumbnail,
      fileName: "render.png",
      uuid: crypto.randomUUID(),
      maybe_title: "Screenshot",
    });
    if (coverResp.success && coverResp.data) {
      await new MediaFilesApi().UpdateCoverImage({
        mediaFileToken: sceneToken,
        imageToken: coverResp.data,
      });
    }
  } catch {
    // Best-effort — the scene is already saved, so we don't toast here.
  }
};

const loadSceneViaApi = async (token: string): Promise<unknown> => {
  const mediaApi = new MediaFilesApi();
  const meta = await mediaApi.GetMediaFileByToken({ mediaFileToken: token });
  const cdnUrl = meta.data?.media_links?.cdn_url;
  if (!cdnUrl) throw new Error("Scene CDN URL missing");

  // Mirror the loaded scene's metadata into the lib's store. Several
  // lib surfaces gate on these fields — the File menu's "Reset to
  // original" item needs `sceneMeta.token`, the visitor-vs-owner gate
  // needs `sceneMeta.ownerToken`, and the webapp's header title
  // display reads `sceneMeta.title`. The lib doesn't emit
  // onSceneTitleChange on the load path (only on init/new), so we
  // populate it from the metadata fetch we're already doing here.
  usePageSceneStore.getState().setSceneMeta({
    title: meta.data?.maybe_title ?? undefined,
    token,
    ownerToken: meta.data?.maybe_creator_user?.user_token ?? undefined,
    isModified: false,
    isInitializing: false,
  });

  const fileResp = await fetch(cdnUrl);
  if (!fileResp.ok) throw new Error(`Scene fetch HTTP ${fileResp.status}`);
  const text = await fileResp.text();

  // Seed the scene cache's `original` snapshot on first fetch so the
  // destructive "Reset to original" menu item has something to revert
  // to without going back over the network. Cache-hit reloads skip
  // this path entirely (Editor.initialize uses cacheJsonString).
  const cache = useSceneCacheStore.getState();
  if (!cache.getEntry(token)?.original) {
    cache.setOriginal(token, text);
  }

  return JSON.parse(text);
};

// ─── Adapter ───────────────────────────────────────────────────────────────

export interface WebAppPageSceneAdapterOptions {
  userToken: string | undefined;
  initialSceneToken: string | undefined;
  navigateToImageTo3D: () => void;
  // Wrapper size — kept in a ref so the closure sees live values without
  // rebuilding the adapter on every resize.
  getViewportSize: () => { width: number; height: number };
  // Open the host's signup CTA modal. Called from inside the lib when an
  // anonymous visitor clicks Save / Generate / Upload / My Library.
  promptSignup: (reason?: string) => void;
  // Open the host's splash modal. Called from the lib's File > New Scene
  // menu item; replaces the lib's inline confirm dialog.
  onRequestNewSceneSelector: () => void;
}

export const useWebAppPageSceneAdapter = (
  options: WebAppPageSceneAdapterOptions,
): PageSceneAdapter => {
  const {
    userToken,
    initialSceneToken,
    navigateToImageTo3D,
    getViewportSize,
    promptSignup,
    onRequestNewSceneSelector,
  } = options;

  // Read the session live at call time rather than through the memoized
  // closure. EngineProvider captures the adapter exactly once at engine
  // construction (adapter is intentionally excluded from its effect deps);
  // the webapp session resolves async, so the engine usually captures an
  // adapter built before `userToken` is known. A live store read keeps
  // user-dependent methods correct regardless of capture timing.
  const getLiveUser = () => useSessionStore.getState().user;

  return useMemo<PageSceneAdapter>(
    () => ({
      enqueueGeneration: async () => {
        if (!getLiveUser()) {
          promptSignup("generate");
          return { status: "fail" };
        }
        // Generation through the webapp adapter isn't wired up yet —
        // signed-in users still hit this path during the editor port.
        return { status: "fail" };
      },

      saveScene: ({ saveJson, sceneTitle, sceneToken, sceneThumbnail }) =>
        saveSceneViaApi(saveJson, sceneTitle, sceneToken, sceneThumbnail),

      loadScene: loadSceneViaApi,

      // Engine-driven scene-meta transitions (new scene on init,
      // editor.newScene() user action). Mirrors the data straight into
      // the store so the lib's surfaces (File menu, visitor gate) and
      // the webapp's header title display all read consistent state.
      // Scene-load metadata is populated separately inside
      // loadSceneViaApi above — the lib doesn't emit this callback on
      // the load path.
      onSceneTitleChange: (meta) => {
        usePageSceneStore.getState().setSceneMeta({
          title: meta.title,
          token: meta.token,
          ownerToken: meta.ownerToken,
          isModified: meta.isModified,
          isInitializing: false,
        });
      },

      fetchAsset: (url: string, init?: { signal?: AbortSignal }) =>
        fetch(url, { mode: "cors", signal: init?.signal }),

      getCdnOrigin: () => GetCdnOrigin(),
      getApiSchemeAndHost: apiHost,
      getCurrentUserToken: () => getLiveUser()?.user_token,

      getCdnUrl: (bucketPath, width, quality) => {
        const base = GetCdnOrigin();
        const path = bucketPath?.startsWith("/")
          ? bucketPath
          : `/${bucketPath ?? ""}`;
        const params: string[] = [];
        if (width) params.push(`width=${width}`);
        if (quality) params.push(`quality=${quality}`);
        if (params.length === 0) return `${base}${path}`;
        return `${base}/cdn-cgi/image/${params.join(",")}${path}`;
      },

      // The wrapper around <Stage3D> creates a fixed-positioning containing
      // block sized via the webapp's SidebarInset flex layout. Return its
      // live size so the lib's DnD hit-testing matches what the user sees,
      // not raw `window.innerWidth/innerHeight`.
      getViewportSize,

      listUserMediaFiles: async (query) => {
        const user = getLiveUser();
        if (!user) {
          return {
            success: false,
            data: [],
            pagination: undefined,
            errorMessage: "Sign in to load your saved scenes.",
          };
        }
        const api = new MediaFilesApi();
        const response = await api.ListUserMediaFiles({
          username: user.username,
          // Saved scenes are persisted with is_user_upload = TRUE; the
          // list endpoint excludes uploads unless this is set (matches
          // the Tauri adapter's ArtcraftMediaFilesApi behavior).
          include_user_uploads: true,
          page_size: query.pageSize,
          page_index: query.pageIndex,
          // Lib's FilterEngineCategories has a SPLAT variant that the API
          // enum doesn't yet — cast through unknown is safe at runtime
          // since the wire format is the same string.
          filter_engine_categories:
            query.filterEngineCategories as unknown as never,
          filter_media_type: query.filterMediaTypes as unknown as never,
        });
        return {
          success: response.success,
          data: response.data as never,
          pagination: response.pagination,
          errorMessage: response.errorMessage,
        };
      },

      listFeaturedMediaFiles: async (query) => {
        const api = new MediaFilesApi();
        const response = await api.ListFeaturedMediaFiles({
          page_size: query.pageSize,
          cursor: query.cursor,
          filter_engine_categories:
            query.filterEngineCategories as unknown as never,
          filter_media_type: query.filterMediaTypes as unknown as never,
        });
        return {
          success: response.success,
          data: response.data as never,
          pagination: response.pagination,
          errorMessage: response.errorMessage,
        };
      },

      showToast: (level: ToastTypes, message: string) => {
        showToast(level === ToastTypes.ERROR ? "error" : "success", message);
      },

      getMediaUrlByToken: async (token) => {
        const api = new MediaFilesApi();
        const response = await api.GetMediaFileByToken({ mediaFileToken: token });
        return response.data?.media_links?.cdn_url ?? "";
      },

      // Batch URL resolution — backs the scene loader's warm cache so
      // it can fire all per-asset binary fetches in parallel after a
      // single metadata roundtrip. Hits GET /v1/media_files/batch.
      getMediaUrlsByTokens: async (tokens: string[]) => {
        if (tokens.length === 0) return {};
        const api = new MediaFilesApi();
        const response = await api.ListMediaFilesByTokens({
          mediaTokens: tokens,
        });
        const urls: Record<string, string> = {};
        for (const file of response.data ?? []) {
          const cdn = file?.media_links?.cdn_url;
          if (cdn) urls[file.token] = cdn;
        }
        return urls;
      },

      renderAssetBrowser: () => null,
      renderSceneLoader: () => null,
      renderAssetUploader: (props) => (
        <UploadModal3D
          isOpen={props.isOpen}
          onClose={props.onClose}
          onSuccess={props.onSuccess}
          title={props.title}
          titleIcon={props.titleIcon}
        />
      ),
      renderImageUploader: (props) => (
        <UploadModalImage
          isOpen={props.isOpen}
          onClose={props.onClose}
          onSuccess={props.onSuccess}
          title={props.title}
          titleIcon={props.titleIcon}
        />
      ),
      renderSplatUploader: (props) => (
        <UploadModalSplat
          isOpen={props.isOpen}
          onClose={props.onClose}
          onSuccess={props.onSuccess}
          title={props.title}
          titleIcon={props.titleIcon}
        />
      ),

      uploadImage: UploadImageMedia,

      uploadPlaneFromMediaToken: async ({ title, mediaToken, progressCallback }) => {
        progressCallback({ status: UploaderStates.uploadingAsset });
        const mediaApi = new MediaFilesApi();
        const fileResp = await mediaApi.GetMediaFileByToken({ mediaFileToken: mediaToken });
        if (!fileResp.success || !fileResp.data) {
          progressCallback({
            status: UploaderStates.assetError,
            errorMessage:
              fileResp.errorMessage ?? "Could not fetch media file by token.",
          });
          return;
        }
        if (title && fileResp.data.maybe_title !== title) {
          const renameResp = await mediaApi.RenameMediaFileByToken({
            mediaToken,
            name: title,
          });
          if (!renameResp.success) {
            progressCallback({
              status: UploaderStates.assetError,
              errorMessage:
                renameResp.errorMessage ?? "Could not rename media file.",
            });
            return;
          }
        }
        progressCallback({ status: UploaderStates.success });
      },

      navigateToImageTo3D,

      promptSignup,

      onRequestNewSceneSelector,

      // Powers the lib's "Reset to original" menu item. The cache has
      // the server's snapshot we seeded on first load; pipe it back
      // through `Editor.applyJson` (which clears undo history and
      // re-renders) and mirror `current = original` in the cache so a
      // pre-serialization reload doesn't drag the edits back.
      resetToOriginal: async () => {
        if (!initialSceneToken) return;
        const editor = getActiveEditor();
        if (!editor) return;
        const entry = useSceneCacheStore
          .getState()
          .getEntry(initialSceneToken);
        if (!entry?.original) return;
        await editor.applyJson(entry.original);
        useSceneCacheStore
          .getState()
          .resetCurrentToOriginal(initialSceneToken);
      },

      performLogout: async () => {
        try {
          await new UsersApi().Logout();
        } catch {
          // Best-effort logout — clear local state regardless.
        }
        invalidateSession();
        window.location.href = "/";
      },

      initialSceneToken,
    }),
    [
      userToken,
      initialSceneToken,
      navigateToImageTo3D,
      getViewportSize,
      promptSignup,
      onRequestNewSceneSelector,
    ],
  );
};
