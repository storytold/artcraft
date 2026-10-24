import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProviderPrioritySettingsPane } from "./ProviderPrioritySettingsPane";

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  setOrder: vi.fn(),
  // Captured from the mocked DndContext so tests can fire a drop directly.
  onDragEnd: { current: undefined as undefined | ((event: any) => void) },
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    mocks.onDragEnd.current = onDragEnd;
    return <div>{children}</div>;
  },
  closestCenter: vi.fn(),
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));
vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual<any>("@dnd-kit/sortable");
  return {
    // Keep the real arrayMove: it is what turns index -1 into "move to end".
    arrayMove: actual.arrayMove,
    SortableContext: ({ children }: any) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    verticalListSortingStrategy: vi.fn(),
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});
vi.mock("@storyteller/tauri-api", () => ({
  Provider: {
    ArtCraft: "artcraft",
    Fal: "fal",
    Sora: "sora",
    Grok: "grok",
    Midjourney: "midjourney",
  },
  GetProviderOrder: mocks.getOrder,
  SetProviderOrder: mocks.setOrder,
}));
vi.mock("@storyteller/model-list", () => ({
  ModelCreator: { ArtCraft: "artcraft", Fal: "fal", OpenAi: "openai" },
  getCreatorIcon: () => <span />,
}));
vi.mock("@storyteller/tauri-utils", () => ({ IsDesktopApp: () => true }));

// Rows render in the order the pane holds them.
const renderedOrder = () =>
  ["ArtCraft", "Fal", "Sora / ChatGPT"]
    .map((name) => ({ name, node: screen.getByText(name) }))
    .sort((a, b) =>
      a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    )
    .map((row) => row.name);

beforeEach(() => {
  mocks.getOrder.mockReset();
  mocks.setOrder.mockReset();
  mocks.onDragEnd.current = undefined;
  mocks.getOrder.mockResolvedValue({
    payload: { providers: ["artcraft", "fal", "sora"] },
  });
  mocks.setOrder.mockResolvedValue({ success: true });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("saves a drop exactly once even under StrictMode double-invoked updaters", async () => {
  render(
    <StrictMode>
      <ProviderPrioritySettingsPane />
    </StrictMode>,
  );
  await screen.findByText("Sora / ChatGPT");

  await act(async () => {
    mocks.onDragEnd.current?.({ active: { id: "sora" }, over: { id: "artcraft" } });
  });

  expect(mocks.setOrder).toHaveBeenCalledTimes(1);
  expect(mocks.setOrder).toHaveBeenCalledWith({
    providers: ["sora", "artcraft", "fal"],
  });
  expect(renderedOrder()).toEqual(["Sora / ChatGPT", "ArtCraft", "Fal"]);
});

it("ignores a drop outside the list instead of moving the item to the end", async () => {
  render(<ProviderPrioritySettingsPane />);
  await screen.findByText("Sora / ChatGPT");

  await act(async () => {
    mocks.onDragEnd.current?.({ active: { id: "artcraft" }, over: null });
  });

  expect(mocks.setOrder).not.toHaveBeenCalled();
  expect(renderedOrder()).toEqual(["ArtCraft", "Fal", "Sora / ChatGPT"]);
});

it("does not save when an item is dropped back onto itself", async () => {
  render(<ProviderPrioritySettingsPane />);
  await screen.findByText("Sora / ChatGPT");

  await act(async () => {
    mocks.onDragEnd.current?.({ active: { id: "fal" }, over: { id: "fal" } });
  });

  expect(mocks.setOrder).not.toHaveBeenCalled();
});

it("survives a failed provider-order load without an unhandled rejection", async () => {
  mocks.getOrder.mockRejectedValue(new Error("backend unavailable"));
  const unhandled = vi.fn();
  process.on("unhandledRejection", unhandled);

  render(<ProviderPrioritySettingsPane />);
  await waitFor(() => expect(mocks.getOrder).toHaveBeenCalled());
  // Give a would-be unhandled rejection a macrotask to be reported.
  await new Promise((resolve) => setTimeout(resolve, 20));
  process.off("unhandledRejection", unhandled);

  expect(unhandled).not.toHaveBeenCalled();
});
