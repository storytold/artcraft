import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

const { getMedia, getPrompt } = vi.hoisted(() => ({
  getMedia: vi.fn(),
  getPrompt: vi.fn(),
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

// jsdom lacks IntersectionObserver/matchMedia that embla needs; the carousel is
// irrelevant here, so stub the hook.
vi.mock("embla-carousel-react", () => ({
  default: () => [() => undefined, undefined],
}));

// The reference tile is wrapped in a hover tooltip; render children only.
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@storyteller/common", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getContextImageThumbnail: () => ({ thumbnail: "thumb.png", fullSize: "full.png" }),
  };
});

import { LightboxModal } from "./lightbox-modal";

type FakeAudio = {
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  volume: number;
  onended: (() => void) | null;
};

describe("LightboxModal reference audio", () => {
  let audios: FakeAudio[];

  beforeEach(() => {
    audios = [];
    // jsdom has no matchMedia, which the embla carousel reads on init.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
    // Minimal Audio stand-in that records every instance created.
    vi.stubGlobal(
      "Audio",
      class {
        pause = vi.fn();
        play = vi.fn().mockResolvedValue(undefined);
        volume = 1;
        onended: (() => void) | null = null;
        constructor() {
          audios.push(this as unknown as FakeAudio);
        }
      },
    );
    getMedia.mockResolvedValue({ success: true, data: { maybe_prompt_token: "p1" } });
    getPrompt.mockResolvedValue({
      success: true,
      data: {
        maybe_positive_prompt: "hello",
        maybe_context_images: [
          {
            semantic: "audioref",
            media_token: "a1",
            media_links: { cdn_url: "https://cdn/a1.mp3" },
          },
        ],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const renderOpen = (isOpen: boolean) => (
    <LightboxModal
      isOpen={isOpen}
      onClose={() => undefined}
      onCloseGallery={() => undefined}
      mediaId="m1"
      imageUrl="https://cdn/img.png"
      mediaClass="image"
    />
  );

  const startAudio = async () => {
    const view = render(renderOpen(true));
    const tile = await waitFor(
      () => {
        const el = document.querySelector(".aspect-square.cursor-pointer");
        expect(el).toBeTruthy();
        return el as Element;
      },
      { timeout: 3000 },
    );
    fireEvent.click(tile);
    expect(audios).toHaveLength(1);
    return view;
  };

  it("pauses a playing reference clip when the lightbox closes", async () => {
    const view = await startAudio();
    view.rerender(renderOpen(false));
    expect(audios[0].pause).toHaveBeenCalled();
  });

  it("pauses a playing reference clip when the lightbox unmounts", async () => {
    const view = await startAudio();
    view.unmount();
    expect(audios[0].pause).toHaveBeenCalled();
  });

  it("pauses a playing reference clip when the lightbox moves to another media", async () => {
    const view = await startAudio();
    // Arrow keys / next-prev buttons change mediaId while the lightbox stays open; the audio rows
    // disappear with the old prompt data, so nothing on screen could stop the clip any more.
    view.rerender(
      <LightboxModal
        isOpen={true}
        onClose={() => undefined}
        onCloseGallery={() => undefined}
        mediaId="m2"
        imageUrl="https://cdn/img2.png"
        mediaClass="image"
      />,
    );
    expect(audios[0].pause).toHaveBeenCalled();
  });

  it("resets the play state when play() is rejected", async () => {
    getPrompt.mockResolvedValue({
      success: true,
      data: {
        maybe_context_images: [
          { semantic: "audioref", media_token: "a1", media_links: { cdn_url: "x" } },
        ],
      },
    });
    vi.stubGlobal(
      "Audio",
      class {
        pause = vi.fn();
        play = vi.fn().mockRejectedValue(new Error("blocked"));
        volume = 1;
        onended: (() => void) | null = null;
        constructor() {
          audios.push(this as unknown as FakeAudio);
        }
      },
    );
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    await startAudio();
    await act(async () => {
      await Promise.resolve();
    });
    process.off("unhandledRejection", unhandled);
    expect(audios[0].play).toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });
});
