import type { SoundsAdapter } from "../sounds";

// Empty default for SoundsAdapter. Every call resolves with a shape-
// correct empty result so the lib runs end-to-end with the sounds
// gallery visible but empty. Hosts (Artcraft) replace this with an
// adapter that calls into their real search / saved-sounds backend.

export const emptySoundsAdapter: SoundsAdapter = {
  async searchSounds() {
    return { results: [], hasNextPage: false, totalCount: 0 };
  },
  async getTopSounds() {
    return [];
  },
  async loadSavedSounds() {
    return [];
  },
  async saveSound() {
    // no-op
  },
  async unsaveSound() {
    // no-op
  },
  async clearSavedSounds() {
    // no-op
  },
  async resolveAudioUrl() {
    return "";
  },
};
