// PageDrawAdapter implementation for the artcraft webapp.
//
// Plugs the shared @storyteller/ui-pagedraw lib into the webapp by speaking
// REST instead of Tauri commands:
//   - enqueueEditImage → OmniGenApi.generateImage, then poll the job and feed
//     results back into the lib's Zustand store (addHistoryImageBundle /
//     resolvePendingGeneration), keyed on frontendSubscriberId.
//   - enqueueBgRemoval → upload base64 → media token → POST
//     /v1/generate/image/remove_background → poll → finishRemoveBackground.
//   - uploadImage → UploadImageMedia (shared REST uploader).
//   - renderBaseImageSelector → the webapp's own upload/library/blank picker.
//
// Inpaint is intentionally stubbed: the omni-gen REST endpoint doesn't yet
// accept a raw mask payload, so we surface a clear toast until that path
// exists. Mirrors the artcraft-website pagedraw port.

import { useMemo } from "react";
import {
  type PageDrawAdapter,
  type PageDrawPersistenceAdapter,
  type ImageBundle,
  type BaseSelectorImage,
  useSceneStore,
} from "@storyteller/ui-pagedraw";
import { CommonAspectRatio, CommonResolution } from "@storyteller/model-list";
import {
  MediaFilesApi,
  OmniGenApi,
  ProjectsApi,
  StorytellerApiHostStore,
  UploadImageMedia,
  type OmniGenImageRequest,
} from "@storyteller/api";
import { UploaderStates } from "@storyteller/common";
import { showToast } from "../../components/toast/toast";
import { useInsufficientCredits } from "../../components/insufficient-credits-modal";
import { useSessionStore } from "../../lib/session";
import { BaseImageSelector } from "./base-image-selector";
import { startPolling, type PolledImage } from "./job-polling";

// ─── Local bg-removal call ──────────────────────────────────────────────────
// Inlined (no dedicated method in @storyteller/api yet). Mirrors ApiManager's
// auth: cookies via credentials:"include", plus the signed-session header
// fallback for browsers that block third-party cookies.

const SESSION_STORAGE_KEY = "artcraft_signed_session";

interface RemoveBgRequest {
  uuid_idempotency_token: string;
  media_file_token: string;
}

interface RemoveBgResponse {
  success: boolean;
  inference_job_token: string;
}

const sessionHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const session = localStorage.getItem(SESSION_STORAGE_KEY);
    if (session) headers.session = session;
  } catch {
    // localStorage unavailable — rely on the cookie.
  }
  return headers;
};

const removeImageBackground = async (
  body: RemoveBgRequest,
): Promise<RemoveBgResponse> => {
  const host = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  const response = await fetch(`${host}/v1/generate/image/remove_background`, {
    method: "POST",
    headers: sessionHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Background removal HTTP ${response.status}`);
  }
  return response.json();
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const polledImagesToBundle = (images: PolledImage[]): ImageBundle => ({
  images: images.map(
    (img) =>
      ({
        url: img.cdn_url,
        mediaToken: img.media_token,
        thumbnailUrlTemplate: img.maybe_thumbnail_template,
        fullImageUrl: img.cdn_url,
      }) as BaseSelectorImage,
  ),
});

const startGenerationPoll = (jobToken: string, subscriberId: string) => {
  startPolling(
    jobToken,
    (images) => {
      const store = useSceneStore.getState();
      // The user may have dismissed the placeholder while the job ran.
      if (!store.pendingGenerations.some((p) => p.id === subscriberId)) return;
      store.addHistoryImageBundle(polledImagesToBundle(images));
      store.resolvePendingGeneration(subscriberId);
    },
    (reason) => {
      showToast("error", reason);
      useSceneStore.getState().resolvePendingGeneration(subscriberId);
    },
  );
};

const base64ToBlob = (base64: string): Blob => {
  const commaIdx = base64.indexOf(",");
  const raw = commaIdx >= 0 ? base64.slice(commaIdx + 1) : base64;
  const headerMatch =
    commaIdx >= 0 ? base64.slice(0, commaIdx).match(/data:(.*?);base64/) : null;
  const mime = headerMatch?.[1] ?? "image/png";
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const uploadBlobAsImage = async (
  blob: Blob,
  title: string,
): Promise<string | undefined> => {
  let mediaToken: string | undefined;
  const file = new File([blob], `${title}.png`, { type: blob.type });
  await UploadImageMedia({
    title,
    assetFile: file,
    progressCallback: (state) => {
      if (state.status === UploaderStates.success && state.data) {
        mediaToken = state.data;
      }
    },
  });
  return mediaToken;
};

// The PromptBox UI emits resolution/aspect-ratio as display labels ("1k",
// "wide", …); the omni-gen REST body wants the CommonResolution /
// CommonAspectRatio enum values ("one_k", "wide", …). Mirror the desktop
// PageDraw adapter's mappers so an unmapped "1k" doesn't 400 the request.
const mapAspectRatio = (ratio?: string): CommonAspectRatio | undefined => {
  switch (ratio) {
    case "auto":   return CommonAspectRatio.Auto;
    case "wide":   return CommonAspectRatio.Wide;
    case "tall":   return CommonAspectRatio.Tall;
    case "square": return CommonAspectRatio.Square;
    default:       return undefined;
  }
};

const mapResolution = (res?: string): CommonResolution | undefined => {
  switch (res) {
    case "1k": return CommonResolution.OneK;
    case "2k": return CommonResolution.TwoK;
    case "4k": return CommonResolution.FourK;
    default:   return undefined;
  }
};

// PageDrawEditRequest.model is an ImageModel object (or possibly a raw id);
// the omni-gen REST body wants the string id.
const modelIdOf = (model: unknown): string => {
  if (!model) return "";
  if (typeof model === "string") return model;
  const m = model as { id?: string; tauriId?: string };
  return m.id ?? m.tauriId ?? String(model);
};

// ApiManager throws Error("HTTP error! status: 402") on a non-2xx response, and
// our inlined bg-removal fetch throws "Background removal HTTP 402"; the JSON
// body isn't surfaced either way. Pull the 3-digit status out of the message so
// callers can special-case 402 Payment Required.
const httpStatusFromError = (e: unknown): number | undefined => {
  const message = e instanceof Error ? e.message : String(e);
  const match = /(\d{3})/.exec(message);
  return match ? Number(match[1]) : undefined;
};

// ─── Session persistence (editor_2d project documents) ─────────────────────
// Server persistence over the project-document endpoints: each pagedraw
// session is one editor_2d project (multipart JSON upload; save-new returns
// the media file token linking the session to its server row). Mirrors the
// moodboard's webapp persistence adapter. All methods are non-throwing per
// the adapter contract.

export const pageDrawPersistence: PageDrawPersistenceAdapter = {
  getUserId: () => useSessionStore.getState().user?.user_token ?? null,
  subscribeAuthState: (onChange) => useSessionStore.subscribe(onChange),

  uploadMedia: async (file) => {
    let token: string | null = null;
    try {
      await UploadImageMedia({
        title: file.name || "PageDraw image",
        assetFile: file,
        progressCallback: (state) => {
          if (state.status === UploaderStates.success && state.data) {
            token = String(state.data);
          }
        },
      });
    } catch (error) {
      console.error("[PageDraw] media upload failed", error);
    }
    return token;
  },

  createProject: async ({ documentJson, name }) => {
    try {
      const response = await new ProjectsApi().UploadNewProject({
        projectType: "editor_2d",
        blob: new Blob([documentJson], { type: "application/json" }),
        fileName: `${name || "Untitled session"}.editor.json`,
        uuid: crypto.randomUUID(),
        maybe_title: name,
      });
      return {
        success: response.success && !!response.data,
        token: response.data,
        errorMessage: response.errorMessage,
      };
    } catch (error) {
      console.error("[PageDraw] project create failed", error);
      return { success: false };
    }
  },

  updateProject: async ({ token, documentJson, name }) => {
    try {
      const response = await new ProjectsApi().UpdateProject({
        projectType: "editor_2d",
        token,
        blob: new Blob([documentJson], { type: "application/json" }),
        fileName: `${name || "Untitled session"}.editor.json`,
        uuid: crypto.randomUUID(),
        maybe_title: name,
      });
      return { success: response.success, errorMessage: response.errorMessage };
    } catch (error) {
      console.error("[PageDraw] project update failed", error);
      return { success: false };
    }
  },

  getProjectInfo: async (token) => {
    try {
      const response = await new MediaFilesApi().GetMediaFileByToken({
        mediaFileToken: token,
      });
      if (!response.success || !response.data) return { success: false };
      return {
        success: true,
        updatedAt: response.data.updated_at,
        title: response.data.maybe_title ?? null,
      };
    } catch (error) {
      console.error("[PageDraw] project info fetch failed", error);
      return { success: false };
    }
  },

  loadProjectDocument: async (token) => {
    try {
      const response = await new MediaFilesApi().GetMediaFileByToken({
        mediaFileToken: token,
      });
      const cdnUrl = response.success
        ? response.data?.media_links?.cdn_url
        : undefined;
      if (!cdnUrl) return { success: false };
      const documentResponse = await fetch(cdnUrl);
      if (!documentResponse.ok) return { success: false };
      return { success: true, documentJson: await documentResponse.text() };
    } catch (error) {
      console.error("[PageDraw] session document fetch failed", error);
      return { success: false };
    }
  },

  listProjects: async () => {
    try {
      const response = await new ProjectsApi().ListSessionProjects({
        filter_project_type: "editor_2d",
        page_size: 100,
      });
      if (!response.success || !response.data) return { success: false };
      return {
        success: true,
        projects: response.data.map((row) => ({
          token: row.token,
          name: row.maybe_title ?? "Untitled session",
          updatedAt: row.updated_at,
        })),
      };
    } catch (error) {
      console.error("[PageDraw] session list failed", error);
      return { success: false };
    }
  },

  deleteProject: async (token) => {
    try {
      const response = await new MediaFilesApi().DeleteMediaFileByToken({
        mediaFileToken: token,
        asMod: false,
      });
      return response.success;
    } catch (error) {
      console.error("[PageDraw] session delete failed", error);
      return false;
    }
  },

  resolveMediaUrls: async (tokens) => {
    try {
      const response = await new MediaFilesApi().ListMediaFilesByTokens({
        mediaTokens: tokens,
      });
      const urlByToken: Record<string, string> = {};
      for (const media of response.data ?? []) {
        if (media.media_links?.cdn_url) {
          urlByToken[media.token] = media.media_links.cdn_url;
        }
      }
      return urlByToken;
    } catch (error) {
      console.error("[PageDraw] media URL resolution failed", error);
      return {};
    }
  },
};

// ─── Adapter ───────────────────────────────────────────────────────────────────

export const useWebPageDrawAdapter = (): PageDrawAdapter => {
  const openInsufficientCredits = useInsufficientCredits();

  return useMemo<PageDrawAdapter>(
    () => ({
      enqueueEditImage: async (req) => {
        const refTokens = [
          ...(req.canvasImageMediaToken ? [req.canvasImageMediaToken] : []),
          ...(req.imageMediaTokens ?? []),
        ].filter((t): t is string => !!t);

        const body: OmniGenImageRequest = {
          model: modelIdOf(req.model),
          prompt: req.prompt ?? null,
          idempotency_token: crypto.randomUUID(),
          aspect_ratio: mapAspectRatio(req.aspectRatio) ?? null,
          resolution: mapResolution(req.imageResolution) ?? null,
          image_batch_count: req.imageCount ?? 1,
          image_media_tokens: refTokens.length ? refTokens : null,
        };

        try {
          const response = await new OmniGenApi().generateImage(body);
          if (
            response.success &&
            response.inference_job_token &&
            req.frontendSubscriberId
          ) {
            startGenerationPoll(
              response.inference_job_token,
              req.frontendSubscriberId,
            );
            return { status: "success" };
          }
          showToast("error", "Generation failed to enqueue");
          return { status: "fail" };
        } catch (e: any) {
          // 402 Payment Required → the user is out of credits. Open the
          // upgrade/credits modal instead of a raw error toast, matching the
          // create-image / create-video generate handlers.
          if (httpStatusFromError(e) === 402) {
            openInsufficientCredits();
            return { status: "fail" };
          }
          showToast("error", `Generation error: ${e?.message ?? e}`);
          return { status: "fail" };
        }
      },

      enqueueInpaint: async (req) => {
        // The omni-gen REST endpoint doesn't yet accept a raw mask payload;
        // surface clearly until a multipart/mask-upload path exists.
        if (!req.maskImageRawBytes) {
          showToast("error", "Inpaint mask missing");
          return { status: "fail" };
        }
        showToast("error", "Inpainting is not yet available on the web");
        return { status: "fail" };
      },

      enqueueBgRemoval: async (base64Image, nodeId) => {
        try {
          const blob = base64ToBlob(base64Image);
          const mediaToken = await uploadBlobAsImage(
            blob,
            `bg-removal-${nodeId}`,
          );
          if (!mediaToken) {
            showToast("error", "Background removal upload failed");
            return;
          }
          const response = await removeImageBackground({
            uuid_idempotency_token: crypto.randomUUID(),
            media_file_token: mediaToken,
          });
          if (!response.success || !response.inference_job_token) {
            showToast("error", "Background removal failed to enqueue");
            return;
          }
          startPolling(
            response.inference_job_token,
            async (images) => {
              const out = images[0];
              if (!out) return;
              await useSceneStore
                .getState()
                .finishRemoveBackground(nodeId, out.media_token, out.cdn_url);
            },
            (reason) => showToast("error", reason),
          );
        } catch (e: any) {
          if (httpStatusFromError(e) === 402) {
            openInsufficientCredits();
            return;
          }
          showToast("error", `Background removal error: ${e?.message ?? e}`);
        }
      },

      uploadImage: UploadImageMedia,

      renderBaseImageSelector: ({ onImageSelect, showLoading }) => (
        <BaseImageSelector
          onImageSelect={onImageSelect}
          showLoading={showLoading}
        />
      ),

      persistence: pageDrawPersistence,
    }),
    [openInsufficientCredits],
  );
};
