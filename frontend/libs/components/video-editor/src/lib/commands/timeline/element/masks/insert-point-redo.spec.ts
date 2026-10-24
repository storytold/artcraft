import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EditorCore } from "../../../../core";
import type { VideoEditorAdapters } from "../../../../adapters";
import type { EditorProject } from "../../../../adapters/types";
import { consoleToast } from "../../../../adapters/default/console-toast";
import { anonymousAuthUser } from "../../../../adapters/default/anonymous-auth-user";
import { downloadExportSink } from "../../../../adapters/default/download-export-sink";
import { emptySoundsAdapter } from "../../../../adapters/default/empty-sounds-adapter";
import { buildDefaultScene } from "../../../../timeline/scenes";
import type { TProject } from "../../../../project/types";
import { ZERO_MEDIA_TIME } from "../../../../wasm";
import { InsertElementCommand } from "../insert-element";
import { InsertFreeformPathMaskPointCommand } from "./insert-custom-mask-point";
import { DeleteFreeformPathMaskPointsCommand } from "./delete-custom-mask-points";

// Redo of "insert mask point". The new point got a fresh random id on every
// run, so a later command aimed at the point (delete it) used the first id and
// matched nothing after undo, undo, redo, redo.

const PROJECT_ID = "effect-redo-project";

// Smallest adapter bundle EditorCore needs; nothing here touches the network,
// IndexedDB or audio, so jsdom is enough.
function buildAdapters(): VideoEditorAdapters {
  return {
    projectStorage: {
      async loadProject() {
        return null;
      },
      async saveProject() {},
      async deleteProject() {},
      async listProjects() {
        return [];
      },
      async createProject(name: string): Promise<EditorProject> {
        return { id: "p", name, updatedAt: Date.now(), data: null };
      },
    },
    mediaSource: {
      async resolveMedia() {
        return { url: "blob:unused", mime: "image/png" };
      },
      async uploadLocalFile(file: File) {
        return { id: `media-${file.name}`, kind: "image" };
      },
    },
    authUser: anonymousAuthUser,
    exportSink: downloadExportSink,
    toast: consoleToast,
    soundsAdapter: emptySoundsAdapter,
    assetGallery: null,
  };
}

function buildProject(): TProject {
  const scene = buildDefaultScene({ name: "Main scene", isMain: true });
  return {
    metadata: {
      id: PROJECT_ID,
      name: "Effect redo",
      duration: ZERO_MEDIA_TIME,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    scenes: [scene],
    currentSceneId: scene.id,
    settings: {
      fps: 30 as never,
      canvasSize: { width: 1920, height: 1080 },
      background: { type: "color", color: "#000000" },
    },
    version: 1,
  };
}



const MASK_ID = "mask-1";
const BOUNDS = { cx: 960, cy: 540, width: 1000, height: 1000, rotation: 0 };

function pathLength(editor: EditorCore): number {
  const element = editor.scenes.getActiveScene().tracks.main.elements[0] as never as {
    masks: { params: { path: unknown[] } }[];
  };
  return element.masks[0].params.path.length;
}

describe("InsertFreeformPathMaskPointCommand redo", () => {
  beforeEach(() => {
    EditorCore.initialize({ adapters: buildAdapters() });
    const editor = EditorCore.getInstance();
    const project = buildProject();
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });
    editor.command.execute({
      command: new InsertElementCommand({
        element: {
          type: "image",
          name: "pic",
          mediaId: "pic",
          startTime: 0,
          duration: 1000,
        } as never,
        placement: { mode: "auto" },
      }),
    });
    const tracks = editor.scenes.getActiveScene().tracks;
    const point = (id: string, x: number, y: number) => ({
      id,
      x,
      y,
      inX: 0,
      inY: 0,
      outX: 0,
      outY: 0,
    });
    const mask = {
      id: MASK_ID,
      type: "freeform",
      params: {
        inverted: false,
        feather: 0,
        strokeAlpha: 1,
        path: [point("a", -0.4, 0), point("b", 0.4, 0)],
        closed: false,
        centerX: 0,
        centerY: 0,
        rotation: 0,
        scale: 1,
      },
    };
    editor.timeline.updateTracks({
      ...tracks,
      main: {
        ...tracks.main,
        elements: [{ ...tracks.main.elements[0], masks: [mask] }],
      },
    } as never);
  });

  afterEach(() => {
    EditorCore.reset();
  });

  it("still deletes the inserted point after undo, undo, redo, redo", () => {
    const editor = EditorCore.getInstance();
    const track = editor.scenes.getActiveScene().tracks.main;
    const elementId = track.elements[0].id;

    const result = editor.command.execute({
      command: new InsertFreeformPathMaskPointCommand({
        trackId: track.id,
        elementId,
        maskId: MASK_ID,
        segmentIndex: 0,
        canvasPoint: { x: 960, y: 540 },
        bounds: BOUNDS,
      }),
    }) as unknown;
    void result;
    expect(pathLength(editor)).toBe(3);
    const mid = (
      editor.scenes.getActiveScene().tracks.main.elements[0] as never as {
        masks: { params: { path: { id: string }[] } }[];
      }
    ).masks[0].params.path[1].id;

    editor.command.execute({
      command: new DeleteFreeformPathMaskPointsCommand({
        trackId: track.id,
        elementId,
        maskId: MASK_ID,
        pointIds: [mid],
      }),
    });
    expect(pathLength(editor)).toBe(2);

    editor.command.undo();
    editor.command.undo();
    editor.command.redo();
    editor.command.redo();

    expect(pathLength(editor)).toBe(2);
  });
});
