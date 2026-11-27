import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePromptBoxDrop, UsePromptBoxDropOptions } from "./usePromptBoxDrop";

const { error } = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error } }));
vi.mock("@storyteller/tauri-utils", () => ({ IsDesktopApp: () => false }));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("lucide-react", () => ({ ImagesIcon: () => null, MusicIcon: () => null, VideoIcon: () => null }));
vi.mock("tailwind-merge", () => ({ twMerge: (...values: string[]) => values.join(" ") }));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  error.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("prompt reference file routing", () => {
  it.each(["drop", "paste"] as const)("accepts M4A reported as video/mp4 through %s", (transport) => {
    const receive = mount({ acceptsAudio: true });
    const file = new File(["audio"], "voice.m4a", { type: "video/mp4" });
    deliver(transport, [file]);
    expect(receive).toHaveBeenCalledWith({ images: [], videos: [], audios: [file] });
    expect(error).not.toHaveBeenCalled();
  });

  it("routes M4A into audio when both video and audio are supported", () => {
    const receive = mount({ acceptsAudio: true, acceptsVideos: true });
    const file = new File(["audio"], "VOICE.M4A", { type: "video/mp4" });
    deliver("drop", [file]);
    expect(receive).toHaveBeenCalledWith({ images: [], videos: [], audios: [file] });
  });

  it("does not send M4A to a video-only model", () => {
    const receive = mount({ acceptsVideos: true });
    deliver("drop", [new File(["audio"], "voice.m4a", { type: "video/mp4" })]);
    expect(receive).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("Audio references aren't available here");
  });

  it("preserves genuine MP4 video references", () => {
    const receive = mount({ acceptsVideos: true });
    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
    deliver("drop", [file]);
    expect(receive).toHaveBeenCalledWith({ images: [], videos: [file], audios: [] });
  });

  it("preserves audio MIME routing without a recognized extension", () => {
    const receive = mount({ acceptsAudio: true });
    const file = new File(["audio"], "recording", { type: "audio/mpeg" });
    deliver("paste", [file]);
    expect(receive).toHaveBeenCalledWith({ images: [], videos: [], audios: [file] });
  });

  it("preserves extension fallback for empty MIME", () => {
    const receive = mount({ acceptsAudio: true });
    const file = new File(["audio"], "voice.m4a");
    deliver("drop", [file]);
    expect(receive).toHaveBeenCalledWith({ images: [], videos: [], audios: [file] });
  });

  it("preserves image routing", () => {
    const receive = mount({ acceptsImages: true });
    const file = new File(["image"], "photo.png", { type: "image/png" });
    deliver("drop", [file]);
    expect(receive).toHaveBeenCalledWith({ images: [file], videos: [], audios: [] });
  });

  it("still rejects audio when the model only accepts images", () => {
    const receive = mount({ acceptsImages: true });
    deliver("paste", [new File(["audio"], "voice.mp3", { type: "audio/mpeg" })]);
    expect(receive).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("Audio references aren't available here");
  });
});

function mount(capabilities: Partial<UsePromptBoxDropOptions>) {
  const receive = vi.fn();
  function Zone() {
    const drop = usePromptBoxDrop({ acceptsAudio: false, acceptsVideos: false, acceptsImages: false, ...capabilities, onDropFiles: receive });
    return <div {...drop.dropZoneProps} data-testid="zone" />;
  }
  act(() => root.render(<Zone />));
  return receive;
}

function deliver(transport: "drop" | "paste", files: File[]) {
  const event = new Event(transport, { bubbles: true, cancelable: true });
  Object.defineProperty(event, transport === "drop" ? "dataTransfer" : "clipboardData", { value: { files, types: ["Files"] } });
  act(() => {
    const target = transport === "drop" ? container.querySelector('[data-testid="zone"]')! : window;
    target.dispatchEvent(event);
  });
}
