import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { buildImageModelsFromListing, CommonResolution, IMAGE_MODELS } from "@storyteller/model-list";
import { GenerateImage } from "@storyteller/tauri-api";
import { PromptBoxImage } from "./PromptBoxImage";
import { usePromptImageStore } from "./promptStore";
import { ReferenceDeck } from "./deck/ReferenceDeck";
import { usePromptBoxDrop } from "./deck/usePromptBoxDrop";

vi.mock("@storyteller/tauri-api", () => ({ GenerateImage: vi.fn().mockResolvedValue({ status: "success", payload: {} }) }));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-popover", () => ({
  PopoverMenu: ({ items, panelTitle }: {
    items: { label: string; selected?: boolean }[]; panelTitle: string;
  }) => <select aria-label={panelTitle} value={items.find((item) => item.selected)?.label ?? ""} onChange={() => {}}>
    {items.map((item) => <option key={item.label}>{item.label}</option>)}
  </select>,
}));
vi.mock("@storyteller/ui-tooltip", () => ({ Tooltip: ({ children }: { children: ReactNode }) => children }));
vi.mock("@storyteller/ui-button", () => ({
  GenerateIconButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) =>
    <button onClick={onClick} disabled={disabled}>Generate</button>,
}));
vi.mock("./deck/ReferenceDeck", () => ({ ReferenceDeck: vi.fn(() => <div data-testid="reference-deck" />) }));
vi.mock("./deck/useDeckMedia", () => ({ useDeckMedia: () => ({ uploadingImages: [] }) }));
vi.mock("./deck/usePromptBoxDrop", () => ({
  PromptBoxDropOverlay: () => null,
  usePromptBoxDrop: vi.fn(() => ({ dropZoneProps: {}, fullscreenDropZoneProps: {} })),
}));
vi.mock("./useAutoGrowEditorHeight", () => ({ useAutoGrowEditorHeight: () => ({ isExpanded: false, toggleExpand: vi.fn() }) }));
vi.mock("./PromptFullscreenButton", () => ({ PromptFullscreenButton: () => null }));
vi.mock("./PromptClearAllButton", () => ({ PromptClearAllButton: () => null, PROMPT_TOOLBAR_ICON_BUTTON_CLASSES: "" }));
vi.mock("./PromptFullscreenModal", () => ({
  PromptFullscreenModal: () => null,
  useFullscreenPrompt: () => ({ isFullscreen: false, openFullscreen: vi.fn(), closeFullscreen: vi.fn() }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  usePromptImageStore.setState({ prompt: "a wave", generationCount: 1, referenceImages: [], commonResolution: CommonResolution.HalfK });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.clearAllTimers(); vi.useRealTimers(); localStorage.clear(); });

it.each([
  ["nano_banana_2", "nano_banana_pro", CommonResolution.HalfK, CommonResolution.OneK, "1K"],
  ["seedream_4", "gpt_image_2", CommonResolution.ThreeK, CommonResolution.OneK, "1K"],
] as const)("normalizes resolution from %s before submitting %s to WaveSpeed", async (source, destination, stale, expected, label) => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === source)!;
  usePromptImageStore.setState({ commonResolution: stale });
  const props = { useJobContext: vi.fn(), selectedProvider: GenerationProvider.WaveSpeed };
  const { rerender } = render(<PromptBoxImage {...props} selectedModel={model} />);
  const next = IMAGE_MODELS.find((entry) => entry.tauriId === destination)!;
  rerender(<PromptBoxImage {...props} selectedModel={next} />);
  expect((screen.getByRole("combobox", { name: "Resolution" }) as HTMLSelectElement).value).toBe(label);
  expect(usePromptImageStore.getState().commonResolution).toBe(expected);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateImage).toHaveBeenCalledWith(expect.objectContaining({ provider: GenerationProvider.WaveSpeed, resolution: expected }));
});

it("keeps the remembered count until the model resolves and submits the supported count", async () => {
  usePromptImageStore.setState({ generationCount: 3 });
  const props = { useJobContext: vi.fn(), selectedProvider: GenerationProvider.Artcraft };
  const { rerender } = render(<PromptBoxImage {...props} />);
  expect(usePromptImageStore.getState().generationCount).toBe(3);

  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "nano_banana_pro")!;
  rerender(<PromptBoxImage {...props} selectedModel={model} />);
  expect(usePromptImageStore.getState().generationCount).toBe(3);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateImage).toHaveBeenCalledWith(expect.objectContaining({ batch_size: 3 }));
});

it("keeps direct Midjourney at four without replacing the remembered non-Midjourney count", async () => {
  usePromptImageStore.setState({ generationCount: 2 });
  const [model] = buildImageModelsFromListing([], [{ model: "midjourney_8" }]);
  render(<PromptBoxImage useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.Midjourney} />);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateImage).toHaveBeenCalledWith(expect.objectContaining({ batch_size: 4 }));
  expect(usePromptImageStore.getState().generationCount).toBe(2);
});

it("disables signed-out reference controls and omits stored account references from generation", async () => {
  usePromptImageStore.setState({
    referenceImages: [{ id: "ref", url: "https://example.com/ref.png", file: new File([], "ref.png"), mediaToken: "media_ref" }],
  });
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "nano_banana_pro")!;
  render(<PromptBoxImage useJobContext={vi.fn()} selectedModel={model} selectedProvider={GenerationProvider.WaveSpeed} canUseReferenceImages={false} />);

  expect(ReferenceDeck).not.toHaveBeenCalled();
  expect(usePromptBoxDrop).toHaveBeenLastCalledWith(expect.objectContaining({ acceptsImages: false }));
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(GenerateImage).toHaveBeenCalledWith(expect.not.objectContaining({ image_media_tokens: expect.anything() }));
});
