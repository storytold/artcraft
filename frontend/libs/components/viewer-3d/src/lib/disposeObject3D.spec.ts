import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { disposeObject3D } from "./disposeObject3D";

// A real SplatMesh / SparkRenderer needs Spark's WASM decoder and a WebGL
// renderer; only `instanceof` and the dispose() calls matter here.
vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  const accumulator = () => ({ splats: { dispose: vi.fn() } });
  return {
    SplatMesh: class extends Object3D {
      dispose = vi.fn();
    },
    SparkRenderer: class extends Object3D {
      defaultView = { dispose: vi.fn() };
      active = accumulator();
      freeAccumulators = [accumulator(), accumulator()];
    },
  };
});

describe("disposeObject3D", () => {
  it("disposes nested geometries, materials and their textures", () => {
    const map = new THREE.Texture();
    const normalMap = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map, normalMap });
    const geometry = new THREE.BoxGeometry();
    const root = new THREE.Group();
    const child = new THREE.Group();
    child.add(new THREE.Mesh(geometry, material));
    root.add(child);

    const disposed = trackDisposals([map, normalMap, material, geometry]);
    disposeObject3D(root);

    expect(disposed).toEqual(new Set([map, normalMap, material, geometry]));
  });

  it("disposes every material of a multi-material mesh", () => {
    const first = new THREE.MeshBasicMaterial({ map: new THREE.Texture() });
    const second = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), [first, second]);

    const disposed = trackDisposals([first, second, first.map!]);
    disposeObject3D(mesh);

    expect(disposed).toEqual(new Set([first, second, first.map]));
  });

  it("disposes a material shared by several meshes once", () => {
    const material = new THREE.MeshBasicMaterial();
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
    root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));

    const onDispose = vi.fn();
    material.addEventListener("dispose", onDispose);
    disposeObject3D(root);

    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it("disposes skinned mesh skeletons", () => {
    const bone = new THREE.Bone();
    const skeleton = new THREE.Skeleton([bone]);
    const mesh = new THREE.SkinnedMesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial(),
    );
    mesh.add(bone);
    mesh.bind(skeleton);
    const dispose = vi.spyOn(skeleton, "dispose");

    disposeObject3D(mesh);

    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("frees splat buffers", () => {
    const splat = new SplatMesh();
    const root = new THREE.Group();
    root.add(splat);

    disposeObject3D(root);

    expect(splat.dispose).toHaveBeenCalledTimes(1);
  });

  it("frees a SparkRenderer's viewpoint and accumulators", () => {
    const spark = new SparkRenderer({} as never);
    const root = new THREE.Group();
    root.add(spark);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { freeAccumulators } = spark as any;

    disposeObject3D(root);

    expect(spark.defaultView.dispose).toHaveBeenCalledTimes(1);
    expect(spark.active.splats.dispose).toHaveBeenCalledTimes(1);
    for (const accumulator of freeAccumulators) {
      expect(accumulator.splats.dispose).toHaveBeenCalledTimes(1);
    }
  });

  it("disposes textures held in ShaderMaterial uniforms", () => {
    const normals = new THREE.Texture();
    const mirror = new THREE.WebGLRenderTarget(4, 4).texture;
    const layers = [new THREE.Texture(), new THREE.Texture()];
    const material = new THREE.ShaderMaterial({
      uniforms: {
        normalSampler: { value: normals },
        mirrorSampler: { value: mirror },
        layerSamplers: { value: layers },
        size: { value: 1.0 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);

    const disposed = trackDisposals([normals, mirror, ...layers]);
    disposeObject3D(mesh);

    expect(disposed).toEqual(new Set([normals, mirror, ...layers]));
  });

  it("disposes a texture shared by a property and a uniform once", () => {
    const video = new THREE.Texture();
    const material = new THREE.ShaderMaterial({
      uniforms: { map: { value: video } },
    });
    // ChromaKeyMaterial keeps its VideoTexture both here and in a uniform.
    (material as unknown as { texture: THREE.Texture }).texture = video;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);

    const onDispose = vi.fn();
    video.addEventListener("dispose", onDispose);
    disposeObject3D(mesh);

    expect(onDispose).toHaveBeenCalledTimes(1);
  });

  it("skips objects without geometry or material", () => {
    const root = new THREE.Group();
    root.add(new THREE.DirectionalLight());
    root.add(new THREE.PerspectiveCamera());

    expect(() => disposeObject3D(root)).not.toThrow();
  });
});

// Records which resources dispatched their "dispose" event.
function trackDisposals(
  resources: Array<THREE.Texture | THREE.Material | THREE.BufferGeometry>,
): Set<unknown> {
  const disposed = new Set<unknown>();
  for (const resource of resources) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (resource as any).addEventListener("dispose", () => disposed.add(resource));
  }
  return disposed;
}
