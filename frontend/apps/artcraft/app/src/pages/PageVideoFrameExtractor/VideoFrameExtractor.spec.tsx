// Spec for the Video Frame Extractor page's "Extract Frames" run.
//
// What is being protected: pressing "Extract Frames" seeks the <video> to a series of times and copies
// each frame onto a canvas. The run waits on browser events (the video finishing loading, then one
// "seeked" per frame), so it has two ways to go wrong that only show up for real users:
//   1. the video never finishes loading (bad URL, slow network): the user must be told and the run must
//      stop, not carry on seeking a video that has no picture;
//   2. the user presses "Switch Video" in the middle of a run: the old run must not leave the button on
//      "Extracting..." for the next video, and must not drop its frames into the new video's panel.
// jsdom has no media pipeline, so the tests hand-feed the facts a real <video> would report (frame
// size, ready state, duration) and the "seeked" events themselves.

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

// Everything the page pulls in that is not under test is replaced by a stand-in.
vi.mock("react-hot-toast", () => ({
  default: { error: mocks.toastError, success: mocks.toastSuccess },
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/api", () => ({
  MediaUploadApi: class {},
  EIntermediateFile: { true: "true", false: "false" },
}));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptVideoStore: { getState: () => ({ setReferenceImages: vi.fn() }) },
}));
vi.mock("~/pages/Stores/TabState", () => ({
  useTabStore: { getState: () => ({ setActiveTab: vi.fn() }) },
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
// A plain <button> that keeps the label, the click handler and the disabled flag.
vi.mock("@storyteller/ui-button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) =>
      createElement(
        "button",
        { onClick: props.onClick, disabled: props.disabled },
        props.children,
      ),
  };
});

import { VideoFrameExtractor } from "./VideoFrameExtractor";

// The facts a loaded <video> reports. readyState 4 / a frame size means "picture is ready".
interface VideoFacts {
  readyState: number;
  width: number;
  height: number;
  duration: number;
}
const READY: VideoFacts = { readyState: 4, width: 640, height: 360, duration: 10 };
// Metadata known (so the frame size is known) but no first frame yet: what WebKit reports for a video
// with preload="metadata" until it is played or seeked. "loadeddata" never fires in this state.
const METADATA_ONLY: VideoFacts = { readyState: 1, width: 640, height: 360, duration: 10 };
// Nothing has loaded at all.
const NOTHING_LOADED: VideoFacts = { readyState: 0, width: 0, height: 0, duration: 0 };

// jsdom's <video> has read-only getters for these, so they are overridden on the element itself.
function setVideoFacts(video: HTMLVideoElement, facts: VideoFacts) {
  Object.defineProperty(video, "readyState", { configurable: true, value: facts.readyState });
  Object.defineProperty(video, "videoWidth", { configurable: true, value: facts.width });
  Object.defineProperty(video, "videoHeight", { configurable: true, value: facts.height });
  Object.defineProperty(video, "duration", { configurable: true, value: facts.duration });
  // The page reads the duration into its state when the browser announces the metadata.
  fireEvent(video, new Event("loadedmetadata"));
}

// Records every assignment to video.currentTime (each one is a seek). While `autoFinish` is on, each
// seek is answered with a "seeked" event, the way a real video answers once the frame is ready.
function watchSeeks(video: HTMLVideoElement, autoFinish: boolean) {
  const watch = { seeks: [] as number[], autoFinish };
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => watch.seeks[watch.seeks.length - 1] ?? 0,
    set: (value: number) => {
      watch.seeks.push(value);
      // Queued as a microtask: the page attaches its "seeked" listener right after this assignment.
      if (watch.autoFinish) queueMicrotask(() => video.dispatchEvent(new Event("seeked")));
    },
  });
  return watch;
}

// Lets pending promises run and moves the fake clock forward.
async function settle(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

// Picks a local video through the start screen's hidden file input.
function chooseVideo(container: HTMLElement, name = "clip.mp4") {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, {
    target: { files: [new File(["x"], name, { type: "video/mp4" })] },
  });
  return container.querySelector("video") as HTMLVideoElement;
}

const extractButton = () => screen.getByRole("button", { name: /^Extract/ });
const frameImages = () => screen.queryAllByAltText(/^Frame \d+$/);

let blobCounter = 0;

beforeEach(() => {
  vi.useFakeTimers();
  blobCounter = 0;
  mocks.toastError.mockReset();
  mocks.toastSuccess.mockReset();
  // jsdom has no object URLs, no canvas drawing and no scrollIntoView; give the page stand-ins.
  URL.createObjectURL = vi.fn(() => `blob:clip-${++blobCounter}`);
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,AAAA",
  );
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("VideoFrameExtractor loading wait", () => {
  it("tells the user and stops when the video never reports a frame size", async () => {
    const { container } = render(<VideoFrameExtractor />);
    const video = chooseVideo(container);
    setVideoFacts(video, NOTHING_LOADED);
    const watch = watchSeeks(video, false);

    fireEvent.click(extractButton());
    // The page waits up to 5 seconds for the first frame to load.
    await settle(5000);

    // The user gets a message and the run ends: no seeking a video with no picture, button usable again.
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(watch.seeks).toEqual([]);
    expect(extractButton().textContent).toBe("Extract Frames");
    expect((extractButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it("still extracts when the frame size is known but loadeddata never fires (WebKit)", async () => {
    // Control: this is the case the page's "carry on after 5 seconds" behavior exists for. The fix for
    // the previous test must not turn it into an error.
    const { container } = render(<VideoFrameExtractor />);
    const video = chooseVideo(container);
    setVideoFacts(video, METADATA_ONLY);
    const watch = watchSeeks(video, true);

    fireEvent.click(extractButton());
    await settle(5000);
    await settle();

    expect(mocks.toastError).not.toHaveBeenCalled();
    // 10 frames, plus the final seek back to where the playhead was.
    expect(watch.seeks).toHaveLength(11);
    expect(frameImages()).toHaveLength(10);
    expect(extractButton().textContent).toBe("Extract Frames");
  });

  it("extracts straight away from a video that is ready", async () => {
    // Control: the plain path, no waiting for the load.
    const { container } = render(<VideoFrameExtractor />);
    const video = chooseVideo(container);
    setVideoFacts(video, READY);
    const watch = watchSeeks(video, true);

    fireEvent.click(extractButton());
    await settle();

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(watch.seeks).toHaveLength(11);
    expect(frameImages()).toHaveLength(10);
  });
});

describe("VideoFrameExtractor Switch Video during a run", () => {
  it("does not leave Extract stuck on Extracting after switching to another video", async () => {
    const { container } = render(<VideoFrameExtractor />);
    const first = chooseVideo(container, "first.mp4");
    setVideoFacts(first, READY);
    // The first seek never answers, like a slow remote video still fetching its frame.
    watchSeeks(first, false);

    fireEvent.click(extractButton());
    await settle();
    expect(extractButton().textContent).toBe("Extracting...");

    // The user gives up waiting and picks a different video.
    fireEvent.click(screen.getByRole("button", { name: "Switch Video" }));
    const second = chooseVideo(container, "second.mp4");
    setVideoFacts(second, READY);
    const secondWatch = watchSeeks(second, true);

    // The new video can be extracted: the button is not stuck from the abandoned run.
    expect(extractButton().textContent).toBe("Extract Frames");
    expect((extractButton() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(extractButton());
    await settle();
    expect(secondWatch.seeks).toHaveLength(11);
    expect(frameImages()).toHaveLength(10);
  });

  it("does not show the old video's frames after the old run finishes late", async () => {
    const { container } = render(<VideoFrameExtractor />);
    const first = chooseVideo(container, "first.mp4");
    setVideoFacts(first, READY);
    const firstWatch = watchSeeks(first, false);

    fireEvent.click(extractButton());
    await settle();

    fireEvent.click(screen.getByRole("button", { name: "Switch Video" }));
    const second = chooseVideo(container, "second.mp4");
    setVideoFacts(second, READY);
    watchSeeks(second, false);

    // The abandoned run's video finally answers its seeks and the run runs to the end.
    firstWatch.autoFinish = true;
    await act(async () => {
      first.dispatchEvent(new Event("seeked"));
    });
    await settle();

    // Those frames belong to the first video; the panel for the second video stays empty.
    expect(frameImages()).toHaveLength(0);
  });
});
