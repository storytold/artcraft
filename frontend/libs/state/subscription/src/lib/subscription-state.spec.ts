import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSubscription } = vi.hoisted(() => ({ getSubscription: vi.fn() }));

vi.mock("@storyteller/tauri-api", () => ({
  ArtcraftGetSubscription: getSubscription,
}));

import { useSubscriptionState } from "./subscription-state";

// Builds a server response carrying one active subscription.
const response = (token: string) => ({
  payload: {
    active_subscription: {
      subscription_token: token,
      product_slug: "pro",
      namespace: "artcraft",
    },
  },
});

// Returns a promise plus its resolver, to control response ordering.
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe("useSubscriptionState.fetchFromServer", () => {
  beforeEach(() => {
    getSubscription.mockReset();
    useSubscriptionState.setState({ subscriptionInfo: undefined });
  });

  it("does not let a slow older response overwrite a newer one", async () => {
    const slow = deferred<unknown>();
    const fast = deferred<unknown>();
    getSubscription
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);

    const first = useSubscriptionState.getState().fetchFromServer();
    const second = useSubscriptionState.getState().fetchFromServer();
    fast.resolve(response("new"));
    await second;
    slow.resolve(response("old"));
    await first;

    expect(useSubscriptionState.getState().subscriptionInfo?.subscriptionToken).toBe("new");
  });

  it("does not repopulate after reset() ran while a fetch was in flight", async () => {
    const pending = deferred<unknown>();
    getSubscription.mockReturnValueOnce(pending.promise);

    const run = useSubscriptionState.getState().fetchFromServer();
    useSubscriptionState.getState().reset();
    pending.resolve(response("previous-user"));
    await run;

    expect(useSubscriptionState.getState().subscriptionInfo).toBeUndefined();
  });

  it("tolerates an undefined response without throwing", async () => {
    getSubscription.mockResolvedValueOnce(undefined);
    await expect(useSubscriptionState.getState().fetchFromServer()).resolves.toBeUndefined();
  });
});
