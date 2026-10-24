import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted so the vi.mock factories below can use them.
const { collectMock, createContextMock, fakeContext, mediabunny } = vi.hoisted(
  () => {
    // A minimal stand-in for the browser AudioContext. AudioManager only reads
    // `state`, `currentTime`, `destination`, calls `resume()` and `close()`.
    const context = {
      state: "running" as string,
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn(),
      close: vi.fn(() => Promise.resolve()),
    };

    // Shared bookkeeping for the fake mediabunny `Input` below.
    const bunny = {
      // Every Input the manager creates, so a test can check each was disposed.
      inputs: [] as Array<{ disposed: boolean }>,
      // How each new Input answers getPrimaryAudioTrack (set per test).
      trackFactory: (() => Promise.resolve(null)) as () => Promise<unknown>,
    };

    // Fake of mediabunny's Input: remembers itself and whether dispose() ran.
    class FakeInput {
      disposed = false;
      constructor() {
        bunny.inputs.push(this);
      }
      getPrimaryAudioTrack() {
        return bunny.trackFactory();
      }
      dispose() {
        this.disposed = true;
      }
    }

    return {
      // Replaces the function that decodes the timeline's audio clips.
      collectMock: vi.fn(),
      createContextMock: vi.fn(() => context),
      fakeContext: context,
      // Same object the FakeInput class reads, so tests can mutate it.
      mediabunny: Object.assign(bunny, { FakeInput }),
    };
  },
);

vi.mock("../../media/audio", () => ({
  createAudioContext: createContextMock,
  collectAudioClips: collectMock,
}));

// The mastering chain wires real Web Audio nodes; the manager only needs an
// object with a `gain.value` it can set.
vi.mock("../../media/audio-mastering", () => ({
  createAudioMasteringChain: () => ({ input: { gain: { value: 1 } } }),
}));

// mediabunny does the real audio demuxing; swap in the tracking fake Input.
vi.mock("mediabunny", () => ({
  ALL_FORMATS: [],
  AudioBufferSink: class {},
  BlobSource: class {},
  Input: mediabunny.FakeInput,
}));

import { AudioManager } from "./audio-manager";
import { TICKS_PER_SECOND } from "../../wasm";
import type { EditorCore } from "../index";

// A promise we settle by hand so a test controls the order in which two
// overlapping "decode the audio clips" calls finish.
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// Builds a fake editor and exposes `seek(seconds)`, which fires the same
// callback the real PlaybackManager fires when the playhead jumps.
function buildHarness() {
  let seekListener: (time: number) => void = () => {};
  const editor = {
    playback: {
      getVolume: () => 1,
      getIsPlaying: () => true,
      getIsScrubbing: () => false,
      getCurrentTime: () => 0,
      subscribe: () => () => {},
      onSeek: (listener: (time: number) => void) => {
        seekListener = listener;
        return () => {};
      },
    },
    timeline: { subscribe: () => () => {}, getTotalDuration: () => 10 },
    media: { subscribe: () => () => {}, getAssets: () => [] },
    scenes: { getActiveScene: () => ({ tracks: {} }) },
  };
  const manager = new AudioManager(editor as unknown as EditorCore);
  return {
    manager,
    // The playback manager reports seek times in ticks, not seconds.
    seek: (seconds: number) => seekListener(seconds * TICKS_PER_SECOND),
  };
}

// Reads a private field so the test can see which seek position "won".
function startTimeOf(manager: AudioManager): number {
  return (manager as unknown as { playbackStartTime: number })
    .playbackStartTime;
}

describe("AudioManager overlapping startPlayback calls", () => {
  beforeEach(() => {
    // Fake timers let us count the schedule intervals the manager creates.
    vi.useFakeTimers();
    collectMock.mockReset();
    fakeContext.state = "running";
    fakeContext.resume.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("two overlapping starts leave exactly one schedule interval, and dispose clears it", async () => {
    const first = deferred<unknown[]>();
    const second = deferred<unknown[]>();
    collectMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { manager, seek } = buildHarness();

    // The user seeks twice while the first decode is still running.
    seek(1);
    seek(2);
    expect(collectMock).toHaveBeenCalledTimes(2);

    // Both decodes finish; let the manager's continuations run.
    first.resolve([]);
    second.resolve([]);
    await vi.advanceTimersByTimeAsync(0);

    // Only the newest start may own a schedule interval. (Old code created
    // one per call, so this was 2.)
    expect(vi.getTimerCount()).toBe(1);

    // dispose() clears the one interval it knows about; nothing may be left
    // ticking afterwards. (Old code leaked the first interval forever.)
    manager.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("an older start that finishes LAST does not overwrite the newest seek position", async () => {
    const first = deferred<unknown[]>();
    const second = deferred<unknown[]>();
    collectMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { manager, seek } = buildHarness();

    seek(1); // older request, slow decode
    seek(2); // newer request, fast decode

    // Newer one finishes first and sets the position to 2 s...
    second.resolve([]);
    await vi.advanceTimersByTimeAsync(0);
    expect(startTimeOf(manager)).toBe(2);

    // ...then the stale older one finishes. It must be ignored.
    first.resolve([]);
    await vi.advanceTimersByTimeAsync(0);
    expect(startTimeOf(manager)).toBe(2);

    manager.dispose();
  });

  it("a start superseded while the audio context resumes does not go on to decode", async () => {
    // The browser starts contexts suspended until a user gesture; resume()
    // is then an await point. Both calls wait on the same resume promise.
    fakeContext.state = "suspended";
    const resumed = deferred<void>();
    fakeContext.resume.mockReturnValue(resumed.promise);
    collectMock.mockResolvedValue([]);
    const { manager, seek } = buildHarness();

    seek(1);
    seek(2);
    resumed.resolve();
    await vi.advanceTimersByTimeAsync(0);

    // Only the newer start continues to the (expensive) clip decode.
    // (Old code decoded once per call, so this was 2.)
    expect(collectMock).toHaveBeenCalledTimes(1);
    expect(startTimeOf(manager)).toBe(2);

    manager.dispose();
  });

  it("a single start still schedules one interval at the requested position", async () => {
    collectMock.mockResolvedValue([]);
    const { manager, seek } = buildHarness();

    seek(3);
    await vi.advanceTimersByTimeAsync(0);

    expect(startTimeOf(manager)).toBe(3);
    expect(vi.getTimerCount()).toBe(1);

    manager.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});

// getAudioSink is private, so call it through a cast in these tests.
type SinkCaller = {
  getAudioSink: (args: { clip: unknown }) => Promise<unknown>;
};

describe("AudioManager.getAudioSink Input leaks", () => {
  beforeEach(() => {
    // Forget Inputs created by earlier tests.
    mediabunny.inputs.length = 0;
  });

  it("two concurrent calls for the same source share one sink and dispose the duplicate Input", async () => {
    // Each new Input waits on its own hand-settled track promise.
    const trackA = deferred<object>();
    const trackB = deferred<object>();
    const queue = [trackA.promise, trackB.promise];
    mediabunny.trackFactory = () => queue.shift() as Promise<unknown>;
    const { manager } = buildHarness();

    // Two split clips of one file share a sourceKey and start together.
    const clip = { sourceKey: "src-1", file: new Blob() };
    const caller = manager as unknown as SinkCaller;
    const first = caller.getAudioSink({ clip });
    const second = caller.getAudioSink({ clip });
    trackA.resolve({});
    trackB.resolve({});
    const [sinkA, sinkB] = await Promise.all([first, second]);

    // Both callers get the SAME sink. (Old code returned two sinks.)
    expect(sinkA).toBe(sinkB);

    // After dispose() every Input must be closed. (Old code overwrote the
    // first Input in the map, so it was never disposed.)
    manager.dispose();
    expect(mediabunny.inputs).toHaveLength(2);
    expect(mediabunny.inputs.every((input) => input.disposed)).toBe(true);
  });

  it("disposes the Input when opening the audio track throws", async () => {
    mediabunny.trackFactory = () => Promise.reject(new Error("corrupt file"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { manager } = buildHarness();

    const result = await (manager as unknown as SinkCaller).getAudioSink({
      clip: { sourceKey: "src-2", file: new Blob() },
    });

    // The failure yields no sink, and the half-opened Input is released.
    expect(result).toBeNull();
    expect(mediabunny.inputs).toHaveLength(1);
    expect(mediabunny.inputs[0].disposed).toBe(true);

    warn.mockRestore();
    manager.dispose();
  });
});
