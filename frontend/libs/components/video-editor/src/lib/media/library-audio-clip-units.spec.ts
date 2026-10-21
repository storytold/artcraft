import { afterEach, describe, expect, it, vi } from "vitest";

// 1000 ticks per second keeps the arithmetic readable. The decoding helpers
// are replaced because only the unit of the collected clip times is checked.
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

import { collectAudioClips } from "./audio";
import type { SceneTracks } from "../timeline/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("collectAudioClips unit of library audio clips", () => {
  it("reports library clip times in seconds, like uploaded clips", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, blob: async () => new Blob(["x"]) })),
    );

    const clips = await collectAudioClips({
      tracks: tracksWith({
        id: "lib-1",
        type: "audio",
        sourceType: "library",
        sourceUrl: "https://example.com/a.mp3",
        name: "ding",
        startTime: 2000,
        duration: 3000,
        trimStart: 500,
        trimEnd: 250,
        params: {},
      }),
      mediaAssets: [],
    });

    // 2000 ticks at 1000 per second is 2 seconds, and so on.
    expect(clips).toHaveLength(1);
    expect(clips[0]).toMatchObject({
      startTime: 2,
      duration: 3,
      trimStart: 0.5,
      trimEnd: 0.25,
    });
  });
});

function tracksWith(element: Record<string, unknown>): SceneTracks {
  return {
    overlay: [],
    main: { id: "main", type: "video", elements: [] },
    audio: [{ id: "a1", type: "audio", muted: false, elements: [element] }],
  } as unknown as SceneTracks;
}
