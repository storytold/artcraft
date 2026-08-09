import type { Model } from "@storyteller/model-list";
import { beforeEach, describe, expect, it } from "vitest";
import { useClassyModelSelectorStore } from "./classy-model-selector-store";
import { ModelPage } from "./model-pages";

const PAGE = ModelPage.ImageTo3DObject;

describe("model selection catalog reconciliation", () => {
  beforeEach(() => {
    useClassyModelSelectorStore.setState({
      selectedModels: {},
      modelSelectionSources: {},
      selectedProviders: {},
    });
  });

  it("promotes an automatic fallback to the hydrated catalog default", () => {
    const bootstrapFallback = fakeModel("bootstrap-fallback", "static");
    const hydratedFallback = fakeModel("bootstrap-fallback", "hydrated");
    const serverDefault = fakeModel("server-default", "hydrated");
    const store = useClassyModelSelectorStore.getState();

    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [bootstrapFallback],
      bootstrapFallback,
    );
    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [serverDefault, hydratedFallback],
      serverDefault,
    );

    const state = useClassyModelSelectorStore.getState();
    expect(state.selectedModels[PAGE]).toBe(serverDefault);
    expect(state.modelSelectionSources[PAGE]).toBe("automatic");
  });

  it("preserves an explicit choice that is absent from the hydrated catalog", () => {
    const bootstrapFallback = fakeModel("bootstrap-fallback", "static");
    const explicitChoice = fakeModel("artist-choice", "static");
    const serverDefault = fakeModel("server-default", "hydrated");
    const store = useClassyModelSelectorStore.getState();

    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [bootstrapFallback],
      bootstrapFallback,
    );
    store.setSelectedModel(PAGE, explicitChoice);
    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [serverDefault],
      serverDefault,
    );

    const state = useClassyModelSelectorStore.getState();
    expect(state.selectedModels[PAGE]).toBe(explicitChoice);
    expect(state.modelSelectionSources[PAGE]).toBe("explicit");
  });

  it("refreshes an explicit same-id instance without losing its provenance", () => {
    const explicitChoice = fakeModel("artist-choice", "static-capabilities");
    const hydratedChoice = fakeModel("artist-choice", "hydrated-capabilities");
    const serverDefault = fakeModel("server-default", "hydrated");
    const store = useClassyModelSelectorStore.getState();

    store.setSelectedModel(PAGE, explicitChoice);
    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [serverDefault, hydratedChoice],
      serverDefault,
    );

    const state = useClassyModelSelectorStore.getState();
    expect(state.selectedModels[PAGE]).toBe(hydratedChoice);
    expect(state.selectedModels[PAGE]?.selectorDescription).toBe(
      "hydrated-capabilities",
    );
    expect(state.modelSelectionSources[PAGE]).toBe("explicit");
  });

  it("refreshes an automatic same-id instance after hydration", () => {
    const bootstrapDefault = fakeModel(
      "catalog-default",
      "static-capabilities",
    );
    const hydratedDefault = fakeModel(
      "catalog-default",
      "hydrated-capabilities",
    );
    const store = useClassyModelSelectorStore.getState();

    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [bootstrapDefault],
      bootstrapDefault,
    );
    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [hydratedDefault],
      hydratedDefault,
    );

    const state = useClassyModelSelectorStore.getState();
    expect(state.selectedModels[PAGE]).toBe(hydratedDefault);
    expect(state.modelSelectionSources[PAGE]).toBe("automatic");
  });

  it("keeps the current selection when the catalog is empty", () => {
    const explicitChoice = fakeModel("artist-choice", "static");
    const store = useClassyModelSelectorStore.getState();

    store.setSelectedModel(PAGE, explicitChoice);
    store.reconcileSelectedModelFromCatalog(PAGE, [], undefined);

    const state = useClassyModelSelectorStore.getState();
    expect(state.selectedModels[PAGE]).toBe(explicitChoice);
    expect(state.modelSelectionSources[PAGE]).toBe("explicit");
  });

  it("keeps an automatic fallback when hydration yields no models", () => {
    const bootstrapFallback = fakeModel("bootstrap-fallback", "static");
    const store = useClassyModelSelectorStore.getState();

    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [bootstrapFallback],
      bootstrapFallback,
    );
    store.reconcileSelectedModelFromCatalog(PAGE, [], undefined);

    const state = useClassyModelSelectorStore.getState();
    expect(state.selectedModels[PAGE]).toBe(bootstrapFallback);
    expect(state.modelSelectionSources[PAGE]).toBe("automatic");
  });

  it("uses an available fallback when the requested default is unavailable", () => {
    const firstAvailable = fakeModel("first-available", "hydrated");
    const unavailableDefault = fakeModel("unavailable-default", "static");
    const store = useClassyModelSelectorStore.getState();

    store.reconcileSelectedModelFromCatalog(
      PAGE,
      [firstAvailable],
      unavailableDefault,
    );

    expect(useClassyModelSelectorStore.getState().selectedModels[PAGE]).toBe(
      firstAvailable,
    );
  });
});

const fakeModel = (tauriId: string, selectorDescription: string): Model =>
  ({
    id: `ui-${tauriId}`,
    tauriId,
    selectorDescription,
  }) as unknown as Model;
