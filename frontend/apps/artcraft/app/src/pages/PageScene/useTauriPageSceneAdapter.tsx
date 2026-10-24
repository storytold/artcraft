// PageSceneAdapter implementation backed by the artcraft host's Tauri
// + HTTP plumbing. Built once per <PageScene> mount via useMemo so the
// reference is stable across re-renders (matters because the lib's
// EngineProvider holds the adapter in a ref keyed at construction time).
//
// Replaces the previous engine/api_manager.ts + engine/api_fetchers.ts
// surface — those files are gone; their bodies live here as the
// host-side implementation of the adapter contract.

import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  GenerateImage,
  GenerateImageRequest,
  LoadWithoutCors,
} from "@storyteller/tauri-api";
import { FetchProxy } from "@storyteller/tauri-utils";
import {
  MediaFilesApi,
  StorytellerApiHostStore,
  UploadImageMedia,
} from "@storyteller/api";
import type { PageSceneAdapter } from "@storyteller/ui-pagescene";
import { ToastTypes } from "@storyteller/ui-pagescene";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";
import { BucketConfig } from "~/api/BucketConfig";
import { MediaFilesApi as ArtcraftMediaFilesApi } from "~/Classes/ApiManager";
import {
  UploadModal3D,
  UploadModalImage,
  UploadModalSplat,
} from "@storyteller/ui-upload-modal";
import { uploadImage as hostUploadImage } from "~/components/reusable/UploadModalMedia/uploadImage";
import { uploadPlaneFromMediaToken as hostUploadPlaneFromMediaToken } from "~/components/reusable/UploadModalMedia/uploadPlane";
import { useTabStore } from "~/pages/Stores/TabState";
import { setLogoutStates } from "~/signals/authentication/utilities";
import {
  addToast,
  authentication,
  pageHeight,
  pageWidth,
  signalScene,
} from "~/signals";
import { sceneOutputAdapter } from "./sceneOutputAdapter";

const apiHost = () =>
  StorytellerApiHostStore.getInstance().getApiSchemeAndHost();

// — Scene file save/load (replaces api_fetchers.ts) ────────────────────

const uploadNewScene = async (file: File, sceneTitle: string) => {
  const formData = new FormData();
  formData.append("uuid_idempotency_token", uuidv4());
  formData.append("file", file);
  formData.append("maybe_title", sceneTitle);
  formData.append("maybe_visibility", "public");
  formData.append("engine_category", "scene");

  return FetchProxy(`${apiHost()}/v1/media_files/upload/new_scene`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
    body: formData,
  })
    .then((res) => res.json())
    .then((res) => (res?.success ? res : { success: false }))
    .catch(() => ({ success: false }));
};

const updateExistingScene = async (file: File, sceneToken: string) => {
  const formData = new FormData();
  formData.append("uuid_idempotency_token", uuidv4());
  formData.append("file", file);

  return FetchProxy(
    `${apiHost()}/v1/media_files/upload/saved_scene/${sceneToken}`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
      body: formData,
    },
  )
    .then((res) => res.json())
    .then((res) => (res?.success ? res : { success: false }))
    .catch(() => ({ success: false }));
};

const uploadSceneCoverImage = async (blob: Blob, fileName: string) => {
  const formData = new FormData();
  formData.append("uuid_idempotency_token", uuidv4());
  formData.append("is_intermediate_system_file", "true");
  formData.append("maybe_title", "Screenshot");
  formData.append("file", blob, fileName);

  const response = await fetch(`${apiHost()}/v1/media_files/upload/image`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
    body: formData,
  });
  if (!response.ok) throw new Error("Upload Media Failed to send file");
  return response.json();
};

const setSceneCoverImage = async (
  sceneToken: string,
  coverImageToken: string,
) => {
  await fetch(`${apiHost()}/v1/media_files/cover_image/${sceneToken}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cover_image_media_file_token: coverImageToken }),
  });
};

// — Scene load (replaces api_manager.loadSceneState body) ──────────────

const loadSceneState = async (
  scene_media_file_token: string,
): Promise<unknown> => {
  const url = `${apiHost()}/v1/media_files/file/${scene_media_file_token}`;
  const response = await fetch(url);
  if (response.status > 200) throw new Error("Failed to load scene");

  const json = await response.json();
  if (json?.media_file?.maybe_title === null) {
    console.warn(`Scene /w Token: ${scene_media_file_token} has no title`);
  }
  const bucket_path = json["media_file"]["public_bucket_path"];
  const media_url = `${GetCdnOrigin()}${bucket_path}`;

  const file_response = await fetch(media_url);
  if (!file_response.ok) throw new Error("Failed to download file");

  // Parse directly rather than inside a FileReader callback: a JSON.parse
  // throw inside onloadend was never caught, so a corrupt scene file left this
  // promise pending forever (the loader hung instead of reporting an error).
  const sceneJson = JSON.parse(await file_response.text());

  // WHY: signal the title/token only now that the scene file is in hand. The header and the Save button take the
  // open scene's token from this signal, so announcing it before the download meant a failed download (offline,
  // CDN error, corrupt file) left the editor holding the previous scene (or an empty one) under the NEW scene's
  // token, and the next Save wrote that content over the scene the user had tried to open.
  if (json?.media_file) {
    signalScene({
      title: json.media_file.maybe_title || "Untitled Scene",
      token: scene_media_file_token || undefined,
      ownerToken: json.media_file.maybe_creator_user?.user_token,
      isModified: false,
    });
  }
  return sceneJson;
};

// — Hook ──────────────────────────────────────────────────────────────

export type TauriPageSceneAdapterOptions = {
  initialSceneToken?: string;
  cacheJsonString?: string;
  onSceneSerialized?: (json: string) => void;
};

export const useTauriPageSceneAdapter = (
  options: TauriPageSceneAdapterOptions = {},
): PageSceneAdapter => {
  const { initialSceneToken, cacheJsonString, onSceneSerialized } = options;
  return useMemo<PageSceneAdapter>(
    () => ({
      ...sceneOutputAdapter,
      enqueueGeneration: async (req) => {
        const request: GenerateImageRequest = {
          model: req.model,
          provider: req.provider,
          scene_image_media_token: req.sceneImageMediaToken,
          image_media_tokens: req.imageMediaTokens,
          prompt: req.prompt,
          batch_size: req.imageCount,
          aspect_ratio: req.aspectRatio,
          resolution: req.resolution,
          frontend_caller: req.frontendCaller,
          frontend_subscriber_id: req.frontendSubscriberId,
        };
        return GenerateImage(request);
      },

      uploadAsset: UploadImageMedia,

      saveScene: async ({
        saveJson,
        sceneTitle,
        sceneToken,
        sceneThumbnail,
      }) => {
        const file = new File([saveJson], `${sceneTitle}.glb`, {
          type: "application/json",
        });
        const uploadSceneResponse = sceneToken
          ? await updateExistingScene(file, sceneToken)
          : await uploadNewScene(file, sceneTitle);

        if (uploadSceneResponse["success"] === false) return "";

        // WHY: an update response may omit media_file_token; the scene being
        // updated is then identified by the token we were given. Without this
        // the cover call hit cover_image/undefined and saveScene returned
        // undefined for a scene that did save.
        const savedSceneToken: string =
          uploadSceneResponse["media_file_token"] ?? sceneToken;

        if (sceneThumbnail) {
          // WHY: the scene is already saved at this point, so a cover-image
          // failure (upload throws on !ok) must not make saveScene report the
          // whole save as failed. Swallow it and still return the token.
          try {
            const image_resp = await uploadSceneCoverImage(
              sceneThumbnail,
              "render.png",
            );
            if (image_resp["success"] !== false && image_resp["media_file_token"]) {
              await setSceneCoverImage(
                savedSceneToken,
                image_resp["media_file_token"],
              );
            }
          } catch (error) {
            console.warn("Scene saved, but setting its cover image failed", error);
          }
        }

        return savedSceneToken;
      },

      loadScene: loadSceneState,

      uploadSceneCoverImage: async (blob: Blob, fileName: string) =>
        uploadSceneCoverImage(blob, fileName),

      setSceneCoverImage,

      fetchAsset: async (
        url: string,
        init?: { signal?: AbortSignal },
      ) => {
        // FetchProxy returns a Response; LoadWithoutCors returns
        // ArrayBuffer. Scene's load paths consume `.arrayBuffer()` from
        // the Response, so wrap LoadWithoutCors's result if FetchProxy
        // doesn't fit the URL (CDN media often needs the no-CORS path).
        //
        // signal is forwarded to FetchProxy (Tauri's plugin-http honors
        // it). The Tauri-invoke LoadWithoutCors fallback can't be
        // cancelled mid-flight — the lib's ticket guard still keeps
        // late-arriving buffers from polluting the scene, we just lose
        // the bandwidth saving in that fallback path.
        if (init?.signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        try {
          return await FetchProxy(url, { signal: init?.signal });
        } catch {
          const buffer = await LoadWithoutCors(url);
          return new Response(buffer);
        }
      },

      getCdnOrigin: () => GetCdnOrigin(),
      getApiSchemeAndHost: apiHost,
      getCurrentUserToken: () =>
        authentication.userInfo.value?.user_token,

      getCdnUrl: (bucketPath, width, quality) =>
        new BucketConfig().getCdnUrl(bucketPath, width, quality),

      listUserMediaFiles: async (query) => {
        const api = new ArtcraftMediaFilesApi();
        const response = await api.ListUserMediaFiles({
          page_size: query.pageSize,
          page_index: query.pageIndex,
          filter_engine_categories: query.filterEngineCategories,
          filter_media_type: query.filterMediaTypes,
        });
        return {
          success: response.success,
          data: response.data,
          pagination: response.pagination,
          errorMessage: response.errorMessage,
        };
      },

      listFeaturedMediaFiles: async (query) => {
        const api = new ArtcraftMediaFilesApi();
        const response = await api.ListFeaturedMediaFiles({
          page_size: query.pageSize,
          cursor: query.cursor,
          filter_engine_categories: query.filterEngineCategories,
          filter_media_type: query.filterMediaTypes,
        });
        return {
          success: response.success,
          data: response.data,
          pagination: response.pagination,
          errorMessage: response.errorMessage,
        };
      },

      showToast: (level: ToastTypes, message: string) =>
        addToast(level, message),

      getMediaUrlByToken: async (token) => {
        const mediaFilesApi = new MediaFilesApi();
        const response = await mediaFilesApi.GetMediaFileByToken({
          mediaFileToken: token,
        });
        // WHY: a failed lookup has no data; the old non-null assertion threw
        // an opaque TypeError. Name the token so the failure is diagnosable.
        const cdnUrl = response.data?.media_links?.cdn_url;
        if (!cdnUrl) {
          throw new Error(`Failed to look up media file for token: ${token}`);
        }
        return cdnUrl;
      },

      // Batch URL resolution via GET /v1/media_files/batch — backs the
      // scene loader's warm cache so it can fire all per-asset binary
      // fetches in parallel after a single metadata roundtrip.
      getMediaUrlsByTokens: async (tokens: string[]) => {
        if (tokens.length === 0) return {};
        const mediaFilesApi = new MediaFilesApi();
        const response = await mediaFilesApi.ListMediaFilesByTokens({
          mediaTokens: tokens,
        });
        const urls: Record<string, string> = {};
        for (const file of response.data ?? []) {
          const cdn = file?.media_links?.cdn_url;
          if (cdn) urls[file.token] = cdn;
        }
        return urls;
      },

      onSceneTitleChange: (meta) => signalScene(meta as never),

      getViewportSize: () => ({
        width: pageWidth.value,
        height: pageHeight.value,
      }),

      // Slot renderers — host-owned UI for asset browser + scene
      // loader. Today these are still rendered inside PageEditor's own
      // asset modal; once those move into the lib, the lib will call
      // these renderers from inside its own AssetMenu container.
      renderAssetBrowser: () => null,
      renderSceneLoader: () => null,

      renderAssetUploader: (props) => (
        <UploadModal3D
          isOpen={props.isOpen}
          onClose={props.onClose}
          onSuccess={props.onSuccess}
          title={props.title}
          titleIcon={props.titleIcon}
          initialCategory={props.initialCategory}
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

      uploadImage: hostUploadImage,
      uploadPlaneFromMediaToken: hostUploadPlaneFromMediaToken,

      navigateToImageTo3D: () => {
        useTabStore.getState().setActiveTab("IMAGE_TO_3D_OBJECT");
      },

      performLogout: () => setLogoutStates(),

      initialSceneToken,
      cacheJsonString,
      onSceneSerialized,
    }),
    [initialSceneToken, cacheJsonString, onSceneSerialized],
  );
};
