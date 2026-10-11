import { ScenesManager } from "./scenes-manager";
import { ProjectManager } from "./project-manager";
import { CommandManager } from "./commands";
import type { EditorCore } from "../index";
import type { TProject } from "../../project/types";
import type { TScene } from "../../timeline/types";
import { deserializeProjectDocument } from "../../services/storage/serialization";

const host = vi.hoisted(() => ({ editor: null as unknown as EditorCore }));
// Renderer/audio initialization and unrelated bookmark/ripple operations are
// outside scene CRUD. Exercise real managers, commands, and serialization.
vi.mock("../index", () => ({ EditorCore: { getInstance: () => host.editor } }));
vi.mock("../../commands/scene", async () => ({
  ...(await import("../../commands/scene/delete-scene")),
  ...(await import("../../commands/scene/rename-scene")),
  CreateSceneCommand: class {}, MoveBookmarkCommand: class {},
  RemoveBookmarkCommand: class {}, ToggleBookmarkCommand: class {},
  UpdateBookmarkCommand: class {},
}));
vi.mock("../../commands/project", () => ({ UpdateProjectSettingsCommand: class {} }));
vi.mock("../../media/rehydrate", () => ({ rehydrateProjectMedia: vi.fn() }));
vi.mock("../../timeline/bookmarks", () => ({
  getBookmarkAtTime: vi.fn(), getFrameTime: vi.fn(), isBookmarkAtTime: vi.fn(),
}));
vi.mock("../../wasm", () => ({ ZERO_MEDIA_TIME: 0 }));
vi.mock("../../ripple", () => ({ applyRippleAdjustments: vi.fn(), computeRippleAdjustments: vi.fn() }));

it("persists the fallback scene when deleting the selected scene", async () => {
  const fixture = buildFixture();
  await fixture.scenes.deleteScene({ sceneId: "secondary" });
  const saved = await fixture.saveAndReload();
  expect(fixture.scenes.getActiveScene().id).toBe("main");
  expect(saved.currentSceneId).toBe("main");
  expect(saved.scenes.map((scene) => scene.id)).toEqual(["main", "other"]);
});

it("persists the restored scene when undoing deletion after switching scenes", async () => {
  const fixture = buildFixture();
  await fixture.scenes.deleteScene({ sceneId: "secondary" });
  await fixture.scenes.switchToScene({ sceneId: "other" });
  fixture.command.undo();
  const saved = await fixture.saveAndReload();
  expect(fixture.scenes.getActiveScene().id).toBe("secondary");
  expect(saved.currentSceneId).toBe("secondary");
  expect(saved.scenes.map((scene) => scene.id)).toEqual(["main", "secondary", "other"]);
});

it("persists the fallback again when redoing deletion", async () => {
  const fixture = buildFixture();
  await fixture.scenes.deleteScene({ sceneId: "secondary" });
  fixture.command.undo();
  fixture.command.redo();
  const saved = await fixture.saveAndReload();
  expect(saved.currentSceneId).toBe(fixture.scenes.getActiveScene().id);
  expect(saved.currentSceneId).toBe("main");
});

it("preserves the selected scene when deleting a different scene", async () => {
  const fixture = buildFixture();
  await fixture.scenes.deleteScene({ sceneId: "other" });
  expect((await fixture.saveAndReload()).currentSceneId).toBe("secondary");
  expect(fixture.scenes.getActiveScene().id).toBe("secondary");
});

it("preserves ordinary switching and renaming selection", async () => {
  const fixture = buildFixture();
  await fixture.scenes.switchToScene({ sceneId: "other" });
  await fixture.scenes.renameScene({ sceneId: "other", name: "Renamed" });
  const saved = await fixture.saveAndReload();
  expect(saved.currentSceneId).toBe("other");
  expect(saved.scenes.find((scene) => scene.id === "other")?.name).toBe("Renamed");
});

it("protects the main scene and preserves the current project", async () => {
  const fixture = buildFixture();
  await expect(fixture.scenes.deleteScene({ sceneId: "main" })).rejects.toThrow("Cannot delete main scene");
  expect((await fixture.saveAndReload()).currentSceneId).toBe("secondary");
  expect(fixture.scenes.getScenes()).toHaveLength(3);
});

function buildFixture() {
  let savedData: unknown;
  const editor = {
    adapters: { projectStorage: {
      async saveProject({ data }: { data: unknown }) {
        savedData = JSON.parse(JSON.stringify(data));
      },
    } },
    media: { getAssets: () => [] },
    selection: { getSnapshot: () => ({ selectedElements: [], selectedKeyframes: [] }) },
    save: { markDirty: vi.fn() },
  } as unknown as EditorCore;
  const project = new ProjectManager(editor);
  const scenes = new ScenesManager(editor);
  const command = new CommandManager(editor);
  Object.assign(editor, { project, scenes, command });
  host.editor = editor;
  const sceneList = [sampleScene("main", true), sampleScene("secondary"), sampleScene("other")];
  project.setActiveProject({ project: {
    metadata: {
      id: "project-a", name: "Scene deletion", createdAt: new Date(0),
      updatedAt: new Date(0), duration: 0,
    },
    scenes: sceneList, currentSceneId: "secondary", version: 1,
    settings: {
      fps: { numerator: 30, denominator: 1 },
      canvasSize: { width: 1920, height: 1080 },
      background: { type: "color", color: "#000" },
    },
  } as TProject });
  scenes.initializeScenes({ scenes: sceneList, currentSceneId: "secondary" });
  return { project, scenes, command, async saveAndReload() {
    await project.saveCurrentProject();
    return deserializeProjectDocument(savedData)!.project;
  } };
}

function sampleScene(id: string, isMain = false): TScene {
  return {
    id, name: id, isMain, createdAt: new Date(0), updatedAt: new Date(0),
    bookmarks: [],
    tracks: { overlay: [], audio: [], main: {
      id: `${id}-track`, name: "Main", type: "video", elements: [],
      muted: false, hidden: false,
    } },
  };
}
