import { afterEach, describe, expect, it, vi } from "vitest";

// Every heavy dependency of the manager is replaced so the test drives only
// its start / stop / dispose bookkeeping.
vi.mock("../../wasm", () => ({ TICKS_PER_SECOND: 1000 }));
vi.mock("../../retime/rate", () => ({
  clampRetimeRate: ({ rate }: { rate: number }) => rate,
  shouldMaintainPitch: () => false,
}));
vi.mock("../../retime", () => ({
  getClipTimeAtSourceTime: () => 0,
  getSourceTimeAtClipTime: () => 0,
  renderRetimedBuffer: async () => null,
}));
vi.mock("../../timeline/audio-state", () => ({
  buildAudioGainAutomation: () => [],
  hasAnimatedVolume: () => false,
}));
vi.mock("../../media/audio-mastering", () => ({
  createAudioMasteringChain: () => ({ input: { gain: { value: 1 } } }),
}));
vi.mock("mediabunny", () => ({
  ALL_FORMATS: [],
  AudioBufferSink: class {},
  BlobSource: class {},
  Input: class {},
}));

// The clip lookup is held open so a test can decide when it finishes.
let releaseClips: (clips: unknown[]) => void = () => undefined;
const createAudioContext = vi.fn(() => ({
  state: "running",
  currentTime: 0,
  destination: {},
  close: vi.fn(async () => undefined),
}));
vi.mock("../../media/audio", () => ({
  createAudioContext: () => createAudioContext(),
  collectAudioClips: () =>
    new Promise((resolve) => {
      releaseClips = resolve;
    }),
}));

import { AudioManager } from "./audio-manager";
import type { EditorCore } from "../index";

afterEach(() => {
  vi.restoreAllMocks();
  createAudioContext.mockClear();
});

describe("AudioManager start racing a stop", () => {
  it("does not start playing after dispose while the clip lookup was still running", async () => {
    const { manager, startPlaying } = buildManager();
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    // Playback begins; the clip lookup is still pending.
    startPlaying();
    manager.dispose();
    const contextsBeforeLookupEnds = createAudioContext.mock.calls.length;

    releaseClips([]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // A disposed manager must stay silent: no new schedule interval and no
    // fresh AudioContext.
    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(createAudioContext.mock.calls.length).toBe(contextsBeforeLookupEnds);
  });
});

function buildManager() {
  let playbackListener: () => void = () => undefined;
  let playing = false;
  const editor = {
    playback: {
      getVolume: () => 1,
      getIsPlaying: () => playing,
      getIsScrubbing: () => false,
      getCurrentTime: () => 0,
      subscribe: (listener: () => void) => {
        playbackListener = listener;
        return () => undefined;
      },
      onSeek: () => () => undefined,
    },
    timeline: { subscribe: () => () => undefined, getTotalDuration: () => 5000 },
    media: { subscribe: () => () => undefined, getAssets: () => [] },
    scenes: { getActiveScene: () => ({ tracks: {} }) },
  } as unknown as EditorCore;
  const manager = new AudioManager(editor);
  return {
    manager,
    startPlaying: () => {
      playing = true;
      playbackListener();
    },
  };
}
