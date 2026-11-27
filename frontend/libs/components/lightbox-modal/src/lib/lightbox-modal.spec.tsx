import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LightboxModal from "./lightbox-modal";

const mocks = vi.hoisted(() => {
  function carousel(selector: string) {
    const listeners = new Map<string, Set<() => void>>();
    const count = () => document.querySelectorAll(selector).length;
    const api = {
      index: 0,
      listeners,
      selectedScrollSnap: () => api.index,
      canScrollPrev: () => api.index > 0,
      canScrollNext: () => api.index < count() - 1,
      scrollPrev: () => api.scrollTo(api.index - 1),
      scrollNext: () => api.scrollTo(api.index + 1),
      scrollTo: (index: number) => {
        const next = Math.max(0, Math.min(index, count() - 1));
        if (next !== api.index) {
          api.index = next;
          api.emit("select");
        }
      },
      reInit: () => {
        api.scrollTo(api.index);
        api.emit("reInit");
      },
      on: (event: string, callback: () => void) => {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(callback);
        return api;
      },
      off: (event: string, callback: () => void) => {
        listeners.get(event)?.delete(callback);
        return api;
      },
      emit: (event: string) => {
        listeners.get(event)?.forEach((callback) => callback());
      },
    };
    return api;
  }

  return {
    main: carousel(".embla__slide"),
    thumbs: carousel(".embla-thumbs__slide"),
    getBatch: vi.fn(),
    getMedia: vi.fn().mockResolvedValue({ success: false }),
  };
});

vi.mock("embla-carousel-react", () => ({
  default: (options: { containScroll?: string }) => {
    const [node, setNode] = useState<HTMLElement | null>(null);
    return [setNode, node ? (options.containScroll ? mocks.thumbs : mocks.main) : undefined];
  },
}));
vi.mock("@storyteller/ui-modal", () => ({
  Modal: Object.assign(
    ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
    { DragHandle: ({ children }: { children: ReactNode }) => <>{children}</> },
  ),
}));
vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {
    GetMediaFilesByBatchToken = mocks.getBatch;
    GetMediaFileByToken = mocks.getMedia;
  },
  PromptsApi: class {},
}));
vi.mock("./tags/TagsSection", () => ({ TagsSection: () => null }));
vi.mock("@storyteller/ui-audio-player", () => ({ WaveformAudioPlayer: () => null }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: () => {} }));

const BUNDLES = [
  { imageUrl: "a0.png", imageUrls: ["a0.png", "a1.png", "a2.png"] },
  { imageUrl: "b0.png", imageUrls: ["b0.png", "b1.png", "b2.png"] },
];
const BASE_PROPS = {
  isOpen: true,
  onClose: () => {},
  onCloseGallery: () => {},
  mediaClass: "image",
};

beforeEach(() => {
  vi.useFakeTimers();
  mocks.main.index = 0;
  mocks.thumbs.index = 0;
  mocks.main.listeners.clear();
  mocks.thumbs.listeners.clear();
  mocks.getBatch.mockReset();
  mocks.getBatch.mockImplementation(({ batchToken }: { batchToken: string }) =>
    Promise.resolve({
      success: true,
      data: [0, 1, 2].map((index) => ({
        token: `${batchToken}${index}`,
        media_links: { cdn_url: `${batchToken}${index}.png` },
      })),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("LightboxModal carousel navigation", () => {
  it("remembers each bundle's last slide when navigating down and back up", () => {
    renderNavigator(BUNDLES);
    selectThumbnail(3);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expectSelection(0);
    selectThumbnail(2);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expectSelection(2);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expectSelection(1);
    expect(mocks.main.listeners.get("select")?.size).toBe(1);
    expect(mocks.main.listeners.get("reInit")?.size).toBe(1);
  });

  it("keeps cross-bundle navigation at the left/right boundaries", () => {
    renderNavigator(BUNDLES);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expectSelection(1);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expectSelection(2);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expectSelection(0);
    expect(screen.getByAltText("Generated image 1").getAttribute("src")).toContain("b0.png");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expectSelection(2);
    expect(screen.getByAltText("Generated image 1").getAttribute("src")).toContain("a0.png");
  });

  it.each(["video", "audio"])("restores an image selection after visiting %s media", (mediaClass) => {
    renderNavigator([BUNDLES[0], { imageUrl: "other-media", mediaClass }]);
    selectThumbnail(3);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.queryByAltText("Thumbnail 3")).toBeNull();
    expect(mocks.main.listeners.get("select")?.size).toBe(0);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expectSelection(2);
  });

  it("restores the saved slide after a fetched batch replaces its one-image placeholder", async () => {
    renderNavigator([
      { imageUrl: "a0.png", mediaId: "a0", batchImageToken: "a" },
      { imageUrl: "b0.png", mediaId: "b0", batchImageToken: "b" },
    ]);
    await loadBatch();
    selectThumbnail(3);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.queryByAltText("Thumbnail 3")).toBeNull();
    expect(screen.getByAltText("Generated image 1").getAttribute("src")).toContain("b0.png");

    fireEvent.keyDown(window, { key: "ArrowUp" });
    await loadBatch();
    expectSelection(2);
    act(() => mocks.main.reInit());
    expectSelection(2);
  });

  it("honors a different opening image when a fetched batch is reordered", async () => {
    const onDownloadClicked = vi.fn();
    const props = { ...BASE_PROPS, batchImageToken: "a", onDownloadClicked };
    const view = render(<LightboxModal {...props} mediaId="a0" imageUrl="a0.png" />);
    await loadBatch();
    selectThumbnail(3);

    view.rerender(<LightboxModal {...props} mediaId="a1" imageUrl="a1.png" />);
    await loadBatch();
    expectSelection(0);
    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(onDownloadClicked).toHaveBeenCalledWith("a1.png", "image", undefined);

    view.rerender(<LightboxModal {...props} mediaId="a0" imageUrl="a0.png" />);
    await loadBatch();
    expectSelection(2);
  });

  it("uses the requested initial slide for a new entry and after reopening", () => {
    const props = { ...BASE_PROPS, ...BUNDLES[0], initialIndex: 1 };
    const view = render(<LightboxModal {...props} />);
    expectSelection(1);
    selectThumbnail(3);

    view.rerender(<LightboxModal {...props} isOpen={false} />);
    view.rerender(<LightboxModal {...props} />);
    expectSelection(1);
    view.rerender(<LightboxModal {...props} initialIndex={0} />);
    expectSelection(0);

    view.unmount();
    expect(mocks.main.listeners.get("select")?.size).toBe(0);
    expect(mocks.main.listeners.get("reInit")?.size).toBe(0);
  });
});

function renderNavigator(bundles: Array<{
  imageUrl: string;
  imageUrls?: string[];
  mediaId?: string;
  batchImageToken?: string;
  mediaClass?: string;
}>) {
  function Navigator() {
    const [index, setIndex] = useState(0);
    return (
      <LightboxModal
        {...BASE_PROPS}
        {...bundles[index]}
        onNavigatePrev={() => setIndex((current) => Math.max(0, current - 1))}
        onNavigateNext={() => setIndex((current) => Math.min(bundles.length - 1, current + 1))}
      />
    );
  }
  return render(<Navigator />);
}

function selectThumbnail(number: number) {
  fireEvent.click(screen.getByAltText(`Thumbnail ${number}`).closest("button")!);
}

function expectSelection(index: number) {
  const thumbnail = screen.getByAltText(`Thumbnail ${index + 1}`).closest("button")!;
  expect(thumbnail.classList.contains("border-white")).toBe(true);
  expect(mocks.main.selectedScrollSnap()).toBe(index);
}

async function loadBatch() {
  await act(async () => vi.advanceTimersByTimeAsync(200));
}
