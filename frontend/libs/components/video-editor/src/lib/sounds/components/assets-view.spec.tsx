import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// The sounds panel has two lists (Sound effects, Saved) that each play a short
// preview through an <audio> element. Two things used to go wrong:
//   1. Nothing paused the preview when the list went away (switching tabs, or
//      leaving the panel), so the clip kept playing with no button to stop it.
//   2. Starting a second preview pauses the first one. A browser rejects the
//      first one's still-pending play() with an AbortError, and the old catch
//      handler cleared the "playing" marker, which by then belonged to the
//      second preview: it kept playing but its button showed "play".

const m = vi.hoisted(() => ({
  getTopSounds: vi.fn(),
  loadSavedSounds: vi.fn(),
}));

// The store file pulls in the editor core, wasm and timeline builders.
vi.mock("../../core", () => ({
  EditorCore: {
    getInstance: () => ({
      adapters: {
        soundsAdapter: {
          getTopSounds: m.getTopSounds,
          loadSavedSounds: m.loadSavedSounds,
          searchSounds: vi.fn(),
        },
        toast: { error: vi.fn() },
      },
    }),
  },
}));
vi.mock("../../timeline/element-utils", () => ({ buildLibraryAudioElement: vi.fn() }));
vi.mock("../../wasm", () => ({ mediaTimeFromSeconds: vi.fn() }));

// Make the play/pause icon readable: jsdom would otherwise render two identical
// anonymous <svg> trees.
vi.mock("@hugeicons/react", async (importOriginal) => {
  const real = await importOriginal<typeof import("@hugeicons/react")>();
  const icons = await import("@hugeicons/core-free-icons");
  const React = await import("react");
  return {
    ...real,
    HugeiconsIcon: ({ icon }: { icon: unknown }) =>
      React.createElement("i", {
        "data-icon":
          icon === icons.PauseIcon ? "pause" : icon === icons.PlayIcon ? "play" : "other",
      }),
  };
});

import { useSoundsStore } from "../sounds-store";
import { SoundsView } from "./assets-view";

// A stand-in for HTMLAudioElement that behaves like a browser where it matters:
// play() stays pending until the test settles it, and pause() while it is
// pending rejects it with an AbortError.
class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  pause = vi.fn(() => {
    this.settle?.reject(new DOMException("The play() request was interrupted", "AbortError"));
    this.settle = null;
  });
  private settle: { resolve: () => void; reject: (e: unknown) => void } | null = null;
  private listeners = new Map<string, Array<() => void>>();

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
  addEventListener(type: string, fn: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }
  play() {
    return new Promise<void>((resolve, reject) => {
      this.settle = { resolve, reject };
    });
  }
  startedPlaying() {
    this.settle?.resolve();
    this.settle = null;
  }
  emit(type: string) {
    for (const fn of this.listeners.get(type) ?? []) fn();
  }
}

const sound = (id: number, name: string, previewUrl: string | null) =>
  ({
    id,
    name,
    description: "",
    url: "",
    previewUrl,
    downloadUrl: "",
    duration: 3,
    username: "someone",
    tags: [],
    license: "",
  }) as never;

const saved = (id: number, name: string) =>
  ({
    id,
    name,
    username: "someone",
    previewUrl: `https://cdn.test/${name}.mp3`,
    downloadUrl: "",
    duration: 3,
    tags: [],
    license: "",
    savedAt: "2026-10-01T00:00:00.000Z",
  }) as never;

const rowButton = (name: string) => screen.getByText(name).closest("button") as HTMLButtonElement;
const iconOf = (name: string) => rowButton(name).querySelector("i")?.getAttribute("data-icon");

// Radix tab triggers activate on mouse-down, not click.
function openTab(name: string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0 });
}

beforeEach(() => {
  FakeAudio.instances = [];
  vi.stubGlobal("Audio", FakeAudio);
  vi.spyOn(console, "error").mockImplementation(() => {});
  m.getTopSounds.mockReset().mockResolvedValue([]);
  m.loadSavedSounds.mockReset().mockResolvedValue([]);
  useSoundsStore.setState({
    topSoundEffects: [
      sound(1, "Rain", "https://cdn.test/rain.mp3"),
      sound(2, "Wind", "https://cdn.test/wind.mp3"),
      sound(3, "Silent", null),
    ],
    hasLoaded: true,
    searchQuery: "",
    savedSounds: [saved(11, "Thunder"), saved(12, "Birds")],
    isSavedSoundsLoaded: true,
    isLoadingSavedSounds: false,
    savedSoundsError: null,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sounds panel preview audio", () => {
  it("stops a Sound effects preview when the user switches to the Saved tab", async () => {
    render(<SoundsView />);
    fireEvent.click(rowButton("Rain"));
    await act(async () => FakeAudio.instances[0].startedPlaying());
    expect(iconOf("Rain")).toBe("pause");

    await act(async () => openTab("Saved"));

    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
  });

  it("stops a Saved preview when the user switches back to Sound effects", async () => {
    render(<SoundsView />);
    await act(async () => openTab("Saved"));
    fireEvent.click(rowButton("Thunder"));
    await act(async () => FakeAudio.instances[0].startedPlaying());
    expect(iconOf("Thunder")).toBe("pause");

    await act(async () => openTab("Sound effects"));

    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
  });

  it("stops the preview when the whole panel is removed", async () => {
    const { unmount } = render(<SoundsView />);
    fireEvent.click(rowButton("Wind"));
    await act(async () => FakeAudio.instances[0].startedPlaying());

    unmount();

    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
  });

  it.each([
    ["Sound effects", "Rain", "Wind", "Sound effects"],
    ["Saved", "Thunder", "Birds", "Saved"],
  ])(
    "keeps the newly started preview marked as playing in %s when the interrupted one rejects",
    async (_view, first, second, tab) => {
      render(<SoundsView />);
      if (tab === "Saved") await act(async () => openTab("Saved"));

      fireEvent.click(rowButton(first)); // play() still pending (clip is loading)
      fireEvent.click(rowButton(second)); // pauses the first -> its play() rejects
      await act(async () => FakeAudio.instances[1].startedPlaying());

      expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
      expect(iconOf(second)).toBe("pause");
      expect(iconOf(first)).toBe("play");
    },
  );

  it("ignores the end of a preview that was already replaced", async () => {
    render(<SoundsView />);
    fireEvent.click(rowButton("Rain"));
    await act(async () => FakeAudio.instances[0].startedPlaying());
    fireEvent.click(rowButton("Wind"));
    await act(async () => FakeAudio.instances[1].startedPlaying());

    await act(async () => FakeAudio.instances[0].emit("error")); // late event from the old clip

    expect(iconOf("Wind")).toBe("pause");
  });

  it("clears the playing marker when the clicked sound has no preview to play", async () => {
    render(<SoundsView />);
    fireEvent.click(rowButton("Rain"));
    await act(async () => FakeAudio.instances[0].startedPlaying());
    expect(iconOf("Rain")).toBe("pause");

    fireEvent.click(rowButton("Silent")); // nothing to play, but Rain is paused

    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();
    expect(iconOf("Rain")).toBe("play");
  });

  it("still toggles a preview off and on", async () => {
    render(<SoundsView />);
    fireEvent.click(rowButton("Rain"));
    await act(async () => FakeAudio.instances[0].startedPlaying());
    expect(iconOf("Rain")).toBe("pause");

    fireEvent.click(rowButton("Rain"));
    expect(iconOf("Rain")).toBe("play");
    expect(FakeAudio.instances[0].pause).toHaveBeenCalled();

    fireEvent.click(rowButton("Rain"));
    expect(FakeAudio.instances).toHaveLength(2);
    expect(iconOf("Rain")).toBe("pause");
  });

  it("returns the button to play when the clip finishes", async () => {
    render(<SoundsView />);
    fireEvent.click(rowButton("Rain"));
    await act(async () => FakeAudio.instances[0].startedPlaying());

    await act(async () => FakeAudio.instances[0].emit("ended"));

    expect(iconOf("Rain")).toBe("play");
  });
});
