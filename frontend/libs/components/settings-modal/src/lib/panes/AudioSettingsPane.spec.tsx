import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioSettingsPane } from "./AudioSettingsPane";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  preview: vi.fn(),
}));

vi.mock("@storyteller/tauri-api", () => ({
  GetAppPreferences: mocks.get,
  UpdateAppPreferences: mocks.update,
  PreferenceName: {
    PlaySounds: "play_sounds",
    DeleteFileSound: "delete_file_sound",
    EnqueueSuccessSound: "enqueue_success_sound",
    EnqueueFailureSound: "enqueue_failure_sound",
    GenerationSuccessSound: "generation_success_sound",
    GenerationFailureSound: "generation_failure_sound",
  },
}));
vi.mock("@storyteller/soundboard", () => ({
  SoundManager: {
    OPTIONS: [
      { label: "None", value: "none" },
      { label: "Chime", value: "chime" },
    ],
    playPreview: mocks.preview,
  },
}));

// The five sound pickers, in the order they appear on the pane.
const PICKERS = [
  "Delete File Sound",
  "Enqueue Success Sound",
  "Enqueue Failure Sound",
  "Generation Success Sound",
  "Generation Failure Sound",
];

// The dropdown buttons of the five pickers (the play buttons next to them are not listboxes).
const pickerButtons = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="listbox"]'));

beforeEach(() => {
  mocks.get.mockReset();
  mocks.update.mockReset();
  mocks.preview.mockReset();
  mocks.get.mockResolvedValue({ preferences: { play_sounds: true } });
  mocks.update.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe("AudioSettingsPane labels", () => {
  it.each(PICKERS.map((label, index) => [label, index] as const))(
    "clicking the label %s opens that picker and no other",
    async (label, index) => {
      render(<AudioSettingsPane />);
      await act(async () => {});
      expect(pickerButtons()).toHaveLength(5);

      fireEvent.click(screen.getByText(label));

      const expanded = pickerButtons().map((b) => b.getAttribute("aria-expanded") === "true");
      expect(expanded).toEqual(PICKERS.map((_, i) => i === index));
    },
  );

  it("gives every picker its own id", async () => {
    render(<AudioSettingsPane />);
    await act(async () => {});

    const ids = pickerButtons().map((b) => b.id);
    expect(new Set(ids).size).toBe(5);
  });
});
