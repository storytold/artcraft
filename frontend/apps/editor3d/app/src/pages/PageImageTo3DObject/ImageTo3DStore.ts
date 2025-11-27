import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { MediaFilesApi, MediaUploadApi } from "@storyteller/api";
import { v4 as uuidv4 } from "uuid";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Offscreen thumbnail capture function - produces a square image
async function captureModelThumbnail(modelUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      // Square dimensions for thumbnail
      const size = 512;
      const fov = 50;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x282828);

      const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000); // Aspect ratio 1 for square

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(1);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 2);
      scene.add(ambientLight);

      const hemisphereLight = new THREE.HemisphereLight(
        0xffffff,
        0x888888,
        1.2,
      );
      scene.add(hemisphereLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2);
      keyLight.position.set(2, 10, 8);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
      fillLight.position.set(-6, 6, -4);
      scene.add(fillLight);

      const frontLight = new THREE.DirectionalLight(0xffffff, 1);
      frontLight.position.set(0, 4, 10);
      scene.add(frontLight);

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model);
          const modelSize = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
          const scale = 2 / maxDim;
          model.scale.multiplyScalar(scale);

          const scaledBox = new THREE.Box3().setFromObject(model);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          const scaledSize = scaledBox.getSize(new THREE.Vector3());

          model.position.x = -scaledCenter.x;
          model.position.z = -scaledCenter.z;
          model.position.y = -scaledBox.min.y;

          scene.add(model);

          // Calculate camera distance to fit model in view with padding
          const modelHeight = scaledSize.y;
          const maxModelDim = Math.max(
            scaledSize.x,
            scaledSize.y,
            scaledSize.z,
          );

          // Calculate distance needed to fit the model based on FOV
          // For a 45-degree camera angle, we view from a diagonal
          const fovRad = (fov * Math.PI) / 180;
          const fitDistance = maxModelDim / 2 / Math.tan(fovRad / 2);

          // Add some padding (1.3x) and account for diagonal viewing angle
          const cameraDistance = fitDistance * 1.3;

          // Position camera at 45-degree angle
          const angle = Math.PI / 4; // 45 degrees
          camera.position.set(
            Math.sin(angle) * cameraDistance,
            modelHeight * 0.5 + cameraDistance * 0.4,
            Math.cos(angle) * cameraDistance,
          );
          camera.lookAt(0, modelHeight * 0.4, 0);

          // Render and capture
          renderer.render(scene, camera);
          const dataUrl = renderer.domElement.toDataURL("image/png");

          // Cleanup
          renderer.dispose();
          scene.clear();

          resolve(dataUrl);
        },
        undefined,
        (error) => {
          console.error("[captureModelThumbnail] Error loading model:", error);
          renderer.dispose();
          scene.clear();
          resolve(null);
        },
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        renderer.dispose();
        scene.clear();
        resolve(null);
      }, 30000);
    } catch (error) {
      console.error("[captureModelThumbnail] Error:", error);
      resolve(null);
    }
  });
}

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
  coverImageUploaded?: boolean;
};

// Global cache for cover image URLs - TaskQueue can use this as fallback
// Maps mediaToken -> cover image data URL
export const coverImageCache = new Map<string, string>();

type ImageTo3DState = {
  results: ImageTo3DResult[];
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    meshOnly: boolean,
    subscriberId?: string,
  ) => string;
  completeGeneration: (
    modelUrl: string,
    mediaToken: string,
    maybeSubscriberId?: string,
  ) => void;
  uploadCoverImage: (
    mediaToken: string,
    thumbnailDataUrl: string,
  ) => Promise<void>;
  captureAndUploadCover: (
    modelUrl: string,
    mediaToken: string,
  ) => Promise<void>;
  reset: () => void;
};

export const useImageTo3DStore = create<ImageTo3DState>((set, get) => ({
  results: [],
  startGeneration: (
    mode: "image" | "text",
    note: string,
    previewUrl: string | undefined,
    meshOnly: boolean,
    subscriberId?: string,
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
    maybeSubscriberId?: string,
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
  uploadCoverImage: async (mediaToken: string, thumbnailDataUrl: string) => {
    try {
      // Check if already uploaded
      const result = get().results.find((r) => r.mediaToken === mediaToken);
      if (result?.coverImageUploaded) {
        console.log(
          "[ImageTo3DStore] Cover image already uploaded for:",
          mediaToken,
        );
        return;
      }

      console.log("[ImageTo3DStore] Uploading cover image for:", mediaToken);

      // Convert data URL to blob
      const response = await fetch(thumbnailDataUrl);
      const blob = await response.blob();

      // Upload as image
      const mediaUploadApi = new MediaUploadApi();
      const uploadResult = await mediaUploadApi.UploadImage({
        blob,
        fileName: `cover-${mediaToken}.png`,
        uuid: uuidv4(),
      });

      if (!uploadResult.success || !uploadResult.data) {
        console.error("[ImageTo3DStore] Failed to upload cover image");
        return;
      }

      const coverImageToken = uploadResult.data;
      console.log("[ImageTo3DStore] Cover image uploaded:", coverImageToken);

      // Set as cover image for the 3D model
      const mediaFilesApi = new MediaFilesApi();
      const setCoverResult = await mediaFilesApi.UpdateCoverImage({
        mediaFileToken: mediaToken,
        imageToken: coverImageToken,
      });

      if (setCoverResult.success) {
        console.log("[ImageTo3DStore] Cover image set successfully");

        // Store in global cache for TaskQueue to use as fallback
        coverImageCache.set(mediaToken, thumbnailDataUrl);

        // Mark as uploaded
        set((s) => ({
          results: s.results.map((r) =>
            r.mediaToken === mediaToken
              ? { ...r, coverImageUploaded: true }
              : r,
          ),
        }));
        // Emit event to trigger task queue refresh with the cover data
        window.dispatchEvent(
          new CustomEvent("cover-image-uploaded", {
            detail: { mediaToken, thumbnailDataUrl },
          }),
        );
      } else {
        console.error(
          "[ImageTo3DStore] Failed to set cover image:",
          setCoverResult.errorMessage,
        );
      }
    } catch (error) {
      console.error("[ImageTo3DStore] Error uploading cover image:", error);
    }
  },
  captureAndUploadCover: async (modelUrl: string, mediaToken: string) => {
    try {
      // Check if already uploaded
      const result = get().results.find((r) => r.mediaToken === mediaToken);
      if (result?.coverImageUploaded) {
        console.log("[ImageTo3DStore] Cover already uploaded for:", mediaToken);
        return;
      }

      console.log("[ImageTo3DStore] Capturing thumbnail for:", modelUrl);
      const thumbnailDataUrl = await captureModelThumbnail(modelUrl);

      if (thumbnailDataUrl) {
        await get().uploadCoverImage(mediaToken, thumbnailDataUrl);
      } else {
        console.error("[ImageTo3DStore] Failed to capture thumbnail");
      }
    } catch (error) {
      console.error("[ImageTo3DStore] Error in captureAndUploadCover:", error);
    }
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
      payload.maybe_frontend_subscriber_id,
    );
    useImageTo3DStore
      .getState()
      .completeGeneration(
        payload.generated_object.cdn_url,
        payload.generated_object.media_token,
        payload.maybe_frontend_subscriber_id,
      );

    // Automatically capture and upload cover image in background
    useImageTo3DStore
      .getState()
      .captureAndUploadCover(
        payload.generated_object.cdn_url,
        payload.generated_object.media_token,
      );
  }
});
