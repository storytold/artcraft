import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// Shared handles for the wavesurfer / IntersectionObserver fakes.
const h = vi.hoisted(() => ({
  create: vi.fn(),
  waves: [] as { handlers: Record<string, () => void> }[],
  observers: [] as { cb: (entries: { isIntersecting: boolean }[]) => void }[],
}));

vi.mock("wavesurfer.js", () => ({ default: { create: h.create } }));
vi.mock("lucide-react", () => ({
  PauseIcon: () => null,
  PlayIcon: () => null,
  Volume2Icon: () => null,
  VolumeXIcon: () => null,
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/common", () => ({ addCorsParam: (s: string) => s }));
// The slider stub sets the volume to 30 when clicked.
vi.mock("@storyteller/ui-sliderv2", () => ({
  SliderV2: ({ onChange }: { onChange: (v: number) => void }) => (
    <button data-testid="slider" onClick={() => onChange(30)} />
  ),
}));

import { WaveformAudioPlayer } from "./WaveformAudioPlayer";
import { resetAudioPlaybackControllerForTests } from "./audio-playback-controller";

// Minimal <audio> stand-in. Like a browser, "pause" is dispatched ASYNCHRONOUSLY,
// i.e. after the component's cleanup has already removed its listeners.
class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  preload = "";
  src = "";
  volume = 1;
  currentTime = 0;
  duration = NaN;
  paused = true;
  constructor() {
    super();
    FakeAudio.instances.push(this);
  }
  play() {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    queueMicrotask(() => this.dispatchEvent(new Event("pause")));
  }
  load() {}
  removeAttribute() {}
}

describe("WaveformAudioPlayer when src changes", () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    h.waves.length = 0;
    h.observers.length = 0;
    h.create.mockReset();
    h.create.mockImplementation(() => {
      const handlers: Record<string, () => void> = {};
      h.waves.push({ handlers });
      return {
        on: (event: string, cb: () => void) => {
          handlers[event] = cb;
        },
        destroy: vi.fn(),
        exportPeaks: () => [[0]],
      };
    });
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          h.observers.push({ cb });
        }
        observe() {}
        disconnect() {}
      },
    );
    resetAudioPlaybackControllerForTests();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("resets the play button, time and duration for the new track", () => {
    const { getByLabelText, container, rerender } = render(
      <WaveformAudioPlayer src="https://x/a.mp3" durationMillis={5000} />,
    );
    fireEvent.click(getByLabelText("Play"));
    const first = FakeAudio.instances[0];
    act(() => {
      first.currentTime = 3;
      first.dispatchEvent(new Event("timeupdate"));
    });
    expect(getByLabelText("Pause")).toBeTruthy();
    expect(container.textContent).toContain("0:03 / 0:05");

    rerender(
      <WaveformAudioPlayer src="https://x/b.mp3" durationMillis={7000} />,
    );
    // Before the fix: still "Pause" with the old 0:03 position.
    expect(getByLabelText("Play")).toBeTruthy();
    expect(container.textContent).toContain("0:00 / 0:07");
  });

  it("applies the slider volume to the new audio element", () => {
    const { getByLabelText, getByTestId, rerender } = render(
      <WaveformAudioPlayer src="https://x/a.mp3" />,
    );
    fireEvent.click(getByLabelText("Volume"));
    fireEvent.click(getByTestId("slider"));
    expect(FakeAudio.instances[0].volume).toBeCloseTo(0.3);

    rerender(<WaveformAudioPlayer src="https://x/b.mp3" />);
    const next = FakeAudio.instances[FakeAudio.instances.length - 1];
    expect(next).not.toBe(FakeAudio.instances[0]);
    // Before the fix a fresh element played at 1.0 while the slider showed 30.
    expect(next.volume).toBeCloseTo(0.3);
  });

  it("retries the waveform for a new src after the previous one failed", () => {
    const { rerender } = render(<WaveformAudioPlayer src="https://x/a.mp3" />);
    // Scroll into view -> wavesurfer is created for track A.
    act(() => h.observers[h.observers.length - 1].cb([{ isIntersecting: true }]));
    expect(h.create).toHaveBeenCalledTimes(1);

    // Decode fails (e.g. CORS) -> component falls back to the plain bar.
    act(() => h.waves[0].handlers["error"]());

    rerender(<WaveformAudioPlayer src="https://x/b.mp3" />);
    act(() => h.observers[h.observers.length - 1].cb([{ isIntersecting: true }]));
    // Before the fix the sticky "failed" state unmounted the wave container,
    // so no waveform was ever built for track B.
    expect(h.create).toHaveBeenCalledTimes(2);
  });
});
