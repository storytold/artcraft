import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { buildImageModelsFromListing } from "@storyteller/model-list";
import { useModelPickerStyleStore } from "@storyteller/ui-popover";
import { ClassyModelSelector } from "./classy-model-selector";
import { useClassyModelSelectorStore } from "./classy-model-selector-store";
import { ModelPage } from "./model-pages";

const PAGE = ModelPage.TextToImage;
const MODELS = buildImageModelsFromListing([], [
  { model: "nano_banana_pro" },
  { model: "gpt_image_1p5" },
  { model: "flux_dev" },
  { model: "seedream_4" },
  { model: "recraft_3" },
  { model: "imagen_4" },
  { model: "midjourney_7" },
  { model: "midjourney_8" },
]);
const INITIAL_MODEL = MODELS.find((model) => model.id === "nano_banana_pro")!;
const MIDJOURNEY_MODEL = MODELS.find((model) => model.id === "midjourney_8")!;
const ITEMS = MODELS.map((model) => ({ label: model.selectorName, model }));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
    unobserve() {}
  });
  // jsdom has no layout; give the menu a visible rect so its viewport clamp
  // and Headless UI visibility checks behave as they do in the app.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(100, 100, 280, 40),
  );
  useClassyModelSelectorStore.setState({
    selectedModels: { [PAGE]: INITIAL_MODEL },
    selectedProviders: { [PAGE]: { [MIDJOURNEY_MODEL.id]: GenerationProvider.Artcraft } },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useClassyModelSelectorStore.setState({ selectedModels: {}, selectedProviders: {} });
  useModelPickerStyleStore.getState().setStyle("grouped");
});

it.each([
  { style: "grouped", provider: GenerationProvider.Midjourney, label: "Midjourney" },
  { style: "flat", provider: GenerationProvider.Midjourney, label: "Midjourney" },
  { style: "grouped", provider: GenerationProvider.Artcraft, label: "ArtCraft" },
] as const)(
  "selects both Midjourney v8 and $label from the $style picker",
  async ({ style, provider, label }) => {
    if (provider === GenerationProvider.Artcraft) {
      useClassyModelSelectorStore.getState().setSelectedProvider(PAGE, MIDJOURNEY_MODEL.id, GenerationProvider.Midjourney);
    }
    const user = await openProviderPicker(style);

    // A real click includes the press and focus events that used to dismiss
    // the grouped submenu before the provider's click handler could run.
    await user.click(screen.getByRole("button", { name: new RegExp(label) }));

    expect(useClassyModelSelectorStore.getState().selectedModels[PAGE]).toBe(MIDJOURNEY_MODEL);
    expect(useClassyModelSelectorStore.getState().selectedProviders[PAGE]?.[MIDJOURNEY_MODEL.id])
      .toBe(provider);
    await waitFor(() => expect(screen.queryByText("Select Model")).toBeNull());
    expect(screen.getByRole("button", { name: new RegExp(MIDJOURNEY_MODEL.selectorName) })).toBeTruthy();
  },
);

it("still dismisses the grouped picker on an outside press without changing selection", async () => {
  const user = await openProviderPicker("grouped");

  await user.click(screen.getByRole("button", { name: "Outside" }));

  await waitFor(() => expect(screen.queryByText("Select Model")).toBeNull());
  expect(screen.queryByText("Select Provider")).toBeNull();
  expect(useClassyModelSelectorStore.getState().selectedModels[PAGE]).toBe(INITIAL_MODEL);
  expect(useClassyModelSelectorStore.getState().selectedProviders[PAGE]?.[MIDJOURNEY_MODEL.id])
    .toBe(GenerationProvider.Artcraft);
});

async function openProviderPicker(style: "grouped" | "flat") {
  const user = userEvent.setup();
  useModelPickerStyleStore.getState().setStyle(style);
  render(
    <>
      <ClassyModelSelector items={ITEMS} page={PAGE} variant="embedded" />
      <button type="button">Outside</button>
    </>,
  );

  await user.click(screen.getByRole("button", { name: new RegExp(INITIAL_MODEL.selectorName) }));
  if (style === "grouped") {
    await user.click(screen.getByText("Midjourney", { exact: true }));
  }
  await user.hover(await screen.findByText(MIDJOURNEY_MODEL.selectorName, { exact: true }));
  await screen.findByRole("button", { name: /Midjourney/ });
  return user;
}
