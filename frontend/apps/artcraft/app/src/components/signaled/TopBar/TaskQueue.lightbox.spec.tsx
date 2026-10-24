// TaskQueue.lightbox.spec: checks what the Task Queue hands to the full-screen viewer (the "lightbox") when the user
// clicks a finished generation. There are two places to click one: the small list in the popover under the top-bar
// button, and the bigger "Show all" window. Both must open the viewer with the generated FILE's token, because the viewer
// uses that token to look up the prompt, the creator and the tags. The queue also knows a TASK id (a local job number
// that is not a file token); handing that to the viewer makes every one of those lookups come back empty.
// Everything the component talks to is replaced with small stand-ins; the popover and the window are rendered open so a
// click can reach the cards.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  // The Rust task list; each test decides what it returns.
  getTaskQueue: vi.fn(),
  // The three signals the viewer reads. Plain objects with a `value`, exactly how the component writes to them.
  mediaId: { value: null as string | null },
  visible: { value: false },
  image: { value: null as unknown },
}));

// The Rust task list and the other commands the component imports.
vi.mock("@storyteller/tauri-api", () => ({
  GetTaskQueue: m.getTaskQueue,
  MarkTaskAsDismissed: vi.fn(async () => undefined),
  TasksNukeAll: vi.fn(async () => undefined),
  findDesktopModel: () => undefined,
}));
// Tauri push events: nothing is fired in this spec, so "listen" only has to hand back an unlisten function.
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async () => () => undefined),
}));
// Tooltips just render the thing they wrap.
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
// The popover menu: render its panel straight away (the panel is a function of a `close` callback in the real one) next to
// a trigger button, and tag the panel so the test can search inside just the popover.
vi.mock("@storyteller/ui-popover", async () => {
  const { createElement } = await import("react");
  return {
    PopoverMenu: ({ children }: { children: (close: () => void) => unknown }) =>
      createElement(
        "div",
        { "data-testid": "popover-panel" },
        // The real menu passes a close function into its panel; here closing does nothing visible.
        children(() => undefined) as never,
      ),
  };
});
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
// The "Show all" window: shows its content only while it is open, and is tagged so the test can search inside just it.
vi.mock("@storyteller/ui-modal", async () => {
  const { createElement } = await import("react");
  return {
    Modal: ({ isOpen, children }: { isOpen: boolean; children: unknown }) =>
      isOpen
        ? createElement("div", { "data-testid": "all-tasks-window" }, children as never)
        : null,
  };
});
// A plain button that shows its label and forwards the click.
vi.mock("@storyteller/ui-button", async () => {
  const { createElement } = await import("react");
  return {
    Button: ({ children, onClick }: { children: unknown; onClick?: () => void }) =>
      createElement("button", { onClick }, children as never),
  };
});
vi.mock("@storyteller/ui-close-button", () => ({ CloseButton: () => null }));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  ActionReminderModal: () => null,
}));
// The three signals the viewer reads, backed by the shared objects above so the test can look at what was written.
vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxMediaId: m.mediaId,
  galleryModalLightboxVisible: m.visible,
  galleryModalLightboxImage: m.image,
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

// The ids used below: a local task id and the id of the generated file. They are deliberately different, like the real ones.
const TASK_ID = "task-local-7";
const MEDIA_TOKEN = "m_generated_file_9";

// A finished task as GetTaskQueue returns it. `mediaToken` undefined means the backend had no file for it.
const finishedTask = (mediaToken: string | undefined) => ({
  id: TASK_ID,
  task_status: "complete_success",
  task_type: "image_generation",
  model_type: undefined,
  provider: undefined,
  created_at: new Date(1000),
  updated_at: new Date(2000),
  completed_at: new Date(3000),
  // Only a task with a file has completed_item; this mirrors get_task_queue_command.rs.
  completed_item: mediaToken
    ? {
        primary_media_file: {
          token: mediaToken,
          cdn_url: "https://cdn.example/generated.png",
          maybe_thumbnail_url_template: undefined,
        },
        media_file_class: "image",
        maybe_batch_token: undefined,
      }
    : undefined,
  failure_reason: undefined,
});

// Mount the component with one finished task and let the first poll finish.
const mount = async (mediaToken: string | undefined) => {
  m.getTaskQueue.mockResolvedValue({ tasks: [finishedTask(mediaToken)] });
  const view = render(<TaskQueue />);
  await act(async () => {});
  return view;
};

// Click the finished card inside the popover list. The card's title is the only element with the text "Image".
const clickInPopover = async (view: ReturnType<typeof render>) => {
  const panel = within(view.getByTestId("popover-panel"));
  await act(async () => {
    fireEvent.click(panel.getByText("Image"));
  });
};

// Open the "Show all" window from the popover, then click the finished card inside that window.
const clickInShowAllWindow = async (view: ReturnType<typeof render>) => {
  const panel = within(view.getByTestId("popover-panel"));
  await act(async () => {
    fireEvent.click(panel.getByText("Show all"));
  });
  const window = within(view.getByTestId("all-tasks-window"));
  await act(async () => {
    fireEvent.click(window.getByText("Image"));
  });
};

describe("TaskQueue opens a finished generation in the viewer", () => {
  beforeEach(() => {
    // Start every test with a closed viewer and no task list.
    m.getTaskQueue.mockReset();
    m.mediaId.value = null;
    m.visible.value = false;
    m.image.value = null;
    localStorage.clear();
    // The component logs every poll result; keep the test output readable.
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("from the popover list: gives the viewer the generated file's token", async () => {
    const view = await mount(MEDIA_TOKEN);
    await clickInPopover(view);
    expect(m.visible.value).toBe(true);
    expect(m.mediaId.value).toBe(MEDIA_TOKEN);
    expect((m.image.value as { id: string }).id).toBe(MEDIA_TOKEN);
  });

  it("from the Show all window: gives the viewer the generated file's token", async () => {
    const view = await mount(MEDIA_TOKEN);
    await clickInShowAllWindow(view);
    expect(m.visible.value).toBe(true);
    // The viewer looks the prompt, creator and tags up by this id; it must be the file's token, never the task id.
    expect(m.mediaId.value).toBe(MEDIA_TOKEN);
    expect((m.image.value as { id: string }).id).toBe(MEDIA_TOKEN);
  });

  it("opens the same viewer record from both places", async () => {
    // Open from the popover and remember what the viewer was given.
    const first = await mount(MEDIA_TOKEN);
    await clickInPopover(first);
    const fromPopover = JSON.parse(JSON.stringify(m.image.value));
    cleanup();

    // Open from the Show all window in a fresh mount and compare.
    m.visible.value = false;
    m.image.value = null;
    m.mediaId.value = null;
    const second = await mount(MEDIA_TOKEN);
    await clickInShowAllWindow(second);
    const fromWindow = JSON.parse(JSON.stringify(m.image.value));

    expect(fromWindow).toEqual(fromPopover);
  });

  it("closes the Show all window after a card is opened", async () => {
    const view = await mount(MEDIA_TOKEN);
    await clickInShowAllWindow(view);
    expect(view.queryByTestId("all-tasks-window")).toBeNull();
  });

  it("falls back to the task id in both places when the task has no file at all", async () => {
    // Nothing better exists for a task that finished without a file, so the task id is the only thing to hand over.
    const first = await mount(undefined);
    await clickInPopover(first);
    expect(m.mediaId.value).toBe(TASK_ID);
    cleanup();

    m.mediaId.value = null;
    const second = await mount(undefined);
    await clickInShowAllWindow(second);
    expect(m.mediaId.value).toBe(TASK_ID);
  });
});
