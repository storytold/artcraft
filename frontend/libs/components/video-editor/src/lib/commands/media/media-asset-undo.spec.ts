import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditorCore } from "../../core";
import type { VideoEditorAdapters } from "../../adapters";
import type { EditorProject } from "../../adapters/types";
import { consoleToast } from "../../adapters/default/console-toast";
import { anonymousAuthUser } from "../../adapters/default/anonymous-auth-user";
import { downloadExportSink } from "../../adapters/default/download-export-sink";
import { emptySoundsAdapter } from "../../adapters/default/empty-sounds-adapter";
import { buildDefaultScene } from "../../timeline/scenes";
import type { TProject } from "../../project/types";
import type { MediaAsset } from "../../media/types";
import { ZERO_MEDIA_TIME } from "../../wasm";
import { AddMediaAssetCommand } from "./add-media-asset";

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

describe("media asset undo", () => {
  let editor: EditorCore;
  let blobCounter = 0;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    // jsdom has no object-URL support, and RemoveMediaAssetCommand uses it.
    blobCounter = 0;
    URL.createObjectURL = vi.fn(() => `blob:fresh-${++blobCounter}`);
    URL.revokeObjectURL = vi.fn();

    EditorCore.initialize({ adapters: buildAdapters() });
    editor = EditorCore.getInstance();
    const project = buildProject();
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });
  });

  afterEach(() => {
    EditorCore.reset();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it("undoing an add keeps an asset that was added later outside the history", async () => {
    // Paste adds an asset through a command (so it is undoable) ...
    editor.command.execute({
      command: new AddMediaAssetCommand({ projectId: PROJECT_ID, asset: asset("pasted") }),
    });
    // ... then the assets panel adds another one directly, with no command.
    await editor.media.addMediaAsset({ asset: asset("panel") });
    expect(ids(editor)).toEqual(["pasted", "panel"]);

    editor.command.undo();

    // Only the pasted asset goes away. (Old code restored the empty bin it had
    // snapshotted, so the panel asset vanished from the bin too.)
    expect(ids(editor)).toEqual(["panel"]);

    // Redo brings the pasted asset back and still keeps the panel one.
    editor.command.redo();
    expect(ids(editor).sort()).toEqual(["panel", "pasted"]);
  });

  it("undoing a remove puts the asset back and keeps one added later outside the history", async () => {
    editor.media.loadProjectMedia({ assets: [asset("a1", "blob:a1"), asset("a2", "blob:a2")] });

    editor.media.removeMediaAsset({ projectId: PROJECT_ID, id: "a1" });
    expect(ids(editor)).toEqual(["a2"]);

    // A new asset arrives through the assets panel while a1 is deleted.
    await editor.media.addMediaAsset({ asset: asset("late") });

    editor.command.undo();

    // a1 returns to its old position and "late" is not wiped. (Old code
    // restored the two-asset snapshot, dropping "late".)
    expect(ids(editor)).toEqual(["a1", "a2", "late"]);
  });

  it("undoing a multi-select delete restores every asset with a fresh, live URL", () => {
    editor.media.loadProjectMedia({
      assets: [asset("a", "blob:a-original"), asset("b", "blob:b-original"), asset("c", "blob:c")],
    });

    editor.media.removeMediaAssets({ projectId: PROJECT_ID, ids: ["a", "b"] });
    expect(ids(editor)).toEqual(["c"]);

    editor.command.undo();

    expect(ids(editor)).toEqual(["a", "b", "c"]);
    const byId = new Map(editor.media.getAssets().map((a) => [a.id, a.url]));
    // Both deleted assets had their blob URL revoked, so each must come back
    // with a newly created one. (Old code restored "b" from an older snapshot
    // that still held its revoked "blob:b-original".)
    expect(byId.get("a")).toMatch(/^blob:fresh-/);
    expect(byId.get("b")).toMatch(/^blob:fresh-/);
    // The asset that was never deleted keeps the URL it had.
    expect(byId.get("c")).toBe("blob:c");
  });

  it("does not duplicate a removed asset when undo runs twice over the same bin", () => {
    editor.media.loadProjectMedia({ assets: [asset("a", "blob:a"), asset("b", "blob:b")] });
    editor.media.removeMediaAsset({ projectId: PROJECT_ID, id: "a" });

    editor.command.undo();
    expect(ids(editor)).toEqual(["a", "b"]);

    // Redo removes it again and a second undo restores it exactly once.
    editor.command.redo();
    expect(ids(editor)).toEqual(["b"]);
    editor.command.undo();
    expect(ids(editor)).toEqual(["a", "b"]);
  });
});
