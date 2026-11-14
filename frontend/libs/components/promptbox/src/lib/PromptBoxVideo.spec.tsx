import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { VIDEO_MODELS } from "@storyteller/model-list";
import { GenerateVideo } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";
import { PromptBoxVideo } from "./PromptBoxVideo";
import { useCharactersStore, usePromptVideoStore } from "./promptStore";
import userEvent from "@testing-library/user-event";
const deckOptions = vi.hoisted(() => vi.fn());

vi.mock("@storyteller/tauri-api", () => ({ GenerateVideo: vi.fn().mockResolvedValue({ status: "success", payload: {} }) }));
vi.mock("@storyteller/api", () => ({ CharactersApi: vi.fn() }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: ({ panelTitle, items = [], onSelect }: { panelTitle: string; items?: { label: string }[]; onSelect?: (item: { label: string }) => void }) => (
  <select aria-label={panelTitle} onChange={(event) => onSelect?.(items.find((item) => item.label === event.target.value)!)}>{items.map((item) => <option key={item.label}>{item.label}</option>)}</select>
) }));
vi.mock("@storyteller/ui-sliderv2", () => ({ SliderV2: () => null }));
vi.mock("@storyteller/ui-tooltip", () => ({ Tooltip: ({ children }: { children: ReactNode }) => children }));
vi.mock("@storyteller/ui-button", () => ({
  GenerateIconButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) =>
    <button onClick={onClick} disabled={disabled}>Generate</button>,
  ToggleButton: () => null,
  NEUTRAL_BUTTON_HOVER_CLASSES: "",
}));
vi.mock("./deck/ReferenceDeck", () => ({ ReferenceDeck: () => null }));
vi.mock("./deck/KeyframeCards", () => ({ KeyframeCards: () => null }));
vi.mock("./deck/useDeckMedia", () => ({ useDeckMedia: (options: unknown) => { deckOptions(options); return { uploadingImages: [] }; } }));
vi.mock("./deck/usePromptBoxDrop", () => ({
  PromptBoxDropOverlay: () => null,
  usePromptBoxDrop: () => ({ dropZoneProps: {}, fullscreenDropZoneProps: {} }),
}));
vi.mock("./CharactersModal", () => ({ CharactersModal: () => null }));
vi.mock("./MentionTextarea", async () => {
  const { forwardRef } = await import("react");
  return { MentionTextarea: forwardRef<HTMLDivElement>((_props, ref) => <div ref={ref} data-testid="character-mentions" />) };
});
vi.mock("./PromptFullscreenButton", () => ({ PromptFullscreenButton: () => null }));
vi.mock("./PromptClearAllButton", () => ({ PromptClearAllButton: () => null, PROMPT_TOOLBAR_ICON_BUTTON_CLASSES: "" }));
vi.mock("./PromptFullscreenModal", () => ({
  PromptFullscreenModal: () => null,
  useFullscreenPrompt: () => ({ isFullscreen: false, openFullscreen: vi.fn(), closeFullscreen: vi.fn() }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  useCharactersStore.setState({ loaded: true, characters: [{ character_token: "char_alice", name: "Alice" }] });
  usePromptVideoStore.setState({
    prompt: "@Alice walks along a beach", inputMode: "keyframe", referenceImages: [], referenceVideos: [],
    referenceAudios: [], endFrameImage: undefined, generationCount: 1, duration: 5, resolution: "720p",
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); });

it("disables character selection and tokens after switching Seedance 2.0 to WaveSpeed", async () => {
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  const props = { useJobContext: vi.fn(), selectedModel: model };
  const { rerender } = render(<PromptBoxVideo {...props} selectedProvider={GenerationProvider.Artcraft} />);
  expect(screen.getByRole("button", { name: "@Characters" })).toBeTruthy();
  expect(screen.getByTestId("character-mentions")).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateVideo).toHaveBeenLastCalledWith(expect.objectContaining({ reference_character_tokens: ["char_alice"] }));
  rerender(<PromptBoxVideo {...props} selectedProvider={GenerationProvider.WaveSpeed} />);
  expect(screen.queryByRole("button", { name: "@Characters" })).toBeNull();
  expect(screen.queryByTestId("character-mentions")).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  const request = vi.mocked(GenerateVideo).mock.calls.at(-1)![0];
  expect(request.provider).toBe(GenerationProvider.WaveSpeed);
  expect(request.prompt).toBe("@Alice walks along a beach");
  expect(request.reference_character_tokens).toBeUndefined();
});

it("omits stale account media when generating a signed-out local video", async () => {
  usePromptVideoStore.setState({ inputMode: "reference", referenceImages: [{ id: "a", mediaToken: "mf_image", url: "https://example.com/image.png", file: new File([], "image.png") }], referenceVideos: [{ id: "v", mediaToken: "mf_video", url: "https://example.com/input.mp4", duration: 5, file: new File([], "input.mp4") }], endFrameImage: { id: "end", mediaToken: "mf_end", url: "https://example.com/end.png", file: new File([], "end.png") } });
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} canUseReferenceMedia={false} />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  const request = vi.mocked(GenerateVideo).mock.calls.at(-1)![0];
  expect(request.start_frame_image_media_token).toBeUndefined();
  expect(request.end_frame_image_media_token).toBeUndefined();
  expect(request.reference_image_media_tokens).toBeUndefined();
  expect(request.reference_video_media_tokens).toBeUndefined();
});

it("routes Seedance editing through the explicit mode and one reference video", async () => {
  usePromptVideoStore.setState({ inputMode: "reference", prompt: "Edit @Video1 with dramatic lighting" });
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} />);
  fireEvent.change(screen.getByRole("combobox", { name: "WaveSpeed video mode" }), { target: { value: "edit" } });
  act(() => usePromptVideoStore.setState({ referenceVideos: [{ id: "v", mediaToken: "mf_source", url: "https://example.com/source.mp4", duration: 5, file: new File([], "source.mp4") }] }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateVideo).toHaveBeenLastCalledWith(expect.objectContaining({ wavespeed_mode: "edit", reference_video_media_tokens: ["mf_source"], prompt: "Edit @Video 1 with dramatic lighting" }));
});

it("explains why frame-only WaveSpeed models need a signed-in account", () => {
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "kling_1p6_pro")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} canUseReferenceMedia={false} />);
  expect(screen.getByRole("status").textContent).toContain("Sign in to attach the starting frame");
  expect((screen.getByRole("button", { name: "Generate" }) as HTMLButtonElement).disabled).toBe(true);
});

it("hides empty Kling resolution controls while preserving Seedance options", () => {
  const kling = VIDEO_MODELS.find((entry) => entry.tauriId === "kling_1p6_pro")!;
  const { rerender } = render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={kling} selectedProvider={GenerationProvider.WaveSpeed} />);
  expect(screen.queryByRole("combobox", { name: "Resolution" })).toBeNull();
  const seedance = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  rerender(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={seedance} selectedProvider={GenerationProvider.WaveSpeed} />);
  expect((screen.getByRole("combobox", { name: "Resolution" }) as HTMLSelectElement).options.length).toBeGreaterThan(0);
});

it("limits reference clips without capping edit or extension source videos", () => {
  usePromptVideoStore.setState({ inputMode: "reference" });
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} />);
  expect(deckOptions).toHaveBeenLastCalledWith(expect.objectContaining({ maxVideoTotalSec: 15 }));
  for (const mode of ["edit", "extend"]) {
    fireEvent.change(screen.getByRole("combobox", { name: "WaveSpeed video mode" }), { target: { value: mode } });
    expect(deckOptions).toHaveBeenLastCalledWith(expect.objectContaining({ maxVideoTotalSec: Infinity, maxVideos: 1 }));
  }
});

it("rejects an image upload that finishes after switching to Extend video", async () => {
  usePromptVideoStore.setState({ inputMode: "reference", prompt: "Extend this clip" });
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} />);
  fireEvent.change(screen.getByRole("combobox", { name: "WaveSpeed video mode" }), { target: { value: "extend" } });
  act(() => usePromptVideoStore.setState({
    referenceImages: [{ id: "late", mediaToken: "mf_late", url: "https://example.com/image.png", file: new File([], "image.png") }],
    referenceVideos: [{ id: "source", mediaToken: "mf_source", url: "https://example.com/source.mp4", duration: 5, file: new File([], "source.mp4") }],
  }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateVideo).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("reference images"));
});

it("keeps only the first reference image when switching back to Keyframe", () => {
  usePromptVideoStore.setState({
    inputMode: "reference",
    referenceImages: [
      { id: "first", mediaToken: "mf_first", url: "https://example.com/first.png", file: new File([], "first.png") },
      { id: "second", mediaToken: "mf_second", url: "https://example.com/second.png", file: new File([], "second.png") },
    ],
  });
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Input Mode" }), { target: { value: "Keyframe" } });
  expect(usePromptVideoStore.getState().referenceImages.map((image) => image.id)).toEqual(["first"]);
});

it("keeps the labelled WaveSpeed mode control keyboard-focusable with a visible focus style", async () => {
  vi.useRealTimers();
  const user = userEvent.setup();
  usePromptVideoStore.setState({ inputMode: "reference" });
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  render(<PromptBoxVideo useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} />);
  const select = screen.getByRole("combobox", { name: "WaveSpeed video mode" });
  for (let count = 0; count < 20 && document.activeElement !== select; count += 1) await user.tab();
  expect(document.activeElement).toBe(select);
  expect(select.className).toContain("focus-visible:outline");
  await user.selectOptions(select, "edit");
  expect((select as HTMLSelectElement).value).toBe("edit");
});
