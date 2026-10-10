import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { usePasteMedia } from "./use-paste-media";
import { MediaManager } from "../core/managers/media-manager";
import { CommandManager } from "../core/managers/commands";
import { AddMediaAssetCommand } from "../commands/media/add-media-asset";
import type { EditorCore } from "../core";
import type { TProject } from "../project/types";
import type { TScene, SceneTracks } from "../timeline/types";
import type { MediaAsset } from "./types";

const fixture = vi.hoisted(() => ({
  editor: null as unknown as EditorCore,
  adapters: null as any,
}));
vi.mock("../core", () => ({ EditorCore: { getInstance: () => fixture.editor } }));
vi.mock("../EditorProvider", () => ({ useEditorAdapters: () => fixture.adapters }));
vi.mock("../commands", async () => await import("../commands/batch-command"));
vi.mock("../commands/media", async () => ({
  ...(await import("../commands/media/add-media-asset")),
  RemoveMediaAssetCommand: class { constructor() { throw new Error("removal is outside this test"); } },
}));
vi.mock("../commands/timeline", async () => await import("../commands/timeline/element/insert-element"));
// Browser decoding is not the subject of these ownership tests. The real
// processor still performs uploadLocalFile, resolveMedia and its async yield.
vi.mock("./mediabunny", () => ({ readVideoFile: async () => ({
  duration: 1, width: 640, height: 360, fps: 30,
  hasAudio: false, codec: "h264", canDecode: true, thumbnailUrl: null,
}) }));
vi.mock("../wasm", () => ({
  TICKS_PER_SECOND: 1000, ZERO_MEDIA_TIME: 0,
  mediaTime: ({ ticks }: { ticks: number }) => ticks,
  mediaTimeFromSeconds: ({ seconds }: { seconds: number }) => seconds * 1000,
  roundMediaTime: ({ time }: { time: number }) => Math.round(time),
}));
vi.mock("../graphics", () => ({
  buildDefaultGraphicInstance: () => { throw new Error("graphics not used"); },
  graphicsRegistry: { has: () => false }, registerDefaultGraphics: () => {},
}));
vi.mock("../effects", () => ({
  buildDefaultEffectInstance: () => { throw new Error("effects not used"); },
}));
vi.mock("../ripple", () => ({
  applyRippleAdjustments: () => { throw new Error("ripple disabled"); },
  computeRippleAdjustments: () => { throw new Error("ripple disabled"); },
}));
vi.mock("../services/video-cache", () => ({ videoCache: { clearVideo: vi.fn(), clearAll: vi.fn() } }));
vi.mock("../services/waveform-cache", () => ({ waveformCache: { clearSource: vi.fn(), clearAll: vi.fn() } }));

let root: Root;
let container: HTMLDivElement;
let activeProject: TProject;
let activeScene: TScene;
let upload: ReturnType<typeof deferred<{ id: string; kind: "video" }>>;
let resolve: ReturnType<typeof deferred<{ url: string; mime: string }>>;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  activeProject = project("project-a");
  activeScene = scene("scene-a");
  upload = deferred();
  resolve = deferred();
  fixture.adapters = {
    toast: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
    mediaSource: {
      uploadLocalFile: vi.fn(() => upload.promise),
      resolveMedia: vi.fn(() => resolve.promise),
    },
  };
  const editor = {
    project: {
      getActive: () => activeProject,
      getActiveOrNull: () => activeProject,
      ratchetFpsForImportedMedia: () => null,
      updateSettings: ({ settings }: { settings: Partial<TProject["settings"]> }) => {
        activeProject.settings = { ...activeProject.settings, ...settings };
      },
    },
    scenes: {
      getActiveScene: () => activeScene,
      getActiveSceneOrNull: () => activeScene,
    },
    playback: { getCurrentTime: () => 0 },
    timeline: { updateTracks: (tracks: SceneTracks) => { activeScene.tracks = tracks; } },
    selection: { getSnapshot: () => ({}), applySelectionPatch: () => ({}) },
    clipboard: { paste: vi.fn() },
  } as unknown as EditorCore;
  Object.assign(editor, { media: new MediaManager(editor), command: new CommandManager(editor) });
  fixture.editor = editor;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<PasteListener />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("imports into the original project and scene when context remains active", async () => {
  await beginPaste();
  await completePaste();
  expect(fixture.editor.media.getAssets().map((asset) => asset.id)).toEqual(["uploaded"]);
  expect(activeScene.tracks.main.elements).toHaveLength(1);
  expect(fixture.editor.command.canUndo()).toBe(true);
  expect(fixture.adapters.mediaSource.resolveMedia).toHaveBeenCalledWith({ id: "uploaded", kind: "video" });
});

it("does not attach a delayed paste to a different project", async () => {
  await beginPaste();
  activeProject = project("project-b");
  activeScene = scene("scene-b");
  await completePaste();
  expect.soft(fixture.editor.media.getAssets()).toEqual([]);
  expect.soft(activeScene.tracks.main.elements).toEqual([]);
  expect.soft(fixture.editor.command.canUndo()).toBe(false);
});

it("does not insert into a scene selected while media resolves", async () => {
  await beginPaste();
  activeScene = scene("scene-b");
  await completePaste();
  expect.soft(fixture.editor.media.getAssets()).toEqual([]);
  expect.soft(activeScene.tracks.main.elements).toEqual([]);
  expect.soft(fixture.editor.command.canUndo()).toBe(false);
});

it("does not finish a paste after its listener unmounts", async () => {
  await beginPaste();
  act(() => root.render(null));
  await completePaste();
  expect.soft(fixture.editor.media.getAssets()).toEqual([]);
  expect.soft(activeScene.tracks.main.elements).toEqual([]);
  expect.soft(fixture.editor.command.canUndo()).toBe(false);
});

it("rejects an asset submitted by a stale file or gallery import", async () => {
  const result = await fixture.editor.media.addMediaAsset({ projectId: "old-project", asset: asset() });
  expect(result).toBeNull();
  expect(fixture.editor.media.getAssets()).toEqual([]);
});

it("accepts an asset whose requested project is active", async () => {
  const result = await fixture.editor.media.addMediaAsset({ projectId: "project-a", asset: asset() });
  expect(result?.id).toBe("uploaded");
  expect(fixture.editor.media.getAssets()).toHaveLength(1);
});

it("does not execute an add-media command for another project", () => {
  new AddMediaAssetCommand({ projectId: "old-project", asset: asset() }).execute();
  expect(fixture.editor.media.getAssets()).toEqual([]);
});

it("does not undo media into a different project's bin", () => {
  const command = new AddMediaAssetCommand({ projectId: "project-a", asset: asset() });
  command.execute();
  activeProject = project("project-b");
  const otherAsset = { ...asset(), id: "other-project-asset" };
  fixture.editor.media.loadProjectMedia({ assets: [otherAsset] });
  command.undo();
  expect(fixture.editor.media.getAssets()).toEqual([otherAsset]);
});

it("does not accept a stale import just because its asset id exists", async () => {
  fixture.editor.media.loadProjectMedia({ assets: [asset()] });
  const result = await fixture.editor.media.addMediaAsset({ projectId: "old-project", asset: asset() });
  expect(result).toBeNull();
  expect(fixture.editor.media.getAssets()).toHaveLength(1);
});

it("preserves imports that intentionally omit the optional project id", async () => {
  const result = await fixture.editor.media.addMediaAsset({ asset: asset() });
  expect(result?.id).toBe("uploaded");
});

it("preserves internal timeline paste without media files", () => {
  const event = new Event("paste", { cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { items: [] } });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(fixture.editor.clipboard.paste).toHaveBeenCalledOnce();
});

function PasteListener() {
  usePasteMedia();
  return null;
}

async function beginPaste() {
  const file = new File(["synthetic"], "clip.mp4", { type: "video/mp4" });
  const event = new Event("paste", { cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: {
    items: [{ kind: "file", type: file.type, getAsFile: () => file }],
  } });
  window.dispatchEvent(event);
  await vi.waitFor(() => expect(fixture.adapters.mediaSource.uploadLocalFile).toHaveBeenCalledWith(file));
  upload.resolve({ id: "uploaded", kind: "video" });
  await vi.waitFor(() => expect(fixture.adapters.mediaSource.resolveMedia).toHaveBeenCalled());
}

async function completePaste() {
  resolve.resolve({ url: "https://media.invalid/clip.mp4", mime: "video/mp4" });
  await vi.waitFor(() => expect(
    fixture.adapters.toast.success.mock.calls.length + fixture.adapters.toast.warning.mock.calls.length,
  ).toBeGreaterThan(0));
}

function asset(): MediaAsset {
  return { id: "uploaded", name: "clip.mp4", type: "video", url: "https://media.invalid/clip.mp4" };
}

function project(id: string): TProject {
  return { metadata: { id }, settings: { fps: { numerator: 30, denominator: 1 } } } as TProject;
}

function scene(id: string): TScene {
  return { id, tracks: { overlay: [], audio: [], main: { id: "main", type: "video", elements: [] } } } as unknown as TScene;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
