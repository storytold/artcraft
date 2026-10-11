import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { DragEndEvent } from "@dnd-kit/core";
import { ProviderPrioritySettingsPane } from "./ProviderPrioritySettingsPane";

const boundary = vi.hoisted(() => ({
  dragEnd: null as ((event: DragEndEvent) => void) | null,
  setOrder: vi.fn(),
}));

// Exercise the mounted pane at the drag-end callback and persistence boundary;
// pointer hit testing and the native Tauri transport are not part of this test.
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd: typeof boundary.dragEnd }) => {
    boundary.dragEnd = onDragEnd;
    return children;
  },
  closestCenter: vi.fn(), KeyboardSensor: class {}, PointerSensor: class {},
  useSensor: vi.fn(), useSensors: vi.fn(),
}));
vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const original = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    arrayMove: original.arrayMove,
    SortableContext: ({ children }: { children: ReactNode }) => children,
    sortableKeyboardCoordinates: vi.fn(), verticalListSortingStrategy: vi.fn(),
    useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn() }),
  };
});
vi.mock("@dnd-kit/utilities", () => ({ CSS: { Transform: { toString: () => undefined } } }));
vi.mock("lucide-react", () => ({ GripVerticalIcon: () => null, LoaderCircleIcon: () => null }));
vi.mock("@storyteller/tauri-api", () => ({
  Provider: { ArtCraft: "artcraft", Fal: "fal", Sora: "sora" },
  GetProviderOrder: async () => ({ payload: { providers: ["artcraft", "fal", "sora"] } }),
  SetProviderOrder: boundary.setOrder,
}));
vi.mock("@storyteller/model-list", () => ({
  getCreatorIcon: () => null,
  ModelCreator: { ArtCraft: "artcraft", Fal: "fal", OpenAi: "openai" },
}));
vi.mock("@storyteller/tauri-utils", () => ({ IsDesktopApp: () => true }));

let root: Root;
let host: HTMLDivElement;

beforeEach(async () => {
  vi.clearAllMocks();
  boundary.setOrder.mockResolvedValue({ success: true });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<ProviderPrioritySettingsPane />));
  expect(providerNames()).toEqual(["ArtCraft", "Fal", "Sora / ChatGPT"]);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it("keeps provider priority when a drag ends outside all drop targets", async () => {
  await drop("artcraft", null);
  expect(providerNames()).toEqual(["ArtCraft", "Fal", "Sora / ChatGPT"]);
  expect(boundary.setOrder).not.toHaveBeenCalled();
});

it("ignores an active provider that is no longer present", async () => {
  await drop("removed-provider", "fal");
  expect(providerNames()).toEqual(["ArtCraft", "Fal", "Sora / ChatGPT"]);
  expect(boundary.setOrder).not.toHaveBeenCalled();
});

it("ignores a drop target that is no longer present", async () => {
  await drop("artcraft", "removed-provider");
  expect(providerNames()).toEqual(["ArtCraft", "Fal", "Sora / ChatGPT"]);
  expect(boundary.setOrder).not.toHaveBeenCalled();
});

it("does not persist a drop onto the same provider", async () => {
  await drop("fal", "fal");
  expect(providerNames()).toEqual(["ArtCraft", "Fal", "Sora / ChatGPT"]);
  expect(boundary.setOrder).not.toHaveBeenCalled();
});

it("persists and displays a valid reorder", async () => {
  await drop("artcraft", "sora");
  expect(providerNames()).toEqual(["Fal", "Sora / ChatGPT", "ArtCraft"]);
  expect(boundary.setOrder).toHaveBeenCalledWith({ providers: ["fal", "sora", "artcraft"] });
});

function providerNames() {
  return [...host.querySelectorAll("span.font-medium")].map((node) => node.textContent);
}

async function drop(activeId: string, overId: string | null) {
  const event = { active: { id: activeId }, over: overId === null ? null : { id: overId } } as DragEndEvent;
  await act(async () => boundary.dragEnd?.(event));
}
