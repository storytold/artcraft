import { Node } from "../Node";
import type { Model3DParams } from "../utilities/render3DModel";
import type { LineNode, SceneState } from "../stores/SceneState";
import { AspectRatioType } from "../stores/SceneState";

// The pagedraw project document ("editor_2d" on the server). Version history:
//   "2.0" — file import/export era: local images inlined as base64
//           `imageDataUrl`, no media tokens, no name.
//   "3.0" — adds `name` and per-node `mediaId` (durable server media token).
//           Server documents reference images token-first and only fall back
//           to inline base64 for images whose upload hasn't landed yet, so a
//           flaky upload can never lose the user's image. File exports remain
//           fully self-contained (base64 kept). Loaders accept both versions.
export const PAGEDRAW_DOCUMENT_VERSION = "3.0";

// Rendered when a node's mediaId can't be resolved to a URL at load time
// (deleted media, offline, transient API failure): a neutral "unavailable"
// tile. Never persisted — the serializer drops it so the document keeps the
// token and the next successful load self-heals to the real image.
export const UNRESOLVED_MEDIA_DATA_URL =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">` +
      `<rect width="256" height="256" fill="#2a2a31"/>` +
      `<path d="M88 168l32-40 24 28 16-20 28 32z" fill="#4a4a55"/>` +
      `<circle cx="96" cy="96" r="14" fill="#4a4a55"/>` +
      `</svg>`,
  );

/** Shape node as persisted in a project document (no File / DOM handles). */
export interface DocumentShapeNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  type: "rectangle" | "circle" | "triangle" | "image";
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  imageUrl?: string;
  /** Durable server media token; the loader re-resolves it to a CDN URL. */
  mediaId?: string;
  /** Inline base64 fallback, present only when the image has no token yet. */
  imageDataUrl?: string;
  backgroundColor?: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  locked: boolean;
  modelUrl?: string;
  model3dParams?: Model3DParams;
}

export type DocumentDrawNode = DocumentShapeNode | LineNode;

export interface PageDrawDocument {
  version: string;
  /** Session name — new in 3.0; absent in 2.0-era documents. */
  name?: string;
  drawNodes: DocumentDrawNode[];
  inpaintLineNodes: LineNode[];
  brushColor: string;
  brushSize: number;
  fillColor: string;
  aspectRatioType: AspectRatioType;
}

/** The slice of SceneState the document is built from. */
export type SerializableSceneSlice = Pick<
  SceneState,
  | "drawNodes"
  | "inpaintLineNodes"
  | "brushColor"
  | "brushSize"
  | "fillColor"
  | "aspectRatioType"
>;

/**
 * Build the lean server document: token-first images (base64 stripped when a
 * mediaId exists), inline base64 only as the no-token-yet fallback. The
 * unresolved-media placeholder URL is never written back.
 */
export const buildServerDocument = async (
  scene: SerializableSceneSlice,
  name: string,
): Promise<string> => {
  const drawNodes: DocumentDrawNode[] = await Promise.all(
    scene.drawNodes.map(async (n) => {
      if (!(n instanceof Node)) {
        return JSON.parse(JSON.stringify(n)) as LineNode;
      }
      const shape: DocumentShapeNode = {
        id: n.id,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        fill: n.fill,
        type: n.type,
        stroke: n.stroke,
        strokeWidth: n.strokeWidth,
        draggable: n.draggable,
        imageUrl:
          n.imageUrl === UNRESOLVED_MEDIA_DATA_URL ? undefined : n.imageUrl,
        mediaId: n.mediaId,
        backgroundColor: n.backgroundColor,
        rotation: n.rotation || 0,
        scaleX: n.scaleX || 1,
        scaleY: n.scaleY || 1,
        offsetX: n.offsetX || 0,
        offsetY: n.offsetY || 0,
        locked: n.locked || false,
        modelUrl: n.modelUrl,
        model3dParams: n.model3dParams,
      };
      if (!n.mediaId && n.imageFile instanceof File) {
        try {
          shape.imageDataUrl = await fileToDataUrl(n.imageFile);
        } catch (error) {
          console.error("[PageDraw] base64 fallback failed for node", n.id, error);
        }
      }
      return shape;
    }),
  );

  const document: PageDrawDocument = {
    version: PAGEDRAW_DOCUMENT_VERSION,
    name,
    drawNodes,
    inpaintLineNodes: JSON.parse(JSON.stringify(scene.inpaintLineNodes)),
    brushColor: scene.brushColor,
    brushSize: scene.brushSize,
    fillColor: scene.fillColor,
    aspectRatioType: scene.aspectRatioType,
  };
  return JSON.stringify(document);
};

/**
 * Parse a persisted document, accepting both the 2.0 (base64-era) and 3.0
 * shapes. Returns null for malformed input — callers treat that as a failed
 * load, never as an empty document.
 */
export const parseDocument = (json: string): PageDrawDocument | null => {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data["drawNodes"]) && !Array.isArray(data["inpaintLineNodes"])) {
    return null;
  }
  return {
    version: typeof data["version"] === "string" ? data["version"] : "2.0",
    name: typeof data["name"] === "string" ? data["name"] : undefined,
    drawNodes: Array.isArray(data["drawNodes"])
      ? (data["drawNodes"] as DocumentDrawNode[])
      : [],
    inpaintLineNodes: Array.isArray(data["inpaintLineNodes"])
      ? (data["inpaintLineNodes"] as LineNode[])
      : [],
    brushColor:
      typeof data["brushColor"] === "string" ? data["brushColor"] : "#000000",
    brushSize: typeof data["brushSize"] === "number" ? data["brushSize"] : 5,
    fillColor:
      typeof data["fillColor"] === "string" ? data["fillColor"] : "white",
    aspectRatioType: isAspectRatioType(data["aspectRatioType"])
      ? data["aspectRatioType"]
      : AspectRatioType.NONE,
  };
};

/** Collect the media tokens a document needs resolved before hydration. */
export const collectDocumentMediaIds = (doc: PageDrawDocument): string[] => {
  const tokens = new Set<string>();
  for (const node of doc.drawNodes) {
    if (node.type === "line") continue;
    const shape = node as DocumentShapeNode;
    if (shape.mediaId && !shape.imageDataUrl) tokens.add(shape.mediaId);
  }
  return Array.from(tokens);
};

/**
 * Apply resolved token→URL mappings onto a parsed document so the standard
 * import path can load images. Unresolvable tokens get the placeholder tile
 * (kept out of future saves by the serializer).
 */
export const applyResolvedMediaUrls = (
  doc: PageDrawDocument,
  urlByToken: Record<string, string>,
): PageDrawDocument => ({
  ...doc,
  drawNodes: doc.drawNodes.map((node) => {
    if (node.type === "line") return node;
    const shape = node as DocumentShapeNode;
    if (!shape.mediaId || shape.imageDataUrl) return shape;
    const resolved = urlByToken[shape.mediaId];
    if (resolved) return { ...shape, imageUrl: resolved };
    if (shape.imageUrl) return shape;
    return { ...shape, imageUrl: UNRESOLVED_MEDIA_DATA_URL };
  }),
});

// ---------- helpers ----------

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const isAspectRatioType = (value: unknown): value is AspectRatioType =>
  typeof value === "string" &&
  (Object.values(AspectRatioType) as string[]).includes(value);
