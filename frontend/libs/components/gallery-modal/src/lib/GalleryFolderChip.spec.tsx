import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

// The chip only imports the GalleryFolder type from here; stub the heavy module.
vi.mock("./GalleryDraggableItem", () => ({}));
vi.mock("lucide-react", () => ({
  EllipsisIcon: () => <i />,
  FolderIcon: () => <i data-testid="folder-icon" />,
  StarIcon: () => <i />,
}));

import { GalleryFolderChip } from "./GalleryFolderChip";

// Builds a minimal folder; cast because only the fields the chip reads matter.
const folder = (extra: Record<string, unknown>) =>
  ({ id: "f1", name: "Folder", ...extra }) as never;

const img = (container: HTMLElement) => container.querySelector("img");

describe("GalleryFolderChip thumbnail", () => {
  afterEach(() => cleanup());

  it("shows the placeholder for a broken cover, then the new image once the cover changes", () => {
    const { container, rerender } = render(
      <GalleryFolderChip
        folder={folder({ coverUrl: "https://x/broken.png" })}
        childCount={0}
        onOpen={vi.fn()}
      />,
    );
    fireEvent.error(img(container)!);
    // Failed url -> placeholder div, no <img>.
    expect(img(container)).toBeNull();

    rerender(
      <GalleryFolderChip
        folder={folder({ coverUrl: "https://x/fresh.png" })}
        childCount={0}
        onOpen={vi.fn()}
      />,
    );
    // Before the fix the sticky `failed` flag kept the placeholder here.
    expect(img(container)?.getAttribute("src")).toBe("https://x/fresh.png");
  });

  it("recovers when a failed cover is removed and the collage image takes its place", () => {
    const { container, rerender } = render(
      <GalleryFolderChip
        folder={folder({ coverUrl: "https://x/broken.png" })}
        childCount={0}
        onOpen={vi.fn()}
      />,
    );
    fireEvent.error(img(container)!);
    expect(img(container)).toBeNull();

    rerender(
      <GalleryFolderChip
        folder={folder({ collageUrls: ["https://x/recent.png"] })}
        childCount={0}
        onOpen={vi.fn()}
      />,
    );
    expect(img(container)?.getAttribute("src")).toBe("https://x/recent.png");
  });
});
