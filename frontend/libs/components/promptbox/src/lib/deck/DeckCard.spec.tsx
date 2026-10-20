import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

// The card only imports the modal for the preview dialog, which is not under test.
vi.mock("@storyteller/ui-modal", () => ({ Modal: () => null }));

import { DeckCard } from "./DeckCard";
import type { DeckItem } from "./deckTypes";

// A stand-in for `new Audio(url)` so a test can decide how play() ends.
let playImpl: () => Promise<void>;
class FakeAudio {
  volume = 1;
  onended: (() => void) | null = null;
  constructor(public src: string) {}
  play = vi.fn(() => playImpl());
  pause = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal("Audio", FakeAudio);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const audioItem: DeckItem = {
  id: "a1",
  kind: "audio",
  url: "blob:audio",
  name: "Audio 1",
  duration: 3,
};

// While "playing" the icon is the red stop square.
const showsStop = (container: HTMLElement) =>
  container.querySelector(".text-red-400") !== null;

describe("DeckCard audio playback", () => {
  it("shows the stop state while a clip is actually playing", async () => {
    playImpl = () => Promise.resolve();
    const { container } = render(<DeckCard item={audioItem} />);
    await act(async () => {
      fireEvent.click(container.firstElementChild as HTMLElement);
    });
    expect(showsStop(container)).toBe(true);
  });

  it("goes back to the play state when the browser refuses to play the clip", async () => {
    // e.g. a container the webview cannot decode: play() rejects with
    // NotSupportedError and `ended` never fires.
    playImpl = () =>
      Promise.reject(new DOMException("unsupported", "NotSupportedError"));
    const { container } = render(<DeckCard item={audioItem} />);
    await act(async () => {
      fireEvent.click(container.firstElementChild as HTMLElement);
    });
    await waitFor(() => expect(showsStop(container)).toBe(false));
  });

  it("lets a second click start the clip again after a refused play", async () => {
    let calls = 0;
    // First attempt is refused, the second one works.
    playImpl = () =>
      ++calls === 1
        ? Promise.reject(new DOMException("unsupported", "NotSupportedError"))
        : Promise.resolve();
    const { container } = render(<DeckCard item={audioItem} />);
    const card = container.firstElementChild as HTMLElement;
    await act(async () => {
      fireEvent.click(card);
    });
    await waitFor(() => expect(showsStop(container)).toBe(false));
    await act(async () => {
      fireEvent.click(card);
    });
    expect(showsStop(container)).toBe(true);
    expect(calls).toBe(2);
  });
});
