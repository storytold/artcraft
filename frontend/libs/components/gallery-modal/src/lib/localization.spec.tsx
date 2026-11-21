import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { setLocale } from "@storyteller/i18n";
import { FolderNameDialog } from "./FolderNameDialog";
import { promptFolderDrop } from "./promptFolderDrop";

const { reminder } = vi.hoisted(() => ({ reminder: vi.fn() }));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: reminder,
  isActionReminderOpen: { value: true },
}));

afterEach(async () => {
  cleanup();
  await setLocale("en");
  localStorage.clear();
  vi.clearAllMocks();
});

it("preserves the edited folder name through language changes and submits the original value", async () => {
  const save = vi.fn();
  render(<FolderNameDialog isOpen title="Rename" confirmLabel="Save" initialValue="Original folder" onConfirm={save} onClose={vi.fn()} />);
  const input = screen.getByRole("textbox", { name: "Folder name" });
  fireEvent.change(input, { target: { value: "My 用户 folder" } });
  await act(() => setLocale("zh-CN"));
  expect((screen.getByRole("textbox", { name: "文件夹名称" }) as HTMLInputElement).value).toBe("My 用户 folder");
  expect(screen.getByRole("button", { name: "取消" })).toBeTruthy();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(save).toHaveBeenCalledWith("My 用户 folder");
});

it("localizes folder-drop choices without rewriting names or exchanging move/copy actions", async () => {
  const move = vi.fn();
  const copy = vi.fn();
  await setLocale("zh-CN");
  promptFolderDrop({ count: 2, targetFolderName: "<img> My 文件夹", onMove: move, onAdd: copy });
  const config = reminder.mock.calls[0][0];
  expect(config.title).toBe("移动还是复制 2 项素材？");
  expect(config.primaryActionText).toBe("移动到此处");
  expect(config.secondaryActionText).toBe("添加副本");
  const { container } = render(config.message);
  expect(container.textContent).toContain("<img> My 文件夹");
  expect(container.querySelector("img")).toBeNull();
  expect(move).not.toHaveBeenCalled();
  expect(copy).not.toHaveBeenCalled();
  await config.onSecondaryAction();
  expect(copy).toHaveBeenCalledTimes(1);
  expect(move).not.toHaveBeenCalled();
  await config.onPrimaryAction();
  expect(move).toHaveBeenCalledTimes(1);
});
