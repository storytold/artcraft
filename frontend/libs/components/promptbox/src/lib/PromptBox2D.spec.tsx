import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GenerationProvider } from "@storyteller/api-enums";
import { CommonAspectRatio, IMAGE_MODELS, imageModelForProvider } from "@storyteller/model-list";
import { toast } from "@storyteller/ui-toaster";
import { PromptBox2D } from "./PromptBox2D";
import { usePrompt2DStore } from "./promptStore";

vi.mock("@storyteller/ui-popover", () => ({
  PopoverMenu: ({ items, onSelect, panelTitle }: {
    items: { label: string; action?: string; selected?: boolean }[];
    onSelect: (item: { label: string; action?: string }) => void;
    panelTitle: string;
  }) => (
    <select aria-label={panelTitle}
      value={items.find((item) => item.selected)?.label ?? ""}
      onChange={(event) => onSelect(items.find((item) => item.label === event.target.value)!)}>
      {items.map((item) => <option key={item.label}>{item.label}</option>)}
    </select>
  ),
}));
vi.mock("@storyteller/ui-tooltip", () => ({ Tooltip: ({ children }: { children: ReactNode }) => children }));
vi.mock("@storyteller/ui-button", () => ({
  Button: () => null,
  GenerateButton: ({ children, onClick, disabled }: {
    children: ReactNode; onClick: () => void; disabled?: boolean;
  }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  NEUTRAL_BUTTON_HOVER_CLASSES: "",
}));
vi.mock("@storyteller/ui-modal", () => ({ Modal: () => null }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("./ImagePromptRow", () => ({
  ImagePromptRow: ({ referenceImages, setReferenceImages, allowUpload, maxImagePromptCount }: {
    referenceImages: { id: string }[];
    setReferenceImages: (images: { id: string }[]) => void;
    allowUpload: boolean;
    maxImagePromptCount: number;
  }) => <div>
    {allowUpload && referenceImages.length < maxImagePromptCount && <button>Upload reference</button>}
    {referenceImages.slice(0, maxImagePromptCount).map((image) => <button key={image.id} onClick={() => setReferenceImages(referenceImages.filter((entry) => entry.id !== image.id))}>Remove reference {image.id}</button>)}
  </div>,
}));
vi.mock("./PromptFullscreenButton", () => ({ PromptFullscreenButton: () => null }));
vi.mock("./PromptClearAllButton", () => ({ PromptClearAllButton: () => null, PROMPT_TOOLBAR_ICON_BUTTON_CLASSES: "" }));
vi.mock("./PromptFullscreenModal", () => ({
  PromptFullscreenModal: () => null,
  useFullscreenPrompt: () => ({ isFullscreen: false, openFullscreen: vi.fn(), closeFullscreen: vi.fn() }),
}));

beforeEach(() => {
  usePrompt2DStore.setState({ prompt: "edit this image", resolution: "1k", aspectRatio: "wide", referenceImages: [] });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("uses WaveSpeed resolution and count limits when switching from Artcraft in Draw", async () => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "seedream_4")!;
  const onGenerateClick = vi.fn();
  const onGenerationCountChange = vi.fn();
  const props = {
    selectedImageModel: model,
    selectedProvider: GenerationProvider.Artcraft,
    generationCount: 4,
    onGenerationCountChange,
    onGenerateClick,
    EncodeImageBitmapToBase64: vi.fn(),
    usePrompt2DStore,
  };
  const { rerender } = render(<PromptBox2D {...props} />);
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed, 1)!;
  rerender(<PromptBox2D {...props} selectedImageModel={direct} selectedProvider={GenerationProvider.WaveSpeed} />);
  expect(onGenerationCountChange).toHaveBeenCalledWith(1);
  const resolution = screen.getByRole("combobox", { name: "Resolution" }) as HTMLSelectElement;
  expect(Array.from(resolution.options, (option) => option.text)).toEqual(["2K", "3K", "4K"]);
  expect(resolution.value).toBe("2K");
  const count = screen.getByRole("combobox", { name: "No. of images" }) as HTMLSelectElement;
  expect(Array.from(count.options, (option) => option.text)).toEqual(["1"]);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).toHaveBeenLastCalledWith("edit this image", expect.objectContaining({ resolution: "two_k", aspectRatio: "square" }));
  fireEvent.change(resolution, { target: { value: "3K" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).toHaveBeenLastCalledWith("edit this image", expect.objectContaining({ resolution: "three_k" }));
});

it("normalizes settings on a WaveSpeed model switch and omits unsupported resolution", async () => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "seedream_4")!;
  const onGenerateClick = vi.fn();
  const props = {
    selectedImageModel: imageModelForProvider(model, GenerationProvider.WaveSpeed, 1),
    selectedProvider: GenerationProvider.WaveSpeed,
    onGenerateClick,
    EncodeImageBitmapToBase64: vi.fn(),
    usePrompt2DStore,
  };
  const { rerender } = render(<PromptBox2D {...props} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Resolution" }), { target: { value: "3K" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Aspect Ratio" }), { target: { value: "16:9 (Wide)" } });
  const gpt = IMAGE_MODELS.find((entry) => entry.tauriId === "gpt_image_1p5")!;
  rerender(<PromptBox2D {...props} selectedImageModel={imageModelForProvider(gpt, GenerationProvider.WaveSpeed, 1)} />);
  expect(screen.queryByRole("combobox", { name: "Resolution" })).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).toHaveBeenCalledWith("edit this image", expect.objectContaining({ resolution: undefined, aspectRatio: "square" }));
});

it("synchronizes the canvas callback with defaults, exact picker ratios and provider switches", () => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "seedream_4")!;
  const onAspectRatioChange = vi.fn();
  const props = {
    selectedImageModel: imageModelForProvider(model, GenerationProvider.WaveSpeed, 1),
    selectedProvider: GenerationProvider.WaveSpeed,
    onAspectRatioChange,
    onGenerateClick: vi.fn(),
    EncodeImageBitmapToBase64: vi.fn(),
    usePrompt2DStore,
  };
  const { rerender } = render(<PromptBox2D {...props} />);
  expect(onAspectRatioChange).toHaveBeenLastCalledWith(CommonAspectRatio.Square);
  fireEvent.change(screen.getByRole("combobox", { name: "Aspect Ratio" }), { target: { value: "16:9 (Wide)" } });
  expect(onAspectRatioChange).toHaveBeenLastCalledWith(CommonAspectRatio.WideSixteenByNine);
  const gpt = IMAGE_MODELS.find((entry) => entry.tauriId === "gpt_image_1p5")!;
  rerender(<PromptBox2D {...props} selectedImageModel={imageModelForProvider(gpt, GenerationProvider.WaveSpeed, 1)} />);
  expect(onAspectRatioChange).toHaveBeenLastCalledWith(CommonAspectRatio.Square);
  rerender(<PromptBox2D {...props} selectedImageModel={model} selectedProvider={GenerationProvider.Artcraft} />);
  expect(onAspectRatioChange).toHaveBeenLastCalledWith("wide");
});

it("rejects stale extra references instead of exceeding the endpoint's total reference limit", () => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "flux_1_dev")!;
  const onGenerateClick = vi.fn();
  usePrompt2DStore.setState({ referenceImages: [{ id: "ref", mediaToken: "mf_ref", url: "https://example.com/ref.png", file: new File([], "ref.png") }] });
  render(<PromptBox2D
    selectedImageModel={imageModelForProvider(model, GenerationProvider.WaveSpeed, 1)}
    selectedProvider={GenerationProvider.WaveSpeed}
    onGenerateClick={onGenerateClick}
    EncodeImageBitmapToBase64={vi.fn()}
    usePrompt2DStore={usePrompt2DStore}
  />);
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  expect(onGenerateClick).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("0 additional image references"));
});

it("uses the shared prompt limit counter and validation for WaveSpeed canvas requests", async () => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "seedream_4")!;
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed, 1)!;
  const onGenerateClick = vi.fn();
  usePrompt2DStore.setState({ prompt: "a".repeat(direct.maxPromptLength + 1) });
  render(<PromptBox2D
    selectedImageModel={direct}
    selectedProvider={GenerationProvider.WaveSpeed}
    onGenerateClick={onGenerateClick}
    EncodeImageBitmapToBase64={vi.fn()}
    usePrompt2DStore={usePrompt2DStore}
  />);
  expect(screen.getByText(`${direct.maxPromptLength + 1} / ${direct.maxPromptLength}`).className).toContain("text-red-500");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(`Prompt exceeds the ${direct.maxPromptLength} character limit for this model`);
  act(() => { usePrompt2DStore.setState({ prompt: "a".repeat(direct.maxPromptLength) }); });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).toHaveBeenCalledTimes(1);
});

it("keeps unsupported references removable after switching models without clearing the prompt", async () => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === "seedream_4")!;
  const zeroReferences = IMAGE_MODELS.find((entry) => entry.tauriId === "flux_1_dev")!;
  const onGenerateClick = vi.fn();
  usePrompt2DStore.setState({ referenceImages: ["first", "second"].map((id) => ({ id, mediaToken: `mf_${id}`, url: `https://example.com/${id}.png`, file: new File([], `${id}.png`) })) });
  const props = { selectedProvider: GenerationProvider.WaveSpeed, onGenerateClick, EncodeImageBitmapToBase64: vi.fn(), usePrompt2DStore };
  const { rerender } = render(<PromptBox2D {...props} selectedImageModel={imageModelForProvider(model, GenerationProvider.WaveSpeed, 1)} />);
  rerender(<PromptBox2D {...props} selectedImageModel={imageModelForProvider(zeroReferences, GenerationProvider.WaveSpeed, 1)} />);
  expect(screen.queryByRole("button", { name: "Upload reference" })).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).not.toHaveBeenCalled();
  for (const id of ["first", "second"]) fireEvent.click(screen.getByRole("button", { name: `Remove reference ${id}` }));
  expect(usePrompt2DStore.getState().prompt).toBe("edit this image");
  expect(usePrompt2DStore.getState().referenceImages).toEqual([]);
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Generate" })); });
  expect(onGenerateClick).toHaveBeenCalledWith("edit this image", expect.objectContaining({ images: [] }));
});
