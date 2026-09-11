import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";

export interface GeneratedAngle {
  id: string;
  imageUrl: string;
  thumbnailUrlTemplate?: string;
  rotation: number;
  tilt: number;
  zoom: number;
  timestamp: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface AngleConfig {
  rotation: number; // 0, 45, 90, 135, 180, 225, 270, 315
  tilt: number; // -30, 0, 30, 60
  zoom: number; // 0, 5, 10
}

// Snapped value options (backend values)
export const ROTATION_VALUES = [0, 45, 90, 135, 180, 225, 270, 315];
export const TILT_VALUES = [-30, 0, 30, 60];
export const ZOOM_VALUES = [0, 5, 10];

// ─── Display conversion helpers ──────────────────────────────────────────────
// Backend uses 0–315 for rotation; UI displays −180 to +180 centered at 0.

/** Convert backend rotation (0–315) to display value (−180 to +180). */
export const rotationToDisplay = (backend: number): number =>
  backend > 180 ? backend - 360 : backend;

/** Convert display rotation (−180 to +180) to backend value (0–315). */
export const displayToRotation = (display: number): number =>
  display < 0 ? display + 360 : display;

/** Snap targets for the display-range rotation slider. */
export const DISPLAY_ROTATION_VALUES = [-180, -135, -90, -45, 0, 45, 90, 135, 180];

interface AnglesState {
  // Source image
  sourceImageUrl: string | null;
  sourceMediaToken: string | null;
  sourceThumbnailUrlTemplate: string | null;
  imageDimensions: ImageDimensions | null;

  // Angle config
  angleConfig: AngleConfig;
  generateFromBestAngles: boolean;

  // Generated results
  generatedAngles: GeneratedAngle[];
  activeAngleId: string | null;

  // Processing
  isProcessing: boolean;
  pendingSubscriberIds: string[];
  isLoadingImage: boolean;

  // Actions
  setSourceImage: (url: string, mediaToken: string | null, thumbnailUrlTemplate?: string | null) => void;
  setImageDimensions: (dims: ImageDimensions | null) => void;
  setRotation: (value: number) => void;
  setTilt: (value: number) => void;
  setZoom: (value: number) => void;
  setGenerateFromBestAngles: (value: boolean) => void;
  addGeneratedAngle: (angle: GeneratedAngle) => void;
  setActiveAngle: (id: string | null) => void;
  getActiveAngle: () => GeneratedAngle | null;
  removeGeneratedAngle: (id: string) => void;
  clearGeneratedAngles: () => void;
  removePendingSubscriber: (subscriberId: string) => void;
  setIsLoadingImage: (value: boolean) => void;
  startGeneration: (subscriberId: string) => void;
  completeGeneration: (
    subscriberId: string,
    images: Array<{
      cdn_url: string;
      media_token: string;
      maybe_thumbnail_template?: string;
    }>,
  ) => void;
  resetSource: () => void;
  clearAll: () => void;
}

const DEFAULT_CONFIG: AngleConfig = {
  rotation: 0,
  tilt: 0,
  zoom: 0,
};

export const useAnglesStore = create<AnglesState>((set, get) => ({
  sourceImageUrl: null,
  sourceMediaToken: null,
  sourceThumbnailUrlTemplate: null,
  imageDimensions: null,
  angleConfig: { ...DEFAULT_CONFIG },
  generateFromBestAngles: false,
  generatedAngles: [],
  activeAngleId: null,
  isProcessing: false,
  pendingSubscriberIds: [],
  isLoadingImage: false,

  setSourceImage: (url, mediaToken, thumbnailUrlTemplate) => {
    set({ sourceImageUrl: url, sourceMediaToken: mediaToken, sourceThumbnailUrlTemplate: thumbnailUrlTemplate ?? null });
  },

  setImageDimensions: (dims) => {
    set({ imageDimensions: dims });
  },

  setRotation: (value) => {
    set((state) => ({
      angleConfig: { ...state.angleConfig, rotation: value },
    }));
  },

  setTilt: (value) => {
    set((state) => ({
      angleConfig: { ...state.angleConfig, tilt: value },
    }));
  },

  setZoom: (value) => {
    set((state) => ({
      angleConfig: { ...state.angleConfig, zoom: value },
    }));
  },

  setGenerateFromBestAngles: (value) => {
    set({ generateFromBestAngles: value });
  },

  addGeneratedAngle: (angle) => {
    set((state) => ({
      generatedAngles: [...state.generatedAngles, angle],
      activeAngleId: angle.id,
    }));
  },

  setActiveAngle: (id) => {
    set({ activeAngleId: id });
  },

  getActiveAngle: () => {
    const state = get();
    return (
      state.generatedAngles.find((a) => a.id === state.activeAngleId) ?? null
    );
  },

  removeGeneratedAngle: (id) => {
    set((s) => {
      const filtered = s.generatedAngles.filter((a) => a.id !== id);
      return {
        generatedAngles: filtered,
        activeAngleId: s.activeAngleId === id ? null : s.activeAngleId,
      };
    });
  },

  clearGeneratedAngles: () => {
    set({
      generatedAngles: [],
      activeAngleId: null,
      isProcessing: false,
      pendingSubscriberIds: [],
    });
  },

  removePendingSubscriber: (subscriberId) => {
    set((s) => {
      const remaining = s.pendingSubscriberIds.filter(
        (id) => id !== subscriberId,
      );
      return {
        pendingSubscriberIds: remaining,
        isProcessing: remaining.length > 0,
      };
    });
  },

  setIsLoadingImage: (value) => {
    set({ isLoadingImage: value });
  },

  startGeneration: (subscriberId) => {
    set((s) => ({
      isProcessing: true,
      pendingSubscriberIds: [...s.pendingSubscriberIds, subscriberId],
    }));
  },

  completeGeneration: (subscriberId, images) => {
    const state = get();
    if (!state.pendingSubscriberIds.includes(subscriberId)) return;

    const newAngles: GeneratedAngle[] = images.map((img) => ({
      id: img.media_token,
      imageUrl: img.cdn_url,
      thumbnailUrlTemplate: img.maybe_thumbnail_template,
      rotation: state.angleConfig.rotation,
      tilt: state.angleConfig.tilt,
      zoom: state.angleConfig.zoom,
      timestamp: Date.now(),
    }));

    const remaining = state.pendingSubscriberIds.filter(
      (id) => id !== subscriberId,
    );
    set((s) => ({
      generatedAngles: [...s.generatedAngles, ...newAngles],
      activeAngleId: newAngles[0]?.id ?? s.activeAngleId,
      isProcessing: remaining.length > 0,
      pendingSubscriberIds: remaining,
    }));
  },

  resetSource: () => {
    set({
      sourceImageUrl: null,
      sourceMediaToken: null,
      sourceThumbnailUrlTemplate: null,
      imageDimensions: null,
      angleConfig: { ...DEFAULT_CONFIG },
      generateFromBestAngles: false,
      isProcessing: false,
      pendingSubscriberIds: [],
      isLoadingImage: false,
    });
  },

  clearAll: () => {
    set({
      sourceImageUrl: null,
      sourceMediaToken: null,
      sourceThumbnailUrlTemplate: null,
      imageDimensions: null,
      angleConfig: { ...DEFAULT_CONFIG },
      generateFromBestAngles: false,
      generatedAngles: [],
      activeAngleId: null,
      isProcessing: false,
      pendingSubscriberIds: [],
      isLoadingImage: false,
    });
  },
}));

// ─── Module-level event listener ────────────────────────────────────────────────
// Persists across page navigations so generation results are never lost.
// Angle models route through ImageGeneration task type, which fires
// text_to_image_generation_complete_event (not image_edit_complete_event).
listen<{
  status: string;
  data: {
    generated_images: Array<{
      media_token: string;
      cdn_url: string;
      maybe_thumbnail_template?: string;
    }>;
    maybe_frontend_subscriber_id?: string;
  };
}>("text_to_image_generation_complete_event", (wrappedEvent) => {
  const event = wrappedEvent.payload.data;
  const state = useAnglesStore.getState();
  if (state.pendingSubscriberIds.length === 0) return;

  const subscriberId = event.maybe_frontend_subscriber_id;
  if (subscriberId && !state.pendingSubscriberIds.includes(subscriberId))
    return;

  const resolvedId = subscriberId ?? state.pendingSubscriberIds[0];

  const images = event.generated_images.map((img) => ({
    cdn_url: img.cdn_url,
    media_token: img.media_token,
    maybe_thumbnail_template: img.maybe_thumbnail_template,
  }));

  state.completeGeneration(resolvedId, images);
});
