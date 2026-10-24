import { useCallback, useEffect, useRef, useState } from "react";
import type { SoundEffect } from "./types";

// Plays one short preview clip at a time for the sounds lists (Sound effects and
// Saved share it). It owns the <audio> element so that:
//   - leaving the list (switching tabs, closing the panel) stops the clip;
//   - an event from a clip that has already been replaced or stopped is ignored.
//     Pausing a clip whose play() is still pending makes the browser reject that
//     play() with an AbortError, and the old handlers answered by clearing
//     `playingId`, which by then belonged to the newer clip.
export function useSoundPreview() {
  // Id of the sound whose button should show "pause", or null.
  const [playingId, setPlayingId] = useState<number | null>(null);
  // The clip that is current, with the sound it belongs to. A ref, not state:
  // the handlers below must compare against the latest value, not a render's.
  const currentRef = useRef<{ audio: HTMLAudioElement; id: number } | null>(null);

  // Forget the current clip first, then pause it, so the rejection that the
  // pause can cause (see above) already finds it replaced and is ignored.
  const stopCurrent = useCallback(() => {
    const current = currentRef.current;
    currentRef.current = null;
    current?.audio.pause();
  }, []);

  // Unmount: stop the clip so it does not keep playing with no way to pause it.
  useEffect(() => stopCurrent, [stopCurrent]);

  const togglePreview = useCallback(
    ({ sound }: { sound: SoundEffect }) => {
      const wasThisSound = currentRef.current?.id === sound.id;
      stopCurrent();
      // Same sound again = stop. A sound with no preview has nothing to play,
      // but the clip that was playing is already paused, so clear its marker.
      if (wasThisSound || !sound.previewUrl) {
        setPlayingId(null);
        return;
      }

      const audio = new Audio(sound.previewUrl);
      // Only the current clip may clear the marker; a late event from a clip
      // that was replaced or stopped must not touch the newer one's state.
      const finish = () => {
        if (currentRef.current?.audio !== audio) return;
        currentRef.current = null;
        setPlayingId(null);
      };
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      audio.play().catch((error) => {
        if (currentRef.current?.audio !== audio) return;
        console.error("Failed to play sound preview:", error);
        finish();
      });

      currentRef.current = { audio, id: sound.id };
      setPlayingId(sound.id);
    },
    [stopCurrent],
  );

  return { playingId, togglePreview };
}
