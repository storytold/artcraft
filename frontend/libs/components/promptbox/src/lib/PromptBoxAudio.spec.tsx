import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromptBoxAudio } from "./PromptBoxAudio";
import { usePromptAudioStore, type RefAudio } from "./promptStore";
import type { OmniGenAudioModelDetails, UploadMediaFn } from "@storyteller/api";
import { UploaderStates } from "@storyteller/common";
import * as gallery from "@storyteller/ui-gallery-modal";

const TRACK: RefAudio = {
  id: "old", url: "https://example.com/old.mp3", file: new File([], "old.mp3"),
  mediaToken: "old-token", duration: 5,
};
const MODELS = [
  { model: "many", full_name: "Many", audio_references_supported: true, audio_references_max: 3, image_references_supported: true },
  { model: "one", full_name: "One", audio_references_supported: true, audio_references_max: 1 },
  { model: "none", full_name: "None", audio_references_supported: false, audio_references_max: 0 },
] as OmniGenAudioModelDetails[];

let root: Root;
let container: HTMLDivElement;
let probes: HTMLAudioElement[];
let imageUpload: Parameters<UploadMediaFn>[0];
let finishImageUpload: () => void;

describe("audio prompt library completion", () => {
  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    usePromptAudioStore.setState({ referenceAudios: [TRACK], referenceImages: [], selectedModelId: "many", prompt: "" });
    probes = [];
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:test");
      static revokeObjectURL = vi.fn();
    });
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const element = createElement(tag, options);
      if (tag === "audio") probes.push(element as HTMLAudioElement);
      return element;
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    const uploadImage: UploadMediaFn = (args) => new Promise((resolve) => {
      imageUpload = args;
      finishImageUpload = resolve;
    });
    await act(async () => root.render(<PromptBoxAudio models={MODELS} uploadImage={uploadImage} />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not restore a removed reference after pending library metadata arrives", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3" }]);
    await clickLabel("Remove audio");
    await finishMetadata(10);
    expect(usePromptAudioStore.getState().referenceAudios.map((a) => a.mediaToken)).toEqual(["new"]);
  });

  it("preserves a reference added while library metadata was pending", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3" }]);
    await act(async () => usePromptAudioStore.getState().setReferenceAudios([TRACK, { ...TRACK, id: "other", mediaToken: "other-token" }]));
    await finishMetadata(10);
    expect(usePromptAudioStore.getState().referenceAudios.map((a) => a.mediaToken)).toEqual(["old-token", "other-token", "new"]);
  });

  it("uses the current model's count limit after metadata completes", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3" }]);
    await act(async () => usePromptAudioStore.getState().setSelectedModelId("one"));
    await finishMetadata(10);
    expect(usePromptAudioStore.getState().referenceAudios).toEqual([TRACK]);
  });

  it("does not append audio when the current model no longer supports it", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3" }]);
    await act(async () => usePromptAudioStore.getState().setSelectedModelId("none"));
    await finishMetadata(10);
    expect(usePromptAudioStore.getState().referenceAudios).toEqual([TRACK]);
  });

  it("checks total duration against references added during metadata loading", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3" }]);
    await act(async () => usePromptAudioStore.getState().setReferenceAudios([{ ...TRACK, duration: 595 }]));
    await finishMetadata(10);
    expect(usePromptAudioStore.getState().referenceAudios).toHaveLength(1);
    expect(usePromptAudioStore.getState().referenceAudios[0].duration).toBe(595);
  });

  it("clears a current image when completing a valid audio selection", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3" }]);
    await act(async () => usePromptAudioStore.getState().setReferenceImages([{ id: "image", url: "image.png", mediaToken: "image-token", file: new File([], "image.png") }]));
    await finishMetadata(10);
    expect(usePromptAudioStore.getState().referenceImages).toEqual([]);
  });

  it("keeps ordinary library selection with known duration working", async () => {
    await select([{ id: "new", fullImage: "https://example.com/new.mp3", durationMillis: 10000 }]);
    await act(async () => { await (gallery as unknown as { pendingSelection: Promise<void> }).pendingSelection; });
    expect(probes).toHaveLength(0);
    expect(usePromptAudioStore.getState().referenceAudios.map((a) => a.mediaToken)).toEqual(["old-token", "new"]);
  });

  it("clears audio added while an image upload was pending", async () => {
    await act(async () => usePromptAudioStore.getState().setReferenceAudios([]));
    const input = container.querySelector<HTMLInputElement>('input[accept="image/*"]')!;
    Object.defineProperty(input, "files", { value: [new File([], "image.png", { type: "image/png" })] });
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    await act(async () => usePromptAudioStore.getState().setReferenceAudios([TRACK]));
    await act(async () => {
      imageUpload.progressCallback({ status: UploaderStates.success, data: "uploaded-image" });
      finishImageUpload();
    });
    expect(usePromptAudioStore.getState().referenceAudios).toEqual([]);
    expect(usePromptAudioStore.getState().referenceImages.map((image) => image.mediaToken)).toEqual(["uploaded-image"]);
  });
});

async function select(items: unknown[]) {
  (gallery as unknown as { choose: (items: unknown[]) => void }).choose(items);
  const open = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "From library");
  if (!open) throw new Error("Missing live reference-row library button");
  await act(async () => open.click());
  await clickLabel("Use library selection");
}

async function clickLabel(label: string) {
  const button = container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  if (!button) throw new Error(`Missing ${label}`);
  await act(async () => button.click());
}

async function finishMetadata(duration: number) {
  expect(probes).toHaveLength(1);
  await act(async () => {
    Object.defineProperty(probes[0], "duration", { value: duration });
    probes[0].dispatchEvent(new Event("loadedmetadata"));
    await (gallery as unknown as { pendingSelection: Promise<void> }).pendingSelection;
  });
}
