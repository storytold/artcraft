import { create } from "zustand";
import { persist } from "zustand/middleware";

// Audio behavior for lightbox videos: whether they open with sound (off by
// default, toggled in the settings modal's General tab) and the last volume
// the user picked, so each video doesn't reset to 100%.

interface LightboxSoundStore {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  // 0..1, mirrors HTMLMediaElement.volume.
  volume: number;
  setVolume: (volume: number) => void;
}

export const useLightboxSoundStore = create<LightboxSoundStore>()(
  persist(
    (set) => ({
      soundEnabled: false,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      volume: 1,
      setVolume: (volume) => set({ volume }),
    }),
    { name: "artcraft-lightbox-sound" },
  ),
);
