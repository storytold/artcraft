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
import { InsertElementCommand } from "../../commands/timeline/element/insert-element";

// A drag or slider edit goes through previewElements + commitPreview. When the
// final value equals what was already committed (drag back to the start, retype
// the same number) the commit used to push an undo step that changes nothing.

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

describe("commitPreview with no real change", () => {
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

  it("does not add an undo step when the previewed value equals the committed one", () => {
    const editor = EditorCore.getInstance();
    const track = editor.scenes.getActiveScene().tracks.main;
    const element = track.elements[0];
    editor.command.clear();

    editor.timeline.previewElements({
      updates: [
        { trackId: track.id, elementId: element.id, updates: { name: "pic" } },
      ],
    });
    editor.timeline.commitPreview();

    expect(editor.command.canUndo()).toBe(false);
  });

  it("still records a real change", () => {
    const editor = EditorCore.getInstance();
    const track = editor.scenes.getActiveScene().tracks.main;
    const element = track.elements[0];
    editor.command.clear();

    editor.timeline.previewElements({
      updates: [
        { trackId: track.id, elementId: element.id, updates: { name: "renamed" } },
      ],
    });
    editor.timeline.commitPreview();

    expect(editor.command.canUndo()).toBe(true);
    editor.command.undo();
    expect(editor.scenes.getActiveScene().tracks.main.elements[0].name).toBe("pic");
  });
});
