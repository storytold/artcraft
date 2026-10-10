import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  convertModelBufferToGlb,
  getConvertibleModelExtension,
} from "./modelToGlb";

const OBJ_QUAD = [
  "o quad",
  "v 0 0 0",
  "v 1 0 0",
  "v 1 1 0",
  "v 0 1 0",
  "f 1 2 3",
  "f 1 3 4",
].join("\n");

const STL_ASCII_TRIANGLE = [
  "solid triangle",
  "facet normal 0 0 1",
  "outer loop",
  "vertex 0 0 0",
  "vertex 1 0 0",
  "vertex 0 1 0",
  "endloop",
  "endfacet",
  "endsolid triangle",
].join("\n");

const PLY_COLORED_TRIANGLE = [
  "ply",
  "format ascii 1.0",
  "element vertex 3",
  "property float x",
  "property float y",
  "property float z",
  "property uchar red",
  "property uchar green",
  "property uchar blue",
  "element face 1",
  "property list uchar int vertex_indices",
  "end_header",
  "0 0 0 255 0 0",
  "1 0 0 0 255 0",
  "0 1 0 0 0 255",
  "3 0 1 2",
].join("\n");

// PLYLoader de-indexes meshes with per-face colors.
const PLY_FACE_COLORED_QUAD = [
  "ply",
  "format ascii 1.0",
  "element vertex 4",
  "property float x",
  "property float y",
  "property float z",
  "element face 2",
  "property list uchar int vertex_indices",
  "property uchar red",
  "property uchar green",
  "property uchar blue",
  "end_header",
  "0 0 0",
  "1 0 0",
  "1 1 0",
  "0 1 0",
  "3 0 1 2 255 0 0",
  "3 0 2 3 0 0 255",
].join("\n");

const PLY_POINT_CLOUD = [
  "ply",
  "format ascii 1.0",
  "element vertex 2",
  "property float x",
  "property float y",
  "property float z",
  "end_header",
  "0 0 0",
  "1 0 0",
].join("\n");

const PLY_GAUSSIAN_SPLAT_HEADER = [
  "ply",
  "format binary_little_endian 1.0",
  "element vertex 1",
  "property float x",
  "property float y",
  "property float z",
  "property float f_dc_0",
  "property float opacity",
  "property float scale_0",
  "property float rot_0",
  "end_header",
  "",
].join("\n");

describe("getConvertibleModelExtension", () => {
  it("recognizes convertible formats case-insensitively", () => {
    expect(getConvertibleModelExtension("rig.FBX")).toBe("fbx");
    expect(getConvertibleModelExtension("chair.obj")).toBe("obj");
    expect(getConvertibleModelExtension("part.v2.Stl")).toBe("stl");
    expect(getConvertibleModelExtension("scan.ply")).toBe("ply");
  });

  it("returns null for GLB and unrelated files", () => {
    expect(getConvertibleModelExtension("model.glb")).toBeNull();
    expect(getConvertibleModelExtension("splat.spz")).toBeNull();
    expect(getConvertibleModelExtension("obj")).toBeNull();
  });
});

describe("convertModelBufferToGlb", () => {
  describe("obj", () => {
    it("exports the faces with a PBR material", async () => {
      const meshes = await convertAndReload(text(OBJ_QUAD), "obj");
      expect(meshes).toHaveLength(1);
      expect(triangleCount(meshes[0])).toBe(2);
      expect(meshes[0].material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it("rejects files without faces", async () => {
      await expect(
        convertModelBufferToGlb(text("v 0 0 0\nv 1 0 0"), "obj", "empty"),
      ).rejects.toThrow("No faces found");
    });
  });

  describe("stl", () => {
    it("exports an ASCII STL", async () => {
      const meshes = await convertAndReload(text(STL_ASCII_TRIANGLE), "stl");
      expect(meshes).toHaveLength(1);
      expect(triangleCount(meshes[0])).toBe(1);
      expect(meshes[0].geometry.getAttribute("normal")).toBeDefined();
    });

    it("exports a binary STL", async () => {
      const meshes = await convertAndReload(binaryStl(2), "stl");
      expect(triangleCount(meshes[0])).toBe(2);
    });

    it("names the mesh after the file", async () => {
      const meshes = await convertAndReload(text(STL_ASCII_TRIANGLE), "stl");
      expect(meshes[0].name).toBe("model");
    });
  });

  describe("ply", () => {
    it("exports a mesh and keeps vertex colors", async () => {
      const meshes = await convertAndReload(text(PLY_COLORED_TRIANGLE), "ply");
      expect(triangleCount(meshes[0])).toBe(1);
      expect(meshes[0].geometry.getAttribute("color")).toBeDefined();
      expect(meshes[0].geometry.getAttribute("normal")).toBeDefined();
    });

    it("exports meshes with per-face colors", async () => {
      const meshes = await convertAndReload(
        text(PLY_FACE_COLORED_QUAD),
        "ply",
      );
      expect(triangleCount(meshes[0])).toBe(2);
      expect(meshes[0].geometry.getAttribute("color")).toBeDefined();
    });

    it("rejects Gaussian-splat PLYs", async () => {
      await expect(
        convertModelBufferToGlb(text(PLY_GAUSSIAN_SPLAT_HEADER), "ply", "s"),
      ).rejects.toThrow("Gaussian splat");
    });

    it("rejects point clouds", async () => {
      await expect(
        convertModelBufferToGlb(text(PLY_POINT_CLOUD), "ply", "points"),
      ).rejects.toThrow("point cloud");
    });
  });
});

// ─── helpers ──────────────────────────────────────────────────────────────

async function convertAndReload(
  buffer: ArrayBuffer,
  ext: "obj" | "stl" | "ply",
): Promise<THREE.Mesh[]> {
  const glb = await convertModelBufferToGlb(buffer, ext, "model");
  const gltf = await new GLTFLoader().parseAsync(glb, "");
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) meshes.push(child);
  });
  return meshes;
}

function triangleCount(mesh: THREE.Mesh): number {
  const geometry = mesh.geometry;
  return (geometry.index ?? geometry.getAttribute("position")).count / 3;
}

// Copied into a buffer from this realm: jsdom's TextEncoder returns bytes
// whose buffer fails the loaders' `instanceof ArrayBuffer` checks (File
// reads in the app don't have this problem).
function text(source: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(source);
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

// 80-byte header, uint32 count, then 50 bytes per facet (normal, three
// vertices, attribute byte count).
function binaryStl(triangles: number): ArrayBuffer {
  const view = new DataView(new ArrayBuffer(84 + 50 * triangles));
  view.setUint32(80, triangles, true);
  for (let t = 0; t < triangles; t++) {
    const offset = 84 + 50 * t;
    const floats = [0, 0, 1, t, 0, 0, t + 1, 0, 0, t, 1, 0];
    floats.forEach((value, i) => view.setFloat32(offset + i * 4, value, true));
  }
  return view.buffer;
}
