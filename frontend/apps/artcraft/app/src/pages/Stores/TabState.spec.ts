import { beforeEach, expect, it } from "vitest";
import { useTabStore } from "./TabState";
import { useSceneStore } from "../../../../../../libs/components/pagedraw/src/lib/stores/SceneState";
import { Node } from "../../../../../../libs/components/pagedraw/src/lib/Node";

const initialScene = useSceneStore.getInitialState();
const initialTabs = useTabStore.getInitialState();

beforeEach(() => {
  useSceneStore.setState(initialScene, true);
  useTabStore.setState(initialTabs, true);
});

it("retains decoded images, selection, model metadata, and history across tab changes", async () => {
  const image = new Node({
    id: "image", type: "image", x: 10, y: 20, width: 512, height: 512,
    fill: "transparent", imageFile: new File(["pixels"], "artwork.png"),
    imageElement: new Image(), modelUrl: "blob:model",
  });
  useSceneStore.setState({ drawNodes: [image], selectedNodeIds: [image.id] });
  useSceneStore.getState().saveState();
  const before = useSceneStore.getState();

  await useTabStore.getState().setActiveTab("2D");
  await useTabStore.getState().setActiveTab("APPS");
  await useTabStore.getState().setActiveTab("2D");

  const after = useSceneStore.getState();
  expect(after.drawNodes).toBe(before.drawNodes);
  expect(after.drawNodes[0]).toBe(image);
  expect(after.selectedNodeIds).toEqual([image.id]);
  expect(after.history).toBe(before.history);
  expect(after.historyIndex).toBe(before.historyIndex);
});

it("keeps redo available when navigating away after undo", async () => {
  const scene = useSceneStore.getState();
  useSceneStore.setState({ drawNodes: [rectangle("first")] });
  scene.saveState();
  useSceneStore.setState({ drawNodes: [rectangle("first"), rectangle("second")] });
  scene.saveState();
  await scene.undo();

  await useTabStore.getState().setActiveTab("2D");
  await useTabStore.getState().setActiveTab("IMAGE");
  await useTabStore.getState().setActiveTab("2D");
  await useSceneStore.getState().redo();

  expect(useSceneStore.getState().drawNodes.map((node) => node.id)).toEqual(["first", "second"]);
});

it("keeps edits made while away and does not restore an old scene after a gallery reset", async () => {
  useSceneStore.setState({ drawNodes: [rectangle("old")] });
  await useTabStore.getState().setActiveTab("2D");
  await useTabStore.getState().setActiveTab("APPS");
  useSceneStore.getState().RESET();
  useSceneStore.setState({ drawNodes: [rectangle("new")] });
  await useTabStore.getState().setActiveTab("2D");
  expect(useSceneStore.getState().drawNodes.map((node) => node.id)).toEqual(["new"]);
});

it("honors the latest rapid navigation request", async () => {
  await useTabStore.getState().setActiveTab("2D");
  const results = await Promise.all([
    useTabStore.getState().setActiveTab("IMAGE"),
    useTabStore.getState().setActiveTab("VIDEO"),
  ]);
  expect(results).toEqual([true, true]);
  expect(useTabStore.getState().activeTabId).toBe("VIDEO");
});

it("still exports a portable scene when explicitly requested", async () => {
  const image = new Node({
    id: "image", type: "image", x: 0, y: 0, width: 1, height: 1,
    fill: "transparent", imageFile: new File(["pixels"], "image.png", { type: "image/png" }),
  });
  useSceneStore.setState({ drawNodes: [image] });
  const exported = JSON.parse(await useSceneStore.getState().exportSceneAsJson());
  expect(exported.drawNodes[0].imageDataUrl).toBe("data:image/png;base64,cGl4ZWxz");
});

function rectangle(id: string) {
  return new Node({ id, type: "rectangle", x: 0, y: 0, width: 100, height: 100, fill: "red" });
}
