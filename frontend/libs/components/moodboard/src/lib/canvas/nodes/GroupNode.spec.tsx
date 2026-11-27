import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMoodboardStore } from "../MoodboardStore";
import { GroupNode } from "./GroupNode";
import { ImageNode } from "./ImageNode";
import { TextNode } from "./TextNode";
import { VideoNode } from "./VideoNode";

interface PrimitiveProps {
  id?: string;
  children?: ReactNode;
  draggable?: boolean;
  image?: HTMLVideoElement;
  onMouseDown?: (event: { evt: MouseEvent }) => void;
}

// Use the browser entry rather than Konva's Node entry, which requires
// the native canvas package even though drawing is stubbed below.
vi.mock("konva", async () => ({
  default: (await import("konva/lib/index")).default,
}));

// Replace only the canvas drawing boundary. Exercise the actual node
// components, media lifecycle, grouping actions, and selection callbacks.
vi.mock("react-konva", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  const Shape = forwardRef<unknown, PrimitiveProps>(
    ({ id, children, draggable, image, onMouseDown }, ref) => {
      useImperativeHandle(ref, () => ({ getLayer: () => null }));
      return (
        <div
          data-testid={id}
          data-draggable={String(Boolean(draggable))}
          data-media-src={image?.getAttribute("src")}
          onMouseDown={(event) => onMouseDown?.({ evt: event.nativeEvent })}
        >
          {children}
        </div>
      );
    },
  );
  return { Group: Shape, Rect: Shape, Image: Shape, Text: Shape };
});

describe("grouped moodboard videos", () => {
  beforeEach(() => {
    useMoodboardStore.getState().reset();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(
      () => undefined,
    );
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders a grouped video and loads its media source", () => {
    const { videoId, groupId } = groupVideoWithImage();
    render(<BoardNodes />);

    const videoShape = screen.getByTestId(videoId);
    expect(screen.getByTestId(groupId).contains(videoShape)).toBe(true);
    expect(videoShape.getAttribute("data-draggable")).toBe("false");

    const video = vi.mocked(HTMLMediaElement.prototype.play).mock
      .contexts[0] as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe("https://cdn.test/reference.mp4");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    act(() => video.dispatchEvent(new Event("loadedmetadata")));
    expect(videoShape.getAttribute("data-media-src")).toBe(
      "https://cdn.test/reference.mp4",
    );
  });

  it("keeps videos visible inside nested groups", () => {
    const { videoId, groupId } = groupVideoWithImage();
    const store = useMoodboardStore.getState();
    const textId = store.addText({ x: 700, y: 100 });
    store.setSelection([groupId, textId]);
    const outerId = groupSelection();
    render(<BoardNodes />);

    const video = screen.getByTestId(videoId);
    expect(screen.getByTestId(groupId).contains(video)).toBe(true);
    expect(screen.getByTestId(outerId).contains(video)).toBe(true);
  });

  it("selects the containing group when its video is clicked", () => {
    const { videoId, groupId } = groupVideoWithImage();
    const onSelect = vi.fn((id: string) => {
      useMoodboardStore.getState().toggleInSelection(id, false);
    });
    render(<BoardNodes onSelect={onSelect} />);

    fireEvent.mouseDown(screen.getByTestId(videoId));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBe(groupId);
    expect([...useMoodboardStore.getState().selectedIds]).toEqual([groupId]);
  });

  it("preserves existing image and text group rendering", () => {
    const store = useMoodboardStore.getState();
    const imageId = store.addImage(
      "https://cdn.test/image.png",
      { x: 0, y: 0 },
      100,
      100,
    );
    const textId = store.addText({ x: 200, y: 100 });
    store.setSelection([imageId, textId]);
    const groupId = groupSelection();
    render(<BoardNodes />);

    const group = screen.getByTestId(groupId);
    expect(group.contains(screen.getByTestId(imageId))).toBe(true);
    expect(group.contains(screen.getByTestId(textId))).toBe(true);
  });

  it("keeps videos visible through ungroup, undo, and redo", () => {
    const { videoId, groupId } = groupVideoWithImage();
    render(<BoardNodes />);

    act(() => useMoodboardStore.getState().ungroup());
    expect(screen.getByTestId(videoId).getAttribute("data-draggable")).toBe(
      "true",
    );
    expect(screen.queryByTestId(groupId)).toBeNull();

    act(() => useMoodboardStore.getState().undo());
    expect(
      screen.getByTestId(groupId).contains(screen.getByTestId(videoId)),
    ).toBe(true);

    act(() => useMoodboardStore.getState().redo());
    expect(screen.getByTestId(videoId).getAttribute("data-draggable")).toBe(
      "true",
    );
    expect(screen.queryByTestId(groupId)).toBeNull();
  });
});

function groupVideoWithImage() {
  const store = useMoodboardStore.getState();
  const videoId = store.addVideo(
    "https://cdn.test/reference.mp4",
    { x: 100, y: 100 },
    320,
    180,
  );
  const imageId = store.addImage(
    "https://cdn.test/image.png",
    { x: 500, y: 100 },
    200,
    100,
  );
  store.setSelection([videoId, imageId]);
  return { videoId, groupId: groupSelection() };
}

function BoardNodes({
  onSelect = () => undefined,
}: {
  onSelect?: (id: string) => void;
}) {
  const nodes = useMoodboardStore((s) => s.nodes);
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  return rootOrder.map((id) => {
    const node = nodes[id];
    if (node.kind === "group") {
      return (
        <GroupNode key={id} node={node} selected={false} onSelect={onSelect} />
      );
    }
    const props = { selected: false, draggable: true, onSelect };
    if (node.kind === "video")
      return <VideoNode key={id} node={node} {...props} />;
    if (node.kind === "image")
      return <ImageNode key={id} node={node} {...props} />;
    if (node.kind === "text")
      return <TextNode key={id} node={node} {...props} />;
    return null;
  });
}

function groupSelection(): string {
  const id = useMoodboardStore.getState().group();
  if (!id) throw new Error("Expected the selected nodes to form a group");
  return id;
}
