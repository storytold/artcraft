// Tests for the Cost Breakdown modal on the "Image to 3D" tabs.
//
// The bug these cover: on the Image-to-3D *object* tab the Generate button and the "Costs" button
// badge show the credit quote the app fetched from the backend, but the Cost Breakdown modal opened
// from that same tab said "Credit Costs not yet available for this model" for BOTH Hunyuan models.
// The modal decides whether to show a breakdown with a hard-coded allow-list of model ids
// (MODELS_WITH_COST_DATA), and the two Hunyuan ids were never added to it.
//
// The model lists come from the real `@storyteller/model-list` package so that a model added to the
// lists later, but forgotten in the modal, is caught here too. Everything heavy (the model selector,
// the prompt-box stores, the modal chrome, currency rates and the four estimate hooks) is mocked.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OBJECT_3D_MODELS, SPLAT_MODELS } from "@storyteller/model-list";
import { CostBreakdownModal } from "./cost-breakdown-modal";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

// Shared, hoisted mutable state: lets each test choose which model the (mocked) selector reports.
const mocks = vi.hoisted(() => ({
  selected: undefined as unknown,
}));

// The real enum values, copied in because vi.mock factories cannot use imports.
vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: {
    TextToImage: "text-to-image",
    ImageToVideo: "image-to-video",
    Canvas2D: "canvas-2d",
    Stage3D: "stage-3d",
    ImageEditor: "image-editor",
    ImageTo3DWorld: "image-to-3d-world",
    ImageTo3DObject: "image-to-3d-object",
    Angles: "angles",
  },
  // The model the user picked on the page (set per test through `mocks.selected`).
  useSelectedModel: () => mocks.selected,
  // Every model in these tests is served by ArtCraft.
  useSelectedProviderForModel: () => "artcraft",
  // Only used when nothing is selected; the tests always select a model.
  defaultModelForPage: (models: unknown[]) => models[0],
  // The per-page model lists are not needed because a model is always selected.
  useTextToImagePageModelList: () => [],
  useImageToVideoPageModelList: () => [],
  useCanvas2dPageModelList: () => [],
  useStage3dPageModelList: () => [],
  useImageEditorPageModelList: () => [],
  useAnglesPageModelList: () => [],
  IMAGE_TO_3D_WORLD_PAGE_MODEL_LIST: [],
  IMAGE_TO_3D_OBJECT_PAGE_MODEL_LIST: [],
}));

// The prompt-box stores only supply resolution and count for the 2D/3D/image/video/edit pages.
vi.mock("@storyteller/ui-promptbox", () => ({
  usePrompt2DStore: () => ({ resolution: "1k", generationCount: 1 }),
  usePrompt3DStore: () => ({ resolution: "1k" }),
  usePromptImageStore: () => ({ resolution: "1k", generationCount: 1 }),
  usePromptVideoStore: () => ({ resolution: "720p", generationCount: 1 }),
  usePromptEditStore: () => ({ resolution: "1k" }),
}));

// A plain stand-in for the draggable modal: renders its children only while open.
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: unknown }) =>
    isOpen ? <div>{children as never}</div> : null,
}));

// The currency dropdown is irrelevant here.
vi.mock("@storyteller/ui-select", () => ({ Select: () => null }));

// Fixed USD formatting so no network call for exchange rates happens.
vi.mock("./use-currency", () => ({
  useCurrency: () => ({
    currency: "USD",
    setCurrency: () => {},
    formatPrice: (usd: number) => `$${usd.toFixed(2)}`,
    currencyOptions: [],
  }),
}));

// The four estimate hooks normally fetch quotes and write them into the store; here the test writes
// the store directly, so each hook just reports "not loading".
vi.mock("./useVideoCostEstimate", () => ({
  useVideoCostEstimate: () => ({ isLoading: false }),
}));
vi.mock("./useImageCostEstimate", () => ({
  useImageCostEstimate: () => ({ isLoading: false }),
}));
vi.mock("./useSplatCostEstimate", () => ({
  useSplatCostEstimate: () => ({ isLoading: false }),
}));
vi.mock("./useMeshCostEstimate", () => ({
  useMeshCostEstimate: () => ({ isLoading: false }),
}));

// The store keys for the two 3D pages (the same strings the real enum holds).
const OBJECT_PAGE = "image-to-3d-object";
const WORLD_PAGE = "image-to-3d-world";

// Open the modal with the given page quote already in the store, as the app would after a fetch.
const openWithQuote = (page: string, credits: number | null) => {
  useCostBreakdownModalStore.setState({
    isOpen: true,
    estimatedCreditsByPage: { [page]: credits },
  });
};

beforeEach(() => {
  mocks.selected = undefined;
  useCostBreakdownModalStore.setState({
    isOpen: false,
    estimatedCreditsByPage: {},
  });
});

afterEach(() => {
  cleanup();
});

describe("Image to 3D object tab", () => {
  // One test per model on the page, so a newly added model that is missing from the modal's list fails.
  it.each(OBJECT_3D_MODELS.map((model) => [model.id, model] as const))(
    "shows the quoted credits for %s instead of 'not yet available'",
    (_id, model) => {
      mocks.selected = model;
      openWithQuote(OBJECT_PAGE, 40);

      render(<CostBreakdownModal activeTabId="IMAGE_TO_3D_OBJECT" />);

      // The same 40-credit quote the Generate button shows must appear in the modal.
      expect(screen.getByText("40 Credits")).toBeTruthy();
      expect(screen.queryByText(/not yet available/i)).toBeNull();
    },
  );

  it("shows the dash, not 'not yet available', while the quote has not arrived", () => {
    mocks.selected = OBJECT_3D_MODELS[0];
    openWithQuote(OBJECT_PAGE, null);

    render(<CostBreakdownModal activeTabId="IMAGE_TO_3D_OBJECT" />);

    // No quote yet: the credits row reads "—" and the model is not declared unpriced.
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.queryByText(/not yet available/i)).toBeNull();
  });

  it("does not invent an image resolution for a 3D object", () => {
    mocks.selected = OBJECT_3D_MODELS[0];
    openWithQuote(OBJECT_PAGE, 40);

    render(<CostBreakdownModal activeTabId="IMAGE_TO_3D_OBJECT" />);

    // A mesh has no pixel resolution, and the generic "Items" label is the fallback for unknown pages.
    expect(screen.queryByText("Resolution")).toBeNull();
    expect(screen.queryByText("Items")).toBeNull();
    // The page is named like its siblings ("Image to 3D World").
    expect(screen.getByText("Image to 3D Object")).toBeTruthy();
  });
});

describe("controls that already worked", () => {
  // The World tab's models were already on the allow-list, so they must keep their breakdown.
  it.each(SPLAT_MODELS.map((model) => [model.id, model] as const))(
    "still shows the quoted credits for the world model %s",
    (_id, model) => {
      mocks.selected = model;
      openWithQuote(WORLD_PAGE, 25);

      render(<CostBreakdownModal activeTabId="IMAGE_TO_3D_WORLD" />);

      expect(screen.getByText("25 Credits")).toBeTruthy();
      expect(screen.queryByText(/not yet available/i)).toBeNull();
    },
  );

  it("still says 'not yet available' for a model that really has no price data", () => {
    // A made-up id that is on no list, on a page that has a live estimate hook.
    mocks.selected = { id: "mystery_model", selectorName: "Mystery" };
    openWithQuote("stage-3d", 9);

    render(<CostBreakdownModal activeTabId="3D" />);

    expect(screen.getByText(/not yet available/i)).toBeTruthy();
    expect(screen.queryByText("9 Credits")).toBeNull();
  });
});
