import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, createEvent, fireEvent, render } from "@testing-library/react";

const h = vi.hoisted(() => ({
  onPointerDown: vi.fn(),
  getDragState: vi.fn(() => ({ isDragging: false })),
}));

vi.mock("./galleryDnd", () => ({
  default: { onPointerDown: h.onPointerDown, getDragState: h.getDragState },
}));
vi.mock("./gallery-modal", () => ({}));
vi.mock("./GalleryItemMenuItems", () => ({ GalleryItemMenuItems: () => null }));
vi.mock("lucide-react", () => ({
  CheckIcon: () => <i />,
  EllipsisIcon: () => <i />,
  MusicIcon: () => <i />,
  UploadIcon: () => <i />,
}));
vi.mock("@storyteller/ui-loading-spinner", () => ({ LoadingSpinner: () => <i /> }));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: vi.fn(),
  isActionReminderOpen: { value: false },
}));
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { GalleryDraggableItem } from "./GalleryDraggableItem";

const item = {
  id: "m1",
  label: "A picture",
  thumbnail: "https://x/t.png",
  mediaClass: "image",
} as never;

// jsdom 22 has no PointerEvent: build generic events and attach the fields the
// component reads (button / pageX / pageY / pointerType).
const pointer = (
  type: string,
  x: number,
  y: number,
  pointerType = "mouse",
): Event => {
  const ev = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
  Object.defineProperty(ev, "pageX", { value: x });
  Object.defineProperty(ev, "pageY", { value: y });
  Object.defineProperty(ev, "pointerType", { value: pointerType });
  return ev;
};

const renderTile = (onClick = vi.fn()) => {
  const utils = render(
    <GalleryDraggableItem
      item={item}
      mode="view"
      activeFilter="all"
      selected={false}
      onClick={onClick}
      onImageError={vi.fn()}
    />,
  );
  return { ...utils, onClick, button: utils.getByRole("button", { name: "A picture" }) };
};

describe("GalleryDraggableItem pointer handling", () => {
  beforeEach(() => {
    h.onPointerDown.mockClear();
  });
  afterEach(() => {
    // Releases any listener a test left armed.
    window.dispatchEvent(pointer("pointercancel", 0, 0));
    window.dispatchEvent(pointer("pointerup", 0, 0));
    cleanup();
  });

  it("hands the press to galleryDnd once the mouse moves past the threshold", () => {
    const { button } = renderTile();
    button.dispatchEvent(pointer("pointerdown", 0, 0));
    window.dispatchEvent(pointer("pointermove", 30, 30));
    expect(h.onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("does not start a phantom drag from later moves after the press was cancelled", () => {
    const { button } = renderTile();
    button.dispatchEvent(pointer("pointerdown", 0, 0));
    // The browser cancels the press (no pointerup ever arrives).
    window.dispatchEvent(pointer("pointercancel", 0, 0));
    // Mouse wanders with no button held.
    window.dispatchEvent(pointer("pointermove", 300, 300));
    expect(h.onPointerDown).not.toHaveBeenCalled();
  });

  it("still opens the tile on a touch tap after an earlier mouse drag on it", () => {
    const { button, onClick } = renderTile();
    // Mouse drag: marks the tile as having dragged.
    button.dispatchEvent(pointer("pointerdown", 0, 0));
    window.dispatchEvent(pointer("pointermove", 30, 30));
    window.dispatchEvent(pointer("pointerup", 30, 30));
    // Click after a drag is swallowed (correct).
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    // Later a finger taps the same tile: pointerdown (touch) then click.
    button.dispatchEvent(pointer("pointerdown", 5, 5, "touch"));
    const click = createEvent.click(button);
    fireEvent(button, click);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
