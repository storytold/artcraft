import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import TextToImage from "./TextToImage";

const state = vi.hoisted(() => ({
  status: "logged_out", model: undefined as any, provider: undefined as any,
  items: [] as any[], setSelectedModel: vi.fn(), setSelectedProvider: vi.fn(),
  promptProps: vi.fn(),
}));
vi.mock("@preact/signals-react/runtime", () => ({ useSignals: () => undefined }));
vi.mock("~/signals", () => ({ authentication: { status: { get value() { return state.status; } } } }));
vi.mock("~/enums", () => ({ AUTH_STATUS: { LOGGED_IN: "logged_in" } }));
vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: { TextToImage: "image" },
  useTextToImagePageModelList: () => state.items,
  useSelectedImageModel: () => state.model,
  useSelectedProviderForModel: () => state.provider,
  useClassyModelSelectorStore: { getState: () => state },
  ClassyModelSelector: () => null,
}));
vi.mock("@storyteller/ui-promptbox", () => ({ PromptBoxImage: (props: any) => { state.promptProps(props); return null; } }));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxImage: {}, galleryModalLightboxMediaId: {}, galleryModalLightboxVisible: {},
  galleryModalLightboxNavPrev: {}, galleryModalLightboxNavNext: {},
}));
vi.mock("@storyteller/ui-help-menu", () => ({ HelpMenuButton: () => null }));
vi.mock("@storyteller/ui-pricing-modal", () => ({ CostCalculatorButton: () => null, useCostBreakdownModalStore: () => 0 }));
vi.mock("@storyteller/ui-generation-list", () => ({
  localGenerationsToGalleryItems: () => [],
  useGalleryData: () => ({ items: [], hasMore: false }),
  useLastViewedGenerationStore: () => null,
}));
vi.mock("@storyteller/tauri-api", () => ({ useLocalGenerations: () => [] }));
vi.mock("~/components/generation-feed/useDesktopGenerationFeed", () => ({
  useDesktopGenerationFeed: () => ({ inProgress: [], failed: [], newlyCompleted: [] }),
}));
vi.mock("~/components/generation-feed/useDesktopUsername", () => ({ useDesktopUsername: () => null }));
vi.mock("~/components/generation-feed/DesktopCreatePageShell", () => ({ DesktopCreatePageShell: ({ promptBox }: any) => promptBox }));
vi.mock("~/components/generation-feed/DesktopGenerationGallery", () => ({ DesktopGenerationGallery: () => null }));
vi.mock("./TextToImageStore", () => ({ useTextToImageStore: () => vi.fn() }));

beforeEach(() => { state.status = "logged_out"; state.model = undefined; state.provider = undefined; state.items = []; });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("selects a supported WaveSpeed model when continuing without an account", () => {
  const model = { id: "wavespeed_model", getProviders: () => [GenerationProvider.WaveSpeed] };
  state.items = [{ model: { id: "cloud_only", getProviders: () => [GenerationProvider.Artcraft] } }, { model }];
  render(<TextToImage />);
  fireEvent.click(screen.getByRole("button", { name: "Use WaveSpeed" }));
  expect(state.setSelectedModel).toHaveBeenCalledWith("image", model);
  expect(state.setSelectedProvider).toHaveBeenCalledWith("image", model.id, GenerationProvider.WaveSpeed);
  expect(state.promptProps.mock.lastCall?.[0].canUseReferenceImages).toBe(false);
});

it("keeps the current model when it supports WaveSpeed", () => {
  state.model = { id: "current_model", getProviders: () => [GenerationProvider.WaveSpeed] };
  render(<TextToImage />);
  fireEvent.click(screen.getByRole("button", { name: "Use WaveSpeed" }));
  expect(state.setSelectedModel).toHaveBeenCalledWith("image", state.model);
});

it("enables reference images for signed-in accounts", () => {
  state.status = "logged_in";
  render(<TextToImage />);
  expect(screen.queryByRole("button", { name: "Use WaveSpeed" })).toBeNull();
  expect(state.promptProps.mock.lastCall?.[0].canUseReferenceImages).toBe(true);
});
