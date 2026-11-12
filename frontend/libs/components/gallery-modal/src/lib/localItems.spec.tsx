import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GalleryItem } from "./gallery-modal";
import { clearGalleryCache, GalleryModal } from "./gallery-modal";
import { galleryModalVisibleViewMode } from "./galleryModalSignals";
import { GalleryModalApi, MediaFilesApi, UsersApi } from "@storyteller/api";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { GalleryItemMenuItems } from "./GalleryItemMenuItems";
import { showActionReminder } from "@storyteller/ui-action-reminder-modal";
import { toast } from "@storyteller/ui-toaster";

const LOCAL_ID = "local_file_3f2a9c1e_4b7d_4e8a_9c2f_1a2b3c4d5e6f";
const LIBRARY_ID = "m_abc123";

vi.mock("@storyteller/ui-lightbox-modal", () => ({ LightboxModal: () => null }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@storyteller/ui-action-reminder-modal", async () => {
  const { signal } = await import("@preact/signals-react");
  return { showActionReminder: vi.fn(), isActionReminderOpen: signal(false) };
});
afterEach(() => { cleanup(); clearGalleryCache(); vi.restoreAllMocks(); vi.clearAllMocks(); galleryModalVisibleViewMode.value = false; vi.unstubAllGlobals(); });

it.each(["success", "failure", "exception"])("discards a previous user's late %s without blocking the new user's refresh", async (outcome) => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  const session = vi.spyOn(UsersApi.prototype, "GetSession").mockResolvedValue({ success: true, data: { user: { username: "alice" } } } as any);
  let settleAlice!: (value: any) => void;
  let rejectAlice!: (error: Error) => void;
  const pendingAlice = new Promise<any>((resolve, reject) => { settleAlice = resolve; rejectAlice = reject; });
  const remoteItem = (name: string) => ({ token: `mf_${name}`, title: name, media_class: "image", created_at: "2026-11-12T00:00:00Z", media_links: { cdn_url: `https://example.com/${name}.png` } });
  const list = vi.spyOn(GalleryModalApi.prototype, "listUserMediaFiles").mockImplementation((query) => query.username === "alice"
    ? pendingAlice : Promise.resolve({ success: true, data: [remoteItem("bob")], pagination: { current: 0, total_page_count: 1 } } as any));
  const { rerender } = render(<GalleryModal mode="select" isOpen forceFilter="image" />);
  await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ username: "alice" })));
  rerender(<GalleryModal mode="select" isOpen={false} forceFilter="image" />);
  session.mockResolvedValue({ success: true, data: { user: { username: "bob" } } } as any);
  rerender(<GalleryModal mode="select" isOpen forceFilter="image" />);
  try {
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ username: "bob" })));
  } finally {
    await act(async () => {
      if (outcome === "exception") rejectAlice(new Error("Alice's stale failure"));
      else settleAlice(outcome === "success" ? { success: true, data: [remoteItem("alice")], pagination: { current: 0, total_page_count: 1 } } : { success: false, errorMessage: "Alice's stale failure" });
    });
  }
  await waitFor(() => expect(document.querySelector('[data-media-id="mf_bob"]')).toBeTruthy());
  expect(document.querySelector('[data-media-id="mf_alice"]')).toBeNull();
  expect(screen.queryByText("Alice's stale failure")).toBeNull();
});

it.each(["mesh", "splat"])("ignores old session-scoped %s responses after switching users", async (mediaClass) => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  const session = vi.spyOn(UsersApi.prototype, "GetSession").mockResolvedValue({ success: true, data: { user: { username: "alice" } } } as any);
  let settleAlice!: (value: any) => void;
  const pendingAlice = new Promise<any>((resolve) => { settleAlice = resolve; });
  const response = (name: string) => ({ success: true, data: [{ token: `mf_${name}`, media_class: mediaClass, created_at: "2026-11-12T00:00:00Z", media_links: { cdn_url: `https://example.com/${name}.glb` } }], pagination: {} });
  const list = vi.spyOn(MediaFilesApi.prototype, mediaClass === "mesh" ? "ListSessionMeshMediaFiles" : "ListSessionSplatMediaFiles").mockImplementationOnce(() => pendingAlice).mockResolvedValue(response("bob") as any);
  const { rerender } = render(<GalleryModal mode="select" isOpen forceFilter={mediaClass} />);
  await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
  rerender(<GalleryModal mode="select" isOpen={false} forceFilter={mediaClass} />);
  session.mockResolvedValue({ success: true, data: { user: { username: "bob" } } } as any);
  rerender(<GalleryModal mode="select" isOpen forceFilter={mediaClass} />);
  try {
    await waitFor(() => expect(document.querySelector('[data-media-id="mf_bob"]')).toBeTruthy());
  } finally {
    await act(async () => { settleAlice(response("alice")); });
  }
  expect(document.querySelector('[data-media-id="mf_alice"]')).toBeNull();
});

it("does not restore remote items after reopening the gallery signed out", async () => {
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  const session = vi.spyOn(UsersApi.prototype, "GetSession").mockResolvedValue({ success: true, data: { user: { username: "alice" } } } as any);
  let settleAlice!: (value: any) => void;
  const list = vi.spyOn(GalleryModalApi.prototype, "listUserMediaFiles").mockImplementation(() => new Promise((resolve) => { settleAlice = resolve; }));
  const { rerender } = render(<GalleryModal mode="select" isOpen forceFilter="image" />);
  await waitFor(() => expect(list).toHaveBeenCalled());
  rerender(<GalleryModal mode="select" isOpen={false} forceFilter="image" />);
  session.mockResolvedValue({ success: false } as any);
  rerender(<GalleryModal mode="select" isOpen forceFilter="image" />);
  await waitFor(() => expect(session).toHaveBeenCalledTimes(2));
  await act(async () => { settleAlice({ success: true, data: [{ token: "mf_alice", media_class: "image", created_at: "2026-11-12T00:00:00Z", media_links: { cdn_url: "https://example.com/alice.png" } }], pagination: { current: 0, total_page_count: 1 } }); });
  expect(document.querySelector('[data-media-id="mf_alice"]')).toBeNull();
});

it.each(["rejection", "failure response"])("retains failed bulk deletions for retry and reports a %s", async (failure) => {
  vi.spyOn(UsersApi.prototype, "GetSession").mockResolvedValue({ success: false });
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  galleryModalVisibleViewMode.value = true;
  const first = { ...item(LOCAL_ID), label: "first tile" };
  const second = { ...item(`${LOCAL_ID}_second`), label: "second tile" };
  const onDeleteMedia = vi.fn().mockResolvedValueOnce({ status: "success" });
  if (failure === "rejection") onDeleteMedia.mockRejectedValueOnce(new Error("offline"));
  else onDeleteMedia.mockResolvedValueOnce({ status: "error" });
  render(<GalleryModal mode="view" isOpen localItems={[first, second]} onDeleteMedia={onDeleteMedia} />);
  for (const label of [first.label, second.label]) {
    const tile = await screen.findByRole("button", { name: label });
    fireEvent.click(tile.closest("[data-media-id]")!.querySelector(".absolute.left-2.top-2")!);
  }
  expect(screen.getByText("2 selected")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  const confirm = vi.mocked(showActionReminder).mock.calls.at(-1)![0];
  await act(async () => { await confirm.onPrimaryAction!(); });
  await waitFor(() => expect(screen.getByText("1 selected")).toBeTruthy());
  expect(screen.queryByRole("button", { name: first.label })).toBeNull();
  expect(screen.getByRole("button", { name: second.label })).toBeTruthy();
  expect(toast.error).toHaveBeenCalledWith("Failed to delete 1 item.");
});

it("shows saved local images in the signed-out library", async () => {
  vi.spyOn(UsersApi.prototype, "GetSession").mockResolvedValue({ success: false });
  const list = vi.spyOn(GalleryModalApi.prototype, "listUserMediaFiles");
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  galleryModalVisibleViewMode.value = true;
  render(<GalleryModal mode="view" isOpen localItems={[item(LOCAL_ID)]} />);
  await waitFor(() => expect(screen.getByRole("button", { name: "tile" })).toBeTruthy());
  expect(list).not.toHaveBeenCalled();
});

describe("gallery tile menu", () => {
  it("offers only view and delete for an image kept on this computer", () => {
    renderMenu(LOCAL_ID);
    expect(screen.getByText("View image")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
    expect(screen.queryByText("Edit image")).toBeNull();
    expect(screen.queryByText("Add to Folder")).toBeNull();
    expect(screen.queryByText("Remove from folder")).toBeNull();
  });

  it("offers library actions for a library item", () => {
    renderMenu(LIBRARY_ID);
    expect(screen.getByText("Edit image")).toBeTruthy();
    expect(screen.getByText("Add to Folder")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });
});

describe("gallery tile in select mode", () => {
  it("won't pick an image kept on this computer", () => {
    const onClick = renderSelectTile(LOCAL_ID);
    expect((screen.getByRole("button", { name: "tile" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "tile" }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.queryByText("Added")).toBeNull();
  });

  it("picks a library item", () => {
    const onClick = renderSelectTile(LIBRARY_ID);
    fireEvent.click(screen.getByRole("button", { name: "tile" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

it.each(["Enter", " "])("supports %s bulk-selection of local history without enabling cloud reference selection", (key) => {
  const onClick = vi.fn();
  const onBulkSelectToggle = vi.fn();
  render(<GalleryDraggableItem
    item={item(LOCAL_ID)}
    mode="view"
    activeFilter="image"
    selected={false}
    onClick={onClick}
    onImageError={vi.fn()}
    onBulkSelectToggle={onBulkSelectToggle}
    disableTooltipAndBadge
  />);
  fireEvent.keyDown(screen.getByRole("checkbox", { name: "Select tile" }), { key });
  expect(onBulkSelectToggle).toHaveBeenCalledTimes(1);
  expect(onClick).not.toHaveBeenCalled();
});

function item(id: string): GalleryItem {
  return {
    id,
    label: "tile",
    thumbnail: "https://example.com/t.png",
    fullImage: "https://example.com/f.png",
    createdAt: "2026-10-15T00:00:00Z",
    mediaClass: "image",
  };
}

function renderMenu(id: string) {
  render(
    <GalleryItemMenuItems
      item={item(id)}
      folders={[]}
      onOpen={vi.fn()}
      onEditClicked={vi.fn()}
      onAddToFolder={vi.fn()}
      onRemoveFromFolder={vi.fn()}
      onDelete={vi.fn()}
      close={vi.fn()}
    />,
  );
}

function renderSelectTile(id: string) {
  const onClick = vi.fn();
  render(
    <GalleryDraggableItem
      item={item(id)}
      mode="select"
      activeFilter="image"
      selected={false}
      onClick={onClick}
      onImageError={vi.fn()}
      disableTooltipAndBadge
    />,
  );
  return onClick;
}
