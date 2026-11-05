import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState, type ReactElement } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";

// Shared handle for the toast stand-in (vi.mock calls are lifted above the imports, so it has to come from vi.hoisted).
const m = vi.hoisted(() => ({ toastError: vi.fn() }));

// The hook only needs these at module load; none of them matter to the video upload logic under test.
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: m.toastError } }));
vi.mock("@storyteller/common", () => ({
  UploaderStates: {
    success: "success",
    assetError: "assetError",
    imageCreateError: "imageCreateError",
  },
}));
vi.mock("../common/imagePreview", () => ({
  createImagePreviewUrl: vi.fn(async () => "blob:preview"),
  revokeIfBlobUrl: vi.fn(),
}));

import { useDeckMedia, type DeckMediaRefLike } from "./useDeckMedia";

// How long (in seconds) the stand-in video element reports each file to be, keyed by file name.
const DURATIONS: Record<string, number> = {};

// Sources whose length the stand-in <video> withholds until the test calls releaseVideo for them, and the callbacks
// that release them.
const held = new Set<string>();
const releases = new Map<string, () => void>();
const releaseVideo = (src: string) => releases.get(src)?.();

// One in-flight upload the test controls: finish() reports success for it and lets its promise settle.
interface PendingUpload {
  name: string;
  finish: (token: string) => Promise<void>;
}
let pending: PendingUpload[] = [];

// The real uploader talks to the network. This stand-in records each call and leaves it pending until the test decides.
const uploadVideo = vi.fn(
  (args: { assetFile: File; progressCallback: (s: { status: string; data?: string }) => void }) =>
    new Promise<void>((resolve) => {
      pending.push({
        name: args.assetFile.name,
        finish: async (token) => {
          await act(async () => {
            args.progressCallback({ status: "success", data: token });
            resolve();
          });
        },
      });
    }),
);

// Same stand-in for the audio uploader; it shares the `pending` list, so settleAll finishes audio uploads too.
const uploadAudio = vi.fn(
  (args: { assetFile: File; progressCallback: (s: { status: string; data?: string }) => void }) =>
    new Promise<void>((resolve) => {
      pending.push({
        name: args.assetFile.name,
        finish: async (token) => {
          await act(async () => {
            args.progressCallback({ status: "success", data: token });
            resolve();
          });
        },
      });
    }),
);

const realCreateElement = document.createElement.bind(document);

beforeEach(() => {
  pending = [];
  uploadVideo.mockClear();
  uploadAudio.mockClear();
  m.toastError.mockReset();
  for (const key of Object.keys(DURATIONS)) delete DURATIONS[key];
  held.clear();
  releases.clear();
  // The object URL carries the file name so the fake <video> below can look its duration up.
  URL.createObjectURL = vi.fn((file: Blob | MediaSource) => `blob:${(file as File).name}`);
  URL.revokeObjectURL = vi.fn();
  // jsdom never loads media, so a real <video> or <audio> would never report its length. The hook measures a file by
  // making one of them, setting src and waiting for onloadedmetadata; this stand-in answers from DURATIONS right after
  // src is set (for both tags, because the audio path measures with an <audio>).
  vi.spyOn(document, "createElement").mockImplementation(((tag: string, options?: ElementCreationOptions) => {
    if (tag !== "video" && tag !== "audio") return realCreateElement(tag, options);
    const fake: {
      duration: number;
      preload: string;
      currentSrc: string;
      onloadedmetadata: (() => void) | null;
      onerror: (() => void) | null;
    } = {
      duration: 0,
      preload: "",
      currentSrc: "",
      onloadedmetadata: null,
      onerror: null,
    };
    Object.defineProperty(fake, "src", {
      // The audio measurer reads src back to revoke the object URL, so it needs a getter as well as the setter.
      get() {
        return fake.currentSrc;
      },
      set(value: string) {
        fake.currentSrc = value;
        fake.duration = DURATIONS[value.replace("blob:", "")] ?? 3;
        // A source the test is holding back reports its length only when the test releases it, so the test can
        // decide what happens while the measurement is still pending (a slow network probe in the real app).
        if (held.has(value)) {
          releases.set(value, () => fake.onloadedmetadata?.());
          return;
        }
        queueMicrotask(() => fake.onloadedmetadata?.());
      },
    });
    return fake as unknown as HTMLElement;
  }) as typeof document.createElement);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mp4 = (name: string) => new File(["x"], name, { type: "video/mp4" });

// Mounts the hook the way the prompt box does: the committed videos live in the caller's state and come back in as a
// prop, so a commit only becomes visible to the hook after React has re-rendered it.
const setup = (initial: DeckMediaRefLike[] = [], maxVideos = 3, ownGalleryModal = false) =>
  renderHook(() => {
    const [videos, setVideos] = useState<DeckMediaRefLike[]>(initial);
    const deck = useDeckMedia<never, DeckMediaRefLike, never>({
      referenceImages: [],
      setReferenceImages: vi.fn(),
      maxImages: 0,
      referenceVideos: videos,
      setReferenceVideos: setVideos,
      maxVideos,
      maxVideoTotalSec: 15,
      uploadVideo: uploadVideo as never,
      ownGalleryModal,
    });
    return { deck, videos, setVideos };
  });

// Lets timers and microtasks run, so a measurement that is waiting on the (fake) video element can finish.
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

// Starts one drop of a single video. The hook's batch promise is deliberately NOT awaited: the app calls it with
// `void`, so the next drop can arrive while this one is still uploading.
const drop = async (ctx: ReturnType<typeof setup>, name: string) => {
  await act(async () => {
    void ctx.result.current.deck.processVideoFiles([mp4(name)]);
  });
  await flush();
};

// Finishes every upload in the order the uploads started, one at a time, until nothing is left to start or finish. It
// does not care whether the hook runs overlapping drops side by side or one after another.
const settleAll = async () => {
  for (let guard = 0; guard < 20; guard++) {
    await flush();
    const next = pending.shift();
    if (!next) return;
    await next.finish(`tok-${next.name}`);
  }
};

const tokens = (ctx: ReturnType<typeof setup>) =>
  ctx.result.current.videos.map((v: DeckMediaRefLike) => v.mediaToken);

describe("useDeckMedia: a second video dropped while the first is still uploading", () => {
  it("keeps both videos (the later commit used to overwrite the earlier one)", async () => {
    const ctx = setup();
    await drop(ctx, "a.mp4");
    await drop(ctx, "b.mp4");

    await settleAll();

    expect(tokens(ctx)).toEqual(["tok-a.mp4", "tok-b.mp4"]);
  });

  it("keeps showing a spinner for the second video after the first one finishes", async () => {
    const ctx = setup();
    await drop(ctx, "a.mp4");
    await drop(ctx, "b.mp4");

    // Finish only the first upload, then let the hook settle.
    await pending.shift()!.finish("tok-a.mp4");
    await flush();

    // The second video has not finished: its spinner must still be on screen, not cleared by the first one's finish.
    expect(ctx.result.current.deck.uploadingVideo?.file.name).toBe("b.mp4");
    // And the first video is already in the deck.
    expect(tokens(ctx)).toContain("tok-a.mp4");

    await settleAll();
    expect(ctx.result.current.deck.uploadingVideo).toBeNull();
    expect(tokens(ctx)).toEqual(["tok-a.mp4", "tok-b.mp4"]);
  });

  it("respects the video limit when each drop arrives while earlier ones are uploading", async () => {
    // The deck takes 2 videos; three are dropped one after another, each before the previous upload ends.
    const ctx = setup([], 2);
    await drop(ctx, "a.mp4");
    await drop(ctx, "b.mp4");
    await drop(ctx, "c.mp4");

    await settleAll();

    // The third one does not fit: the deck holds the first two and the person is told why.
    expect(tokens(ctx)).toEqual(["tok-a.mp4", "tok-b.mp4"]);
    expect(m.toastError).toHaveBeenCalled();
  });

  it("does not bring back a video the person removed while a new one was uploading", async () => {
    const existing: DeckMediaRefLike = { id: "x", url: "blob:x", mediaToken: "tok-x", duration: 3 };
    const ctx = setup([existing]);
    await drop(ctx, "a.mp4");

    // While a.mp4 uploads the person removes the video that was already in the deck.
    await act(async () => {
      ctx.result.current.setVideos((prev: DeckMediaRefLike[]) => prev.filter((v: DeckMediaRefLike) => v.id !== "x"));
    });

    await settleAll();

    // Only the new video remains; the removed one must not reappear when the upload lands.
    expect(tokens(ctx)).toEqual(["tok-a.mp4"]);
  });

  // Controls: these must pass on the old code AND the fixed code, so the fix does not change the ordinary paths.
  it("control: one drop commits the video and clears the spinner", async () => {
    const ctx = setup();
    await drop(ctx, "a.mp4");
    expect(ctx.result.current.deck.uploadingVideo?.file.name).toBe("a.mp4");

    await settleAll();

    expect(tokens(ctx)).toEqual(["tok-a.mp4"]);
    expect(ctx.result.current.deck.uploadingVideo).toBeNull();
  });

  it("control: a second drop AFTER the first finished adds to it", async () => {
    const ctx = setup();
    await drop(ctx, "a.mp4");
    await settleAll();

    await drop(ctx, "b.mp4");
    await settleAll();

    expect(tokens(ctx)).toEqual(["tok-a.mp4", "tok-b.mp4"]);
  });

  it("control: one drop of several files commits them in order", async () => {
    const ctx = setup();
    await act(async () => {
      void ctx.result.current.deck.processVideoFiles([mp4("a.mp4"), mp4("b.mp4")]);
    });

    await settleAll();

    expect(tokens(ctx)).toEqual(["tok-a.mp4", "tok-b.mp4"]);
  });

  it("control: a video that would pass the total length limit is refused with a message", async () => {
    // Two videos of 9s each cannot fit in a 15s total.
    DURATIONS["a.mp4"] = 9;
    DURATIONS["b.mp4"] = 9;
    const ctx = setup();
    await act(async () => {
      void ctx.result.current.deck.processVideoFiles([mp4("a.mp4"), mp4("b.mp4")]);
    });

    await settleAll();

    expect(tokens(ctx)).toEqual(["tok-a.mp4"]);
    expect(m.toastError).toHaveBeenCalled();
  });
});

describe("useDeckMedia: a video picked from the library while another is uploading", () => {
  const LIB_SRC = "https://cdn.example/lib.mp4";

  // The prompt box renders `deck.galleryModal`; its "Use selected" handler is a prop on that element, so the test
  // calls it the way the modal would.
  const useSelected = (ctx: ReturnType<typeof setup>) =>
    (ctx.result.current.deck.galleryModal as ReactElement<{ onUseSelected: (items: unknown[]) => Promise<void> }>).props
      .onUseSelected;

  const openVideoLibrary = (ctx: ReturnType<typeof setup>) =>
    act(async () => {
      ctx.result.current.deck.openGallery("video");
    });

  it("keeps the uploaded video when the pick finishes measuring after the upload has landed", async () => {
    const ctx = setup([], 3, true);
    await drop(ctx, "a.mp4");
    await openVideoLibrary(ctx);

    // The person confirms the library pick; its length is still being measured (slow network probe)...
    held.add(LIB_SRC);
    let picked: Promise<void> = Promise.resolve();
    await act(async () => {
      picked = useSelected(ctx)([{ id: "lib-1", fullImage: LIB_SRC }]);
    });
    // ...and meanwhile the upload finishes and its video joins the deck.
    await pending.shift()!.finish("tok-a.mp4");
    await flush();
    expect(tokens(ctx)).toEqual(["tok-a.mp4"]);

    // The measurement ends and the library video is added: it must join the uploaded one, not replace it.
    await act(async () => {
      releaseVideo(LIB_SRC);
      await picked;
    });

    expect(tokens(ctx)).toEqual(["tok-a.mp4", "lib-1"]);
  });

  it("control: a library pick on its own adds the video", async () => {
    const ctx = setup([], 3, true);
    await openVideoLibrary(ctx);

    await act(async () => {
      await useSelected(ctx)([{ id: "lib-1", fullImage: LIB_SRC }]);
    });

    expect(tokens(ctx)).toEqual(["lib-1"]);
  });
});

// ---- Audio: the same overlapping-drop situation on the audio reference deck ----

const mp3 = (name: string) => new File(["x"], name, { type: "audio/mpeg" });

// Mounts the hook the way the video prompt box does for its audio deck: committed tracks live in the caller's state.
const setupAudio = (initial: DeckMediaRefLike[] = [], maxAudios = 2, ownGalleryModal = false) =>
  renderHook(() => {
    const [audios, setAudios] = useState<DeckMediaRefLike[]>(initial);
    const deck = useDeckMedia<never, never, DeckMediaRefLike>({
      referenceImages: [],
      setReferenceImages: vi.fn(),
      maxImages: 0,
      referenceAudios: audios,
      setReferenceAudios: setAudios,
      maxAudios,
      maxAudioTotalSec: 15,
      uploadAudio: uploadAudio as never,
      ownGalleryModal,
    });
    return { deck, audios, setAudios };
  });

// One drop of a single audio file; the batch promise is not awaited, like the app's `void deck.processAudioFiles(...)`.
const dropAudio = async (ctx: ReturnType<typeof setupAudio>, name: string) => {
  await act(async () => {
    void ctx.result.current.deck.processAudioFiles([mp3(name)]);
  });
  await flush();
};

const audioTokens = (ctx: ReturnType<typeof setupAudio>) =>
  ctx.result.current.audios.map((a: DeckMediaRefLike) => a.mediaToken);

describe("useDeckMedia: a second audio track dropped while the first is still uploading", () => {
  it("keeps showing a spinner for the second track after the first one finishes", async () => {
    const ctx = setupAudio();
    await dropAudio(ctx, "a.mp3");
    await dropAudio(ctx, "b.mp3");

    // Finish only the first upload, then let the hook settle.
    await pending.shift()!.finish("tok-a.mp3");
    await flush();

    // The second track has not finished: its spinner must still be on screen, not cleared by the first one's finish.
    expect(ctx.result.current.deck.uploadingAudio?.file.name).toBe("b.mp3");
    expect(audioTokens(ctx)).toContain("tok-a.mp3");

    await settleAll();
    expect(ctx.result.current.deck.uploadingAudio).toBeNull();
    expect(audioTokens(ctx)).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });

  it("respects the audio limit when each drop arrives while earlier ones are uploading", async () => {
    // The deck takes 2 tracks; three are dropped one after another, each before the previous upload ends.
    const ctx = setupAudio([], 2);
    await dropAudio(ctx, "a.mp3");
    await dropAudio(ctx, "b.mp3");
    await dropAudio(ctx, "c.mp3");

    await settleAll();

    // The third one does not fit: the deck holds the first two.
    expect(audioTokens(ctx)).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });

  // Passes on the old code too: the audio commit already read the freshest list, so only the video deck lost updates.
  it("control: both tracks end up in the deck", async () => {
    const ctx = setupAudio();
    await dropAudio(ctx, "a.mp3");
    await dropAudio(ctx, "b.mp3");

    await settleAll();

    expect(audioTokens(ctx)).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });

  // Controls: these must pass on the old code AND the fixed code.
  it("control: one drop commits the track and clears the spinner", async () => {
    const ctx = setupAudio();
    await dropAudio(ctx, "a.mp3");
    expect(ctx.result.current.deck.uploadingAudio?.file.name).toBe("a.mp3");

    await settleAll();

    expect(audioTokens(ctx)).toEqual(["tok-a.mp3"]);
    expect(ctx.result.current.deck.uploadingAudio).toBeNull();
  });

  it("control: a second drop AFTER the first finished adds to it", async () => {
    const ctx = setupAudio();
    await dropAudio(ctx, "a.mp3");
    await settleAll();

    await dropAudio(ctx, "b.mp3");
    await settleAll();

    expect(audioTokens(ctx)).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });

  it("control: one drop of several files commits them in order", async () => {
    const ctx = setupAudio();
    await act(async () => {
      void ctx.result.current.deck.processAudioFiles([mp3("a.mp3"), mp3("b.mp3")]);
    });

    await settleAll();

    expect(audioTokens(ctx)).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });

  it("control: a track the person removed while a new one uploaded does not come back", async () => {
    const existing: DeckMediaRefLike = { id: "x", url: "blob:x", mediaToken: "tok-x", duration: 3 };
    const ctx = setupAudio([existing]);
    await dropAudio(ctx, "a.mp3");

    await act(async () => {
      ctx.result.current.setAudios((prev: DeckMediaRefLike[]) => prev.filter((a: DeckMediaRefLike) => a.id !== "x"));
    });

    await settleAll();

    expect(audioTokens(ctx)).toEqual(["tok-a.mp3"]);
  });

  it("control: a drop on a full deck adds nothing", async () => {
    const full: DeckMediaRefLike[] = [
      { id: "x", url: "blob:x", mediaToken: "tok-x", duration: 3 },
      { id: "y", url: "blob:y", mediaToken: "tok-y", duration: 3 },
    ];
    const ctx = setupAudio(full, 2);
    await dropAudio(ctx, "a.mp3");

    await settleAll();

    expect(audioTokens(ctx)).toEqual(["tok-x", "tok-y"]);
    expect(uploadAudio).not.toHaveBeenCalled();
  });
});

describe("useDeckMedia: an audio track picked from the library while another is uploading", () => {
  const LIB_AUDIO = "https://cdn.example/lib.mp3";

  const useSelected = (ctx: ReturnType<typeof setupAudio>) =>
    (ctx.result.current.deck.galleryModal as ReactElement<{ onUseSelected: (items: unknown[]) => Promise<void> }>).props
      .onUseSelected;

  const openAudioLibrary = (ctx: ReturnType<typeof setupAudio>) =>
    act(async () => {
      ctx.result.current.deck.openGallery("audio");
    });

  it("keeps the uploaded track when the pick finishes measuring after the upload has landed", async () => {
    const ctx = setupAudio([], 3, true);
    await dropAudio(ctx, "a.mp3");
    await openAudioLibrary(ctx);

    // The person confirms the library pick; its length is still being measured (slow network probe)...
    held.add(LIB_AUDIO);
    let picked: Promise<void> = Promise.resolve();
    await act(async () => {
      picked = useSelected(ctx)([{ id: "lib-1", fullImage: LIB_AUDIO }]);
    });
    // ...and meanwhile the upload finishes and its track joins the deck.
    await pending.shift()!.finish("tok-a.mp3");
    await flush();
    expect(audioTokens(ctx)).toEqual(["tok-a.mp3"]);

    // The measurement ends and the library track is added: it must join the uploaded one, not replace it.
    await act(async () => {
      releaseVideo(LIB_AUDIO);
      await picked;
    });

    expect(audioTokens(ctx)).toEqual(["tok-a.mp3", "lib-1"]);
  });

  it("control: a library pick on its own adds the track", async () => {
    const ctx = setupAudio([], 3, true);
    await openAudioLibrary(ctx);

    await act(async () => {
      await useSelected(ctx)([{ id: "lib-1", fullImage: LIB_AUDIO }]);
    });

    expect(audioTokens(ctx)).toEqual(["lib-1"]);
  });
});
