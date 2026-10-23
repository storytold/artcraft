import { act, cleanup, renderHook } from "@testing-library/react";
import type Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMoodboardStore } from "../MoodboardStore";
import { useMoodboardHistoryStore } from "../MoodboardHistoryStore";
import { usePasteHandler } from "./usePasteHandler";

vi.mock("../../boards/measureMedia", () => ({
  measureImage: vi.fn().mockResolvedValue({ w: 200, h: 100 }),
}));

describe("moodboard clipboard image placement", () => {
  beforeEach(() => {
    useMoodboardStore.setState({
      nodes: {},
      rootOrder: [],
      selectedIds: new Set(),
    });
    useMoodboardHistoryStore.getState().clear();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL() {
          return "blob:clipboard-image";
        }
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    { name: "default viewport", x: 0, y: 0, zoom: 1 },
    { name: "panned viewport", x: -1200, y: 900, zoom: 1 },
    { name: "zoomed-in viewport", x: 0, y: 0, zoom: 2 },
    { name: "panned and zoomed-out viewport", x: 600, y: -300, zoom: 0.5 },
  ])("centers pasted images in a $name", async ({ x, y, zoom }) => {
    mountPasteHandler({ x, y, zoom });

    const event = await pasteImage();

    expect(event.defaultPrevented).toBe(true);
    const nodes = Object.values(useMoodboardStore.getState().nodes);
    expect(nodes).toHaveLength(1);
    const node = nodes[0];
    // Project the real store node back to screen space: its center should
    // match the visible stage center regardless of the viewport transform.
    expect((node.x + node.width / 2) * zoom + x).toBe(500);
    expect((node.y + node.height / 2) * zoom + y).toBe(300);
  });

  it("retains the fallback position before the stage is mounted", async () => {
    renderHook(() =>
      usePasteHandler({ sendToGeneration: vi.fn() }, true, { current: null }),
    );

    await pasteImage();

    const node = Object.values(useMoodboardStore.getState().nodes)[0];
    expect(node.x + node.width / 2).toBe(400);
    expect(node.y + node.height / 2).toBe(400);
  });

  it("does not intercept paste while inactive", async () => {
    mountPasteHandler({ active: false });

    const event = await pasteImage();

    expect(event.defaultPrevented).toBe(false);
    expect(useMoodboardStore.getState().rootOrder).toEqual([]);
  });

  it("leaves image pastes in text inputs alone", async () => {
    mountPasteHandler({});
    const input = document.createElement("textarea");
    document.body.appendChild(input);
    try {
      const event = await pasteImage(input);
      expect(event.defaultPrevented).toBe(false);
      expect(useMoodboardStore.getState().rootOrder).toEqual([]);
    } finally {
      input.remove();
    }
  });
});

function mountPasteHandler({
  x = 0,
  y = 0,
  zoom = 1,
  active = true,
}: {
  x?: number;
  y?: number;
  zoom?: number;
  active?: boolean;
}) {
  // Only the stage's geometry API is needed; jsdom cannot render Konva.
  const stage = {
    width: () => 1000,
    height: () => 600,
    x: () => x,
    y: () => y,
    scaleX: () => zoom,
    scaleY: () => zoom,
  } as Konva.Stage;
  return renderHook(() =>
    usePasteHandler({ sendToGeneration: vi.fn() }, active, { current: stage }),
  );
}

async function pasteImage(target: EventTarget = window) {
  const file = new File(["image"], "clipboard.png", { type: "image/png" });
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      items: [{ kind: "file", type: file.type, getAsFile: () => file }],
    },
  });
  await act(async () => {
    target.dispatchEvent(event);
  });
  return event;
}
