import React, { useMemo } from "react";
import {
  PageDraw as PageDrawLib,
  useSceneStore,
  type PageDrawAdapter,
  type BaseSelectorImage,
  type ImageBundle,
} from "@storyteller/ui-pagedraw";
import {
  GenerateImage,
  GenerateImageRequest,
  EnqueueImageBgRemoval,
  useCanvasBgRemovedEvent,
} from "@storyteller/tauri-api";
import { CommonAspectRatio, CommonResolution } from "@storyteller/model-list";
import { useTextToImageGenerationCompleteEvent } from "@storyteller/tauri-events";
import { UploadImageMedia } from "@storyteller/api";
import { BaseImageSelector } from "./BaseImageSelector";

// ─── Aspect ratio / resolution mappers ────────────────────────────────────────
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

// ─── Tauri event bridges ───────────────────────────────────────────────────────
// These hooks wire Tauri backend events into the shared Zustand store.
// They live here so the lib itself has no Tauri imports.
const useTauriEventBridges = () => {
  // When a bg-removal job completes, update the node in the canvas store.
  useCanvasBgRemovedEvent(async (event) => {
    const nodeId = event.maybe_frontend_subscriber_id;
    if (!nodeId) {
      console.error("No node ID received from background removal event");
      return;
    }
    useSceneStore
      .getState()
      .finishRemoveBackground(nodeId, event.media_token, event.image_cdn_url);
  });

  // The unified `generate_image` Tauri command emits
  // `text_to_image_generation_complete_event` regardless of whether the
  // request was a plain text-to-image, an edit, or an inpaint. We filter on
  // `frontend_subscriber_id` so PageDraw only resolves placeholders it
  // enqueued itself — other pages (Angles, etc.) ignore subscriber IDs they
  // don't own. Same pattern as PageAngles/AnglesStore.
  useTextToImageGenerationCompleteEvent(async (event) => {
    const store = useSceneStore.getState();
    if (store.pendingGenerations.length === 0) return;

    const subscriberId = event.maybe_frontend_subscriber_id;
    if (
      subscriberId &&
      !store.pendingGenerations.some((p) => p.id === subscriberId)
    ) {
      return;
    }

    const resolvedId = subscriberId ?? store.pendingGenerations[0]?.id;

    const newBundle: ImageBundle = {
      images: event.generated_images.map(
        (img) =>
          ({
            url: img.cdn_url,
            mediaToken: img.media_token,
            thumbnailUrlTemplate: img.maybe_thumbnail_template,
            fullImageUrl: img.cdn_url,
          }) as BaseSelectorImage,
      ),
    };

    store.addHistoryImageBundle(newBundle);
    if (resolvedId) store.resolvePendingGeneration(resolvedId);
  });
};

// ─── TauriPageDrawAdapter ──────────────────────────────────────────────────────
const useTauriAdapter = (): PageDrawAdapter => {
  return useMemo<PageDrawAdapter>(
    () => ({
      enqueueEditImage: async (req) => {
        const request: GenerateImageRequest = {
          model: req.model,
          scene_image_media_token: req.sceneImageMediaToken,
          image_media_tokens: req.imageMediaTokens,
          prompt: req.prompt,
          enable_system_prompt:
            typeof req.disableSystemPrompt === "boolean"
              ? !req.disableSystemPrompt
              : undefined,
          batch_size: req.imageCount,
          aspect_ratio: mapAspectRatio(req.aspectRatio),
          resolution: mapResolution(req.imageResolution),
          frontend_caller: req.frontendCaller,
          frontend_subscriber_id: req.frontendSubscriberId,
        };
        if (req.provider) request.provider = req.provider;
        return GenerateImage(request);
      },

      enqueueInpaint: async (req) => {
        const request: GenerateImageRequest = {
          model: req.model,
          image_media_tokens: req.imageMediaToken ? [req.imageMediaToken] : undefined,
          inpainting_mask_image_raw_bytes: req.maskImageRawBytes,
          prompt: req.prompt,
          batch_size: req.imageCount,
          frontend_caller: req.frontendCaller,
          frontend_subscriber_id: req.frontendSubscriberId,
        };
        if (req.provider) request.provider = req.provider;
        return GenerateImage(request);
      },

      enqueueBgRemoval: async (base64Image, nodeId) => {
        await EnqueueImageBgRemoval({
          base64_image: base64Image,
          frontend_caller: "image_editor",
          frontend_subscriber_id: nodeId,
        });
      },

      uploadImage: UploadImageMedia,

      onEnqueueMeta: (meta) => (window as any).__storeTaskEnqueueMeta?.(meta),

      renderBaseImageSelector: ({ onImageSelect, showLoading }) => (
        <BaseImageSelector
          onImageSelect={onImageSelect}
          showLoading={showLoading}
        />
      ),
    }),
    [],
  );
};

// ─── PageDraw wrapper ──────────────────────────────────────────────────────────
const PageDraw = () => {
  useTauriEventBridges();
  const adapter = useTauriAdapter();
  return <PageDrawLib adapter={adapter} />;
};

export default PageDraw;
