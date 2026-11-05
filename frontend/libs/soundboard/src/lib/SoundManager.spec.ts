import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ prefs: vi.fn(), play: vi.fn() }));

vi.mock("@storyteller/tauri-api", () => ({ GetAppPreferences: m.prefs }));
vi.mock("./SoundEffect", () => ({ SoundEffect: class {} }));
vi.mock("./SoundRegistry", () => ({
  SoundRegistry: { getInstance: () => ({ playSound: m.play, setSoundOnce: vi.fn() }) },
}));

import { SoundManager } from "./SoundManager";

beforeEach(() => {
  m.prefs.mockReset();
  m.play.mockReset();
});

describe("SoundManager event playback", () => {
  it("plays the configured sound when sounds are on", async () => {
    m.prefs.mockResolvedValue({
      preferences: { play_sounds: true, generation_success_sound: "correct" },
    });
    await SoundManager.playGenerationSuccess();
    expect(m.play).toHaveBeenCalledWith("correct");
  });

  it("stays silent when sounds are off or no sound is chosen", async () => {
    m.prefs.mockResolvedValue({ preferences: { play_sounds: false, delete_file_sound: "trash" } });
    await SoundManager.playFileDeleted();
    m.prefs.mockResolvedValue({ preferences: { play_sounds: true } });
    await SoundManager.playFileDeleted();
    expect(m.play).not.toHaveBeenCalled();
  });

  it("does not throw when the preferences lookup fails (callers still need to show a toast)", async () => {
    m.prefs.mockRejectedValue(new Error("tauri down"));
    await expect(SoundManager.playGenerationFailure()).resolves.toBeUndefined();
    expect(m.play).not.toHaveBeenCalled();
  });
});
