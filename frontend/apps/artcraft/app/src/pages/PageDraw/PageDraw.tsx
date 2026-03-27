import React, { useMemo } from "react";
import {
  PageDraw as PageDrawLib,
  useSceneStore,
  type PageDrawAdapter,
  type BaseSelectorImage,
  type ImageBundle,
} from "@storyteller/ui-pagedraw";
import {
  EnqueueEditImage,
  EnqueueEditImageRequest,
  EnqueueEditImageSize,
  EnqueueEditImageResolution,
  EnqueueImageInpaint,
  EnqueueImageInpaintRequest,
  EnqueueImageBgRemoval,
  useCanvasBgRemovedEvent,
} from "@storyteller/tauri-api";
import { useImageEditCompleteEvent } from "@storyteller/tauri-events";
import { UploadImageMedia } from "@storyteller/api";
import {
  BaseImageSelector,
} from "../PageEdit/BaseImageSelector";

// ─── Aspect ratio / resolution mappers ────────────────────────────────────────
const mapAspectRatio = (ratio?: string): EnqueueEditImageSize | undefined => {
  switch (ratio) {
    case "auto":   return EnqueueEditImageSize.Auto;
    case "wide":   return EnqueueEditImageSize.Wide;
    case "tall":   return EnqueueEditImageSize.Tall;
    case "square": return EnqueueEditImageSize.Square;
    default:       return undefined;
  }
};

const mapResolution = (res?: string): EnqueueEditImageResolution | undefined => {
  switch (res) {
    case "1k": return EnqueueEditImageResolution.OneK;
    case "2k": return EnqueueEditImageResolution.TwoK;
    case "4k": return EnqueueEditImageResolution.FourK;
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

  // When an image-edit generation completes, add the result to the history
  // stack and resolve the pending placeholder.
  useImageEditCompleteEvent(async (event) => {
    const newBundle: ImageBundle = {
      images: event.edited_images.map(
        (img) =>
          ({
            url: img.cdn_url,
            mediaToken: img.media_token,
            thumbnailUrlTemplate: img.maybe_thumbnail_template,
            fullImageUrl: img.cdn_url,
          }) as BaseSelectorImage,
      ),
    };

    const store = useSceneStore.getState();
    store.addHistoryImageBundle(newBundle);
    if (event.maybe_frontend_subscriber_id) {
      store.resolvePendingGeneration(event.maybe_frontend_subscriber_id);
    }
  });
};

// ─── TauriPageDrawAdapter ──────────────────────────────────────────────────────
const useTauriAdapter = (): PageDrawAdapter => {
  return useMemo<PageDrawAdapter>(
    () => ({
      enqueueEditImage: async (req) => {
        const request: EnqueueEditImageRequest = {
          model: req.model,
          scene_image_media_token: req.sceneImageMediaToken,
          image_media_tokens: req.imageMediaTokens,
          prompt: req.prompt,
          disable_system_prompt: req.disableSystemPrompt,
          image_count: req.imageCount,
          aspect_ratio: mapAspectRatio(req.aspectRatio),
          image_resolution: mapResolution(req.imageResolution),
          frontend_caller: req.frontendCaller,
          frontend_subscriber_id: req.frontendSubscriberId,
        };
        if (req.provider) request.provider = req.provider;
        return EnqueueEditImage(request);
      },

      enqueueInpaint: async (req) => {
        const request: EnqueueImageInpaintRequest = {
          model: req.model,
          image_media_token: req.imageMediaToken,
          mask_image_raw_bytes: req.maskImageRawBytes,
          prompt: req.prompt,
          image_count: req.imageCount,
          frontend_caller: req.frontendCaller,
          frontend_subscriber_id: req.frontendSubscriberId,
        };
        if (req.provider) request.provider = req.provider;
        return EnqueueImageInpaint(request);
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
