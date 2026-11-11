import * as THREE from "three";
import Scene from "../engine/scene";
import type { LoadTicket } from "../engine/save_manager";
import { StoryTellerProxyScene } from "./storyteller_proxy_scene";

vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  return {
    SplatMesh: class extends Object3D {},
    SparkRenderer: class extends Object3D {},
  };
});

// The Addons barrel pulls in a lottie canvas module jsdom cannot run.
vi.mock("three/examples/jsm/Addons.js", async () => {
  const { Mesh } = await import("three");
  return { MMDAnimationHelper: class {}, Water: class extends Mesh {} };
});

const BOX_JSON = {
  media_file_token: "Parim",
  object_name: "Box",
  object_user_data_name: "Box",
  object_uuid: "box-uuid",
  position: new THREE.Vector3(),
  rotation: new THREE.Vector3(),
  scale: new THREE.Vector3(1, 1, 1),
  color: "#FFFFFF",
  metalness: 0,
  shininess: 0.5,
  specular: 0,
  locked: false,
  visible: true,
  media_file_type: "none",
  user_data: { shapeKey: "Box" },
};

describe("loadFromSceneJson", () => {
  it("removes and frees objects that finish after the load is cancelled", async () => {
    const scene = makeScene();
    const proxy = new StoryTellerProxyScene(2, scene);
    const ticket = makeTicket();
    const onDispose = vi.fn();
    const addListener = trackFirstMeshGeometry(scene, onDispose);

    const load = proxy.loadFromSceneJson([BOX_JSON] as never, "m_1", 2, ticket);
    // The box is created before the loader's first await on its tasks;
    // cancel while that await is pending, as a newer load or an unmount
    // would.
    addListener();
    ticket.cancelled = true;
    await load;

    expect(scene.scene.getObjectByProperty("name", "Box")).toBeUndefined();
    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it("keeps the loaded objects when the load is not cancelled", async () => {
    const scene = makeScene();
    const proxy = new StoryTellerProxyScene(2, scene);

    await proxy.loadFromSceneJson([BOX_JSON] as never, "m_1", 2, makeTicket());

    expect(scene.get_object_by_uuid("box-uuid")).toBeDefined();
  });
});

function makeScene(): Scene {
  return new Scene("test", "::CAM::", () => undefined, 2, {
    getCameras: () => [],
    getSelectedCameraId: () => "main",
    fetchAsset: () => Promise.reject(new Error("no network in tests")),
    getMediaUrlByToken: () => Promise.reject(new Error("no network in tests")),
  });
}

function makeTicket(): LoadTicket {
  return { cancelled: false, signal: new AbortController().signal };
}

// Returns a function that, once the load has created its box, subscribes
// `onDispose` to that box's geometry.
function trackFirstMeshGeometry(
  scene: Scene,
  onDispose: () => void,
): () => void {
  return () => {
    const box = scene.scene.getObjectByProperty("name", "Box") as THREE.Mesh;
    box.geometry.addEventListener("dispose", onDispose);
  };
}
