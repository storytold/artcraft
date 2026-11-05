import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));

import { AudioReferenceRow } from "./AudioReferenceRow";
import type { RefAudio } from "../promptStore";

// A stand-in for `new Audio(url)` that remembers every clip it was asked to make.
let clips: FakeAudio[];
class FakeAudio {
  onended: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor(public src: string) {
    clips.push(this);
  }
}

beforeEach(() => {
  clips = [];
  vi.stubGlobal("Audio", FakeAudio);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const audioRef = (): RefAudio => ({
  id: "a1",
  url: "blob:audio",
  file: new File(["x"], "a.mp3", { type: "audio/mpeg" }),
  mediaToken: "tok",
  duration: 3,
});

const props = (referenceAudios: RefAudio[]) => ({
  referenceAudios,
  onReferenceAudiosChange: vi.fn(),
  maxAudioCount: 2,
  maxAudioRefDuration: 15,
});

const clickPlay = async (getByLabelText: (t: string) => HTMLElement) => {
  await act(async () => {
    fireEvent.click(getByLabelText("Play"));
  });
};

describe("AudioReferenceRow clip playback", () => {
  it("plays the clip and pauses it again on a second click", async () => {
    const { getByLabelText } = render(
      <AudioReferenceRow {...props([audioRef()])} />,
    );
    await clickPlay(getByLabelText);
    expect(clips).toHaveLength(1);
    expect(clips[0]!.play).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(getByLabelText("Stop"));
    });
    expect(clips[0]!.pause).toHaveBeenCalledTimes(1);
  });

  it("stops a playing clip when its audio reference is removed", async () => {
    const { getByLabelText, rerender } = render(
      <AudioReferenceRow {...props([audioRef()])} />,
    );
    await clickPlay(getByLabelText);
    // The parent drops the reference, which unmounts the tile (and its
    // play/stop button) while the clip is still sounding.
    rerender(<AudioReferenceRow {...props([])} />);
    expect(clips[0]!.pause).toHaveBeenCalled();
  });

  it("stops a playing clip when the whole row goes away", async () => {
    const { getByLabelText, unmount } = render(
      <AudioReferenceRow {...props([audioRef()])} />,
    );
    await clickPlay(getByLabelText);
    unmount();
    expect(clips[0]!.pause).toHaveBeenCalled();
  });
});
