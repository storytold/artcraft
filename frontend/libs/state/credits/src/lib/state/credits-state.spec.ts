import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCredits = vi.fn();
vi.mock("@storyteller/tauri-api", () => ({ ArtcraftGetCredits: () => getCredits() }));

import { useCreditsState } from "./credits-state";

const PAYLOAD = { payload: { free_credits: 1, monthly_credits: 2, banked_credits: 3, sum_total_credits: 6 } };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  getCredits.mockReset();
  useCreditsState.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCreditsState.fetchFromServer", () => {
  it("stores the credits and keeps the icon hidden on a normal fetch", async () => {
    getCredits.mockResolvedValue(PAYLOAD);
    await useCreditsState.getState().fetchFromServer();
    expect(useCreditsState.getState()).toMatchObject({ freeCredits: 1, monthlyCredits: 2, bankedCredits: 3, totalCredits: 6, iconStatus: "hidden" });
  });

  it("shows the slow icon after three seconds, then flashes recovered and hides it", async () => {
    const pending = deferred<typeof PAYLOAD>();
    getCredits.mockReturnValue(pending.promise);
    const fetching = useCreditsState.getState().fetchFromServer();
    await vi.advanceTimersByTimeAsync(3000);
    expect(useCreditsState.getState().iconStatus).toBe("slow");

    pending.resolve(PAYLOAD);
    await fetching;
    expect(useCreditsState.getState().iconStatus).toBe("recovered");

    await vi.advanceTimersByTimeAsync(1000);
    expect(useCreditsState.getState().iconStatus).toBe("hidden");
  });

  it("marks a rejected or empty response as failed and keeps the old credits", async () => {
    getCredits.mockResolvedValueOnce(PAYLOAD);
    await useCreditsState.getState().fetchFromServer();

    getCredits.mockRejectedValueOnce(new Error("offline"));
    await useCreditsState.getState().fetchFromServer();
    expect(useCreditsState.getState()).toMatchObject({ iconStatus: "failed", totalCredits: 6 });

    getCredits.mockResolvedValueOnce({ payload: null });
    await useCreditsState.getState().fetchFromServer();
    expect(useCreditsState.getState()).toMatchObject({ iconStatus: "failed", totalCredits: 6 });
  });

  it("recovers from a failure", async () => {
    getCredits.mockRejectedValueOnce(new Error("offline"));
    await useCreditsState.getState().fetchFromServer();
    getCredits.mockResolvedValueOnce(PAYLOAD);
    await useCreditsState.getState().fetchFromServer();
    expect(useCreditsState.getState().iconStatus).toBe("recovered");
  });

  it("ignores a stale response when a newer fetch has started", async () => {
    const first = deferred<typeof PAYLOAD>();
    const second = deferred<typeof PAYLOAD>();
    getCredits.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const firstFetch = useCreditsState.getState().fetchFromServer();
    const secondFetch = useCreditsState.getState().fetchFromServer();

    second.resolve({ payload: { free_credits: 0, monthly_credits: 0, banked_credits: 9, sum_total_credits: 9 } });
    await secondFetch;
    first.resolve(PAYLOAD);
    await firstFetch;

    expect(useCreditsState.getState().totalCredits).toBe(9);
  });

  it("drops a response that arrives after reset", async () => {
    const pending = deferred<typeof PAYLOAD>();
    getCredits.mockReturnValue(pending.promise);
    const fetching = useCreditsState.getState().fetchFromServer();
    useCreditsState.getState().reset();
    pending.resolve(PAYLOAD);
    await fetching;
    expect(useCreditsState.getState()).toMatchObject({ totalCredits: 0, iconStatus: "hidden" });
  });
});
