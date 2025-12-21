import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { MediaFilesApi, MediaUploadApi } from "@storyteller/api";
import { v4 as uuidv4 } from "uuid";

export type ImageTo3DWorldResult = {
  id: string;
  mode: "image" | "text";
  timestamp: number;
  note?: string;
  previewUrl?: string;
  status: "pending" | "completed";
  subscriberId: string;
  modelUrl?: string;
  mediaToken?: string;
  coverImageUploaded?: boolean;
};

export const worldCoverImageCache = new Map<string, string>();

type ImageTo3DWorldState = {
  results: ImageTo3DWorldResult[];
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    subscriberId?: string,
  ) => string;
  completeGeneration: (
    modelUrl: string,
    mediaToken: string,
    maybeSubscriberId?: string,
  ) => void;
  uploadCoverFromPreview: (mediaToken: string) => Promise<void>;
  reset: () => void;
};

export const useImageTo3DWorldStore = create<ImageTo3DWorldState>(
  (set, get) => ({
    results: [],
    startGeneration: (
      mode: "image" | "text",
      note: string,
      previewUrl: string | undefined,
      subscriberId?: string,
    ) => {
      const id = subscriberId
        ? subscriberId
        : crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const result: ImageTo3DWorldResult = {
        id,
        mode,
        timestamp: Date.now(),
        note,
        previewUrl,
        status: "pending",
        subscriberId: id,
      };
      set((s) => ({ results: [result, ...s.results] }));
      return id;
    },
    completeGeneration: (
      modelUrl: string,
      mediaToken: string,
      maybeSubscriberId?: string,
    ) => {
      console.log("[ImageTo3DWorldStore] completeGeneration", {
        modelUrl,
        mediaToken,
        maybeSubscriberId,
      });
      const pending = maybeSubscriberId
        ? get().results.find((r) => r.subscriberId === maybeSubscriberId)
        : get().results.find((r) => r.status === "pending");

      set((s) => {
        const results = [...s.results];
        const targetIdx = pending
          ? results.findIndex((r) => r.subscriberId === pending.subscriberId)
          : -1;

        if (targetIdx === -1) {
          const generatedId =
            crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
          const result: ImageTo3DWorldResult = {
            id: generatedId,
            subscriberId: generatedId,
            mode: "image",
            timestamp: Date.now(),
            note: "Generated World",
            status: "completed",
            modelUrl,
            mediaToken,
          };
          return { results: [result, ...results] };
        }

        results[targetIdx] = {
          ...results[targetIdx],
          status: "completed",
          modelUrl,
          mediaToken,
        };

        return { results };
      });
    },
    uploadCoverFromPreview: async (mediaToken: string) => {
      try {
        const result = get().results.find((r) => r.mediaToken === mediaToken);
        if (!result) return;
        if (result.coverImageUploaded) {
          console.log(
            "[ImageTo3DWorldStore] Cover image already uploaded for:",
            mediaToken,
          );
          return;
        }

        if (!result.previewUrl) {
          console.log(
            "[ImageTo3DWorldStore] No preview URL available for cover",
          );
          return;
        }

        console.log(
          "[ImageTo3DWorldStore] Uploading cover from preview for:",
          mediaToken,
        );

        const response = await fetch(result.previewUrl);
        const blob = await response.blob();

        const mediaUploadApi = new MediaUploadApi();
        const uploadResult = await mediaUploadApi.UploadImage({
          blob,
          fileName: `cover-${mediaToken}.png`,
          uuid: uuidv4(),
        });

        if (!uploadResult.success || !uploadResult.data) {
          console.error("[ImageTo3DWorldStore] Failed to upload cover image");
          return;
        }

        const coverImageToken = uploadResult.data;
        console.log(
          "[ImageTo3DWorldStore] Cover image uploaded:",
          coverImageToken,
        );

        const mediaFilesApi = new MediaFilesApi();
        const setCoverResult = await mediaFilesApi.UpdateCoverImage({
          mediaFileToken: mediaToken,
          imageToken: coverImageToken,
        });

        if (setCoverResult.success) {
          console.log("[ImageTo3DWorldStore] Cover image set successfully");

          worldCoverImageCache.set(mediaToken, result.previewUrl);

          set((s) => ({
            results: s.results.map((r) =>
              r.mediaToken === mediaToken
                ? { ...r, coverImageUploaded: true }
                : r,
            ),
          }));
          window.dispatchEvent(
            new CustomEvent("cover-image-uploaded", {
              detail: { mediaToken, thumbnailDataUrl: result.previewUrl },
            }),
          );
        } else {
          console.error(
            "[ImageTo3DWorldStore] Failed to set cover image:",
            setCoverResult.errorMessage,
          );
        }
      } catch (error) {
        console.error(
          "[ImageTo3DWorldStore] Error uploading cover image:",
          error,
        );
      }
    },
    reset: () => set({ results: [] }),
  }),
);

interface GaussianGenerationEvent {
  data: {
    generated_gaussian?: {
      cdn_url: string;
      media_token: string;
      maybe_thumbnail_template?: string;
    };
    maybe_frontend_subscriber_id?: string;
  };
}

listen<GaussianGenerationEvent>(
  "gaussian_generation_complete_event",
  (event) => {
    const payload = event.payload?.data;
    if (payload?.maybe_frontend_subscriber_id && payload?.generated_gaussian) {
      console.log(
        "[ImageTo3DWorldStore] Gaussian event received for subscriber:",
        payload.maybe_frontend_subscriber_id,
      );
      useImageTo3DWorldStore
        .getState()
        .completeGeneration(
          payload.generated_gaussian.cdn_url,
          payload.generated_gaussian.media_token,
          payload.maybe_frontend_subscriber_id,
        );

      useImageTo3DWorldStore
        .getState()
        .uploadCoverFromPreview(payload.generated_gaussian.media_token);
    }
  },
);
