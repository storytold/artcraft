import { act, useState, useLayoutEffect, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UploaderStates } from "@storyteller/common";
import type { UploadMediaFn } from "@storyteller/api";
import { useDeckMedia, type DeckMediaRefLike } from "./useDeckMedia";

let root: Root;
let container: HTMLDivElement;
let deck: ReturnType<typeof useDeckMedia>;
let references: DeckMediaRefLike[];
let audios: DeckMediaRefLike[];
let onRemoved: (() => void) | undefined;
let probes: HTMLVideoElement[];
let audioProbes: HTMLAudioElement[];
let uploads: Array<{ args: Parameters<UploadMediaFn>[0]; resolve: () => void }>;
const originalCreate = document.createElement.bind(document);

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  probes = [];
  audioProbes = [];
  uploads = [];
  onRemoved = undefined;
  vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
    const element = originalCreate(tag, options);
    if (tag === "video") probes.push(element as HTMLVideoElement);
    if (tag === "audio") audioProbes.push(element as HTMLAudioElement);
    return element;
  });
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => `blob:${Math.random()}`);
    static revokeObjectURL = vi.fn();
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("does not restore a reference removed while another video uploads", async () => {
  await render([reference("old")]);
  let pending!: Promise<void>;
  await act(async () => { pending = deck.processVideoFiles([file("new")]); });
  await metadata(0);
  await act(async () => container.querySelector("button")!.click());
  expect(references).toEqual([]);
  await finish(0, "new", pending);
  expect(references.map((item) => item.mediaToken)).toEqual(["new"]);
});

it("keeps both independently completed video uploads", async () => {
  await render([]);
  let first!: Promise<void>;
  let second!: Promise<void>;
  await act(async () => {
    first = deck.processVideoFiles([file("a")]);
    second = deck.processVideoFiles([file("b")]);
  });
  await metadata(0);
  await metadata(1);
  await finish(1, "b", second);
  await finish(0, "a", first);
  expect(references.map((item) => item.mediaToken)).toEqual(["b", "a"]);
});

it("preserves ordinary sequential multi-file uploads", async () => {
  await render([]);
  let pending!: Promise<void>;
  await act(async () => { pending = deck.processVideoFiles([file("a"), file("b")]); });
  await metadata(0);
  await finish(0, "a");
  await metadata(1);
  await finish(1, "b", pending);
  expect(references.map((item) => item.mediaToken)).toEqual(["a", "b"]);
});

it("preserves an existing reference when a normal new upload finishes", async () => {
  await render([reference("old")]);
  let pending!: Promise<void>;
  await act(async () => { pending = deck.processVideoFiles([file("new")]); });
  await metadata(0);
  await finish(0, "new", pending);
  expect(references.map((item) => item.mediaToken)).toEqual(["old", "new"]);
});

it.each([
  { maxVideos: 1, maxSeconds: 15 },
  { maxVideos: 3, maxSeconds: 3 },
])("keeps the first committed upload when parallel completion exceeds $maxVideos videos / $maxSeconds seconds", async ({ maxVideos, maxSeconds }) => {
  await render([], maxVideos, maxSeconds);
  let first!: Promise<void>;
  let second!: Promise<void>;
  await act(async () => {
    first = deck.processVideoFiles([file("a")]);
    second = deck.processVideoFiles([file("b")]);
  });
  await metadata(0);
  await metadata(1);
  await finish(0, "a", first);
  await finish(1, "b", second);
  expect(references.map((item) => item.mediaToken)).toEqual(["a"]);
  // Both metadata probe URLs plus the rejected reference preview are released.
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
});

it("keeps a removal committed before passive effects when an upload completes", async () => {
  await render([reference("old")]);
  let pending!: Promise<void>;
  await act(async () => { pending = deck.processVideoFiles([file("new")]); });
  await metadata(0);
  onRemoved = () => {
    uploads[0].args.progressCallback({ status: UploaderStates.success, data: "new" });
    uploads[0].resolve();
  };
  await act(async () => container.querySelector("button")!.click());
  await pending;
  expect(references.map((item) => item.mediaToken)).toEqual(["new"]);
});

it("does not restore references removed while a library video is probing metadata", async () => {
  await render([reference("old")]);
  await act(async () => deck.openGallery("video"));
  let pending!: Promise<void>;
  await act(async () => { pending = selectLibrary("library"); });
  await act(async () => container.querySelector("button")!.click());
  await metadata(0);
  await pending;
  expect(references.map((item) => item.mediaToken)).toEqual(["library"]);
});

it("preserves an upload completing while a library video is probing metadata", async () => {
  await render([]);
  let upload!: Promise<void>;
  await act(async () => { upload = deck.processVideoFiles([file("upload")]); });
  await metadata(0);
  await act(async () => deck.openGallery("video"));
  let library!: Promise<void>;
  await act(async () => { library = selectLibrary("library"); });
  await finish(0, "upload", upload);
  await metadata(1);
  await library;
  expect(references.map((item) => item.mediaToken)).toEqual(["upload", "library"]);
});

it("uses a stricter model's current limits when an upload finishes", async () => {
  await render([]);
  let pending!: Promise<void>;
  await act(async () => { pending = deck.processVideoFiles([file("new")]); });
  await metadata(0);
  await render([], 0);
  await finish(0, "new", pending);
  expect(references).toEqual([]);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});

it("uses current model limits after library video metadata finishes", async () => {
  await render([]);
  await act(async () => deck.openGallery("video"));
  let pending!: Promise<void>;
  await act(async () => { pending = selectLibrary("library"); });
  await render([], 0);
  await metadata(0);
  await pending;
  expect(references).toEqual([]);
});

it("preserves ordinary library video selection", async () => {
  await render([reference("old")]);
  await act(async () => deck.openGallery("video"));
  let pending!: Promise<void>;
  await act(async () => { pending = selectLibrary("library"); });
  await metadata(0);
  await pending;
  expect(references.map((item) => item.mediaToken)).toEqual(["old", "library"]);
});

it("does not restore audio removed while a library selection awaits duration results", async () => {
  await render([], 3, 15, [reference("old")]);
  await act(async () => deck.openGallery("audio"));
  let pending!: Promise<void>;
  await act(async () => { pending = selectLibrary("library"); });
  await act(async () => container.querySelectorAll("button")[1].click());
  Object.defineProperty(audioProbes[0], "duration", { configurable: true, value: 2 });
  await act(async () => audioProbes[0].dispatchEvent(new Event("loadedmetadata")));
  await pending;
  expect(audios.map((item) => item.mediaToken)).toEqual(["library"]);
});

it("keeps audio uploads completing before the next render", async () => {
  await render([]);
  let first!: Promise<void>;
  let second!: Promise<void>;
  await act(async () => {
    first = deck.processAudioFiles([audioFile("a")]);
    second = deck.processAudioFiles([audioFile("b")]);
  });
  await metadata(0, "audio");
  await metadata(1, "audio");
  await act(async () => {
    uploads[1].args.progressCallback({ status: UploaderStates.success, data: "b" });
    uploads[1].resolve();
    uploads[0].args.progressCallback({ status: UploaderStates.success, data: "a" });
    uploads[0].resolve();
    await Promise.all([first, second]);
  });
  expect(audios.map((item) => item.mediaToken)).toEqual(["b", "a"]);
});

it("uses current model limits when an audio upload finishes", async () => {
  await render([]);
  let pending!: Promise<void>;
  await act(async () => { pending = deck.processAudioFiles([audioFile("new")]); });
  await metadata(0, "audio");
  await render([], 0);
  await finish(0, "new", pending);
  expect(audios).toEqual([]);
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});

it("preserves an audio upload completing while library audio metadata loads", async () => {
  await render([]);
  let upload!: Promise<void>;
  await act(async () => { upload = deck.processAudioFiles([audioFile("upload")]); });
  await metadata(0, "audio");
  await act(async () => deck.openGallery("audio"));
  let library!: Promise<void>;
  await act(async () => { library = selectLibrary("library"); });
  await finish(0, "upload", upload);
  await metadata(1, "audio");
  await library;
  expect(audios.map((item) => item.mediaToken)).toEqual(["upload", "library"]);
});

it("preserves ordinary audio library selection with known duration", async () => {
  await render([], 3, 15, [reference("old")]);
  await act(async () => deck.openGallery("audio"));
  let pending!: Promise<void>;
  await act(async () => { pending = selectLibrary("library", 2000); await pending; });
  expect(audios.map((item) => item.mediaToken)).toEqual(["old", "library"]);
});

it("uses current model limits when library audio metadata finishes", async () => {
  await render([]);
  await act(async () => deck.openGallery("audio"));
  let pending!: Promise<void>;
  await act(async () => { pending = selectLibrary("library"); });
  await render([], 0);
  await metadata(0, "audio");
  await pending;
  expect(audios).toEqual([]);
});

function Harness({ initial, maxVideos, maxSeconds, initialAudios }: { initial: DeckMediaRefLike[]; maxVideos: number; maxSeconds: number; initialAudios: DeckMediaRefLike[] }) {
  const [videos, setVideos] = useState(initial);
  references = videos;
  const [audioRefs, setAudios] = useState(initialAudios);
  audios = audioRefs;
  deck = useDeckMedia({
    referenceImages: [], setReferenceImages: () => {}, maxImages: 0,
    referenceVideos: videos, setReferenceVideos: setVideos,
    maxVideos, maxVideoTotalSec: maxSeconds,
    referenceAudios: audioRefs, setReferenceAudios: setAudios,
    maxAudios: maxVideos, maxAudioTotalSec: maxSeconds,
    ownGalleryModal: true,
    uploadVideo: (args) => new Promise<void>((resolve) => uploads.push({ args, resolve })),
    uploadAudio: (args) => new Promise<void>((resolve) => uploads.push({ args, resolve })),
  });
  useLayoutEffect(() => {
    if (videos.length === 0 && onRemoved) {
      const complete = onRemoved;
      onRemoved = undefined;
      complete();
    }
  }, [videos]);
  return <>
    <button onClick={() => setVideos(videos.filter((video) => video.id !== "old"))}>Remove old reference</button>
    <button onClick={() => setAudios(audioRefs.filter((audio) => audio.id !== "old"))}>Remove old audio</button>
  </>;
}

async function render(initial: DeckMediaRefLike[], maxVideos = 3, maxSeconds = 15, initialAudios: DeckMediaRefLike[] = []) {
  await act(async () => root.render(<Harness initial={initial} maxVideos={maxVideos} maxSeconds={maxSeconds} initialAudios={initialAudios} />));
}

function reference(id: string): DeckMediaRefLike {
  return { id, mediaToken: id, url: `https://example.com/${id}.mp4`, duration: 2 };
}

function file(name: string) {
  return new File([], `${name}.mp4`, { type: "video/mp4" });
}

function audioFile(name: string) {
  return new File([], `${name}.mp3`, { type: "audio/mpeg" });
}

async function metadata(index: number, kind: "video" | "audio" = "video") {
  const video = kind === "video" ? probes[index] : audioProbes[index];
  Object.defineProperty(video, "duration", { configurable: true, value: 2 });
  await act(async () => video.dispatchEvent(new Event("loadedmetadata")));
}

async function finish(index: number, token: string, pending?: Promise<void>) {
  await act(async () => {
    const upload = uploads[index];
    upload.args.progressCallback({ status: UploaderStates.success, data: token });
    upload.resolve();
    if (pending) await pending;
  });
}

function selectLibrary(id: string, durationMillis?: number) {
  const modal = deck.galleryModal as ReactElement<{ onUseSelected: (items: Array<{ id: string; fullImage: string; durationMillis?: number }>) => Promise<void> }>;
  return modal.props.onUseSelected([{ id, fullImage: `https://example.com/${id}.mp4`, durationMillis }]);
}
