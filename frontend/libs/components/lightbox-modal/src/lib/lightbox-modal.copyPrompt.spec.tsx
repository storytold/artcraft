import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// The Copy button next to the prompt must only say "copied" when the clipboard write worked; the Share
// button in the same file already does this (it shows an error toast when the write fails).

const { getMedia, getPrompt, toastSuccess, toastError } = vi.hoisted(() => ({
  getMedia: vi.fn(),
  getPrompt: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@storyteller/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    MediaFilesApi: class {
      GetMediaFileByToken = getMedia;
      GetMediaFilesByBatchToken = vi.fn();
    },
    PromptsApi: class {
      GetPromptsByToken = getPrompt;
    },
  };
});

// The toast the viewer shows.
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

// jsdom lacks IntersectionObserver/matchMedia that embla needs; the carousel is irrelevant here.
vi.mock("embla-carousel-react", () => ({
  default: () => [() => undefined, undefined],
}));

vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { LightboxModal } from "./lightbox-modal";

describe("LightboxModal prompt Copy button", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
    getMedia.mockResolvedValue({ success: true, data: { maybe_prompt_token: "p1" } });
    getPrompt.mockResolvedValue({
      success: true,
      data: { maybe_positive_prompt: "a red fox", maybe_context_images: [] },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("confirms the copy when the clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    await clickCopy();
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Prompt copied"));
    expect(writeText).toHaveBeenCalledWith("a red fox");
    expect(screen.getByText("Copied!")).toBeTruthy();
  });

  it("does not claim success when the clipboard write is rejected", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    await clickCopy();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  const clickCopy = async () => {
    render(
      <LightboxModal
        isOpen={true}
        onClose={() => undefined}
        onCloseGallery={() => undefined}
        mediaId="m1"
        imageUrl="https://cdn/img.png"
        mediaClass="image"
      />,
    );
    const button = await screen.findByText("Copy", {}, { timeout: 3000 });
    fireEvent.click(button);
  };
});
