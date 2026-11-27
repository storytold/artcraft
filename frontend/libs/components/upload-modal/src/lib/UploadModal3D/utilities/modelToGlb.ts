import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// Model formats accepted at the picker that are converted to GLB in the
// browser before preview/upload. Everything downstream (preview canvas,
// backend asset, scene loader, timeline, Viewer3D) is GLTF-only.
export const CONVERTIBLE_MODEL_EXTENSIONS = ["fbx", "obj", "stl", "ply"] as const;

export type ConvertibleModelExtension =
  (typeof CONVERTIBLE_MODEL_EXTENSIONS)[number];

// Gaussian-splat PLYs (3DGS exports) carry spherical-harmonic / scale /
// rotation vertex properties instead of faces. They share the .ply
// extension with meshes but need the splat pipeline, not this one.
const SPLAT_PLY_PROPERTY = /^property\s+\S+\s+(f_dc_0|scale_0|rot_0)\s*$/m;

const PLY_FACE_ELEMENT = /^element\s+face\s+(\d+)\s*$/m;

// PLY headers are short; only this much is decoded to sniff it.
const PLY_HEADER_SNIFF_BYTES = 64 * 1024;

// Same cap as the upload picker (file-uploader's maxSize={50}, decimal MB),
// applied here too because window drag-and-drop skips the picker. Parse
// time and memory grow linearly with the file, so this also bounds the
// vertex and face counts: a 50 MB binary STL is about one million triangles.
export const MAX_CONVERTIBLE_MODEL_BYTES = 50 * 1000 * 1000;

// Binary STL: an 80-byte header, a uint32 facet count, then 50 bytes per
// facet (normal, three vertices, attribute byte count).
const STL_BINARY_HEADER_BYTES = 84;
const STL_BINARY_FACET_BYTES = 50;

// "solid", the first word of an ASCII STL.
const STL_ASCII_MAGIC = [115, 111, 108, 105, 100];

const TRUNCATED_FILE_MESSAGE = "The file looks truncated or corrupted.";

export function assertConvertibleModelSize(byteLength: number): void {
  if (byteLength === 0) throw new Error("The file is empty.");
  if (byteLength > MAX_CONVERTIBLE_MODEL_BYTES) {
    const mb = Math.ceil(byteLength / 1000 / 1000);
    throw new Error(
      `The file is ${mb} MB; the limit is ${MAX_CONVERTIBLE_MODEL_BYTES / 1000 / 1000} MB.`,
    );
  }
}

export function getConvertibleModelExtension(
  fileName: string,
): ConvertibleModelExtension | null {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return null;
  const ext = fileName.slice(dot + 1).toLowerCase();
  return (CONVERTIBLE_MODEL_EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as ConvertibleModelExtension)
    : null;
}

// Parse a model file and export it as a binary GLB. Synchronous CPU work
// apart from the export callback — call it from the worker where possible
// (see convertModelToGlb.ts).
export async function convertModelBufferToGlb(
  buffer: ArrayBuffer,
  ext: ConvertibleModelExtension,
  name: string,
): Promise<ArrayBuffer> {
  assertConvertibleModelSize(buffer.byteLength);
  let object: THREE.Object3D;
  try {
    object = parseModel(buffer, ext);
  } catch (error) {
    // The loaders read binary bodies with DataView, so a header that
    // promises more data than the file holds ends in a bare RangeError.
    if (error instanceof RangeError) {
      throw new Error(TRUNCATED_FILE_MESSAGE);
    }
    throw error;
  }
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) assertValidGeometry(child.geometry);
  });
  object.name = object.name || name;
  return exportGlb(object);
}

function parseModel(
  buffer: ArrayBuffer,
  ext: ConvertibleModelExtension,
): THREE.Object3D {
  switch (ext) {
    case "fbx":
      return new FBXLoader().parse(buffer, "");
    case "obj":
      return parseObj(buffer);
    case "stl":
      return parseStl(buffer);
    case "ply":
      return parsePly(buffer);
  }
}

function exportGlb(object: THREE.Object3D): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error("GLTF export did not produce binary output."));
        }
      },
      (error) => reject(error),
      { binary: true, animations: object.animations ?? [] },
    );
  });
}

// ─── per-format parsers ───────────────────────────────────────────────────

function parseObj(buffer: ArrayBuffer): THREE.Object3D {
  const group = new OBJLoader().parse(new TextDecoder().decode(buffer));
  let hasGeometry = false;
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    hasGeometry = true;
    // OBJLoader builds Phong materials, which glTF can't represent — the
    // exporter would fall back to a default material. Carry the parts glTF
    // keeps over to a PBR material instead.
    child.material = Array.isArray(child.material)
      ? child.material.map(toStandardMaterial)
      : toStandardMaterial(child.material);
  });
  if (!hasGeometry) throw new Error("No faces found in this OBJ file.");
  return group;
}

function parseStl(buffer: ArrayBuffer): THREE.Object3D {
  assertStlFacetCountFits(buffer);
  const geometry = new STLLoader().parse(buffer);
  if (!geometry.getAttribute("position")?.count) {
    throw new Error("No triangles found in this STL file.");
  }
  return meshFromGeometry(geometry);
}

function parsePly(buffer: ArrayBuffer): THREE.Object3D {
  const header = readPlyHeader(buffer);
  if (SPLAT_PLY_PROPERTY.test(header)) {
    throw new Error(
      "This PLY is a Gaussian splat, not a mesh. Convert it to .spz and upload it as a splat.",
    );
  }
  // Checked on the header: PLYLoader drops the index for meshes with
  // per-face UVs/colors, so the parsed geometry can't tell the two apart.
  if (Number(PLY_FACE_ELEMENT.exec(header)?.[1] ?? 0) === 0) {
    throw new Error(
      "This PLY is a point cloud with no faces. Only PLY meshes can be uploaded.",
    );
  }
  return meshFromGeometry(new PLYLoader().parse(buffer));
}

// ─── helpers ──────────────────────────────────────────────────────────────

// STLLoader sizes its position and normal arrays from the facet count at
// byte 80 before it reads a single facet, and it reads any file that doesn't
// start with "solid" as binary. An 84-byte file declaring ten million facets
// would make it ask for about 720 MB before the read fails. Refuse a count
// the file has no room for, so the arrays stay within a small multiple of
// the file size (itself capped by MAX_CONVERTIBLE_MODEL_BYTES).
function assertStlFacetCountFits(buffer: ArrayBuffer): void {
  // Too short for a facet count: the loader fails on it without allocating.
  if (buffer.byteLength < STL_BINARY_HEADER_BYTES) return;
  const facets = new DataView(buffer).getUint32(80, true);
  const declaredBytes =
    STL_BINARY_HEADER_BYTES + facets * STL_BINARY_FACET_BYTES;
  if (declaredBytes <= buffer.byteLength) return;
  // In an ASCII file those four bytes are text, not a count.
  if (startsWithStlAsciiMagic(buffer)) return;
  throw new Error(TRUNCATED_FILE_MESSAGE);
}

// The same test STLLoader uses to tell ASCII from binary: "solid" within the
// first five bytes, since an encoding prefix such as a BOM may come first.
function startsWithStlAsciiMagic(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer, 0, STL_ASCII_MAGIC.length + 5);
  for (let offset = 0; offset < 5; offset++) {
    if (STL_ASCII_MAGIC.every((code, i) => bytes[offset + i] === code)) {
      return true;
    }
  }
  return false;
}

function meshFromGeometry(geometry: THREE.BufferGeometry): THREE.Mesh {
  // Many STL writers leave every facet normal at 0 0 0; the exporter would
  // turn those into (1, 0, 0) and light the mesh wrongly.
  if (!hasUsableNormals(geometry)) geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: geometry.hasAttribute("color"),
  });
  return new THREE.Mesh(geometry, material);
}

function hasUsableNormals(geometry: THREE.BufferGeometry): boolean {
  const normal = geometry.getAttribute("normal");
  if (!normal) return false;
  for (let i = 0; i < normal.count; i++) {
    const x = normal.getX(i);
    const y = normal.getY(i);
    const z = normal.getZ(i);
    if (!(x * x + y * y + z * z > 1e-12)) return false;
  }
  return true;
}

// The loaders accept NaN coordinates and faces that point past the vertex
// list (OBJ turns those into NaN positions, PLY keeps the bad index), and an
// ASCII STL vertex line that doesn't parse is skipped, leaving a triangle
// short. Any of these would end up in the GLB and break bounds and camera
// fitting downstream, so refuse the file instead.
function assertValidGeometry(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute("position");
  if (!position) return;
  const values = position.array;
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      throw new Error(
        "Some vertex positions are not numbers, or a face points at a vertex that doesn't exist.",
      );
    }
  }
  const index = geometry.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i++) {
      if (index.getX(i) >= position.count) {
        throw new Error("A face points at a vertex that doesn't exist.");
      }
    }
  } else if (position.count % 3 !== 0) {
    throw new Error("A face is missing vertices.");
  }
}

function toStandardMaterial(material: THREE.Material): THREE.Material {
  if (!(material instanceof THREE.MeshPhongMaterial)) return material;
  const standard = new THREE.MeshStandardMaterial({
    name: material.name,
    color: material.color,
    map: material.map,
    vertexColors: material.vertexColors,
    side: material.side,
    transparent: material.transparent,
    opacity: material.opacity,
  });
  material.dispose();
  return standard;
}

function readPlyHeader(buffer: ArrayBuffer): string {
  const head = new TextDecoder().decode(
    buffer.slice(0, Math.min(buffer.byteLength, PLY_HEADER_SNIFF_BYTES)),
  );
  const end = head.indexOf("end_header");
  return end === -1 ? head : head.slice(0, end);
}
