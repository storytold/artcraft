import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMediaDuration } from "./processing";

// A stand-in for an <audio> element. jsdom does not implement media loading,
// so the test drives the same events a real browser would fire.
class FakeMediaElement extends EventTarget {
  duration = 0;
  src = "";
  // Duration the browser reports once it has been forced to scan to the end
  // of a stream whose header carries no length (Chrome MediaRecorder webm).
  realDurationAfterSeek: number | null = null;
  private _currentTime = 0;
  load() {}
  remove() {}
  get currentTime() {
    return this._currentTime;
  }
  set currentTime(value: number) {
    this._currentTime = value;
    if (this.realDurationAfterSeek !== null) {
      this.duration = this.realDurationAfterSeek;
      this.dispatchEvent(new Event("durationchange"));
    }
  }
}

let element: FakeMediaElement;

beforeEach(() => {
  element = new FakeMediaElement();
  vi.spyOn(document, "createElement").mockReturnValue(
    element as unknown as HTMLElement,
  );
  URL.createObjectURL = vi.fn(() => "blob:fake");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const audioFile = () => new File(["x"], "take.webm", { type: "audio/webm" });

describe("getMediaDuration", () => {
  it("returns the duration of a normal audio file", async () => {
    const promise = getMediaDuration({ file: audioFile() });
    element.duration = 12.5;
    element.dispatchEvent(new Event("loadedmetadata"));
    expect(await promise).toBe(12.5);
  });

  it("recovers the real length of a stream that reports Infinity", async () => {
    const promise = getMediaDuration({ file: audioFile() });
    element.duration = Infinity;
    element.realDurationAfterSeek = 7.25;
    element.dispatchEvent(new Event("loadedmetadata"));
    // Old code resolved Infinity, which mediaTimeFromSeconds later rejects
    // ("expected an integer tick count") when the clip is dropped on the timeline.
    expect(await promise).toBe(7.25);
  });

  it("reports an unknown length (undefined), never Infinity, when it cannot be recovered", async () => {
    vi.useFakeTimers();
    const promise = getMediaDuration({ file: audioFile() });
    element.duration = Infinity;
    element.dispatchEvent(new Event("loadedmetadata"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(await promise).toBeUndefined();
  });

  it("reports an unknown length for a NaN duration", async () => {
    const promise = getMediaDuration({ file: audioFile() });
    element.duration = NaN;
    element.dispatchEvent(new Event("loadedmetadata"));
    expect(await promise).toBeUndefined();
  });
});
