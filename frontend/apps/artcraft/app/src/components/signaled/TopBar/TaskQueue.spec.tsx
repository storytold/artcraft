import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TaskQueue from "./TaskQueue";
import { LAST_READ_AT_KEY, readLastReadAt } from "./taskQueueStorage";

const mocks = vi.hoisted(() => ({
  getTaskQueue: vi.fn(async () => ({ tasks: [] as never[] })),
  listen: vi.fn(async () => () => undefined),
}));

type PopoverProps = {
  children: ReactNode | ((close: () => void) => ReactNode);
  onOpenChange: (open: boolean) => void;
  triggerIcon?: ReactNode;
};

vi.mock("@storyteller/tauri-api", () => ({
  findDesktopModel: vi.fn(() => undefined),
  GetTaskQueue: mocks.getTaskQueue,
  MarkTaskAsDismissed: vi.fn(async () => undefined),
  TasksNukeAll: vi.fn(async () => undefined),
}));

vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@storyteller/ui-popover", async () => {
  const React = await import("react");
  return {
    PopoverMenu: ({ children, onOpenChange, triggerIcon }: PopoverProps) => {
      const [open, setOpen] = React.useState(false);
      const changeOpen = (next: boolean) => {
        setOpen(next);
        onOpenChange(next);
      };
      const close = () => changeOpen(false);

      return (
        <>
          <button
            type="button"
            aria-label="Toggle task queue"
            onClick={() => changeOpen(!open)}
          >
            {triggerIcon}
          </button>
          {open && typeof children === "function" ? children(close) : null}
        </>
      );
    },
  };
});

vi.mock("lucide-react", () => {
  const Icon = () => null;
  return {
    BombIcon: Icon,
    BrushIcon: Icon,
    CheckIcon: Icon,
    CircleAlertIcon: Icon,
    CopyIcon: Icon,
    ListChecksIcon: Icon,
    LoaderCircleIcon: Icon,
    Trash2Icon: Icon,
    TriangleAlertIcon: Icon,
    XIcon: Icon,
  };
});

vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));

vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children?: ReactNode }) =>
    isOpen ? <>{children}</> : null,
}));

vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxMediaId: { value: null },
  galleryModalLightboxVisible: { value: false },
  galleryModalLightboxImage: { value: null },
}));

vi.mock("@tauri-apps/api/event", () => ({ listen: mocks.listen }));

vi.mock("@storyteller/ui-model-selector", () => ({
  useSelectedImageModel: () => null,
  useSelectedVideoModel: () => null,
  ModelPage: { TextToImage: "TextToImage", ImageToVideo: "ImageToVideo" },
}));

vi.mock("@storyteller/ui-button", () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@storyteller/model-list", () => ({
  getProviderDisplayName: vi.fn(() => undefined),
  ALL_MODELS_LIST: [],
  getModelDisplayName: vi.fn(() => undefined),
}));

vi.mock("@storyteller/ui-close-button", () => ({
  CloseButton: ({ onClick }: { onClick?: () => void }) => (
    <button type="button" onClick={onClick}>Close</button>
  ),
}));

vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  ActionReminderModal: () => null,
}));

vi.mock("@storyteller/api-enums", () => ({ TaskMediaFileClass: {} }));

vi.mock("@storyteller/common", () => ({
  getThumbnailUrl: vi.fn(() => undefined),
  THUMBNAIL_SIZES: { MEDIUM: 256 },
  getPlaceholderForMediaClass: vi.fn(() => ""),
}));

vi.mock("~/pages/PageImageTo3DObject/ImageTo3DStore", () => ({
  coverImageCache: new Map(),
}));

vi.mock("@storyteller/credits", () => ({
  useCreditsState: {
    getState: () => ({ fetchFromServer: vi.fn() }),
  },
}));

vi.mock("./taskEnqueueMeta", () => ({
  getMetaForTask: vi.fn(() => undefined),
  cleanupOldEntries: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  mocks.getTaskQueue.mockReset();
  mocks.getTaskQueue.mockResolvedValue({ tasks: [] });
  mocks.listen.mockReset();
  mocks.listen.mockResolvedValue(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("mounts when reading the optional timestamp throws", () => {
  const originalGetItem = Storage.prototype.getItem;
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
    this: Storage,
    key: string,
  ) {
    if (key === LAST_READ_AT_KEY) {
      throw new DOMException("Storage access denied", "SecurityError");
    }
    return originalGetItem.call(this, key);
  });

  expect(() =>
    render(
      <StrictMode>
        <TaskQueue />
      </StrictMode>,
    ),
  ).not.toThrow();

  expect(
    screen.getByRole("button", { name: "Toggle task queue" }),
  ).toBeTruthy();
});

it("keeps the task queue usable when persisting the opened timestamp throws", () => {
  const originalSetItem = Storage.prototype.setItem;
  const setItemSpy = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === LAST_READ_AT_KEY) {
        throw new DOMException("Storage access denied", "SecurityError");
      }
      originalSetItem.call(this, key, value);
    });

  render(<TaskQueue />);
  const toggle = screen.getByRole("button", { name: "Toggle task queue" });

  expect(() => fireEvent.click(toggle)).not.toThrow();
  expect(setItemSpy).toHaveBeenCalledWith(LAST_READ_AT_KEY, expect.any(String));
  expect(screen.getByText("No tasks yet")).toBeTruthy();
});

it.each(["", "not-a-timestamp", "123bad", "123\n", "-1", "9007199254740992"])(
  "defaults malformed stored timestamp %j to zero",
  (storedValue) => {
    localStorage.setItem(LAST_READ_AT_KEY, storedValue);
    expect(readLastReadAt()).toBe(0);
  },
);
