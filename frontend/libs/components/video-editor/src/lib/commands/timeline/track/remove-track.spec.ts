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
import { RemoveTrackCommand } from "./remove-track";
import { buildEmptyTrack } from "../../../timeline/placement";

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


describe("RemoveTrackCommand selection", () => {
  beforeEach(() => {
    EditorCore.initialize({ adapters: buildAdapters() });
    const editor = EditorCore.getInstance();
    const project = buildProject();
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });
    // Two audio tracks, one clip each.
    const tracks = editor.scenes.getActiveScene().tracks;
    editor.timeline.updateTracks({
      ...tracks,
      audio: [audioTrack("t1", "e1"), audioTrack("t2", "e2")],
    });
  });

  afterEach(() => {
    EditorCore.reset();
  });

  it("drops a selected clip from the selection when its track is deleted", () => {
    const editor = EditorCore.getInstance();
    editor.selection.setSelectedElements({
      elements: [
        { trackId: "t1", elementId: "e1" },
        { trackId: "t2", elementId: "e2" },
      ],
    });

    editor.command.execute({ command: new RemoveTrackCommand("t1") });

    // Only the clip on the surviving track stays selected.
    expect(editor.selection.getSelectedElements()).toEqual([
      { trackId: "t2", elementId: "e2" },
    ]);
  });

  it("clears a mask-point selection that lived on the deleted track", () => {
    const editor = EditorCore.getInstance();
    editor.selection.setSelectedMaskPoints({
      selection: {
        trackId: "t1",
        elementId: "e1",
        maskId: "m1",
        pointIds: ["p1"],
      },
    });

    editor.command.execute({ command: new RemoveTrackCommand("t1") });

    // Mask points outrank every other selection kind, so a leftover one would
    // keep the editor in "mask-points" mode for a clip that is gone.
    expect(editor.selection.getSelectedMaskPointSelection()).toBeNull();
    expect(editor.selection.getActiveSelectionKind()).toBeNull();
  });

  it("brings the selection back when the delete is undone", () => {
    const editor = EditorCore.getInstance();
    editor.selection.setSelectedElements({
      elements: [{ trackId: "t1", elementId: "e1" }],
    });

    editor.command.execute({ command: new RemoveTrackCommand("t1") });
    editor.command.undo();

    expect(editor.selection.getSelectedElements()).toEqual([
      { trackId: "t1", elementId: "e1" },
    ]);
  });
});

function audioTrack(id: string, elementId: string) {
  return {
    ...buildEmptyTrack({ id, type: "audio" }),
    elements: [
      { id: elementId, startTime: 0, duration: 1000, trimStart: 0, trimEnd: 0 },
    ],
  } as never;
}
