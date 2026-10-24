import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EditorCore } from "../../core";
import type { VideoEditorAdapters } from "../../adapters";
import type { EditorProject } from "../../adapters/types";
import { consoleToast } from "../../adapters/default/console-toast";
import { anonymousAuthUser } from "../../adapters/default/anonymous-auth-user";
import { downloadExportSink } from "../../adapters/default/download-export-sink";
import { emptySoundsAdapter } from "../../adapters/default/empty-sounds-adapter";
import { buildDefaultScene } from "../../timeline/scenes";
import type { TProject } from "../../project/types";
import { ZERO_MEDIA_TIME } from "../../wasm";

// Closing a project must drop the selection: it holds track and clip ids of the
// project being left, and none of them exist in the next one opened.

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

describe("closeProject selection", () => {
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

  it("clears the selected clips when the project is closed", () => {
    const editor = EditorCore.getInstance();
    editor.selection.setSelectedElements({
      elements: [{ trackId: "old-track", elementId: "old-clip" }],
    });

    editor.project.closeProject();

    expect(editor.selection.getSelectedElements()).toEqual([]);
  });
});
