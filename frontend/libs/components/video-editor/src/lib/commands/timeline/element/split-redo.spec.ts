import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EditorCore } from "../../../core";
import type { VideoEditorAdapters } from "../../../adapters";
import type { EditorProject } from "../../../adapters/types";
import { consoleToast } from "../../../adapters/default/console-toast";
import { anonymousAuthUser } from "../../../adapters/default/anonymous-auth-user";
import { downloadExportSink } from "../../../adapters/default/download-export-sink";
import { emptySoundsAdapter } from "../../../adapters/default/empty-sounds-adapter";
import { buildDefaultScene } from "../../../timeline/scenes";
import type { TProject } from "../../../project/types";
import { ZERO_MEDIA_TIME } from "../../../wasm";
import { InsertElementCommand } from "./insert-element";
import { SplitElementsCommand } from "./split-elements";
import { UpdateElementsCommand } from "./update-elements";

// Redo of split. Redo runs execute() again, which made a NEW id for the right
// half each time; a later edit of the right half (recorded against the first
// id) then matched nothing and was silently lost.

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



describe("SplitElementsCommand redo", () => {
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
  });

  afterEach(() => {
    EditorCore.reset();
  });

  it("keeps a later edit of the right half after undo, undo, redo, redo", () => {
    const editor = EditorCore.getInstance();
    const track = editor.scenes.getActiveScene().tracks.main;
    const split = new SplitElementsCommand({
      elements: [{ trackId: track.id, elementId: track.elements[0].id }],
      splitTime: 400 as never,
    });
    editor.command.execute({ command: split });
    const right = split.getRightSideElements()[0];
    editor.command.execute({
      command: new UpdateElementsCommand({
        updates: [
          { trackId: right.trackId, elementId: right.elementId, patch: { name: "renamed" } },
        ],
      }),
    });

    editor.command.undo();
    editor.command.undo();
    editor.command.redo();
    editor.command.redo();

    const names = editor.scenes
      .getActiveScene()
      .tracks.main.elements.map((e) => e.name);
    expect(names).toContain("renamed");
  });
});
