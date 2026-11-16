import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import {
  GetTaskQueue,
  MarkTaskAsDismissed,
  CommandSuccessStatus,
} from "@storyteller/tauri-api";
import { TaskStatus, TaskType } from "@storyteller/api-enums";
import { toast } from "@storyteller/ui-toaster";
import { ErrorDialog } from "./ErrorDialog";
import { TaskQueue } from "./TopBar/TaskQueue";

const MESSAGE =
  "Provider diagnostic\n" + "full detail ".repeat(80) + "END OF ERROR";
const writeText = vi.fn();

// Keep the actual diagnostic components, Modal, Tooltip, PopoverMenu and Button.
// Replace editor/provider state and native IPC; no account or network is used.
vi.mock("@storyteller/ui-pagescene", async () => {
  const { create } = await import("zustand");
  return {
    usePageSceneStore: create<{
      showErrorDialog: boolean;
      errorDialogTitle: string;
      errorDialogMessage: string;
      setShowErrorDialog: (open: boolean) => void;
    }>((set) => ({
      showErrorDialog: true,
      errorDialogTitle: "Diagnostic title",
      errorDialogMessage: "",
      setShowErrorDialog: (open) => set({ showErrorDialog: open }),
    })),
  };
});
vi.mock("@storyteller/tauri-api", () => ({
  CommandSuccessStatus: { Success: "success" },
  GetTaskQueue: vi.fn(),
  MarkTaskAsDismissed: vi.fn(),
  TasksNukeAll: vi.fn(),
  findDesktopModel: vi.fn(),
}));
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async () => vi.fn()),
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({}));
vi.mock("@storyteller/ui-model-selector", () => ({
  useSelectedImageModel: () => undefined,
  useSelectedVideoModel: () => undefined,
  ModelPage: {},
}));
vi.mock("@storyteller/model-list", () => ({
  ALL_MODELS_LIST: [],
  getProviderDisplayName: vi.fn(),
  getModelDisplayName: vi.fn(),
}));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  ActionReminderModal: () => null,
}));
vi.mock(
  "@storyteller/ui-button",
  () => import("../../../../../../libs/components/button/src/lib/button"),
);
vi.mock("@storyteller/common", () => ({ DomLevels: { DIALOGUE: 1 } }));
vi.mock("~/pages/PageImageTo3DObject/ImageTo3DStore", () => ({
  coverImageCache: {},
}));
vi.mock("@storyteller/credits", () => ({
  useCreditsState: { getState: () => ({ fetchFromServer: vi.fn() }) },
}));
vi.mock("./TopBar/taskEnqueueMeta", () => ({
  getMetaForTask: () => ({ prompt: "PRIVATE PROMPT: do not copy as an error" }),
  cleanupOldEntries: vi.fn(),
}));
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  writeText.mockReset().mockResolvedValue(undefined);
  usePageSceneStore.setState({
    showErrorDialog: true,
    errorDialogTitle: "Diagnostic title",
    errorDialogMessage: MESSAGE,
  });
  vi.mocked(MarkTaskAsDismissed).mockResolvedValue({
    status: CommandSuccessStatus.Success,
    payload: undefined,
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ErrorDialog diagnostics", () => {
  it("marks only the complete diagnostic as selectable and preserves line breaks", () => {
    render(<ErrorDialog />);
    const message = screen.getByText(/Provider diagnostic/);
    expect(message.textContent).toBe(MESSAGE);
    expect(message.classList.contains("select-text")).toBe(true);
    expect(message.classList.contains("whitespace-pre-wrap")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Close" }).closest(".select-text"),
    ).toBeNull();
  });

  it("copies the full message, excluding title and controls, from the keyboard", async () => {
    const user = setupClipboard();
    render(<ErrorDialog />);
    const copy = screen.getByRole("button", { name: "Copy error details" });
    copy.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MESSAGE));
    expect(toast.success).toHaveBeenCalledWith(
      "Error details copied",
      expect.any(Object),
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Error details copied");
    expect(usePageSceneStore.getState().showErrorDialog).toBe(true);
  });

  it("does not announce success while the clipboard write is pending", async () => {
    const user = setupClipboard();
    const deferred = { complete: () => undefined as void };
    writeText.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        deferred.complete = resolve;
      }),
    );
    render(<ErrorDialog />);
    await user.click(
      screen.getByRole("button", { name: "Copy error details" }),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("");
    await act(async () => deferred.complete());
    expect(screen.getByRole("status").textContent).toBe("Error details copied");
  });

  it.each(["reject", "unavailable"])(
    "handles clipboard %s without closing or exposing diagnostics",
    async (mode) => {
      const user = setupClipboard();
      if (mode === "reject") {
        writeText.mockRejectedValue(new Error(MESSAGE));
      } else {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: undefined,
        });
      }
      render(<ErrorDialog />);
      await user.click(
        screen.getByRole("button", { name: "Copy error details" }),
      );
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Unable to copy error details",
          expect.any(Object),
        ),
      );
      expect(toast.success).not.toHaveBeenCalled();
      expect(usePageSceneStore.getState().showErrorDialog).toBe(true);
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(usePageSceneStore.getState().showErrorDialog).toBe(false);
    },
  );

  it("still closes on Escape", async () => {
    const user = setupClipboard();
    render(<ErrorDialog />);
    await user.keyboard("{Escape}");
    expect(usePageSceneStore.getState().showErrorDialog).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe("TaskQueue failure diagnostics", () => {
  it.each([
    ["generation_failed", MESSAGE, "Generation failed\n\n" + MESSAGE],
    ["unknown", MESSAGE, "An unknown error occurred\n\n" + MESSAGE],
    ["generation_failed", undefined, "Generation failed"],
    ["unknown", undefined, "An unknown error occurred"],
    ["new_provider_reason", undefined, "Failed"],
    ["new_provider_reason", MESSAGE, MESSAGE],
  ])(
    "copies complete %s details and preserves dismiss",
    async (failureType, failureMessage, expected) => {
      const user = setupClipboard();
      queueFailure(failureType, failureMessage);
      const { container } = render(<TaskQueue />);
      const trigger = container.querySelector("button");
      expect(trigger).not.toBeNull();
      await user.click(trigger!);
      const copy = await screen.findByRole("button", {
        name: "Copy error details",
      });
      copy.focus();
      await user.keyboard(" ");
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(expected));
      expect(toast.success).toHaveBeenCalledWith(
        "Error details copied",
        expect.any(Object),
      );
      expect(MarkTaskAsDismissed).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Dismiss" })).toBeTruthy();
      expect(document.activeElement).toBe(copy);
      await user.click(screen.getByRole("button", { name: "Dismiss" }));
      await waitFor(() =>
        expect(MarkTaskAsDismissed).toHaveBeenCalledWith("t_diagnostic"),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "Copy error details" }),
        ).toBeNull(),
      );
    },
  );

  it("reports clipboard rejection and lets the user retry without dismissing", async () => {
    const user = setupClipboard();
    queueFailure("generation_failed", MESSAGE);
    writeText.mockRejectedValueOnce(new Error(MESSAGE));
    const { container } = render(<TaskQueue />);
    await user.click(container.querySelector("button")!);
    const copy = await screen.findByRole("button", {
      name: "Copy error details",
    });
    await user.click(copy);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Unable to copy error details",
        expect.any(Object),
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(MarkTaskAsDismissed).not.toHaveBeenCalled();
    await user.click(copy);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Error details copied",
        expect.any(Object),
      ),
    );
  });
});

function setupClipboard() {
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  return user;
}

function queueFailure(failureType: string, failureMessage?: string) {
  vi.mocked(GetTaskQueue).mockResolvedValue({
    tasks: [
      {
        id: "t_diagnostic",
        task_status: TaskStatus.CompleteFailure,
        task_type: TaskType.ImageGeneration,
        created_at: new Date(),
        updated_at: new Date(),
        failure_reason: {
          failure_type: failureType,
          failure_message: failureMessage,
        },
      },
    ],
  });
}
