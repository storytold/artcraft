import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";

const h = vi.hoisted(() => ({
  listUserMediaFiles: vi.fn(),
  getSession: vi.fn(),
  showActionReminder: vi.fn(),
  toastError: vi.fn(),
}));

// Any method not explicitly stubbed resolves to a failed response so the
// folder / tag loaders on mount are harmless.
vi.mock("@storyteller/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const withFallback = (stubs: Record<string, unknown>) =>
    class {
      constructor() {
        const self = this as Record<string, unknown>;
        Object.assign(self, stubs);
        return new Proxy(self, {
          get: (t, p) =>
            p in t
              ? t[p as string]
              : () => Promise.resolve({ success: false, errorMessage: "n/a" }),
        });
      }
    };
  return {
    ...actual,
    UsersApi: withFallback({ GetSession: h.getSession }),
    GalleryModalApi: withFallback({
      listUserMediaFiles: h.listUserMediaFiles,
    }),
    MediaFilesApi: withFallback({}),
    FoldersApi: withFallback({}),
    TagsApi: withFallback({}),
  };
});

vi.mock("@storyteller/ui-modal", () => {
  const Modal = ({ isOpen, children }: { isOpen?: boolean; children?: unknown }) =>
    isOpen ? <div>{children as never}</div> : null;
  Modal.DragHandle = ({ children }: { children?: unknown }) => <>{children as never}</>;
  Modal.ExpandButton = () => null;
  return { Modal };
});
vi.mock("@storyteller/ui-lightbox-modal", () => ({ LightboxModal: () => null }));
vi.mock("@storyteller/ui-generation-list", () => ({
  useMediaPromptTokens: () => ({}),
  usePrompts: () => ({}),
}));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: h.showActionReminder,
  isActionReminderOpen: { value: true },
}));
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { error: h.toastError, success: vi.fn() },
}));
// Minimal item: a label plus a button that toggles bulk selection.
vi.mock("./GalleryDraggableItem", () => ({
  GalleryDraggableItem: (p: {
    item: { id: string };
    bulkSelected?: boolean;
    onBulkSelectToggle?: () => void;
  }) => (
    <button
      data-testid={`item-${p.item.id}`}
      data-selected={String(!!p.bulkSelected)}
      onClick={p.onBulkSelectToggle}
    >
      {p.item.id}
    </button>
  ),
}));

import { GalleryModal } from "./gallery-modal";
import { galleryModalVisibleViewMode } from "./galleryModalSignals";

const apiItem = (token: string) => ({
  token,
  media_class: "image",
  created_at: "2026-01-01T00:00:00Z",
  media_links: { cdn_url: `https://cdn/${token}.png`, maybe_thumbnail_template: null },
});

const page = (tokens: string[]) => ({
  success: true,
  data: tokens.map(apiItem),
  pagination: { current: 0, total_page_count: 1 },
});

const deferred = <T,>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

describe("GalleryModal load race and bulk delete", () => {
  beforeEach(() => {
    // jsdom has no observers; report everything as visible so date groups render.
    class FakeIntersectionObserver {
      constructor(private cb: (e: { isIntersecting: boolean }[]) => void) {}
      observe() {
        this.cb([{ isIntersecting: true }]);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    h.getSession.mockResolvedValue({
      success: true,
      data: { user: { username: "tester" } },
    });
    galleryModalVisibleViewMode.value = true;
  });

  afterEach(() => {
    cleanup();
    galleryModalVisibleViewMode.value = false;
    vi.clearAllMocks();
  });

  it("drops a slow response from the previous filter after a filter switch", async () => {
    const slowAll = deferred<ReturnType<typeof page>>();
    h.listUserMediaFiles.mockImplementation(() => {
      // First call (filter "all") hangs; the image filter answers at once.
      if (h.listUserMediaFiles.mock.calls.length === 1) return slowAll.promise;
      return Promise.resolve(page(["image-1"]));
    });

    render(<GalleryModal mode="view" />);
    await waitFor(() => expect(h.listUserMediaFiles).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("Image"));
    await waitFor(() => expect(h.listUserMediaFiles).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId("item-image-1")).toBeTruthy());

    // The stale "all" response lands late and must not overwrite the image tab.
    await act(async () => {
      slowAll.resolve(page(["stale-all-1"]));
    });
    expect(screen.queryByTestId("item-stale-all-1")).toBeNull();
    expect(screen.getByTestId("item-image-1")).toBeTruthy();
  });

  it("keeps items whose bulk delete failed and removes the ones that succeeded", async () => {
    h.listUserMediaFiles.mockResolvedValue(page(["a", "b"]));
    const onDeleteMedia = vi.fn((id: string) =>
      id === "a" ? Promise.resolve() : Promise.reject(new Error("boom")),
    );

    render(<GalleryModal mode="view" onDeleteMedia={onDeleteMedia} />);
    await waitFor(() => expect(screen.getByTestId("item-a")).toBeTruthy());

    fireEvent.click(screen.getByTestId("item-a"));
    fireEvent.click(screen.getByTestId("item-b"));
    fireEvent.click(await screen.findByText("Delete"));

    expect(h.showActionReminder).toHaveBeenCalledTimes(1);
    const { onPrimaryAction } = h.showActionReminder.mock.calls[0][0];
    await act(async () => {
      await onPrimaryAction();
    });

    expect(onDeleteMedia).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("item-a")).toBeNull();
    // The failed one is still listed and still selected for a retry.
    expect(screen.getByTestId("item-b").getAttribute("data-selected")).toBe("true");
    expect(h.toastError).toHaveBeenCalledTimes(1);
  });
});
