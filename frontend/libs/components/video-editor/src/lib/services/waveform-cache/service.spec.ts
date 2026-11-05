import { afterEach, describe, expect, it, vi } from "vitest";

// Hoisted so the mock factories below can reference them. `buildSummaryMock`
// stands in for the real (heavy) waveform builder so each test decides when
// and how every "decode" finishes.
const { buildSummaryMock } = vi.hoisted(() => ({
  buildSummaryMock: vi.fn(),
}));

// The service imports createAudioContext from media/audio. We never reach the
// code path that calls it (we pass an audioBuffer), so a stub is enough.
vi.mock("../../media/audio", () => ({
  createAudioContext: vi.fn(),
}));

// Replace the real summary builder with our controllable mock.
vi.mock("../../media/waveform-summary", () => ({
  buildSourceWaveformSummary: buildSummaryMock,
}));

import { WaveformCache } from "./service";

// A "deferred" is a promise we can settle by hand, so the test controls
// exactly when a decode succeeds or fails.
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("WaveformCache stale failure", () => {
  afterEach(() => {
    // Wipe call history and queued return values between tests.
    buildSummaryMock.mockReset();
  });

  it("an old failed decode does not evict a newer cache entry for the same key", async () => {
    const cache = new WaveformCache();
    const fakeBuffer = {} as AudioBuffer;

    // Two decodes for the same source key: the first will FAIL, the second
    // is the retry the user triggered after clearing the cache.
    const firstDecode = deferred<unknown>();
    const secondDecode = deferred<unknown>();
    buildSummaryMock
      .mockReturnValueOnce(firstDecode.promise)
      .mockReturnValueOnce(secondDecode.promise);

    // 1) First request starts decoding.
    const firstRequest = cache.getSourceSummary({
      sourceKey: "clip-a",
      audioBuffer: fakeBuffer,
    });
    // Attach a catch now so the later rejection is never "unhandled".
    const firstOutcome = firstRequest.then(
      () => "resolved",
      () => "rejected",
    );

    // 2) The source is cleared (e.g. the asset was re-imported), then asked
    //    for again. This stores a NEW promise under the same key.
    cache.clearSource({ sourceKey: "clip-a" });
    const secondRequest = cache.getSourceSummary({
      sourceKey: "clip-a",
      audioBuffer: fakeBuffer,
    });

    // 3) The OLD decode now fails. Wait for its rejection to be processed.
    firstDecode.reject(new Error("decode failed"));
    expect(await firstOutcome).toBe("rejected");

    // 4) A third caller must still receive the in-flight second promise,
    //    not trigger a third decode.
    const thirdRequest = cache.getSourceSummary({
      sourceKey: "clip-a",
      audioBuffer: fakeBuffer,
    });

    expect(thirdRequest).toBe(secondRequest);
    // Only two decodes ever started (first + second); old code started three.
    expect(buildSummaryMock).toHaveBeenCalledTimes(2);

    // Let the second decode finish so no promise is left dangling.
    secondDecode.resolve({ ok: true });
    await secondRequest;
  });

  it("still evicts its own failed entry so the next call retries", async () => {
    const cache = new WaveformCache();
    const fakeBuffer = {} as AudioBuffer;

    // First decode fails, second (the retry) is never settled here.
    const firstDecode = deferred<unknown>();
    buildSummaryMock
      .mockReturnValueOnce(firstDecode.promise)
      .mockReturnValueOnce(new Promise(() => {}));

    const firstRequest = cache.getSourceSummary({
      sourceKey: "clip-b",
      audioBuffer: fakeBuffer,
    });
    const firstOutcome = firstRequest.then(
      () => "resolved",
      () => "rejected",
    );

    // The only decode fails with no newer entry in between.
    firstDecode.reject(new Error("decode failed"));
    expect(await firstOutcome).toBe("rejected");

    // The failed entry was evicted, so asking again starts a fresh decode.
    cache.getSourceSummary({ sourceKey: "clip-b", audioBuffer: fakeBuffer });
    expect(buildSummaryMock).toHaveBeenCalledTimes(2);
  });
});
