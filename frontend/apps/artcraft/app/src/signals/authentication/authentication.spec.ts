import { beforeEach, describe, expect, it, vi } from "vitest";

// Use the real enum definitions, but without pulling in the whole "~/enums"
// barrel (its toasts re-export drags in the 3D page-scene package).
vi.mock("~/enums", async () => {
  const auth = await import("~/enums/authentication");
  const billing = await import("~/enums/Billing");
  return { ...auth, ...billing };
});

import { AUTH_STATUS, LoyaltyProgram, SubscriptionNamespace, SubscriptionProduct } from "~/enums";
import type { ActiveSubscriptions, UserInfo } from "~/models";
import { authentication } from "./authentication";

const subscription = {
  namespace: SubscriptionNamespace.ARTCRAFT,
  product_slug: SubscriptionProduct.PLUS,
};

beforeEach(() => {
  // The signals are module-level singletons, so put them back between tests.
  authentication.status.value = AUTH_STATUS.INIT;
  authentication.userInfo.value = undefined;
  authentication.activeSubs.value = undefined;
});

describe("authentication signals: initial state", () => {
  it("starts INIT with no user and no subscriptions", async () => {
    // A fresh copy of the module, so earlier tests cannot have changed it.
    vi.resetModules();
    const fresh = (await import("./authentication")).authentication;
    expect(fresh.status.value).toBe(AUTH_STATUS.INIT);
    expect(fresh.userInfo.value).toBeUndefined();
    expect(fresh.activeSubs.value).toBeUndefined();
    expect(fresh.hasPremium.value).toBeUndefined();
  });
});

describe("authentication.canUpload3D / hasAccess", () => {
  it("is true for everyone, even before a user has loaded", () => {
    expect(authentication.canUpload3D.value).toBe(true);
    expect(authentication.hasAccess.value).toBe(true);
  });

  it("ignores the legacy per-user feature flags and studio access flag", () => {
    authentication.userInfo.value = {
      can_access_studio: false,
      maybe_feature_flags: [],
    } as unknown as UserInfo;
    expect(authentication.canUpload3D.value).toBe(true);
    expect(authentication.hasAccess.value).toBe(true);
  });
});

describe("authentication.hasPremium", () => {
  it("is undefined (unknown) until subscriptions have loaded, not false", () => {
    expect(authentication.hasPremium.value).toBeUndefined();
  });

  it("is false for a loaded account with no subscription and no loyalty program", () => {
    authentication.activeSubs.value = { active_subscriptions: [] };
    expect(authentication.hasPremium.value).toBe(false);
  });

  it("is true with at least one active subscription", () => {
    authentication.activeSubs.value = { active_subscriptions: [subscription] };
    expect(authentication.hasPremium.value).toBe(true);
  });

  it("is true for a contributor even with no subscription", () => {
    authentication.activeSubs.value = {
      active_subscriptions: [],
      maybe_loyalty_program: LoyaltyProgram.CONTRIBUTOR,
    };
    expect(authentication.hasPremium.value).toBe(true);
  });

  it("is false when the loyalty program is some unrecognised value", () => {
    authentication.activeSubs.value = {
      active_subscriptions: [],
      maybe_loyalty_program: "something_else" as unknown as LoyaltyProgram,
    };
    expect(authentication.hasPremium.value).toBe(false);
  });

  it("recomputes as subscriptions arrive and as they are cleared (logout)", () => {
    const loaded: ActiveSubscriptions = { active_subscriptions: [subscription] };
    authentication.activeSubs.value = { active_subscriptions: [] };
    expect(authentication.hasPremium.value).toBe(false);

    authentication.activeSubs.value = loaded;
    expect(authentication.hasPremium.value).toBe(true);

    authentication.activeSubs.value = undefined;
    expect(authentication.hasPremium.value).toBeUndefined();
  });
});
