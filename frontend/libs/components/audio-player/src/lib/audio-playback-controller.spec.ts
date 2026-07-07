import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  notifyAudioStopped,
  registerAudioPlayer,
  requestAudioPlayback,
  resetAudioPlaybackControllerForTests,
  unregisterAudioPlayer,
} from "./audio-playback-controller";

describe("audio-playback-controller", () => {
  beforeEach(() => {
    resetAudioPlaybackControllerForTests();
  });

  it("pauses the previously playing player when another starts", () => {
    const pauseA = vi.fn();
    const pauseB = vi.fn();
    registerAudioPlayer("a", pauseA);
    registerAudioPlayer("b", pauseB);

    requestAudioPlayback("a");
    expect(pauseA).not.toHaveBeenCalled();

    requestAudioPlayback("b");
    expect(pauseA).toHaveBeenCalledTimes(1);
    expect(pauseB).not.toHaveBeenCalled();
  });

  it("does not pause a player that re-requests playback (seek/resume)", () => {
    const pauseA = vi.fn();
    registerAudioPlayer("a", pauseA);

    requestAudioPlayback("a");
    requestAudioPlayback("a");
    expect(pauseA).not.toHaveBeenCalled();
  });

  it("clears the current player when it stops on its own", () => {
    const pauseA = vi.fn();
    registerAudioPlayer("a", pauseA);

    requestAudioPlayback("a");
    notifyAudioStopped("a");

    // A new player starting should not pause the already-stopped one.
    const pauseB = vi.fn();
    registerAudioPlayer("b", pauseB);
    requestAudioPlayback("b");
    expect(pauseA).not.toHaveBeenCalled();
  });

  it("unregistering the current player forgets it", () => {
    const pauseA = vi.fn();
    registerAudioPlayer("a", pauseA);
    requestAudioPlayback("a");

    unregisterAudioPlayer("a");
    requestAudioPlayback("b");
    expect(pauseA).not.toHaveBeenCalled();
  });
});
