import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";

export type ImageTo3DResult = {
  id: string;
  mode: "image" | "text";
  timestamp: number;
  note?: string;
  previewUrl?: string;
  meshOnly?: boolean;
  status: "pending" | "completed";
  subscriberId: string;
  modelUrl?: string;
  mediaToken?: string;
};

type ImageTo3DState = {
  results: ImageTo3DResult[];
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    meshOnly: boolean,
    subscriberId?: string
  ) => string;
  completeGeneration: (
    modelUrl: string,
    mediaToken: string,
    maybeSubscriberId?: string
  ) => void;
  reset: () => void;
};

export const useImageTo3DStore = create<ImageTo3DState>((set, get) => ({
  results: [],
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    meshOnly: boolean,
    subscriberId?: string
  ) => {
    const id = subscriberId
      ? subscriberId
      : crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const result: ImageTo3DResult = {
      id,
      mode,
      timestamp: Date.now(),
      note,
      previewUrl,
      meshOnly,
      status: "pending",
      subscriberId: id,
    };
    set((s) => ({ results: [result, ...s.results] }));
    return id;
  },
  completeGeneration: (
    modelUrl: string,
    mediaToken: string,
    maybeSubscriberId?: string
  ) => {
    console.log("[ImageTo3DStore] completeGeneration", {
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
        const result: ImageTo3DResult = {
          id: generatedId,
          subscriberId: generatedId,
          mode: "image",
          timestamp: Date.now(),
          note: "Generated Model",
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
  reset: () => set({ results: [] }),
}));

interface ObjectGenerationEvent {
  data: {
    generated_object?: {
      cdn_url: string;
      media_token: string;
    };
    maybe_frontend_subscriber_id?: string;
  };
}

listen<ObjectGenerationEvent>("object_generation_complete_event", (event) => {
  const payload = event.payload?.data;
  if (payload?.maybe_frontend_subscriber_id && payload?.generated_object) {
    console.log(
      "[ImageTo3DStore] Global event received for subscriber:",
      payload.maybe_frontend_subscriber_id
    );
    useImageTo3DStore.getState().completeGeneration(
      payload.generated_object.cdn_url,
      payload.generated_object.media_token,
      payload.maybe_frontend_subscriber_id
    );
  }
});

