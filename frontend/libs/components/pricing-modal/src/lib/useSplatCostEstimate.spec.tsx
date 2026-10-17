import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useSplatCostEstimate } from "./useSplatCostEstimate";

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  setCredits: vi.fn(),
}));

vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: { ImageTo3DWorld: "image_to_3d_world" },
}));
vi.mock("@storyteller/api-enums", () => ({
  GenerationProvider: { Artcraft: "artcraft" },
}));
vi.mock("@storyteller/tauri-api", () => ({
  EstimateSplatCost: mocks.estimate,
  isEstimateSplatCostSuccess: (result: any) => result.status === "success",
}));
vi.mock("./cost-breakdown-modal-store", () => ({
  useCostBreakdownModalStore: (select: any) =>
    select({ setEstimatedCreditsForPage: mocks.setCredits }),
}));

const PAGE = "image_to_3d_world" as any;
const priced = { id: "priced", tauriId: "marble" } as any;
const unpriced = { id: "unpriced", tauriId: undefined } as any;

beforeEach(() => {
  mocks.estimate.mockReset();
  mocks.setCredits.mockReset();
});

it("stops loading when the selection changes to a model with no tauriId mid-request", async () => {
  // The first request never settles, so only the effect itself can clear loading.
  mocks.estimate.mockImplementation(() => new Promise(() => {}));
  const hook = renderHook(
    ({ selected }) => useSplatCostEstimate(PAGE, selected, "artcraft"),
    { initialProps: { selected: priced } },
  );
  await waitFor(() => expect(hook.result.current.isLoading).toBe(true));

  hook.rerender({ selected: unpriced });

  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  expect(mocks.setCredits).toHaveBeenLastCalledWith(PAGE, null);
});

it("reports the quote and clears loading for a model that has a tauriId", async () => {
  mocks.estimate.mockResolvedValue({
    status: "success",
    payload: { cost_in_credits: 12 },
  });
  const hook = renderHook(() => useSplatCostEstimate(PAGE, priced, "artcraft"));
  await waitFor(() =>
    expect(mocks.setCredits).toHaveBeenLastCalledWith(PAGE, 12),
  );
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
});
