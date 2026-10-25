import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { setLocale } from "@storyteller/i18n";
import { TagChipInput } from "./tags/TagChipInput";
import { LightboxModal } from "./lightbox-modal";

const mocks = vi.hoisted(() => ({
  carouselRef: vi.fn(),
  reminder: vi.fn(),
  remove: vi.fn().mockResolvedValue(undefined),
  getMedia: vi
    .fn()
    .mockResolvedValue({
      success: true,
      data: { maybe_prompt_token: "prompt_original" },
    }),
  getPrompt: vi.fn().mockResolvedValue({
    success: true,
    data: {
      maybe_positive_prompt: "Keep 原始 <prompt>",
      maybe_model_type: "nano_banana_pro",
      maybe_generation_provider: "artcraft",
      maybe_generate_audio: false,
    },
  }),
}));
vi.mock("embla-carousel-react", () => ({
  default: () => [mocks.carouselRef, undefined],
}));
vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {
    GetMediaFileByToken = mocks.getMedia;
  },
  PromptsApi: class {
    GetPromptsByToken = mocks.getPrompt;
  },
  TagsApi: class {
    ListMediaFileTags = vi.fn().mockResolvedValue({ success: true, data: [] });
  },
  UsersApi: class {
    GetSession = vi
      .fn()
      .mockResolvedValue({ success: true, data: { loggedIn: false } });
  },
}));
vi.mock("@storyteller/tauri-api", () => ({ MediaFileDelete: mocks.remove }));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: mocks.reminder,
  isActionReminderOpen: { value: false },
}));
vi.mock("@storyteller/ui-viewer-3d", () => ({ Viewer3D: () => null }));
vi.mock("@storyteller/ui-audio-player", () => ({
  WaveformAudioPlayer: () => null,
}));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));

afterEach(async () => {
  cleanup();
  await setLocale("en");
  vi.clearAllMocks();
});

it("keeps tag drafts and raw tag values through language switches", async () => {
  const add = vi.fn();
  const remove = vi.fn();
  render(
    <TagChipInput
      chips={["Original 标签"]}
      suggestions={[]}
      onAdd={add}
      onRemove={remove}
    />,
  );
  const input = screen.getByRole("textbox", { name: "Tags" });
  fireEvent.change(input, { target: { value: "New 新标签" } });
  await act(() => setLocale("zh-CN"));
  expect(
    (screen.getByRole("textbox", { name: "标签" }) as HTMLInputElement).value,
  ).toBe("New 新标签");
  expect(screen.getByTitle("移除“Original 标签”")).toBeTruthy();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(add).toHaveBeenCalledWith(["New 新标签"]);
  fireEvent.click(screen.getByTitle("移除“Original 标签”"));
  expect(remove).toHaveBeenCalledWith("Original 标签");
});

it("preserves prompt data and action targets without refetching when the preview changes language", async () => {
  const download = vi.fn().mockResolvedValue(undefined);
  const edit = vi.fn();
  const close = vi.fn();
  render(
    <LightboxModal
      isOpen
      onClose={close}
      onCloseGallery={vi.fn()}
      imageUrl="https://example.test/original.png"
      mediaId="media_original"
      mediaClass="image"
      createdAt="2026-10-13T00:00:00Z"
      onDownloadClicked={download}
      onEditClicked={edit}
    />,
  );
  await screen.findByText("Keep 原始 <prompt>");
  await act(() => setLocale("zh-CN"));
  expect(screen.getByText("提示词", { exact: true })).toBeTruthy();
  expect(screen.getByText("Keep 原始 <prompt>")).toBeTruthy();
  expect(screen.getByText("关闭", { exact: true })).toBeTruthy();
  expect(screen.getByText(/2026年10月13日/)).toBeTruthy();
  expect(mocks.getMedia).toHaveBeenCalledTimes(1);
  expect(mocks.getPrompt).toHaveBeenCalledTimes(1);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "下载", exact: true })),
  );
  expect(download).toHaveBeenCalledWith(
    "https://example.test/original.png",
    "image",
    "nano_banana_pro",
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "编辑图片", exact: true }),
    ),
  );
  expect(edit).toHaveBeenCalledWith(
    "https://example.test/original.png",
    "media_original",
  );
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "删除", exact: true })),
  );
  const config = mocks.reminder.mock.calls[0][0];
  expect(config.title).toBe("删除此素材？");
  expect(config.primaryActionText).toBe("删除");
  expect(config.secondaryActionText).toBe("取消");
  expect(mocks.remove).not.toHaveBeenCalled();
  await act(async () => config.onPrimaryAction());
  expect(mocks.remove).toHaveBeenCalledWith("media_original");
});
