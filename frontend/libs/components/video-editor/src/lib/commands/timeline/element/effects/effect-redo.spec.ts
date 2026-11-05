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
import { registerDefaultEffects } from "../../../../effects";
import { InsertElementCommand } from "../insert-element";
import { AddClipEffectCommand } from "./add-effect";
import { ToggleClipEffectCommand } from "./toggle-effect";
import { UpdateClipEffectParamsCommand } from "./update-effect-params";

// Redo of "add effect". Redo just runs execute() again, and execute() built a
// brand-new effect (new random id) each time. Every later command in the undo
// history (toggle, edit params, remove, reorder) is stored with the ORIGINAL
// effect id, so after undo-undo-redo-redo they matched nothing and the user's
// later edit silently vanished.

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


function mainTrackAndElement(editor: EditorCore) {
  const track = editor.scenes.getActiveScene().tracks.main;
  return { trackId: track.id, element: track.elements[0] as never as {
    id: string;
    effects?: { id: string; enabled: boolean; params: Record<string, unknown> }[];
  } };
}

describe("AddClipEffectCommand redo", () => {
  beforeEach(() => {
    EditorCore.initialize({ adapters: buildAdapters() });
    registerDefaultEffects();
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

  it("keeps a later toggle of the effect after undo, undo, redo, redo", () => {
    const editor = EditorCore.getInstance();
    const { trackId, element } = mainTrackAndElement(editor);

    const add = new AddClipEffectCommand({
      trackId,
      elementId: element.id,
      effectType: "blur",
    });
    editor.command.execute({ command: add });
    const effectId = add.getEffectId() as string;
    editor.command.execute({
      command: new ToggleClipEffectCommand({
        trackId,
        elementId: element.id,
        effectId,
      }),
    });
    expect(mainTrackAndElement(editor).element.effects?.[0].enabled).toBe(false);

    editor.command.undo();
    editor.command.undo();
    editor.command.redo();
    editor.command.redo();

    const effects = mainTrackAndElement(editor).element.effects ?? [];
    expect(effects).toHaveLength(1);
    expect(effects[0].id).toBe(effectId);
    expect(effects[0].enabled).toBe(false);
  });

  it("keeps a later parameter edit after undo, undo, redo, redo", () => {
    const editor = EditorCore.getInstance();
    const { trackId, element } = mainTrackAndElement(editor);

    const add = new AddClipEffectCommand({
      trackId,
      elementId: element.id,
      effectType: "blur",
    });
    editor.command.execute({ command: add });
    const effectId = add.getEffectId() as string;
    const paramKey = Object.keys(
      mainTrackAndElement(editor).element.effects?.[0].params ?? {},
    )[0];
    editor.command.execute({
      command: new UpdateClipEffectParamsCommand({
        trackId,
        elementId: element.id,
        effectId,
        params: { [paramKey]: 42 },
      }),
    });

    editor.command.undo();
    editor.command.undo();
    editor.command.redo();
    editor.command.redo();

    const effects = mainTrackAndElement(editor).element.effects ?? [];
    expect(effects[0].params[paramKey]).toBe(42);
  });
});
