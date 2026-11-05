import { afterEach, describe, expect, it, vi } from "vitest";

// Only the context bookkeeping is under test, so the decoding and mastering
// helpers (which pull in wasm and mediabunny) are replaced with stand-ins.
vi.mock("../wasm", () => ({
  TICKS_PER_SECOND: 1000,
  ZERO_MEDIA_TIME: 0,
  mediaTime: ({ ticks }: { ticks: number }) => ticks,
}));
vi.mock("mediabunny", () => ({
  ALL_FORMATS: [],
  AudioBufferSink: class {},
  BlobSource: class {},
  Input: class {},
}));
vi.mock("./audio-mastering", () => ({
  applyAudioMasteringToBuffer: async ({ audioBuffer }: { audioBuffer: unknown }) =>
    audioBuffer,
}));
vi.mock("../retime/audio-stretch", () => ({ renderRetimedBuffer: async () => null }));

import { createTimelineAudioBuffer } from "./audio";
import type { SceneTracks } from "../timeline/types";

const closeSpy = vi.fn(async () => undefined);

afterEach(() => {
  vi.unstubAllGlobals();
  closeSpy.mockClear();
});

describe("createTimelineAudioBuffer audio context", () => {
  it("closes the audio context it created itself once the mix is built", async () => {
    stubAudioContext();

    await createTimelineAudioBuffer({
      tracks: emptyTracks(),
      mediaAssets: [],
      duration: 1000,
    });

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves a context passed in by the caller open", async () => {
    stubAudioContext();
    const callerContext = new (window.AudioContext as never as new () => AudioContext)();

    await createTimelineAudioBuffer({
      tracks: emptyTracks(),
      mediaAssets: [],
      duration: 1000,
      audioContext: callerContext,
    });

    expect(closeSpy).not.toHaveBeenCalled();
  });
});

function stubAudioContext() {
  vi.stubGlobal(
    "AudioContext",
    class {
      close = closeSpy;
      createBuffer() {
        return {};
      }
    },
  );
}

function emptyTracks(): SceneTracks {
  return {
    overlay: [],
    main: { id: "main", type: "video", elements: [] },
    audio: [],
  } as unknown as SceneTracks;
}
