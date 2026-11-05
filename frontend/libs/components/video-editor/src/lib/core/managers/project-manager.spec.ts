import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted values are created before the vi.mock factories run, so the
// factories below can hand these exact mock functions to ProjectManager.
const { rehydrateMock, deserializeMock } = vi.hoisted(() => ({
  // Stands in for downloading a project's media bin.
  rehydrateMock: vi.fn(),
  // The real deserializer validates a stored document; the test envelopes
  // already hold ready-made { project, media } objects, so pass them through.
  deserializeMock: vi.fn((data: unknown) => data),
}));

vi.mock("../../media/rehydrate", () => ({
  rehydrateProjectMedia: rehydrateMock,
}));

vi.mock("../../services/storage/serialization", () => ({
  deserializeProjectDocument: deserializeMock,
  serializeProjectDocument: vi.fn(),
  mediaAssetToData: vi.fn(),
}));

// ProjectManager imports this command class; it is unused by these tests, so
// a stub keeps the heavy command module graph out of the test.
vi.mock("../../commands/project", () => ({
  UpdateProjectSettingsCommand: class {},
}));

import { ProjectManager } from "./project-manager";
import type { EditorCore } from "../index";

// A promise we settle by hand so a test decides exactly when a slow
// "storage read" or "media download" finishes.
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// Builds a fake stored project. `media` is the manifest list; the `scenes`
// array just needs to be distinguishable per project.
function buildEnvelope(id: string, media: unknown[] = []) {
  return {
    data: {
      project: {
        metadata: { id, name: id, updatedAt: new Date() },
        scenes: [{ id: `${id}-scene` }],
        currentSceneId: `${id}-scene`,
      },
      media,
    },
  };
}

// Builds a ProjectManager wired to a fake editor. `loadProject` decides what
// each project id returns (usually a deferred promise).
function buildManager(loadProject: (id: string) => Promise<unknown>) {
  const editor = {
    // flush/getIsDirty let openProject save the project it is leaving; a clean
    // editor by default so the older tests are unaffected.
    save: {
      stop: vi.fn(),
      start: vi.fn(),
      flush: vi.fn(async () => {}),
      getIsDirty: vi.fn(() => false),
    },
    command: { clear: vi.fn() },
    selection: { clearSelection: vi.fn() },
    scenes: { clearScenes: vi.fn(), initializeScenes: vi.fn() },
    media: { clearAllAssets: vi.fn(), loadProjectMedia: vi.fn() },
    adapters: {
      projectStorage: { loadProject: vi.fn(loadProject) },
      mediaSource: {},
      toast: {},
    },
  };
  const manager = new ProjectManager(editor as unknown as EditorCore);
  return { manager, editor };
}

describe("ProjectManager.openProject races", () => {
  beforeEach(() => {
    rehydrateMock.mockReset();
  });
  afterEach(() => {
    rehydrateMock.mockReset();
  });

  it("a slow older open does not overwrite a newer project", async () => {
    // Project A's storage read is slow; project B's is instant.
    const loadA = deferred<unknown>();
    const { manager, editor } = buildManager((id) =>
      id === "A" ? loadA.promise : Promise.resolve(buildEnvelope("B")),
    );

    // The user clicks A, then quickly clicks B.
    const openA = manager.openProject({ id: "A" });
    const openB = manager.openProject({ id: "B" });
    await openB;
    expect(manager.getActive()?.metadata.id).toBe("B");

    // Now A's slow read finally returns.
    loadA.resolve(buildEnvelope("A"));
    const resultA = await openA;

    // A must be discarded: B stays the active project and B's scenes stay
    // loaded. (Old code made A active and re-initialised the scenes.)
    expect(resultA).toBeNull();
    expect(manager.getActive()?.metadata.id).toBe("B");
    expect(editor.scenes.initializeScenes).toHaveBeenCalledTimes(1);
    expect(editor.scenes.initializeScenes).toHaveBeenCalledWith(
      expect.objectContaining({ currentSceneId: "B-scene" }),
    );
  });

  it("a slow older media download does not fill the newer project's media bin", async () => {
    // A has a media manifest (so it downloads media); B has none.
    const mediaA = deferred<unknown[]>();
    rehydrateMock.mockReturnValueOnce(mediaA.promise);
    const { manager, editor } = buildManager((id) =>
      Promise.resolve(
        id === "A" ? buildEnvelope("A", [{ id: "clip-a" }]) : buildEnvelope("B"),
      ),
    );

    // A starts opening and gets stuck on its media download.
    const openA = manager.openProject({ id: "A" });
    await vi.waitFor(() => expect(rehydrateMock).toHaveBeenCalledTimes(1));

    // The user opens B while A's media is still downloading.
    await manager.openProject({ id: "B" });

    // A's download now completes.
    mediaA.resolve([{ id: "clip-a" }]);
    expect(await openA).toBeNull();

    // A's assets must NOT be loaded into B's (empty) media bin.
    expect(editor.media.loadProjectMedia).not.toHaveBeenCalled();
    expect(manager.getActive()?.metadata.id).toBe("B");
    expect(manager.getIsLoading()).toBe(false);
  });

  it("the older open does not clear the loading flag while the newer one still loads", async () => {
    const loadA = deferred<unknown>();
    const loadB = deferred<unknown>();
    const { manager } = buildManager((id) =>
      id === "A" ? loadA.promise : loadB.promise,
    );

    const openA = manager.openProject({ id: "A" });
    const openB = manager.openProject({ id: "B" });

    // A finishes first (it is stale). B is still loading, so the manager
    // must still report loading (autosave relies on this flag).
    loadA.resolve(buildEnvelope("A"));
    await openA;
    expect(manager.getIsLoading()).toBe(true);

    // When B finishes, loading ends.
    loadB.resolve(buildEnvelope("B"));
    await openB;
    expect(manager.getIsLoading()).toBe(false);
    expect(manager.getActive()?.metadata.id).toBe("B");
  });

  it("closeProject during an open prevents the project from being resurrected", async () => {
    const loadA = deferred<unknown>();
    const { manager, editor } = buildManager(() => loadA.promise);

    // A starts opening, then the user leaves the editor (closeProject).
    const openA = manager.openProject({ id: "A" });
    manager.closeProject();
    expect(manager.getIsLoading()).toBe(false);

    // A's storage read lands after the close.
    loadA.resolve(buildEnvelope("A"));
    expect(await openA).toBeNull();

    // Nothing is active, no scenes were set up, and autosave was not re-armed.
    expect(manager.getActive()).toBeNull();
    expect(editor.scenes.initializeScenes).not.toHaveBeenCalled();
    expect(editor.save.start).not.toHaveBeenCalled();
    expect(manager.getIsLoading()).toBe(false);
  });

  it("saves the project being left before opening another one", async () => {
    const { manager, editor } = buildManager((id) =>
      Promise.resolve(buildEnvelope(id)),
    );
    await manager.openProject({ id: "A" });

    // The user just edited A: the debounced autosave has not run yet.
    editor.save.getIsDirty.mockReturnValue(true);
    const order: string[] = [];
    editor.save.flush.mockImplementation(async () => {
      order.push("flush");
    });
    editor.scenes.clearScenes.mockImplementation(() => {
      order.push("clear");
    });

    // A host route opens B directly (no header exit flow).
    await manager.openProject({ id: "B" });

    // A's pending edits must be written BEFORE its state is torn down.
    // (Old code went straight to closeProject(), whose save.stop() dropped
    // the pending autosave, so edits from the last ~800 ms were lost.)
    expect(order).toEqual(["flush", "clear"]);
    expect(manager.getActive()?.metadata.id).toBe("B");
  });

  it("does not open the project when the editor was closed during the pre-open save", async () => {
    const { manager, editor } = buildManager((id) =>
      Promise.resolve(buildEnvelope(id)),
    );
    await manager.openProject({ id: "A" });
    editor.save.getIsDirty.mockReturnValue(true);
    const flushGate = deferred<void>();
    editor.save.flush.mockImplementation(() => flushGate.promise);

    // B starts opening and waits on A's save; meanwhile the user exits.
    const openB = manager.openProject({ id: "B" });
    manager.closeProject();
    flushGate.resolve();

    // The late open must not resurrect a project after the close.
    expect(await openB).toBeNull();
    expect(manager.getActive()).toBeNull();
  });

  it("a normal single open still activates the project and finishes loading", async () => {
    const { manager, editor } = buildManager(() =>
      Promise.resolve(buildEnvelope("A")),
    );

    const project = await manager.openProject({ id: "A" });

    expect(project?.metadata.id).toBe("A");
    expect(manager.getActive()?.metadata.id).toBe("A");
    expect(editor.save.start).toHaveBeenCalledTimes(1);
    expect(manager.getIsLoading()).toBe(false);
  });
});
