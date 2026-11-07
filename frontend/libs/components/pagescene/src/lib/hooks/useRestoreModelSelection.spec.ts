import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { buildImageModelsFromListing } from "@storyteller/model-list";
import {
  ModelPage,
  useClassyModelSelectorStore,
  type ModelList,
} from "@storyteller/ui-model-selector";
import type { Model } from "@storyteller/model-list";
import { useRestoreModelSelection } from "./useRestoreModelSelection";

const PAGE = ModelPage.Stage3D;
const [DEFAULT_MODEL, REMEMBERED_MODEL] = buildImageModelsFromListing([], [
  { model: "gpt_image_1p5" },
  // Backend-only: listed once the backend listing hydrates.
  { model: "midjourney_7" },
]);
const STATIC_ITEMS: ModelList = [itemFor(DEFAULT_MODEL)];
const HYDRATED_ITEMS: ModelList = [...STATIC_ITEMS, itemFor(REMEMBERED_MODEL)];

afterEach(() => {
  cleanup();
  localStorage.clear();
  useClassyModelSelectorStore.setState({ selectedModels: {}, selectedModelIds: {}, selectedProviders: {} });
});

it("seeds the default without overwriting the remembered model, then selects it once listed", () => {
  useClassyModelSelectorStore.setState({ selectedModelIds: { [PAGE]: REMEMBERED_MODEL.tauriId } });

  const { rerender } = renderHook(
    ({ items }) => useRestoreModelSelection(PAGE, items, true),
    { initialProps: { items: STATIC_ITEMS } },
  );
  expect(useClassyModelSelectorStore.getState().selectedModels[PAGE]).toBe(DEFAULT_MODEL);
  expect(useClassyModelSelectorStore.getState().selectedModelIds[PAGE]).toBe(REMEMBERED_MODEL.tauriId);

  rerender({ items: HYDRATED_ITEMS });
  expect(useClassyModelSelectorStore.getState().selectedModels[PAGE]).toBe(REMEMBERED_MODEL);
  expect(useClassyModelSelectorStore.getState().selectedModelIds[PAGE]).toBe(REMEMBERED_MODEL.tauriId);
});

it("leaves the selection to the page's own selector when disabled", () => {
  renderHook(() => useRestoreModelSelection(PAGE, HYDRATED_ITEMS, false));

  expect(useClassyModelSelectorStore.getState().selectedModels[PAGE]).toBeUndefined();
});

function itemFor(model: Model): ModelList[number] {
  return { label: model.selectorName, model };
}
