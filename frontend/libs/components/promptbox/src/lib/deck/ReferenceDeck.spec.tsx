import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";

// Hover labels and the preview dialog are not under test; render pass-throughs.
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@storyteller/ui-modal", () => ({ Modal: () => null }));

import { ReferenceDeck } from "./ReferenceDeck";
import type { DeckItem } from "./deckTypes";

const image = (id: string): DeckItem => ({
  id,
  kind: "image",
  url: `blob:${id}`,
  name: `Image ${id}`,
});

// The parent owns the list, exactly as the real prompt boxes do.
const Harness = ({ initial }: { initial: DeckItem[] }) => {
  const [items, setItems] = useState(initial);
  return (
    <div>
      <button onClick={() => setItems([image("new")])}>refill</button>
      <ReferenceDeck
        items={items}
        canAdd
        onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        onClearAll={() => setItems([])}
        addActions={[{ key: "upload", label: "Upload", onSelect: vi.fn() }]}
      />
    </div>
  );
};

// The panel is the always-mounted `w-max` box; it flips between a visible and
// an invisible class set depending on whether the deck counts as expanded.
const panelOf = (container: HTMLElement) =>
  container.querySelector(".w-max") as HTMLElement;
const isOpen = (container: HTMLElement) =>
  panelOf(container).className.includes("opacity-100");

// The hover zone that arms the delayed expand (the card stack).
const stackOf = (container: HTMLElement) =>
  container.querySelector(".inset-y-0.left-0") as HTMLElement;
// The deck root, which closes the panel when the pointer leaves it.
const rootOf = (container: HTMLElement) =>
  container.querySelector(".relative.flex.shrink-0") as HTMLElement;

const hoverStackUntilOpen = (container: HTMLElement) => {
  fireEvent.mouseEnter(stackOf(container));
  act(() => {
    vi.advanceTimersByTime(300);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ReferenceDeck hover panel", () => {
  it("opens after hovering the card stack and closes once the pointer leaves", () => {
    const { container } = render(
      <Harness initial={[image("a"), image("b")]} />,
    );
    expect(isOpen(container)).toBe(false);
    hoverStackUntilOpen(container);
    expect(isOpen(container)).toBe(true);
    fireEvent.mouseLeave(rootOf(container));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(isOpen(container)).toBe(false);
  });

  it("starts collapsed again after 'Clear all' and a refill (pointer is long gone)", () => {
    const { container, getByText } = render(
      <Harness initial={[image("a"), image("b")]} />,
    );
    hoverStackUntilOpen(container);
    expect(isOpen(container)).toBe(true);

    // "Clear all" empties the list, so the deck swaps to its empty placeholder
    // and the hovered root is unmounted: its mouseleave can never fire.
    fireEvent.click(getByText("Clear all"));
    expect(container.querySelector(".w-max")).toBeNull();

    // The user later adds a reference while the pointer is somewhere else.
    fireEvent.click(getByText("refill"));
    expect(isOpen(container)).toBe(false);
  });

  it("starts collapsed again after the last reference is removed and one is re-added", () => {
    const { container, getByText } = render(<Harness initial={[image("a")]} />);
    hoverStackUntilOpen(container);
    expect(isOpen(container)).toBe(true);

    // The X on the only card (it appears on hover inside the open panel).
    const removeButton = panelOf(container).querySelector("button") as HTMLElement;
    fireEvent.click(removeButton);
    expect(container.querySelector(".w-max")).toBeNull();

    fireEvent.click(getByText("refill"));
    expect(isOpen(container)).toBe(false);
  });
});
