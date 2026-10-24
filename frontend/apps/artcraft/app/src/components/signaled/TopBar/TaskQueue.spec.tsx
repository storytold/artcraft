// TaskQueue.spec: checks the number badge on the Task Queue button in the top bar.
// The badge is "tasks in progress + finished tasks the user has not looked at yet". Everything the component
// talks to (the Rust task list, Tauri events, the popover, icons, credits) is replaced with small stand-ins so only
// the badge logic runs. Tasks are fed in through GetTaskQueue; a later poll is triggered by firing
// "generation-complete-event", the same push the real backend sends.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  getTaskQueue: vi.fn(),
  handlers: {} as Record<string, () => void>,
}));

vi.mock("@storyteller/tauri-api", () => ({
  GetTaskQueue: m.getTaskQueue,
  MarkTaskAsDismissed: vi.fn(async () => undefined),
  TasksNukeAll: vi.fn(async () => undefined),
  findDesktopModel: () => undefined,
}));
vi.mock("@tauri-apps/api/event", () => ({
  // Remember each handler by event name so a test can fire it; the returned function is the "unlisten".
  listen: vi.fn(async (name: string, handler: () => void) => {
    m.handlers[name] = handler;
    return () => undefined;
  }),
}));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
vi.mock("@storyteller/ui-popover", async () => {
  const { createElement } = await import("react");
  return {
    // Only the trigger button: clicking it reports "popover opened", like the real menu does.
    PopoverMenu: ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) =>
      createElement("button", {
        "data-testid": "trigger",
        onClick: () => onOpenChange?.(true),
      }),
  };
});
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/ui-modal", () => ({ Modal: () => null }));
vi.mock("@storyteller/ui-button", () => ({ Button: () => null }));
vi.mock("@storyteller/ui-close-button", () => ({ CloseButton: () => null }));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  ActionReminderModal: () => null,
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxMediaId: { value: null },
  galleryModalLightboxVisible: { value: false },
  galleryModalLightboxImage: { value: null },
}));
vi.mock("@storyteller/ui-model-selector", () => ({
  useSelectedImageModel: () => undefined,
  useSelectedVideoModel: () => undefined,
  ModelPage: { TextToImage: "text_to_image", ImageToVideo: "image_to_video" },
}));
vi.mock("@storyteller/model-list", () => ({
  getProviderDisplayName: (s: string) => s,
  getModelDisplayName: (s: string) => s,
  ALL_MODELS_LIST: [],
}));
vi.mock("@storyteller/api-enums", () => ({ TaskMediaFileClass: {} }));
vi.mock("@storyteller/common", () => ({
  getThumbnailUrl: () => undefined,
  THUMBNAIL_SIZES: { MEDIUM: 256 },
  getPlaceholderForMediaClass: () => "",
}));
vi.mock("@storyteller/credits", () => ({
  useCreditsState: { getState: () => ({ fetchFromServer: vi.fn() }) },
}));
vi.mock("~/pages/PageImageTo3DObject/ImageTo3DStore", () => ({
  coverImageCache: new Map(),
}));
vi.mock("./taskEnqueueMeta", () => ({
  getMetaForTask: () => undefined,
  cleanupOldEntries: vi.fn(),
}));

import { TaskQueue } from "./TaskQueue";

// A task as GetTaskQueue returns it (dates already converted to Date objects).
const task = (id: string, status: string, completedAtMs = 3000) => ({
  id,
  task_status: status,
  task_type: "image_generation",
  model_type: undefined,
  provider: undefined,
  created_at: new Date(1000),
  updated_at: new Date(2000),
  completed_at: status === "complete_success" ? new Date(completedAtMs) : undefined,
  completed_item: undefined,
  failure_reason: undefined,
});

// Mount the component and let the first poll finish.
const mount = async () => {
  const view = render(<TaskQueue />);
  await act(async () => {});
  return view;
};

// Fire the "a generation finished" push and let the poll it triggers finish.
const fireComplete = async () => {
  await act(async () => {
    m.handlers["generation-complete-event"]?.();
  });
};

// The badge is the only text the (stand-in) component renders, so its text is the badge number.
const badgeText = (container: HTMLElement) => container.textContent;

describe("TaskQueue badge", () => {
  beforeEach(() => {
    m.getTaskQueue.mockReset();
    for (const key of Object.keys(m.handlers)) delete m.handlers[key];
    localStorage.clear();
    // The component logs every poll result; keep the test output readable.
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows no badge when the queue is empty", async () => {
    m.getTaskQueue.mockResolvedValue({ tasks: [] });
    const { container } = await mount();
    expect(badgeText(container)).toBe("");
  });

  it("counts a task that is still running", async () => {
    m.getTaskQueue.mockResolvedValue({ tasks: [task("run-1", "started")] });
    const { container } = await mount();
    expect(badgeText(container)).toBe("1");
  });

  it("does not badge tasks that were already finished when the app started", async () => {
    // The backend returns every task the user has not dismissed, so old finished work is there on every launch.
    m.getTaskQueue.mockResolvedValue({
      tasks: [task("old-1", "complete_success"), task("old-2", "complete_success")],
    });
    const { container } = await mount();
    expect(badgeText(container)).toBe("");
  });

  it("badges a task that finishes after the app started, but not the old ones", async () => {
    const old = [task("old-1", "complete_success"), task("old-2", "complete_success")];
    m.getTaskQueue.mockResolvedValueOnce({ tasks: old });
    const { container } = await mount();

    m.getTaskQueue.mockResolvedValueOnce({
      tasks: [...old, task("new-1", "complete_success", 9000)],
    });
    await fireComplete();

    expect(badgeText(container)).toBe("1");
  });

  it("badges a task that was running at launch once it finishes", async () => {
    m.getTaskQueue.mockResolvedValueOnce({ tasks: [task("job-1", "started")] });
    const { container } = await mount();
    expect(badgeText(container)).toBe("1");

    m.getTaskQueue.mockResolvedValueOnce({ tasks: [task("job-1", "complete_success", 9000)] });
    await fireComplete();

    // No longer running, now finished and unseen: still exactly one.
    expect(badgeText(container)).toBe("1");
  });

  it("clears the badge when the queue is opened and does not bring old tasks back", async () => {
    const old = [task("old-1", "complete_success")];
    m.getTaskQueue.mockResolvedValueOnce({ tasks: old });
    const { container, getByTestId } = await mount();

    m.getTaskQueue.mockResolvedValue({ tasks: [...old, task("new-1", "complete_success", 9000)] });
    await fireComplete();
    expect(badgeText(container)).toBe("1");

    await act(async () => {
      fireEvent.click(getByTestId("trigger"));
    });
    // Opening the popover re-runs the poll; the old task must not reappear as unread.
    await act(async () => {});
    expect(badgeText(container)).toBe("");
  });
});
