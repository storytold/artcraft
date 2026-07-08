// Global playback coordinator: ensures only one audio player is audible at a
// time. Players register a pause callback; when one starts playing it calls
// requestAudioPlayback, which pauses whichever player was playing before it.

type PauseFn = () => void;

let currentId: string | null = null;
const players = new Map<string, PauseFn>();

export function registerAudioPlayer(id: string, pause: PauseFn): void {
  players.set(id, pause);
}

export function unregisterAudioPlayer(id: string): void {
  players.delete(id);
  if (currentId === id) {
    currentId = null;
  }
}

/** Call when a player starts playing. Pauses the previously playing player. */
export function requestAudioPlayback(id: string): void {
  if (currentId && currentId !== id) {
    players.get(currentId)?.();
  }
  currentId = id;
}

/** Call when a player stops on its own (pause/finish/unmount). */
export function notifyAudioStopped(id: string): void {
  if (currentId === id) {
    currentId = null;
  }
}

/** Test helper: reset module state between test cases. */
export function resetAudioPlaybackControllerForTests(): void {
  currentId = null;
  players.clear();
}
