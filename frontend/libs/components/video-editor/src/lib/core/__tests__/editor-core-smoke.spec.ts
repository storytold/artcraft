import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { EditorCore } from "../index";
import type { VideoEditorAdapters } from "../../adapters";
import type {
  EditorProject,
  ProjectMeta,
} from "../../adapters/types";
import { consoleToast } from "../../adapters/default/console-toast";
import { anonymousAuthUser } from "../../adapters/default/anonymous-auth-user";
import { downloadExportSink } from "../../adapters/default/download-export-sink";
import { emptySoundsAdapter } from "../../adapters/default/empty-sounds-adapter";
import { buildDefaultScene } from "../../timeline/scenes";
import type { TProject } from "../../project/types";
import { mediaTimeFromSeconds, ZERO_MEDIA_TIME } from "../../wasm";

// Smoke test for EditorCore wiring. Walks through the most common
// lifecycle a host would hit: bootstrap with in-memory adapters,
// load a project, switch into its main scene, run a command, undo /
// redo it, and tear the singleton back down.
//
// Browser-only APIs (IndexedDB, AudioContext, mediabunny demuxers)
// would crash under jsdom, so we replace ProjectStorageAdapter +
// MediaSourceAdapter with in-memory implementations and never trigger
// audio playback. The point is to catch wiring bugs in EditorCore +
// its managers, not exercise the rendering or audio path.

const SAMPLE_PROJECT_ID = "smoke-project";

function buildInMemoryAdapters(): VideoEditorAdapters {
  const storage = new Map<string, EditorProject>();

  return {
    projectStorage: {
      async loadProject(id: string) {
        return storage.get(id) ?? null;
      },
      async saveProject(project: EditorProject) {
        storage.set(project.id, project);
      },
      async deleteProject(id: string) {
        storage.delete(id);
      },
      async listProjects(): Promise<ProjectMeta[]> {
        return Array.from(storage.values()).map((project) => ({
          id: project.id,
          name: project.name,
          updatedAt: project.updatedAt,
        }));
      },
      async createProject(name: string): Promise<EditorProject> {
        const project: EditorProject = {
          id: `proj-${storage.size + 1}`,
          name,
          updatedAt: Date.now(),
          data: null,
        };
        storage.set(project.id, project);
        return project;
      },
    },
    mediaSource: {
      async resolveMedia() {
        return { url: "blob:smoke", mime: "video/mp4" };
      },
      async uploadLocalFile(file: File) {
        return { id: `media-${file.name}`, kind: "video" };
      },
    },
    authUser: anonymousAuthUser,
    exportSink: downloadExportSink,
    toast: consoleToast,
    soundsAdapter: emptySoundsAdapter,
    assetGallery: null,
  };
}

function buildSampleProject(): TProject {
  const scene = buildDefaultScene({ name: "Main scene", isMain: true });
  return {
    metadata: {
      id: SAMPLE_PROJECT_ID,
      name: "Smoke test",
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

describe("EditorCore smoke", () => {
  beforeEach(() => {
    EditorCore.initialize({ adapters: buildInMemoryAdapters() });
  });

  afterEach(() => {
    EditorCore.reset();
  });

  test("wires all twelve managers", () => {
    const editor = EditorCore.getInstance();

    expect(editor.command).toBeDefined();
    expect(editor.timeline).toBeDefined();
    expect(editor.playback).toBeDefined();
    expect(editor.scenes).toBeDefined();
    expect(editor.project).toBeDefined();
    expect(editor.media).toBeDefined();
    expect(editor.renderer).toBeDefined();
    expect(editor.save).toBeDefined();
    expect(editor.audio).toBeDefined();
    expect(editor.selection).toBeDefined();
    expect(editor.clipboard).toBeDefined();
    expect(editor.diagnostics).toBeDefined();
  });

  test("exposes the adapter bundle", () => {
    const editor = EditorCore.getInstance();
    expect(editor.adapters.projectStorage).toBeDefined();
    expect(editor.adapters.toast).toBeDefined();
    expect(editor.adapters.mediaSource).toBeDefined();
  });

  test("loads a project + activates its main scene", async () => {
    const editor = EditorCore.getInstance();
    const project = buildSampleProject();
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });

    expect(editor.project.getActive()).toBe(project);
    expect(editor.scenes.getActiveScene().isMain).toBe(true);
  });

  test("seek + getCurrentTime roundtrip", () => {
    const editor = EditorCore.getInstance();
    const project = buildSampleProject();
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });

    // Inject a non-empty duration so PlaybackManager.seek doesn't clamp to zero.
    // We bypass placement by patching the active scene's main track directly.
    const activeScene = editor.scenes.getActiveScene();
    editor.scenes.updateSceneTracks({
      tracks: {
        ...activeScene.tracks,
        main: {
          ...activeScene.tracks.main,
          elements: [
            {
              id: "elem-1",
              type: "text",
              name: "Hello",
              startTime: ZERO_MEDIA_TIME,
              duration: mediaTimeFromSeconds({ seconds: 5 }),
              trimStart: ZERO_MEDIA_TIME,
              trimEnd: ZERO_MEDIA_TIME,
              params: {},
              text: "Hello",
            } as never,
          ],
        },
      },
    });

    const target = mediaTimeFromSeconds({ seconds: 2 });
    editor.playback.seek({ time: target });
    expect(editor.playback.getCurrentTime()).toBe(target);
  });

  test("selection snapshot survives a roundtrip", () => {
    const editor = EditorCore.getInstance();
    const snapshot = editor.selection.getSnapshot();
    expect(snapshot.selectedElements).toEqual([]);
    expect(snapshot.selectedKeyframes).toEqual([]);

    editor.selection.applySelectionPatch({
      patch: {
        selectedElements: [{ trackId: "t1", elementId: "e1" }],
      },
    });
    expect(editor.selection.getSelectedElements()).toEqual([
      { trackId: "t1", elementId: "e1" },
    ]);

    editor.selection.restoreSnapshot({ snapshot });
    expect(editor.selection.getSelectedElements()).toEqual([]);
  });

  test("saveCurrentProject routes through ProjectStorageAdapter", async () => {
    const editor = EditorCore.getInstance();
    const project = buildSampleProject();
    editor.project.setActiveProject({ project });

    await editor.project.saveCurrentProject();

    const listed = await editor.adapters.projectStorage.listProjects();
    expect(listed.map((p) => p.id)).toContain(SAMPLE_PROJECT_ID);
  });

  test("EditorCore.reset clears the singleton", () => {
    const a = EditorCore.getInstance();
    EditorCore.reset();
    const b = EditorCore.getInstance();
    expect(a).not.toBe(b);
  });
});
