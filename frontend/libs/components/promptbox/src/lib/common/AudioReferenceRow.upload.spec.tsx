import { act, createRef, useState, type RefObject } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UploaderStates } from "@storyteller/common";
import { AudioReferenceRow, type AudioReferenceRowHandle } from "./AudioReferenceRow";
import type { RefAudio } from "../promptStore";
import type { UploadMediaFn } from "@storyteller/api";

const FILE = new File(["audio"], "track.mp3", { type: "audio/mpeg" });
const EXISTING: RefAudio = { id: "existing", url: "existing.mp3", file: FILE, mediaToken: "existing-token", duration: 595 };

let root: Root;
let container: HTMLDivElement;
let handle: RefObject<AudioReferenceRowHandle | null>;
let probes: HTMLAudioElement[];
let uploads: Array<{ args: Parameters<UploadMediaFn>[0]; resolve: () => void }>;
let tracks: RefAudio[];
let setTracks: (next: RefAudio[]) => void;
let setLimit: (next: number) => void;
let setImageSupported: (next: boolean) => void;
let images: unknown[];

describe("audio prompt upload completion", () => {
  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    probes = [];
    uploads = [];
    images = [];
    handle = createRef<AudioReferenceRowHandle>();
    const nativeCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const element = nativeCreate(tag, options);
      if (tag === "audio") probes.push(element as HTMLAudioElement);
      return element;
    });
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:test");
      static revokeObjectURL = vi.fn();
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<Harness />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses current model capacity before beginning an upload after metadata", async () => {
    const pending = handle.current!.addAudioFiles([FILE]);
    await act(async () => setLimit(0));
    await metadata(0, 10);
    expect(uploads).toHaveLength(0);
    await pending;
    expect(tracks).toEqual([]);
  });

  it("does not append an upload when the model capacity became zero", async () => {
    const pending = handle.current!.addAudioFiles([FILE]);
    await metadata(0, 10);
    await act(async () => setLimit(0));
    await complete(0, "new");
    await pending;
    expect(tracks).toEqual([]);
  });

  it("enforces the current total duration at upload completion", async () => {
    const pending = handle.current!.addAudioFiles([FILE]);
    await metadata(0, 10);
    await act(async () => setTracks([EXISTING]));
    await complete(0, "new");
    await pending;
    expect(tracks).toEqual([EXISTING]);
  });

  it("retains both independent callbacks completing before the next render", async () => {
    const first = handle.current!.addAudioFiles([FILE]);
    const second = handle.current!.addAudioFiles([FILE]);
    await metadata(0, 10);
    await metadata(1, 20);
    await act(async () => {
      uploads[0].args.progressCallback({ status: UploaderStates.success, data: "first" });
      uploads[1].args.progressCallback({ status: UploaderStates.success, data: "second" });
      uploads[0].resolve();
      uploads[1].resolve();
      await Promise.all([first, second]);
    });
    expect(tracks.map((a) => a.mediaToken)).toEqual(["first", "second"]);
  });

  it("does not exceed a one-track limit with concurrent callbacks", async () => {
    await act(async () => setLimit(1));
    const first = handle.current!.addAudioFiles([FILE]);
    const second = handle.current!.addAudioFiles([FILE]);
    await metadata(0, 10);
    await metadata(1, 20);
    await act(async () => {
      uploads[0].args.progressCallback({ status: UploaderStates.success, data: "first" });
      uploads[1].args.progressCallback({ status: UploaderStates.success, data: "second" });
      uploads[0].resolve();
      uploads[1].resolve();
      await Promise.all([first, second]);
    });
    expect(tracks.map((a) => a.mediaToken)).toEqual(["first"]);
  });

  it("keeps an ordinary two-file sequential upload working", async () => {
    const pending = handle.current!.addAudioFiles([FILE, FILE]);
    await metadata(0, 10);
    await complete(0, "first");
    await metadata(1, 20);
    await complete(1, "second");
    await pending;
    expect(tracks.map((a) => a.mediaToken)).toEqual(["first", "second"]);
  });

  it("discards an image completion when the current model stopped supporting images", async () => {
    let pending!: Promise<void>;
    await act(async () => { pending = handle.current!.addImageFile(new File([], "image.png")); });
    await act(async () => setImageSupported(false));
    await complete(0, "image-token");
    await pending;
    expect(images).toEqual([]);
  });

  it("retains an ordinary image upload", async () => {
    let pending!: Promise<void>;
    await act(async () => { pending = handle.current!.addImageFile(new File([], "image.png")); });
    await complete(0, "image-token");
    await pending;
    expect(images).toHaveLength(1);
  });
});

function Harness() {
  const [current, update] = useState<RefAudio[]>([]);
  const [limit, updateLimit] = useState(3);
  const [imageSupported, updateImageSupported] = useState(true);
  tracks = current;
  setTracks = update;
  setLimit = updateLimit;
  setImageSupported = updateImageSupported;
  const upload: UploadMediaFn = (args) => new Promise((resolve) => uploads.push({ args, resolve }));
  return <AudioReferenceRow ref={handle} referenceAudios={current} onReferenceAudiosChange={update}
    maxAudioCount={limit} maxAudioRefDuration={600} uploadAudio={upload} uploadImage={upload}
    imageSupported={imageSupported} onReferenceImagesChange={(next) => { images = next; }} />;
}

async function metadata(index: number, duration: number) {
  await act(async () => {
    Object.defineProperty(probes[index], "duration", { value: duration });
    probes[index].dispatchEvent(new Event("loadedmetadata"));
  });
}

async function complete(index: number, token: string) {
  await act(async () => {
    uploads[index].args.progressCallback({ status: UploaderStates.success, data: token });
    uploads[index].resolve();
  });
}
