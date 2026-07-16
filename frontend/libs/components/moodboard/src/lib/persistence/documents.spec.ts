import { describe, expect, it } from "vitest";
import type { Board } from "../boards/boardTypes";
import type { ImageNode, GroupNode } from "../canvas/types";
import {
  applyResolvedMediaUrls,
  collectUnresolvedMediaTokens,
  deserializeMoodboardDocument,
  serializeMoodboardDocument,
  EMPTY_CANVAS_DOCUMENT,
  type MoodboardCanvasDocument,
} from "./documents";

describe("moodboard document serialization", () => {
  it("round-trips board, canvas nodes, and viewport through JSON", () => {
    const document = serializeMoodboardDocument({
      board: buildBoard(),
      canvas: buildCanvas(),
    });
    const restored = deserializeMoodboardDocument(JSON.stringify(document));

    expect(restored).not.toBeNull();
    expect(restored?.board.name).toBe("Concept wall");
    expect(restored?.board.items["item-remote"]).toBeDefined();
    expect(restored?.canvas.viewport).toEqual({
      zoom: 1.75,
      pan: { x: -120, y: 40 },
    });
    expect(restored?.canvas.gridSpacing).toBe(24);
    expect(restored?.canvas.snapEnabled).toBe(false);
    expect(restored?.canvas.rootOrder).toContain("node-remote");
  });

  it("drops tokenless blob items and keeps tokened ones with cleared src", () => {
    const document = serializeMoodboardDocument({
      board: buildBoard(),
      canvas: buildCanvas(),
    });

    // Board: blob item without token dropped; with token kept as src "".
    expect(document.board.items["item-blob-untokened"]).toBeUndefined();
    expect(document.board.itemOrder).not.toContain("item-blob-untokened");
    const keptItem = document.board.items["item-blob-tokened"];
    expect(keptItem).toBeDefined();
    expect((keptItem as { src: string }).src).toBe("");

    // Canvas: same rules, plus group membership pruning.
    expect(document.canvas.nodes["node-blob-untokened"]).toBeUndefined();
    expect(document.canvas.rootOrder).not.toContain("node-blob-untokened");
    const keptNode = document.canvas.nodes["node-blob-tokened"] as ImageNode;
    expect(keptNode.src).toBe("");
    const group = document.canvas.nodes["node-group"] as GroupNode;
    expect(group.childIds).toEqual(["node-remote"]);
  });

  it("collects and re-applies unresolved media tokens", () => {
    const document = serializeMoodboardDocument({
      board: buildBoard(),
      canvas: buildCanvas(),
    });

    const tokens = collectUnresolvedMediaTokens(document);
    expect(tokens.sort()).toEqual(["m_board1", "m_canvas1"]);

    const patched = applyResolvedMediaUrls(document, {
      m_board1: "https://cdn/board1.png",
      m_canvas1: "https://cdn/canvas1.png",
    });
    expect(
      (patched.board.items["item-blob-tokened"] as { src: string }).src,
    ).toBe("https://cdn/board1.png");
    expect((patched.canvas.nodes["node-blob-tokened"] as ImageNode).src).toBe(
      "https://cdn/canvas1.png",
    );
  });

  it("rejects malformed payloads", () => {
    expect(deserializeMoodboardDocument("not json")).toBeNull();
    expect(deserializeMoodboardDocument("42")).toBeNull();
    expect(deserializeMoodboardDocument("{}")).toBeNull();
  });
});

// ---------- fixtures ----------

function buildBoard(): Board {
  return {
    id: "board-1",
    name: "Concept wall",
    createdAt: 1,
    updatedAt: 2,
    itemOrder: ["item-remote", "item-blob-tokened", "item-blob-untokened"],
    items: {
      "item-remote": {
        id: "item-remote",
        kind: "image",
        sectionId: null,
        createdAt: 1,
        tags: [],
        aspect: 1,
        rating: 0,
        src: "https://cdn/remote.png",
        mediaId: "m_remote1",
        naturalW: 100,
        naturalH: 100,
        caption: "",
      },
      "item-blob-tokened": {
        id: "item-blob-tokened",
        kind: "image",
        sectionId: null,
        createdAt: 2,
        tags: [],
        aspect: 1,
        rating: 0,
        src: "blob:https://app/abc",
        mediaId: "m_board1",
        naturalW: 100,
        naturalH: 100,
        caption: "",
      },
      "item-blob-untokened": {
        id: "item-blob-untokened",
        kind: "image",
        sectionId: null,
        createdAt: 3,
        tags: [],
        aspect: 1,
        rating: 0,
        src: "blob:https://app/def",
        mediaId: null,
        naturalW: 100,
        naturalH: 100,
        caption: "",
      },
    },
    sections: [],
    remoteToken: null,
  };
}

function buildCanvas(): MoodboardCanvasDocument {
  const base = {
    parentId: null,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: 0,
  };
  return {
    ...EMPTY_CANVAS_DOCUMENT,
    viewport: { zoom: 1.75, pan: { x: -120, y: 40 } },
    gridSpacing: 24,
    snapEnabled: false,
    rootOrder: [
      "node-remote",
      "node-blob-tokened",
      "node-blob-untokened",
      "node-group",
    ],
    nodes: {
      "node-remote": {
        ...base,
        id: "node-remote",
        kind: "image",
        src: "https://cdn/remote.png",
        mediaId: "m_remote1",
        naturalW: 100,
        naturalH: 100,
      },
      "node-blob-tokened": {
        ...base,
        id: "node-blob-tokened",
        kind: "image",
        src: "blob:https://app/abc",
        mediaId: "m_canvas1",
        naturalW: 100,
        naturalH: 100,
      },
      "node-blob-untokened": {
        ...base,
        id: "node-blob-untokened",
        kind: "image",
        src: "blob:https://app/def",
        mediaId: null,
        naturalW: 100,
        naturalH: 100,
      },
      "node-group": {
        ...base,
        id: "node-group",
        kind: "group",
        childIds: ["node-remote", "node-blob-untokened"],
      },
    },
  };
}
