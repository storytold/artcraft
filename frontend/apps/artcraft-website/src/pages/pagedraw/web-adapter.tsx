import { useMemo } from "react";
import {
  type PageDrawAdapter,
  type ImageBundle,
  useSceneStore,
} from "@storyteller/ui-pagedraw";
import {
  OmniGenApi,
  StorytellerApiHostStore,
  UploadImageMedia,
  type OmniGenImageRequest,
} from "@storyteller/api";
import { UploaderStates } from "@storyteller/common";
import { showToast } from "../../components/toast/toast";
import { startPolling, type PolledImage } from "./job-polling";

// ─── Local bg removal call ─────────────────────────────────────────────────────
// Inlined (not in @storyteller/api) until that lib's dist can be rebuilt
// against current source — its noEmitOnError gate currently blocks emits.

interface RemoveBgRequest {
  uuid_idempotency_token: string;
  media_file_token: string;
}

interface RemoveBgResponse {
  success: boolean;
  inference_job_token: string;
}

const SIGNED_SESSION_KEY = "artcraft_signed_session";

const sessionHeaders = (): Record<string, string> => {
  const base: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  try {
    const session = localStorage.getItem(SIGNED_SESSION_KEY);
    if (session) base.session = session;
  } catch {
    // localStorage unavailable
  }
  return base;
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

const polledImagesToBundle = (images: PolledImage[]): ImageBundle => ({
  images: images.map((img) => ({
    url: img.cdn_url,
    mediaToken: img.media_token,
    thumbnailUrlTemplate: img.maybe_thumbnail_template,
    fullImageUrl: img.cdn_url,
  })),
});

const startGenerationPoll = (jobToken: string, subscriberId: string) => {
  startPolling(
    jobToken,
    (images) => {
      const store = useSceneStore.getState();
      // Skip if user dismissed the placeholder.
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

const uploadBlobAsImage = async (blob: Blob, title: string): Promise<string | undefined> => {
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

const modelIdOf = (model: any): string => {
  if (!model) return "";
  if (typeof model === "string") return model;
  return model.id ?? model.tauriId ?? String(model);
};

// The lib's dist .d.ts still uses the old `canvasImageMediaToken` field name,
// while its source (and runtime) uses `sceneImageMediaToken`. Read both so we
// don't depend on which version is actually loaded by Vite.
const readSceneToken = (req: any): string | undefined =>
  req?.sceneImageMediaToken ?? req?.canvasImageMediaToken;

// ─── Adapter ───────────────────────────────────────────────────────────────────

export const useWebPageDrawAdapter = (): PageDrawAdapter => {
  return useMemo<PageDrawAdapter>(
    () => ({
      enqueueEditImage: async (req) => {
        const sceneToken = readSceneToken(req);
        const refTokens = [
          ...(sceneToken ? [sceneToken] : []),
          ...(req.imageMediaTokens ?? []),
        ].filter((t): t is string => !!t);

        const body: OmniGenImageRequest = {
          model: modelIdOf(req.model),
          prompt: req.prompt ?? null,
          idempotency_token: crypto.randomUUID(),
          aspect_ratio: req.aspectRatio ?? null,
          resolution: req.imageResolution ?? null,
          image_batch_count: req.imageCount ?? 1,
          image_media_tokens: refTokens.length ? refTokens : null,
        };

        try {
          const api = new OmniGenApi();
          const response = await api.generateImage(body);
          if (
            response.success &&
            response.inference_job_token &&
            req.frontendSubscriberId
          ) {
            startGenerationPoll(response.inference_job_token, req.frontendSubscriberId);
            return { status: "success" };
          }
          showToast("error", "Generation failed to enqueue");
          return { status: "fail" };
        } catch (e: any) {
          showToast("error", `Generation error: ${e?.message ?? e}`);
          return { status: "fail" };
        }
      },

      enqueueInpaint: async (req) => {
        // The omni-gen REST endpoint doesn't yet accept a raw mask payload;
        // surface clearly until a multipart endpoint or mask-upload step exists.
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
          const mediaToken = await uploadBlobAsImage(blob, `bg-removal-${nodeId}`);
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
          showToast("error", `Background removal error: ${e?.message ?? e}`);
        }
      },

      uploadImage: UploadImageMedia,

      showToast: (type, message) => {
        showToast(type === "info" ? "success" : type, message);
      },
    }),
    [],
  );
};
