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
import { InsertElementCommand } from "../element/insert-element";
import { getKeyframeAtTime } from "../../../animation";
import { PasteKeyframesCommand } from "./paste-keyframes";
import { RetimeKeyframeCommand } from "../element/keyframes/retime-keyframe";

// Redo of "paste keyframes". Each run gave the pasted keyframe a new random id,
// so a later retime of it (recorded with the first id) matched nothing after
// undo, undo, redo, redo.

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



function keyframeAt(editor: EditorCore, time: number) {
  const element = editor.scenes.getActiveScene().tracks.main.elements[0];
  return getKeyframeAtTime({
    animations: element.animations,
    propertyPath: "opacity",
    time,
  });
}

describe("PasteKeyframesCommand redo", () => {
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

  it("keeps a later retime of the pasted keyframe after undo, undo, redo, redo", () => {
    const editor = EditorCore.getInstance();
    const track = editor.scenes.getActiveScene().tracks.main;
    const elementId = track.elements[0].id;

    editor.command.execute({
      command: new PasteKeyframesCommand({
        trackId: track.id,
        elementId,
        time: 100 as never,
        clipboardItems: [
          {
            propertyPath: "opacity",
            timeOffset: 0 as never,
            value: 0.5,
            interpolation: "linear",
            curvePatches: [],
          },
        ],
      }),
    });
    const pasted = keyframeAt(editor, 100);
    expect(pasted).not.toBeNull();

    editor.command.execute({
      command: new RetimeKeyframeCommand({
        trackId: track.id,
        elementId,
        propertyPath: "opacity",
        keyframeId: (pasted as { id: string }).id,
        nextTime: 500 as never,
      }),
    });
    expect(keyframeAt(editor, 500)).not.toBeNull();

    editor.command.undo();
    editor.command.undo();
    editor.command.redo();
    editor.command.redo();

    expect(keyframeAt(editor, 500)).not.toBeNull();
    expect(keyframeAt(editor, 100)).toBeNull();
  });
});
