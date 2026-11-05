import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditorCore } from "../../../core";
import type { VideoEditorAdapters } from "../../../adapters";
import type { EditorProject } from "../../../adapters/types";
import { consoleToast } from "../../../adapters/default/console-toast";
import { anonymousAuthUser } from "../../../adapters/default/anonymous-auth-user";
import { downloadExportSink } from "../../../adapters/default/download-export-sink";
import { emptySoundsAdapter } from "../../../adapters/default/empty-sounds-adapter";
import { buildDefaultScene } from "../../../timeline/scenes";
import type { TProject } from "../../../project/types";
import type { MediaAsset } from "../../../media/types";
import { ZERO_MEDIA_TIME } from "../../../wasm";
import { InsertElementCommand } from "./insert-element";

// Undo of the two media-bin commands. Both used to restore a SNAPSHOT of the
// whole bin taken when the command ran, so undoing one command also threw away
// every asset added after it by something that is not in the undo history (the
// assets panel and timeline drag-drop call editor.media.addMediaAsset directly),
// and a multi-select delete came back with stale, already-revoked blob URLs.

const PROJECT_ID = "media-undo-project";

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
      name: "Media undo",
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

function asset(id: string, url?: string): MediaAsset {
  return { id, name: `${id}.png`, type: "image", file: new File(["x"], `${id}.png`), url };
}

function ids(editor: EditorCore): string[] {
  return editor.media.getAssets().map((a) => a.id);
}



describe("InsertElementCommand first-clip canvas size", () => {
  beforeEach(() => {
    EditorCore.initialize({ adapters: buildAdapters() });
    const editor = EditorCore.getInstance();
    const project = buildProject();
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });
  });

  afterEach(() => {
    EditorCore.reset();
  });

  it("puts the canvas size back when inserting the first clip is undone", async () => {
    const editor = EditorCore.getInstance();
    await editor.media.addMediaAsset({
      asset: { ...asset("pic"), width: 640, height: 480 } as MediaAsset,
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
    expect(editor.project.getActive()?.settings.canvasSize).toEqual({
      width: 640,
      height: 480,
    });

    editor.command.undo();

    expect(editor.project.getActive()?.settings.canvasSize).toEqual({
      width: 1920,
      height: 1080,
    });
  });
});
