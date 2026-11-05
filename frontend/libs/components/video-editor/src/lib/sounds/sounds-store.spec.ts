import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const insertElement = vi.fn();
const toastError = vi.fn();

vi.mock("../core", () => ({
  EditorCore: {
    getInstance: () => ({
      adapters: {
        toast: { error: toastError },
        soundsAdapter: {},
      },
      playback: { getCurrentTime: () => 0 },
      timeline: { insertElement },
    }),
  },
}));
vi.mock("../timeline/element-utils", () => ({
  buildLibraryAudioElement: () => ({ type: "audio" }),
}));

import { useSoundsStore } from "./sounds-store";

const SOUND = {
  id: 1,
  name: "Beep",
  username: "u",
  previewUrl: "https://example.test/beep.mp3",
  downloadUrl: "",
  duration: 1,
  tags: [],
  license: "cc0",
};

describe("addSoundToTimeline", () => {
  it("closes the AudioContext it opened to decode the sound", async () => {
    await useSoundsStore.getState().addSoundToTimeline({ sound: SOUND as never });

    expect(contexts).toHaveLength(1);
    expect(contexts[0].close).toHaveBeenCalledTimes(1);
  });

  it("closes the AudioContext even when decoding fails", async () => {
    decodeShouldFail = true;

    const added = await useSoundsStore
      .getState()
      .addSoundToTimeline({ sound: SOUND as never });

    expect(added).toBe(false);
    expect(contexts[0].close).toHaveBeenCalledTimes(1);
  });
});

let contexts: Array<{ close: ReturnType<typeof vi.fn> }> = [];
let decodeShouldFail = false;

beforeEach(() => {
  contexts = [];
  decodeShouldFail = false;
  insertElement.mockClear();
  toastError.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })),
  );
  vi.stubGlobal(
    "AudioContext",
    class {
      close = vi.fn(async () => undefined);
      constructor() {
        contexts.push(this);
      }
      async decodeAudioData() {
        if (decodeShouldFail) throw new Error("bad audio");
        return {};
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
