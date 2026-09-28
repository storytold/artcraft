import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoIcon } from "lucide-react";
import {
  getVideoThumbnailState,
  markVideoThumbnailFailed,
  resetVideoThumbnailsForTests,
} from "./pending-video-thumbnails";
import { GalleryThumbnail } from "./GalleryThumbnail";

vi.mock("@storyteller/icons", () => ({
  DynamicIcon: () => <span data-testid="fallback-icon" />,
}));
vi.mock("@storyteller/common", () => ({
  PLACEHOLDER_IMAGES: { DEFAULT: "placeholder.png" },
}));

const THUMB =
  "https://cdn-2.fakeyou.com/cdn-cgi/image/width=512,quality=95/media/a/b/storyteller_x.mp4-thumb.gif";

// Probes made by the checker; a test settles each one by hand.
let probes: FakeImage[] = [];

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";
  constructor() {
    probes.push(this);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("Image", FakeImage);
  probes = [];
  resetVideoThumbnailsForTests();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("checker", () => {
  it("re-checks a failed thumbnail and hands back the URL that loaded", () => {
    markVideoThumbnailFailed(THUMB);
    expect(getVideoThumbnailState(THUMB)).toEqual({ status: "pending" });

    vi.advanceTimersByTime(5_000);
    expect(probes).toHaveLength(1);
    expect(probes[0].src).toMatch(/^https:\/\/cdn-2\.fakeyou\.com\/.*\.mp4-thumb\.gif\?_r=\d+$/);

    probes[0].onload!();
    expect(getVideoThumbnailState(THUMB)).toEqual({ status: "ready", src: probes[0].src });
  });

  it("keeps checking past the old 20-retry limit, backing off", () => {
    markVideoThumbnailFailed(THUMB);
    failProbesFor(2 * 60_000);
    expect(probes).toHaveLength(24); // Every 5s for the first two minutes.

    failProbesFor(8 * 60_000);
    expect(probes).toHaveLength(24 + 32); // Then every 15s.
    expect(getVideoThumbnailState(THUMB)).toEqual({ status: "pending" });
  });

  it("gives up after an hour", () => {
    markVideoThumbnailFailed(THUMB);
    failProbesFor(60 * 60_000 + 60_000);
    expect(getVideoThumbnailState(THUMB)).toEqual({ status: "gave_up" });

    const probeCount = probes.length;
    vi.advanceTimersByTime(10 * 60_000);
    expect(probes).toHaveLength(probeCount);
  });

  it("probes a URL once however many cards mark it", () => {
    markVideoThumbnailFailed(THUMB);
    markVideoThumbnailFailed(THUMB);
    vi.advanceTimersByTime(5_000);
    markVideoThumbnailFailed(THUMB);
    vi.advanceTimersByTime(5_000);
    expect(probes).toHaveLength(1); // The first probe is still in flight.
  });

  it("checks right away when the window regains focus", () => {
    markVideoThumbnailFailed(THUMB);
    failProbesFor(3 * 60_000); // Now on the 15s interval.
    const probeCount = probes.length;

    vi.advanceTimersByTime(1_000);
    window.dispatchEvent(new Event("focus"));
    vi.advanceTimersByTime(0);
    expect(probes).toHaveLength(probeCount + 1);
  });

  it("pauses while the window is hidden", () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    markVideoThumbnailFailed(THUMB);
    vi.advanceTimersByTime(60_000);
    expect(probes).toHaveLength(0);

    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(0);
    expect(probes).toHaveLength(1);
  });
});

describe("GalleryThumbnail", () => {
  it("shows a spinner for a failed video thumbnail, then swaps in the loaded one", () => {
    renderVideoThumbnail();
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("Loading thumbnail…")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(5_000);
      probes[0].onerror!();
      vi.advanceTimersByTime(5_000);
      probes[1].onload!();
    });
    expect(screen.getByRole("img").getAttribute("src")).toBe(probes[1].src);
  });

  it("renders an already-recovered thumbnail straight away when remounted", () => {
    markVideoThumbnailFailed(THUMB);
    vi.advanceTimersByTime(5_000);
    probes[0].onload!();

    renderVideoThumbnail();
    expect(screen.getByRole("img").getAttribute("src")).toBe(probes[0].src);
  });

  it("falls back to the video icon once the thumbnail is given up on", () => {
    markVideoThumbnailFailed(THUMB);
    failProbesFor(60 * 60_000 + 60_000);

    renderVideoThumbnail();
    expect(screen.getByTestId("fallback-icon")).toBeTruthy();
  });

  it("leaves image thumbnails on the placeholder fallback", () => {
    render(
      <GalleryThumbnail thumbnail={THUMB} alt="Image" isVideo={false} fallbackIcon={VideoIcon} />,
    );
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img").getAttribute("src")).toBe("placeholder.png");
    expect(getVideoThumbnailState(THUMB)).toBeUndefined();
  });
});

function renderVideoThumbnail() {
  render(
    <GalleryThumbnail thumbnail={THUMB} alt="Video" isVideo fallbackIcon={VideoIcon} />,
  );
}

// Advance time, failing every probe the checker starts along the way.
function failProbesFor(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    vi.advanceTimersByTime(1_000);
    for (const probe of probes) {
      if (probe.onerror) {
        const onerror = probe.onerror;
        probe.onerror = null;
        onerror();
      }
    }
  }
}
