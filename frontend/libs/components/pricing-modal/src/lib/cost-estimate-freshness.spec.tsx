import { act, cleanup, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

const modelPages = vi.hoisted(() => ({
  TextToImage: "text-to-image",
  ImageToVideo: "image-to-video",
  Canvas2D: "canvas-2d",
  Stage3D: "stage-3d",
  ImageEditor: "image-editor",
  ImageTo3DWorld: "image-to-3d-world",
  ImageTo3DObject: "image-to-3d-object",
  Angles: "angles",
}));

const estimateApi = vi.hoisted(() => ({
  image: vi.fn(),
  video: vi.fn(),
  splat: vi.fn(),
}));

const promptStores = vi.hoisted(() => ({
  image: {
    commonAspectRatio: null,
    aspectRatio: "square",
    commonResolution: null,
    resolution: "1k",
    referenceImages: [] as unknown[],
    generationCount: 1,
    commonQuality: null,
  },
  prompt2D: {
    aspectRatio: "square",
    resolution: "1k",
    referenceImages: [] as unknown[],
    generationCount: 1,
  },
  prompt3D: {
    resolution: "1k",
    referenceImages: [] as unknown[],
  },
  edit: {
    aspectRatio: "square",
    resolution: "1k",
    referenceImages: [] as unknown[],
  },
  video: {
    duration: 5,
    aspectRatio: "16:9",
    resolution: "720p",
    inputMode: "reference",
    referenceImages: [] as unknown[],
    endFrameImage: undefined as unknown,
    referenceVideos: [] as unknown[],
    referenceAudios: [] as unknown[],
    generateWithSound: false,
  },
}));

vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: modelPages,
}));

vi.mock("@storyteller/api-enums", () => ({
  GenerationProvider: { Artcraft: "artcraft" },
}));

vi.mock("@storyteller/tauri-api", () => ({
  EstimateImageCost: estimateApi.image,
  EstimateVideoCost: estimateApi.video,
  EstimateSplatCost: estimateApi.splat,
  isEstimateImageCostSuccess: (result: FakeEstimateResult) =>
    result.status === "success",
  isEstimateVideoCostSuccess: (result: FakeEstimateResult) =>
    result.status === "success",
  isEstimateSplatCostSuccess: (result: FakeEstimateResult) =>
    result.status === "success",
}));

vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptImageStore: (selector: StoreSelector) =>
    selector(promptStores.image),
  usePrompt2DStore: (selector: StoreSelector) =>
    selector(promptStores.prompt2D),
  usePrompt3DStore: (selector: StoreSelector) =>
    selector(promptStores.prompt3D),
  usePromptEditStore: (selector: StoreSelector) => selector(promptStores.edit),
  usePromptVideoStore: (selector: StoreSelector) =>
    selector(promptStores.video),
}));

vi.mock("./convert/index.js", () => ({
  imageModelToCommonImageModel: (model: string) => model || null,
  imageAspectRatioToCommonAspectRatio: () => null,
  stringToCommonQuality: () => null,
  stringToCommonVideoResolution: () => null,
  videoModelToCommonVideoModel: (model: string) => model || null,
  videoAspectRatioToCommonAspectRatio: (
    _aspectRatio: string | null,
    sizeOptions: Array<{ tauriValue: string }> | undefined,
  ) => sizeOptions?.[0]?.tauriValue ?? null,
  videoStoreToGenerationMode: (
    inputMode: string,
    referenceImages: unknown[],
  ) => ({ type: inputMode, count: referenceImages.length }),
}));

import { ModelPage } from "@storyteller/ui-model-selector";
import type { Model } from "@storyteller/model-list";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
import { useImageCostEstimate } from "./useImageCostEstimate";
import { useSplatCostEstimate } from "./useSplatCostEstimate";
import { useVideoCostEstimate } from "./useVideoCostEstimate";

type StoreSelector = (state: unknown) => unknown;

interface FakeEstimateResult {
  status: "success" | "error";
  payload: {
    cost_in_credits?: number;
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

interface HookProps {
  activePage: ModelPage;
  model: Model | null;
}

type EstimateHook = (props: HookProps) => { isLoading: boolean };

interface EstimateAdapter {
  name: string;
  page: ModelPage;
  inactivePage: ModelPage;
  estimate: Mock;
  useEstimate: EstimateHook;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const success = (credits: number): FakeEstimateResult => ({
  status: "success",
  payload: { cost_in_credits: credits },
});

const model = (capabilityVersion = "first"): Model =>
  ({
    id: "same-frontend-id",
    tauriId: "same-tauri-id",
    sizeOptions: [
      {
        textLabel: "16:9",
        tauriValue: capabilityVersion,
      },
    ],
    supportsReferenceMode: capabilityVersion === "second",
  }) as unknown as Model;

function useImageEstimateHarness(props: HookProps) {
  return useImageCostEstimate(props.activePage, props.model, "artcraft");
}

function useVideoEstimateHarness(props: HookProps) {
  return useVideoCostEstimate(props.activePage, props.model, "artcraft");
}

function useSplatEstimateHarness(props: HookProps) {
  return useSplatCostEstimate(props.activePage, props.model, "artcraft");
}

const adapters: EstimateAdapter[] = [
  {
    name: "image",
    page: ModelPage.TextToImage,
    inactivePage: ModelPage.ImageToVideo,
    estimate: estimateApi.image,
    useEstimate: useImageEstimateHarness,
  },
  {
    name: "video",
    page: ModelPage.ImageToVideo,
    inactivePage: ModelPage.TextToImage,
    estimate: estimateApi.video,
    useEstimate: useVideoEstimateHarness,
  },
  {
    name: "splat",
    page: ModelPage.ImageTo3DWorld,
    inactivePage: ModelPage.TextToImage,
    estimate: estimateApi.splat,
    useEstimate: useSplatEstimateHarness,
  },
];

const creditsFor = (page: ModelPage): number | null | undefined =>
  useCostBreakdownModalStore.getState().estimatedCreditsByPage[page];

async function resolveEstimate(
  pending: Deferred<FakeEstimateResult>,
  result: FakeEstimateResult,
): Promise<void> {
  await act(async () => {
    pending.resolve(result);
    await pending.promise;
  });
}

async function rejectEstimate(
  pending: Deferred<FakeEstimateResult>,
): Promise<void> {
  await act(async () => {
    pending.reject(new Error("estimate failed"));
    await pending.promise.catch(() => undefined);
  });
}

beforeEach(() => {
  estimateApi.image.mockReset();
  estimateApi.video.mockReset();
  estimateApi.splat.mockReset();
  useCostBreakdownModalStore.setState({ estimatedCreditsByPage: {} });
});

afterEach(() => {
  cleanup();
});

describe.each(adapters)("$name cost-estimate freshness", (adapter) => {
  it("clears a stored quote when mounted inactive", () => {
    useCostBreakdownModalStore
      .getState()
      .setEstimatedCreditsForPage(adapter.page, 99);

    const { result } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.inactivePage, model: model() },
    });

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();
    expect(adapter.estimate).not.toHaveBeenCalled();
  });

  it("clears a stale credit as soon as a replacement estimate begins", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);
    useCostBreakdownModalStore
      .getState()
      .setEstimatedCreditsForPage(adapter.page, 99);

    const { result, unmount } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model() },
    });

    expect(result.current.isLoading).toBe(true);
    expect(creditsFor(adapter.page)).toBeNull();

    unmount();
    await resolveEstimate(pending, success(10));
  });

  it("keeps request B authoritative when same-ID model capabilities refresh", async () => {
    const requestA = deferred<FakeEstimateResult>();
    const requestB = deferred<FakeEstimateResult>();
    adapter.estimate
      .mockReturnValueOnce(requestA.promise)
      .mockReturnValueOnce(requestB.promise);

    const { result, rerender } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model("first") },
    });

    rerender({ activePage: adapter.page, model: model("second") });

    expect(adapter.estimate).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(true);
    expect(creditsFor(adapter.page)).toBeNull();

    await resolveEstimate(requestA, success(1));

    expect(result.current.isLoading).toBe(true);
    expect(creditsFor(adapter.page)).toBeNull();

    await resolveEstimate(requestB, success(2));

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBe(2);
  });

  it("does not write a result after unmount", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);

    const { unmount } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model() },
    });

    unmount();
    await resolveEstimate(pending, success(12));

    expect(creditsFor(adapter.page)).toBeNull();
  });

  it("clears the prior quote when its page becomes inactive", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model() },
    });

    await resolveEstimate(pending, success(7));
    expect(creditsFor(adapter.page)).toBe(7);

    rerender({ activePage: adapter.inactivePage, model: model() });

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();
  });

  it("clears the prior quote when the selected model disappears", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);
    const initialProps: HookProps = {
      activePage: adapter.page,
      model: model(),
    };
    const { result, rerender } = renderHook(adapter.useEstimate, {
      initialProps,
    });

    await resolveEstimate(pending, success(8));
    expect(creditsFor(adapter.page)).toBe(8);

    rerender({ activePage: adapter.page, model: null });

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();
  });

  it("invalidates an in-flight quote when the model is unsupported", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);
    const unsupportedModel = {
      ...model(),
      tauriId: "",
    } as Model;
    const { result, rerender } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model() },
    });

    rerender({ activePage: adapter.page, model: unsupportedModel });

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();

    await resolveEstimate(pending, success(13));

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();
  });

  it("clears loading and credits when the endpoint rejects", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model() },
    });

    await rejectEstimate(pending);

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();
  });

  it("clears loading and credits for a non-success response", async () => {
    const pending = deferred<FakeEstimateResult>();
    adapter.estimate.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(adapter.useEstimate, {
      initialProps: { activePage: adapter.page, model: model() },
    });

    await resolveEstimate(pending, { status: "error", payload: {} });

    expect(result.current.isLoading).toBe(false);
    expect(creditsFor(adapter.page)).toBeNull();
  });
});
