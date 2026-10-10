// @vitest-environment node
import { MediaManager } from "./media-manager";
import { CommandManager } from "./commands";
import type { EditorCore } from "../index";
import type { SceneTracks } from "../../timeline/types";
import type { MediaAsset } from "../../media/types";

const fixture = vi.hoisted(() => ({ editor: null as unknown as EditorCore }));
vi.mock("../index", () => ({ EditorCore: { getInstance: () => fixture.editor } }));
vi.mock("../../commands", async () => await import("../../commands/batch-command"));
vi.mock("../../commands/media", async () => await import("../../commands/media/remove-media-asset"));
// These tests remove assets from an empty timeline. Rendering caches and
// unused ripple/element-construction code are excluded from this boundary.
vi.mock("../../services/video-cache", () => ({ videoCache: { clearVideo: vi.fn(), clearAll: vi.fn() } }));
vi.mock("../../services/video-cache/service", () => ({ videoCache: { clearVideo: vi.fn(), clearAll: vi.fn() } }));
vi.mock("../../services/waveform-cache", () => ({ waveformCache: { clearSource: vi.fn(), clearAll: vi.fn() } }));
vi.mock("../../services/waveform-cache/service", () => ({ waveformCache: { clearSource: vi.fn(), clearAll: vi.fn() } }));
vi.mock("../../retime", () => ({ getSourceTimeAtClipTime: () => { throw new Error("waveform rendering not used"); } }));
vi.mock("../../ripple", () => ({
  applyRippleAdjustments: () => { throw new Error("ripple is disabled"); },
  computeRippleAdjustments: () => { throw new Error("ripple is disabled"); },
}));
vi.mock("../../timeline/element-utils", () => ({ hasMediaId: () => { throw new Error("timeline has no elements"); } }));

afterEach(() => fixture.editor.media.clearAllAssets());

it("keeps both files readable after undoing a multi-asset removal", async () => {
  const { media, command } = buildFixture();
  media.removeMediaAssets({ projectId: "project", ids: ["a", "b"] });
  expect(media.getAssets().map((asset) => asset.id)).toEqual(["c"]);
  command.undo();
  expect(media.getAssets().map((asset) => asset.id)).toEqual(["a", "b", "c"]);
  expect(await readAssets(media)).toEqual(["contents-a", "contents-b", "contents-c"]);
});

it("preserves an already-restored file when undoing consecutive removals", async () => {
  const { media, command } = buildFixture();
  media.removeMediaAsset({ projectId: "project", id: "a" });
  media.removeMediaAsset({ projectId: "project", id: "b" });
  command.undo();
  command.undo();
  expect(await readAssets(media)).toEqual(["contents-a", "contents-b", "contents-c"]);
});

it("supports repeated batch undo/redo without restoring revoked URLs", async () => {
  const { media, command } = buildFixture();
  media.removeMediaAssets({ projectId: "project", ids: ["a", "b"] });
  for (let cycle = 0; cycle < 3; cycle++) {
    command.undo();
    expect(await readAssets(media)).toEqual(["contents-a", "contents-b", "contents-c"]);
    command.redo();
    expect(media.getAssets().map((asset) => asset.id)).toEqual(["c"]);
  }
});

it("preserves the ordinary single removal and undo path", async () => {
  const { media, command } = buildFixture();
  media.removeMediaAsset({ projectId: "project", id: "b" });
  expect(await readAssets(media)).toEqual(["contents-a", "contents-c"]);
  command.undo();
  expect(await readAssets(media)).toEqual(["contents-a", "contents-b", "contents-c"]);
});

function buildFixture() {
  let tracks = { overlay: [], main: { id: "main", elements: [] }, audio: [] } as unknown as SceneTracks;
  const editor = {
    scenes: { getActiveScene: () => ({ tracks }) },
    timeline: { updateTracks: (next: SceneTracks) => { tracks = next; } },
    selection: { getSnapshot: () => ({}) },
  } as unknown as EditorCore;
  const media = new MediaManager(editor);
  const command = new CommandManager(editor);
  Object.assign(editor, { media, command });
  fixture.editor = editor;
  const assets: MediaAsset[] = ["a", "b", "c"].map((id) => {
    const file = new File([`contents-${id}`], `${id}.mp4`, { type: "video/mp4" });
    return { id, file, name: id, type: "video", url: URL.createObjectURL(file) };
  });
  media.loadProjectMedia({ assets });
  return { media, command };
}

async function readAssets(media: MediaManager) {
  return Promise.all(media.getAssets().map(async (asset) => (await fetch(asset.url!)).text()));
}
