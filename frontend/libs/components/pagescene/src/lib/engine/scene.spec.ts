import * as THREE from "three";
import Scene from "./scene";

// Scene imports Spark for splat loading; none of these tests load one.
vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  return {
    SplatMesh: class extends Object3D {},
    SparkRenderer: class extends Object3D {},
  };
});

// The Addons barrel pulls in a lottie canvas module jsdom cannot run; Scene
// only needs these two names from it.
vi.mock("three/examples/jsm/Addons.js", async () => {
  const { Mesh } = await import("three");
  return { MMDAnimationHelper: class {}, Water: class extends Mesh {} };
});

describe("Scene disposal", () => {
  describe("disposeObject", () => {
    it("frees the object's GPU resources", () => {
      const scene = makeScene();
      const geometry = new THREE.BoxGeometry();
      const onDispose = vi.fn();
      geometry.addEventListener("dispose", onDispose);

      scene.disposeObject(new THREE.Mesh(geometry));

      expect(onDispose).toHaveBeenCalledTimes(1);
    });

    it("stops shader ticks for disposed water but keeps the rest", () => {
      const scene = makeScene();
      const water = waterLikeMesh();
      const otherWater = waterLikeMesh();
      scene.shader_objects = [water, otherWater] as never;
      const group = new THREE.Group();
      group.add(water);

      scene.disposeObject(group);

      expect(scene.shader_objects).toEqual([otherWater]);
    });

    it("stops and forgets the video behind a video plane", () => {
      const scene = makeScene();
      const video = stubbedVideo();
      const otherVideo = stubbedVideo();
      scene.video_planes = [video, otherVideo];
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        new THREE.MeshBasicMaterial({ map: new THREE.VideoTexture(video) }),
      );

      scene.disposeObject(plane);

      expect(video.pause).toHaveBeenCalled();
      expect(video.load).toHaveBeenCalled();
      expect(video.hasAttribute("src")).toBe(false);
      expect(scene.video_planes).toEqual([otherVideo]);
      expect(otherVideo.pause).not.toHaveBeenCalled();
    });

    it("removes MMD meshes from the animation helper", () => {
      const scene = makeScene();
      const mmd = new THREE.SkinnedMesh();
      const other = new THREE.SkinnedMesh();
      const remove = vi.fn();
      scene.helper = { meshes: [mmd, other], remove } as never;

      scene.disposeObject(mmd);

      expect(remove).toHaveBeenCalledTimes(1);
      expect(remove).toHaveBeenCalledWith(mmd);
    });
  });

  describe("disposeContents", () => {
    it("empties the scene and frees every child", () => {
      const scene = makeScene();
      const geometries = [new THREE.BoxGeometry(), new THREE.SphereGeometry()];
      const disposed = new Set<THREE.BufferGeometry>();
      for (const geometry of geometries) {
        geometry.addEventListener("dispose", () => disposed.add(geometry));
        scene.scene.add(new THREE.Mesh(geometry));
      }
      const child = scene.scene.children[0];
      scene.hot_items = [child];

      scene.disposeContents();

      expect(scene.scene.children).toHaveLength(0);
      expect(child.parent).toBeNull();
      expect(scene.hot_items).toEqual([]);
      expect(disposed).toEqual(new Set(geometries));
    });

    it("leaves the background for the skybox to replace", () => {
      const scene = makeScene();
      const background = new THREE.CubeTexture();
      const onDispose = vi.fn();
      background.addEventListener("dispose", onDispose);
      scene.scene.background = background;

      scene.disposeContents();

      expect(scene.scene.background).toBe(background);
      expect(onDispose).not.toHaveBeenCalled();
    });
  });

  it("dispose frees the contents and the background", () => {
    const scene = makeScene();
    const geometry = new THREE.BoxGeometry();
    const background = new THREE.CubeTexture();
    const disposed = new Set<unknown>();
    geometry.addEventListener("dispose", () => disposed.add(geometry));
    background.addEventListener("dispose", () => disposed.add(background));
    scene.scene.add(new THREE.Mesh(geometry));
    scene.scene.background = background;

    scene.dispose();

    expect(disposed).toEqual(new Set([geometry, background]));
    expect(scene.scene.children).toHaveLength(0);
    expect(scene.scene.background).toBeNull();
  });

  it("disposeBackground frees a texture background", () => {
    const scene = makeScene();
    const background = new THREE.CubeTexture();
    const onDispose = vi.fn();
    background.addEventListener("dispose", onDispose);
    scene.scene.background = background;

    scene.disposeBackground();

    expect(onDispose).toHaveBeenCalledTimes(1);
  });
});

function makeScene(): Scene {
  return new Scene("test", "::CAM::", () => undefined, 1, {
    getCameras: () => [],
    getSelectedCameraId: () => "main",
    fetchAsset: () => Promise.reject(new Error("no network in tests")),
    getMediaUrlByToken: () => Promise.reject(new Error("no network in tests")),
  });
}

// Scene only tracks Water instances by identity; a plain mesh stands in.
function waterLikeMesh(): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial());
}

// jsdom does not implement media playback, so stub the calls stopVideo makes.
function stubbedVideo(): HTMLVideoElement {
  const video = document.createElement("video");
  video.src = "https://example.invalid/clip.mp4";
  video.pause = vi.fn();
  video.load = vi.fn();
  return video;
}
