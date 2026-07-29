import { describe, expect, it } from "vitest";
import { Node } from "../Node";
import { AspectRatioType, type LineNode } from "../stores/SceneState";
import {
  applyResolvedMediaUrls,
  buildServerDocument,
  collectDocumentMediaIds,
  parseDocument,
  PAGEDRAW_DOCUMENT_VERSION,
  UNRESOLVED_MEDIA_DATA_URL,
  type DocumentShapeNode,
  type PageDrawDocument,
} from "./documentSchema";
import { decideServerHydration } from "./sessionSync";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

describe("pagedraw document serialization", () => {
  it("serializes shapes, lines, settings, and name into a 3.0 document", async () => {
    const json = await buildServerDocument(buildScene(), "My session");
    const doc = JSON.parse(json) as PageDrawDocument;

    expect(doc.version).toBe(PAGEDRAW_DOCUMENT_VERSION);
    expect(doc.name).toBe("My session");
    expect(doc.brushColor).toBe("#ff0000");
    expect(doc.brushSize).toBe(12);
    expect(doc.fillColor).toBe("teal");
    expect(doc.aspectRatioType).toBe(AspectRatioType.SQUARE);
    expect(doc.drawNodes).toHaveLength(4);
    expect(doc.inpaintLineNodes).toHaveLength(1);

    const rect = doc.drawNodes[0] as DocumentShapeNode;
    expect(rect.type).toBe("rectangle");
    expect(rect.fill).toBe("#123456");

    const line = doc.drawNodes[1] as LineNode;
    expect(line.type).toBe("line");
    expect(line.points).toEqual([0, 0, 10, 10]);
  });

  it("persists tokened images token-only and untokened ones as inline base64", async () => {
    const json = await buildServerDocument(buildScene(), "My session");
    const doc = JSON.parse(json) as PageDrawDocument;

    // Tokened image: mediaId kept, no base64 payload.
    const tokened = doc.drawNodes[2] as DocumentShapeNode;
    expect(tokened.mediaId).toBe("media_token_abc");
    expect(tokened.imageDataUrl).toBeUndefined();

    // Untokened local image: inline base64 fallback so the upload gap can't
    // lose the image.
    const untokened = doc.drawNodes[3] as DocumentShapeNode;
    expect(untokened.mediaId).toBeUndefined();
    expect(untokened.imageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("never persists the unresolved-media placeholder URL", async () => {
    const scene = buildScene();
    const placeholderNode = new Node({
      id: "img-placeholder",
      x: 0,
      y: 0,
      width: 64,
      height: 64,
      fill: "",
      type: "image",
      mediaId: "media_token_missing",
      imageUrl: UNRESOLVED_MEDIA_DATA_URL,
    });
    scene.drawNodes.push(placeholderNode);

    const doc = JSON.parse(
      await buildServerDocument(scene, "x"),
    ) as PageDrawDocument;
    const persisted = doc.drawNodes[4] as DocumentShapeNode;
    expect(persisted.mediaId).toBe("media_token_missing");
    expect(persisted.imageUrl).toBeUndefined();
  });

  it("round-trips a 3.0 document through parseDocument", async () => {
    const json = await buildServerDocument(buildScene(), "Round trip");
    const doc = parseDocument(json);

    expect(doc).not.toBeNull();
    expect(doc?.version).toBe("3.0");
    expect(doc?.name).toBe("Round trip");
    expect(doc?.drawNodes).toHaveLength(4);
    expect(doc?.brushSize).toBe(12);
  });

  it("accepts legacy 2.0 documents (no name, no mediaId)", () => {
    const legacy = JSON.stringify({
      drawNodes: [
        {
          id: "n1",
          x: 1,
          y: 2,
          width: 10,
          height: 10,
          fill: "red",
          type: "rectangle",
          stroke: "#555",
          strokeWidth: 2,
          draggable: true,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          offsetX: 0,
          offsetY: 0,
          locked: false,
        },
      ],
      inpaintLineNodes: [],
      brushColor: "#00ff00",
      brushSize: 7,
      fillColor: "white",
      aspectRatioType: "2:3",
      version: "2.0",
    });

    const doc = parseDocument(legacy);
    expect(doc).not.toBeNull();
    expect(doc?.version).toBe("2.0");
    expect(doc?.name).toBeUndefined();
    expect(doc?.aspectRatioType).toBe(AspectRatioType.PORTRAIT);
    expect((doc?.drawNodes[0] as DocumentShapeNode).fill).toBe("red");
  });

  it("rejects malformed documents instead of returning an empty canvas", () => {
    expect(parseDocument("not json at all")).toBeNull();
    expect(parseDocument("42")).toBeNull();
    expect(parseDocument("{}")).toBeNull();
    expect(parseDocument(JSON.stringify({ foo: "bar" }))).toBeNull();
  });

  it("collects unresolved media tokens and applies resolved URLs", async () => {
    const json = await buildServerDocument(buildScene(), "x");
    const doc = parseDocument(json);
    expect(doc).not.toBeNull();
    if (!doc) return;

    // Only the tokened image needs resolution (the untokened one is inline).
    expect(collectDocumentMediaIds(doc)).toEqual(["media_token_abc"]);

    const resolved = applyResolvedMediaUrls(doc, {
      media_token_abc: "https://cdn.example/img.png",
    });
    const node = resolved.drawNodes[2] as DocumentShapeNode;
    expect(node.imageUrl).toBe("https://cdn.example/img.png");
  });

  it("falls back to the placeholder for unresolvable tokens", async () => {
    const json = await buildServerDocument(buildScene(), "x");
    const doc = parseDocument(json);
    if (!doc) throw new Error("parse failed");

    const resolved = applyResolvedMediaUrls(doc, {});
    const node = resolved.drawNodes[2] as DocumentShapeNode;
    expect(node.imageUrl).toBe(UNRESOLVED_MEDIA_DATA_URL);
  });
});

describe("server hydration decision", () => {
  it("uses the server copy when local is clean", () => {
    expect(
      decideServerHydration({
        localDirty: false,
        localBaseRevision: "2026-07-27T10:00:00Z",
        serverUpdatedAt: "2026-07-28T09:00:00Z",
      }),
    ).toBe("useServer");
  });

  it("pushes local edits when the server hasn't moved since our base", () => {
    expect(
      decideServerHydration({
        localDirty: true,
        localBaseRevision: "2026-07-27T10:00:00Z",
        serverUpdatedAt: "2026-07-27T10:00:00Z",
      }),
    ).toBe("useLocalAndPush");
  });

  it("flags a conflict when both sides have new work", () => {
    expect(
      decideServerHydration({
        localDirty: true,
        localBaseRevision: "2026-07-27T10:00:00Z",
        serverUpdatedAt: "2026-07-28T09:00:00Z",
      }),
    ).toBe("conflict");
  });

  it("flags a conflict when dirty local never learned a base revision", () => {
    expect(
      decideServerHydration({
        localDirty: true,
        localBaseRevision: null,
        serverUpdatedAt: "2026-07-28T09:00:00Z",
      }),
    ).toBe("conflict");
  });
});

// ---------- helpers ----------

const buildScene = () => ({
  drawNodes: [
    new Node({
      id: "rect-1",
      x: 5,
      y: 6,
      width: 100,
      height: 50,
      fill: "#123456",
      type: "rectangle" as const,
      draggable: true,
    }),
    {
      id: "line-1",
      type: "line",
      points: [0, 0, 10, 10],
      stroke: "#000000",
      strokeWidth: 3,
      draggable: false,
    } as LineNode,
    new Node({
      id: "img-tokened",
      x: 0,
      y: 0,
      width: 64,
      height: 64,
      fill: "",
      type: "image" as const,
      mediaId: "media_token_abc",
      imageFile: new File([PNG_BYTES], "a.png", { type: "image/png" }),
    }),
    new Node({
      id: "img-untokened",
      x: 10,
      y: 10,
      width: 64,
      height: 64,
      fill: "",
      type: "image" as const,
      imageFile: new File([PNG_BYTES], "b.png", { type: "image/png" }),
    }),
  ],
  inpaintLineNodes: [
    {
      id: "line-inpaint-1",
      type: "line",
      points: [1, 1, 2, 2],
      stroke: "#ffffff",
      strokeWidth: 20,
      draggable: false,
    } as LineNode,
  ],
  brushColor: "#ff0000",
  brushSize: 12,
  fillColor: "teal",
  aspectRatioType: AspectRatioType.SQUARE,
});
