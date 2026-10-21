import { SaveManager } from "./save-manager";
import { ProjectManager } from "./project-manager";
import type { EditorCore } from "../index";
import type { TProject } from "../../project/types";

// Commands and media downloads are not invoked by save/exit; exercise the
// real managers and document serialization against the host storage adapter.
vi.mock("../../commands/project", () => ({ UpdateProjectSettingsCommand: class {} }));
vi.mock("../../media/rehydrate", () => ({ rehydrateProjectMedia: vi.fn() }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("waits for an in-flight autosave and the newest edit before exit closes the project", async () => {
  const fixture = buildFixture();
  fixture.save.markDirty();
  await vi.advanceTimersByTimeAsync(20);
  fixture.project.setActiveProject({ project: sampleProject("Newest edit") });
  fixture.save.markDirty();

  let exited = false;
  const exit = fixture.project.prepareExit().then(() => {
    exited = true;
    fixture.project.closeProject();
  });
  await drainMicrotasks();
  const exitedBeforeWriteFinished = exited;
  fixture.releaseFirstWrite();
  await exit;
  await vi.advanceTimersByTimeAsync(20);

  expect(exitedBeforeWriteFinished).toBe(false);
  expect(fixture.savedNames).toEqual(["Original", "Newest edit"]);
  expect(fixture.project.getActive()).toBeNull();
});

it("makes concurrent flush callers wait for the final write", async () => {
  const fixture = buildFixture();
  fixture.save.markDirty();
  await vi.advanceTimersByTimeAsync(20);
  fixture.project.setActiveProject({ project: sampleProject("Newest edit") });
  const completions: number[] = [];
  const flushes = [1, 2].map((id) => fixture.save.flush().then(() => completions.push(id)));
  await drainMicrotasks();
  const earlyCompletions = [...completions];
  fixture.releaseFirstWrite();
  await Promise.all(flushes);

  expect(earlyCompletions).toEqual([]);
  expect(fixture.savedNames).toEqual(["Original", "Newest edit"]);
  expect(fixture.save.getIsDirty()).toBe(false);
});

it("propagates an in-flight write failure to a waiting flush", async () => {
  const fixture = buildFixture();
  const first = fixture.save.flush();
  const second = fixture.save.flush();
  const results = Promise.allSettled([first, second]);
  fixture.rejectFirstWrite(new Error("disk unavailable"));
  const settled = await results;

  expect(settled.map((result) => result.status)).toEqual(["rejected", "rejected"]);
  expect(fixture.project.getActive()?.metadata.name).toBe("Original");
  fixture.save.stop();
});

it("preserves the ordinary flush and prepare-exit path", async () => {
  const fixture = buildFixture(false);
  fixture.project.setActiveProject({ project: sampleProject("Newest edit") });
  await fixture.project.prepareExit();
  expect(fixture.savedNames).toEqual(["Newest edit"]);
  expect(fixture.save.getIsDirty()).toBe(false);
  fixture.project.closeProject();
});

function buildFixture(blockFirstWrite = true) {
  let releaseFirstWrite!: () => void;
  let rejectFirstWrite!: (reason: Error) => void;
  const firstWrite = new Promise<void>((resolve, reject) => {
    releaseFirstWrite = resolve;
    rejectFirstWrite = reject;
  });
  const savedNames: string[] = [];
  let writes = 0;
  const editor = {
    adapters: { projectStorage: {
      async saveProject(document: { data: { project: { metadata: { name: string } } } }) {
        writes++;
        if (blockFirstWrite && writes === 1) await firstWrite;
        savedNames.push(document.data.project.metadata.name);
      },
    } },
    scenes: { subscribe: () => () => {}, clearScenes: vi.fn() },
    timeline: { subscribe: () => () => {} },
    command: { clear: vi.fn() },
    media: { getAssets: () => [], clearAllAssets: vi.fn() },
  } as unknown as EditorCore;
  const project = new ProjectManager(editor);
  const save = new SaveManager({ editor, debounceMs: 20 });
  Object.assign(editor, { project, save });
  project.setActiveProject({ project: sampleProject("Original") });
  save.start();
  return { project, save, savedNames, releaseFirstWrite, rejectFirstWrite };
}

function sampleProject(name: string): TProject {
  return {
    metadata: { id: "project-a", name, createdAt: new Date(0), updatedAt: new Date(0), duration: 0 },
    scenes: [], currentSceneId: "", settings: { fps: { numerator: 30, denominator: 1 }, canvasSize: { width: 1920, height: 1080 }, background: { type: "color", color: "#000" } },
    version: 1,
  } as TProject;
}

async function drainMicrotasks() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}
