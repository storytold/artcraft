import type { TScene } from "./types";
import { generateUUID } from "../utils/id";
import { calculateTotalDuration } from "./calculate-duration";
import { MAIN_TRACK_NAME } from "./placement/main-track";
import { type MediaTime, ZERO_MEDIA_TIME } from "../wasm";

// Scene CRUD + utility helpers. "Scenes" are top-level project segments
// each with their own track structure; the main scene is required (the
// editor enforces this in ensureMainScene). Deleting the main scene is
// not allowed — canDeleteScene returns false with a reason string for
// the UI to display.

export function getMainScene({ scenes }: { scenes: TScene[] }): TScene | null {
  return scenes.find((scene) => scene.isMain) || null;
}

export function ensureMainScene({ scenes }: { scenes: TScene[] }): TScene[] {
  const hasMain = scenes.some((scene) => scene.isMain);
  if (!hasMain) {
    const mainScene = buildDefaultScene({ name: "Main scene", isMain: true });
    return [mainScene, ...scenes];
  }
  return scenes;
}

export function buildDefaultScene({
  name,
  isMain,
}: {
  name: string;
  isMain: boolean;
}): TScene {
  return {
    id: generateUUID(),
    name,
    isMain,
    tracks: {
      overlay: [],
      main: {
        id: generateUUID(),
        name: MAIN_TRACK_NAME,
        type: "video",
        elements: [],
        muted: false,
        hidden: false,
      },
      audio: [],
    },
    bookmarks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function canDeleteScene({ scene }: { scene: TScene }): {
  canDelete: boolean;
  reason?: string;
} {
  if (scene.isMain) {
    return { canDelete: false, reason: "Cannot delete main scene" };
  }
  return { canDelete: true };
}

export function getFallbackSceneAfterDelete({
  scenes,
  deletedSceneId,
  currentSceneId,
}: {
  scenes: TScene[];
  deletedSceneId: string;
  currentSceneId: string | null;
}): TScene | null {
  if (currentSceneId !== deletedSceneId) {
    return scenes.find((s) => s.id === currentSceneId) || null;
  }
  return getMainScene({ scenes });
}

export function findCurrentScene({
  scenes,
  currentSceneId,
}: {
  scenes: TScene[];
  currentSceneId: string;
}): TScene | null {
  return (
    scenes.find((s) => s.id === currentSceneId) ||
    getMainScene({ scenes }) ||
    scenes[0] ||
    null
  );
}

export function getProjectDurationFromScenes({
  scenes,
}: {
  scenes: TScene[];
}): MediaTime {
  const mainScene = getMainScene({ scenes }) ?? scenes[0] ?? null;
  if (!mainScene?.tracks) {
    return ZERO_MEDIA_TIME;
  }

  return calculateTotalDuration({ tracks: mainScene.tracks });
}

export function updateSceneInArray({
  scenes,
  sceneId,
  updates,
}: {
  scenes: TScene[];
  sceneId: string;
  updates: Partial<TScene>;
}): TScene[] {
  return scenes.map((scene) =>
    scene.id === sceneId ? { ...scene, ...updates } : scene,
  );
}
