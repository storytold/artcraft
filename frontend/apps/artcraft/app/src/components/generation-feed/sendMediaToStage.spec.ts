import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sendMediaToStage } from "./sendMediaToStage";
import { useTabStore } from "../../pages/Stores/TabState";

const stage = vi.hoisted(() => ({ editor: vi.fn(), add: vi.fn() }));
vi.mock("@storyteller/ui-pagescene", () => ({ getActiveEditor: stage.editor, addObject: stage.add, AssetType: { OBJECT: "object" } }));

beforeEach(() => {
  vi.useFakeTimers();
  stage.editor.mockReset();
  stage.add.mockReset().mockResolvedValue("object-id");
  useTabStore.setState(useTabStore.getInitialState(), true);
});
afterEach(() => vi.useRealTimers());

it("waits for the saved scene to load before adding the selected media", async () => {
  let loaded = false;
  const editor = { sceneManager: {}, isEngineDataLoaded: () => loaded };
  stage.editor.mockReturnValue(editor);
  const result = sendMediaToStage("mf_selected");
  await vi.advanceTimersByTimeAsync(500);
  expect(stage.add).not.toHaveBeenCalled();
  loaded = true;
  await vi.advanceTimersByTimeAsync(50);
  await result;
  expect(useTabStore.getState().activeTabId).toBe("3D");
  expect(stage.add).toHaveBeenCalledExactlyOnceWith(editor, expect.objectContaining({ media_id: "mf_selected" }));
});

it("times out without inserting an asset when the editor never becomes ready", async () => {
  stage.editor.mockReturnValue(null);
  const result = expect(sendMediaToStage("mf_selected")).rejects.toThrow("still loading");
  await vi.advanceTimersByTimeAsync(5000);
  await result;
  expect(stage.add).not.toHaveBeenCalled();
});

it("does not report success when the scene rejects the asset", async () => {
  stage.editor.mockReturnValue({ sceneManager: {}, isEngineDataLoaded: () => true });
  stage.add.mockResolvedValue(undefined);
  await expect(sendMediaToStage("mf_selected")).rejects.toThrow("could not be added");
});

it("rejects a missing media ID without navigating", async () => {
  await expect(sendMediaToStage()).rejects.toThrow("no media ID");
  expect(useTabStore.getState().activeTabId).toBe("APPS");
});

it("cancels the pending transfer if the user leaves the stage", async () => {
  stage.editor.mockReturnValue(null);
  const result = expect(sendMediaToStage("mf_selected")).rejects.toThrow("switched tabs");
  await vi.advanceTimersByTimeAsync(50);
  await useTabStore.getState().setActiveTab("IMAGE");
  await vi.advanceTimersByTimeAsync(50);
  await result;
  expect(stage.add).not.toHaveBeenCalled();
});
