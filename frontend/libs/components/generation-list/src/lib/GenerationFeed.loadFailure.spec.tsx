import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// The bug lives in how useGalleryData and the two feed views behave TOGETHER when the history request fails, so this spec
// runs the REAL hook and the REAL views side by side. Only the network, the cards, the spinner and the prompt caches are faked.
const m = vi.hoisted(() => ({ list: vi.fn() }));

// The history request (GalleryModalApi.listUserMediaFiles) is the one thing a flaky network breaks.
vi.mock("@storyteller/api", () => ({
  GalleryModalApi: class {
    listUserMediaFiles = m.list;
  },
  FilterMediaType: { SCENE_JSON: "scene_json" },
}));

// Thumbnail helpers are not under test; simple stand-ins keep the hook's import happy.
vi.mock("@storyteller/common", () => ({
  getMediaThumbnail: () => "thumb",
  getMediaStillThumbnail: () => "still",
  THUMBNAIL_SIZES: { LARGE: 512 },
}));

// A marked stand-in for the spinner so the test can tell "still spinning" from "stopped".
vi.mock("@storyteller/ui-loading-spinner", () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
}));

// The cards and rows are not under test; each prints its item id so the test can see what the feed shows.
vi.mock("./PendingCard", () => ({ PendingCard: () => null }));
vi.mock("./FailedCard", () => ({ FailedCard: () => null }));
vi.mock("./GalleryCard", () => ({
  GalleryCard: ({ item }: { item: { id: string } }) => <div data-testid="item">{item.id}</div>,
}));
vi.mock("./PendingRow", () => ({ PendingRow: () => null }));
vi.mock("./FailedRow", () => ({ FailedRow: () => null }));
vi.mock("./GalleryRow", () => ({
  GalleryRow: ({ item }: { item: { id: string } }) => <div data-testid="item">{item.id}</div>,
}));
// The masonry package measures the layout; a plain wrapper is enough here.
vi.mock("react-masonry-css", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// The prompt look-ups hit the network; the feed works without them.
vi.mock("./prompts-cache", () => ({ usePrompts: () => new Map() }));
vi.mock("./media-prompt-token-cache", () => ({ useMediaPromptTokens: () => new Map() }));

import { useGalleryData } from "./useGalleryData";
import { GenerationGridView } from "./GenerationGridView";
import { GenerationListView } from "./GenerationListView";

// Stable array so the hook's effect is not re-run by a new reference on every render.
const IMAGE = ["image"] as never;
const noop = () => undefined;

// A page of history as the media API returns it; `total` is the page count so a test can say "there is more".
const page = (token: string, total = 1, current = 0) => ({
  success: true,
  data: [{ token, media_class: "image", created_at: "2026-01-01" }],
  pagination: { current, total_page_count: total },
});

// The same wiring the three create pages (Image, Video, Audio) use: the hook feeds a feed view, and the retry props are
// passed straight from the hook. `loadFailed` and `onRetry` are the props the fix adds.
function Feed({ view }: { view: "grid" | "list" }) {
  const gallery = useGalleryData({ username: "ann", filterMediaClasses: IMAGE }) as ReturnType<
    typeof useGalleryData
  > & { loadFailed?: boolean };
  const View = view === "grid" ? GenerationGridView : GenerationListView;
  return (
    <View
      inProgressJobs={[]}
      failedJobs={[]}
      onDismissFailed={noop}
      newlyCompletedItems={[]}
      galleryItems={gallery.items}
      newlyCompletedTokens={new Set()}
      hasMore={gallery.hasMore}
      isLoading={gallery.isLoading}
      isInitialLoading={gallery.isInitialLoading}
      onLoadMore={gallery.loadMore}
      onGalleryItemClick={noop}
      {...({ loadFailed: gallery.loadFailed, onRetry: gallery.loadMore } as object)}
    />
  );
}

// A browser reports the sentinel's visibility right after observe() is called; the fake does the same, with "in view" as
// the answer (an empty feed leaves the sentinel at the top of the screen). It only reports once per observe(), as a real
// observer does: a later report needs the sentinel to move out of view and back, or a new observer to be created.
class FakeObserver {
  private readonly callback: (entries: Array<{ isIntersecting: boolean }>) => void;
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  m.list.mockReset();
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Both layouts share the sentinel; check each.
describe.each(["grid", "list"] as const)("a failed history load in the %s view", (view) => {
  it("stops the spinner and offers Try again instead of spinning forever (request rejected)", async () => {
    m.list.mockRejectedValue(new Error("offline"));
    render(<Feed view={view} />);
    // Wait for the first load to finish (the full-page spinner goes away when isInitialLoading ends).
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(1));
    // The user must be able to ask again; before the fix there was no control at all.
    expect(await screen.findByRole("button", { name: /try again/i })).toBeTruthy();
    // And nothing is still claiming to load.
    expect(screen.queryByTestId("spinner")).toBeNull();
  });

  it("stops the spinner and offers Try again when the API answers success:false", async () => {
    // The api package turns network errors into { success: false } instead of throwing, so this is the usual shape.
    m.list.mockResolvedValue({ success: false, errorMessage: "network down" });
    render(<Feed view={view} />);
    expect(await screen.findByRole("button", { name: /try again/i })).toBeTruthy();
    expect(screen.queryByTestId("spinner")).toBeNull();
  });

  it("Try again asks the server again and then shows the history", async () => {
    // First request fails, the second works.
    m.list.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(page("g1"));
    render(<Feed view={view} />);
    fireEvent.click(await screen.findByRole("button", { name: /try again/i }));
    // The item from the second request appears, and the failure notice is gone.
    expect((await screen.findByTestId("item")).textContent).toBe("g1");
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    expect(m.list).toHaveBeenCalledTimes(2);
  });

  it("keeps the items already loaded when a LATER page fails, and Try again loads that page", async () => {
    // Page 1 of 2 works; the follow-up request for page 2 fails once, then works.
    m.list
      .mockResolvedValueOnce(page("g1", 2, 0))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(page("g2", 2, 1));
    render(<Feed view={view} />);
    // The first page stays on screen and the retry control appears under it.
    fireEvent.click(await screen.findByRole("button", { name: /try again/i }));
    await waitFor(() =>
      expect(screen.getAllByTestId("item").map((n) => n.textContent)).toEqual(["g1", "g2"]),
    );
  });

  // ---- controls: behaviour that must not change ----

  it("control: a good load shows the items and no retry control", async () => {
    m.list.mockResolvedValue(page("g1"));
    render(<Feed view={view} />);
    expect((await screen.findByTestId("item")).textContent).toBe("g1");
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    // One page only, so no "more" spinner either.
    expect(screen.queryByTestId("spinner")).toBeNull();
  });

  it("control: while a load is in flight the spinner shows and there is no retry control", async () => {
    // A request that never settles: the feed is mid-load.
    m.list.mockReturnValue(new Promise(() => undefined));
    render(<Feed view={view} />);
    expect(await screen.findByTestId("spinner")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("control: a failed load does not hammer the server by itself", async () => {
    m.list.mockRejectedValue(new Error("offline"));
    render(<Feed view={view} />);
    // Wait only for the first request itself (not for any retry control), so this check holds before and after the fix.
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(1));
    // Give any stray retry loop several turns to show itself.
    await new Promise((r) => setTimeout(r, 20));
    expect(m.list).toHaveBeenCalledTimes(1);
  });
});
