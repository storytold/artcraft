import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GalleryItem } from "./gallery-modal";
import { GalleryModal } from "./gallery-modal";
import { galleryModalVisibleViewMode } from "./galleryModalSignals";
import { GalleryModalApi, UsersApi } from "@storyteller/api";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { GalleryItemMenuItems } from "./GalleryItemMenuItems";

const LOCAL_ID = "local_file_3f2a9c1e_4b7d_4e8a_9c2f_1a2b3c4d5e6f";
const LIBRARY_ID = "m_abc123";

vi.mock("@storyteller/ui-lightbox-modal", () => ({ LightboxModal: () => null }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); galleryModalVisibleViewMode.value = false; vi.unstubAllGlobals(); });

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
