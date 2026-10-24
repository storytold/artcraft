import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ toastError: vi.fn() }));

// The row only needs these at module load; none matter to what is tested here.
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: m.toastError } }));
vi.mock("./common/imagePreview", () => ({
  createImagePreviewUrl: vi.fn(async () => "blob:preview"),
  revokeIfBlobUrl: vi.fn(),
}));

import { ImagePromptRow } from "./ImagePromptRow";
import type { RefAudio } from "./promptStore";

// ---- URL.createObjectURL bookkeeping: which blob URLs are still alive. ----
let liveUrls: Set<string>;
let nextUrl: number;

// ---- A stand-in for `new Audio(url)` so a test can decide how play() ends. ----
let playImpl: () => Promise<void>;
class FakeAudio {
  volume = 1;
  currentTime = 0;
  onended: (() => void) | null = null;
  constructor(public src: string) {}
  play = vi.fn(() => playImpl());
  pause = vi.fn();
}

const realCreateElement = document.createElement.bind(document);

beforeEach(() => {
  m.toastError.mockReset();
  liveUrls = new Set();
  nextUrl = 0;
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test-${++nextUrl}`;
    liveUrls.add(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => {
    liveUrls.delete(url);
  });
  vi.stubGlobal("Audio", FakeAudio);
  // jsdom never fires `loadedmetadata`, so the duration probe would hang.
  // Videos made by the component's own probe report 5s immediately.
  vi.spyOn(document, "createElement").mockImplementation(((
    tag: string,
    options?: ElementCreationOptions,
  ) => {
    const el = realCreateElement(tag, options);
    if (tag === "video") {
      Object.defineProperty(el, "duration", { value: 5 });
      Object.defineProperty(el, "src", {
        configurable: true,
        get: () => "",
        set: () =>
          queueMicrotask(() =>
            (el as HTMLVideoElement).onloadedmetadata?.(
              new Event("loadedmetadata"),
            ),
          ),
      });
    }
    return el;
  }) as typeof document.createElement);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const mp4 = () => new File(["x"], "clip.mp4", { type: "video/mp4" });

const baseProps = () => ({
  visible: true,
  maxImagePromptCount: 1,
  allowUpload: true,
  referenceImages: [],
  setReferenceImages: vi.fn(),
  isVideo: true,
  showVideoReferenceSection: true,
  referenceVideos: [],
  setReferenceVideos: vi.fn(),
});

describe("AudioRefTile playback", () => {
  const audioRef = (): RefAudio => ({
    id: "a1",
    url: "blob:audio",
    file: new File(["x"], "a.ogg", { type: "audio/ogg" }),
    mediaToken: "tok",
    duration: 3,
  });

  const renderWithAudio = () => {
    const utils = render(
      <ImagePromptRow {...baseProps()} referenceAudios={[audioRef()]} />,
    );
    // The play/stop toggle is the tile's full-size button.
    const toggle = utils.container.querySelector(
      "button.w-full.h-full",
    ) as HTMLButtonElement;
    return { ...utils, toggle };
  };

  // While "playing" the icon is the red stop square.
  const showsStop = (container: HTMLElement) =>
    container.querySelector(".text-red-400") !== null;

  it("shows the stop state while a clip is actually playing", async () => {
    playImpl = () => Promise.resolve();
    const { container, toggle } = renderWithAudio();
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(showsStop(container)).toBe(true);
  });

  it("goes back to the play state when the browser refuses to play the clip", async () => {
    // e.g. a container the webview cannot decode: play() rejects with
    // NotSupportedError and `ended` never fires.
    playImpl = () =>
      Promise.reject(new DOMException("unsupported", "NotSupportedError"));
    const { container, toggle } = renderWithAudio();
    await act(async () => {
      fireEvent.click(toggle);
    });
    await waitFor(() => expect(showsStop(container)).toBe(false));
  });
});

describe("uploading video tile preview URL", () => {
  const startPendingVideoUpload = async () => {
    // The upload never settles, so the "uploading" tile stays on screen.
    const uploadVideo = vi.fn(() => new Promise<void>(() => undefined));
    const props = { ...baseProps(), uploadVideo };
    const utils = render(<ImagePromptRow {...props} />);
    const videoInput = utils.container.querySelectorAll(
      'input[type="file"]',
    )[1] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(videoInput, { target: { files: [mp4()] } });
    });
    await waitFor(() =>
      expect(utils.container.querySelector("video.blur-sm")).not.toBeNull(),
    );
    return { ...utils, props };
  };

  it("does not mint a new object URL every time the row re-renders", async () => {
    const { rerender, props } = await startPendingVideoUpload();
    const afterFirstPaint = (URL.createObjectURL as ReturnType<typeof vi.fn>)
      .mock.calls.length;
    rerender(<ImagePromptRow {...props} className="a" />);
    rerender(<ImagePromptRow {...props} className="b" />);
    rerender(<ImagePromptRow {...props} className="c" />);
    expect(
      (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(afterFirstPaint);
  });

  it("revokes the tile's object URL when the row goes away", async () => {
    const { unmount } = await startPendingVideoUpload();
    unmount();
    expect([...liveUrls]).toEqual([]);
  });
});
