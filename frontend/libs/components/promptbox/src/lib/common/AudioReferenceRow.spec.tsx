import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioReferenceRow } from "./AudioReferenceRow";
import type { RefAudio } from "../promptStore";

const TRACK: RefAudio = {
  id: "track", url: "https://example.com/track.mp3", file: new File([], "track.mp3"),
  mediaToken: "track-token", duration: 10,
};

let root: Root;
let container: HTMLDivElement;
let players: HTMLAudioElement[];
let pendingPlay: Array<{ resolve: () => void; reject: (error: Error) => void }>;

describe("audio reference playback lifetime", () => {
  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    players = [];
    pendingPlay = [];
    const NativeAudio = window.Audio;
    vi.stubGlobal("Audio", function (src: string) {
      const element = new NativeAudio(src);
      players.push(element);
      return element;
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
      new Promise<void>((resolve, reject) => pendingPlay.push({ resolve, reject })),
    );
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<Harness />));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("pauses an audible track when its reference is removed", async () => {
    await click("Play");
    await act(async () => pendingPlay[0].resolve());
    await click("Remove audio");
    expect(players[0].pause).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[aria-label="Stop"]')).toBeNull();
  });

  it("pauses playback when the prompt reference row unmounts", async () => {
    await click("Play");
    await act(async () => pendingPlay[0].resolve());
    await act(async () => root.render(null));
    expect(players[0].pause).toHaveBeenCalledTimes(1);
  });

  it("does not let an old rejected play request stop a newer track", async () => {
    await click("Play");
    await click("Stop");
    await click("Play");
    await act(async () => pendingPlay[1].resolve());
    await act(async () => pendingPlay[0].reject(new Error("The old playback was interrupted")));
    expect(container.querySelector('[aria-label="Stop"]')).not.toBeNull();
    expect(players).toHaveLength(2);
  });

  it("resets the play control after the current track ends", async () => {
    await click("Play");
    await act(async () => pendingPlay[0].resolve());
    await act(async () => players[0].dispatchEvent(new Event("ended")));
    expect(container.querySelector('[aria-label="Play"]')).not.toBeNull();
  });

  it("stops the previous source when the same reference receives a new URL", async () => {
    await click("Play");
    await act(async () => pendingPlay[0].resolve());
    await click("Replace audio source");
    expect(players[0].pause).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[aria-label="Play"]')).not.toBeNull();
    await click("Play");
    expect(players[1].src).toBe("https://example.com/replacement.mp3");
  });

  it("returns to the play control when the current playback rejects", async () => {
    await click("Play");
    await act(async () => pendingPlay[0].reject(new Error("Playback unavailable")));
    expect(container.querySelector('[aria-label="Play"]')).not.toBeNull();
  });

  it("allows a normal stop followed by another playback", async () => {
    await click("Play");
    await act(async () => pendingPlay[0].resolve());
    await click("Stop");
    expect(players[0].pause).toHaveBeenCalledTimes(1);
    await click("Play");
    await act(async () => pendingPlay[1].resolve());
    expect(container.querySelector('[aria-label="Stop"]')).not.toBeNull();
  });
});

function Harness() {
  const [tracks, setTracks] = useState([TRACK]);
  return <><AudioReferenceRow referenceAudios={tracks} onReferenceAudiosChange={setTracks}
    maxAudioCount={2} maxAudioRefDuration={600} />
    <button aria-label="Replace audio source" onClick={() => setTracks([{ ...TRACK, url: "https://example.com/replacement.mp3" }])} />
  </>;
}

async function click(label: string) {
  const button = container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  if (!button) throw new Error(`Missing ${label} control`);
  await act(async () => button.click());
}
