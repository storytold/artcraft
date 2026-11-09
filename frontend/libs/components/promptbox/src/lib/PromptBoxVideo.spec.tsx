import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { VIDEO_MODELS } from "@storyteller/model-list";
import { GenerateVideo } from "@storyteller/tauri-api";
import { PromptBoxVideo } from "./PromptBoxVideo";
import { useCharactersStore, usePromptVideoStore } from "./promptStore";

vi.mock("@storyteller/tauri-api", () => ({ GenerateVideo: vi.fn().mockResolvedValue({ status: "success", payload: {} }) }));
vi.mock("@storyteller/api", () => ({ CharactersApi: vi.fn() }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
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
vi.mock("./deck/useDeckMedia", () => ({ useDeckMedia: () => ({ uploadingImages: [] }) }));
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
