// PageSceneAdapter implementation for the artcraft website.
//
// Mirrors the Tauri host's adapter shape but uses REST calls from
// `@storyteller/api` instead of FetchProxy / GenerateImage Tauri
// commands. Built once per <PageScene> mount via useMemo, keyed on
// `userToken` + `initialSceneToken` so signing in mid-session re-arms
// ownership-based UI gating without unmounting the editor.
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
import { ToastTypes } from "@storyteller/ui-pagescene";
import {
  UploadModal3D,
  UploadModalImage,
  UploadModalSplat,
  UploaderStates,
} from "@storyteller/ui-upload-modal";
import { showToast } from "../../components/toast/toast";
import { invalidateSession } from "../../lib/session";

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
  if (sceneThumbnail) {
    try {
      const coverResp = await uploadApi.UploadImage({
        blob: sceneThumbnail,
        fileName: "render.png",
        uuid: crypto.randomUUID(),
        maybe_title: "Screenshot",
      });
      if (coverResp.success && coverResp.data) {
        await new MediaFilesApi().UpdateCoverImage({
          mediaFileToken: newToken,
          imageToken: coverResp.data,
        });
      }
    } catch {
      // Cover image is best-effort — the scene is still saved.
    }
  }
  return newToken;
};

const loadSceneViaApi = async (token: string): Promise<unknown> => {
  const mediaApi = new MediaFilesApi();
  const meta = await mediaApi.GetMediaFileByToken({ mediaFileToken: token });
  const cdnUrl = meta.data?.media_links?.cdn_url;
  if (!cdnUrl) throw new Error("Scene CDN URL missing");

  const fileResp = await fetch(cdnUrl);
  if (!fileResp.ok) throw new Error(`Scene fetch HTTP ${fileResp.status}`);
  const text = await fileResp.text();
  return JSON.parse(text);
};

// ─── Adapter ───────────────────────────────────────────────────────────────

export interface WebPageSceneAdapterOptions {
  userToken: string | undefined;
  initialSceneToken: string | undefined;
  navigateToImageTo3D: () => void;
}

export const useWebPageSceneAdapter = (
  options: WebPageSceneAdapterOptions,
): PageSceneAdapter => {
  const { userToken, initialSceneToken, navigateToImageTo3D } = options;

  return useMemo<PageSceneAdapter>(
    () => ({
      enqueueGeneration: async () => ({ status: "fail" }),

      saveScene: ({ saveJson, sceneTitle, sceneToken, sceneThumbnail }) =>
        saveSceneViaApi(saveJson, sceneTitle, sceneToken, sceneThumbnail),

      loadScene: loadSceneViaApi,

      fetchAsset: (url: string) => fetch(url, { mode: "cors" }),

      getCdnOrigin: () => GetCdnOrigin(),
      getApiSchemeAndHost: apiHost,
      getCurrentUserToken: () => userToken,

      getCdnUrl: (bucketPath, _width, _quality) =>
        `${GetCdnOrigin()}${bucketPath}`,

      listUserMediaFiles: async (query) => {
        if (!userToken) {
          // Anonymous viewers don't have a "my objects" library.
          return { success: false, data: [], pagination: undefined };
        }
        const api = new MediaFilesApi();
        const response = await api.ListUserMediaFiles({
          username: userToken,
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

      // Slot renders — asset/scene browser slots are unused by the lib
      // today; the three upload modals come from @storyteller/ui-upload-modal,
      // same components the Tauri host renders.
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

      // Drag-drop of a gallery item onto the canvas. Tauri host mirrors
      // this with an optional rename + success signal; no new endpoint
      // needed — the media plane already exists, we just resolve it and
      // optionally retitle.
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
    [userToken, initialSceneToken, navigateToImageTo3D],
  );
};
