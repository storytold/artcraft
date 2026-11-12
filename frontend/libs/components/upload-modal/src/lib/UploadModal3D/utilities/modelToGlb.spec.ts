import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  MAX_CONVERTIBLE_MODEL_BYTES,
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

    it("rejects NaN coordinates", async () => {
      const source = OBJ_QUAD.replace("v 1 1 0", "v NaN 1 0");
      await expect(
        convertModelBufferToGlb(text(source), "obj", "nan"),
      ).rejects.toThrow("not numbers");
    });

    it("rejects a face index past the vertex list", async () => {
      const source = OBJ_QUAD.replace("f 1 3 4", "f 1 3 99");
      await expect(
        convertModelBufferToGlb(text(source), "obj", "bad-index"),
      ).rejects.toThrow("doesn't exist");
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

    it("recomputes facet normals written as 0 0 0", async () => {
      const source = STL_ASCII_TRIANGLE.replace(
        "facet normal 0 0 1",
        "facet normal 0 0 0",
      );
      const meshes = await convertAndReload(text(source), "stl");
      const normal = meshes[0].geometry.getAttribute("normal");
      expect([normal.getX(0), normal.getY(0), normal.getZ(0)]).toEqual([
        0, 0, 1,
      ]);
    });

    it("rejects a NaN vertex in a binary STL", async () => {
      const buffer = binaryStl(1);
      new DataView(buffer).setFloat32(84 + 12, NaN, true);
      await expect(
        convertModelBufferToGlb(buffer, "stl", "nan"),
      ).rejects.toThrow("not numbers");
    });

    it("rejects an ASCII STL vertex that doesn't parse", async () => {
      const source = STL_ASCII_TRIANGLE.replace("vertex 1 0 0", "vertex x 0 0");
      await expect(
        convertModelBufferToGlb(text(source), "stl", "short"),
      ).rejects.toThrow("missing vertices");
    });

    it("reports a truncated binary STL", async () => {
      const buffer = binaryStl(2).slice(0, 84 + 50);
      await expect(
        convertModelBufferToGlb(buffer, "stl", "truncated"),
      ).rejects.toThrow("truncated or corrupted");
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

    it.each(["binary_little_endian", "binary_big_endian"] as const)(
      "exports a %s PLY and keeps its normals and colors",
      async (format) => {
        const meshes = await convertAndReload(binaryPly(format), "ply");
        const geometry = meshes[0].geometry;
        expect(triangleCount(meshes[0])).toBe(1);
        expect(geometry.getAttribute("color")).toBeDefined();
        const normal = geometry.getAttribute("normal");
        expect([normal.getX(0), normal.getY(0), normal.getZ(0)]).toEqual([
          0, 0, 1,
        ]);
      },
    );

    it("rejects a face index past the vertex list", async () => {
      const source = PLY_COLORED_TRIANGLE.replace("3 0 1 2", "3 0 1 99");
      await expect(
        convertModelBufferToGlb(text(source), "ply", "bad-index"),
      ).rejects.toThrow("doesn't exist");
    });
  });

  describe("limits", () => {
    it.each(["obj", "stl", "ply"] as const)(
      "rejects an empty %s file",
      async (ext) => {
        await expect(
          convertModelBufferToGlb(new ArrayBuffer(0), ext, "empty"),
        ).rejects.toThrow("The file is empty.");
      },
    );

    it("rejects files over the size limit before parsing", async () => {
      await expect(
        convertModelBufferToGlb(
          new ArrayBuffer(MAX_CONVERTIBLE_MODEL_BYTES + 1),
          "stl",
          "huge",
        ),
      ).rejects.toThrow("the limit is 50 MB");
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

// One triangle in the z = 0 plane with float normals and uchar colors.
function binaryPly(
  format: "binary_little_endian" | "binary_big_endian",
): ArrayBuffer {
  const header = [
    "ply",
    `format ${format} 1.0`,
    "element vertex 3",
    "property float x",
    "property float y",
    "property float z",
    "property float nx",
    "property float ny",
    "property float nz",
    "property uchar red",
    "property uchar green",
    "property uchar blue",
    "element face 1",
    "property list uchar int vertex_indices",
    "end_header",
    "",
  ].join("\n");
  const headerBytes = new TextEncoder().encode(header);
  const vertexBytes = 6 * 4 + 3;
  const buffer = new ArrayBuffer(headerBytes.length + 3 * vertexBytes + 1 + 12);
  new Uint8Array(buffer).set(headerBytes);
  const view = new DataView(buffer);
  const little = format === "binary_little_endian";
  const positions = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ];
  let offset = headerBytes.length;
  for (const position of positions) {
    for (const value of [...position, 0, 0, 1]) {
      view.setFloat32(offset, value, little);
      offset += 4;
    }
    for (const value of [255, 0, 0]) view.setUint8(offset++, value);
  }
  view.setUint8(offset++, 3);
  for (const index of [0, 1, 2]) {
    view.setInt32(offset, index, little);
    offset += 4;
  }
  return buffer;
}
