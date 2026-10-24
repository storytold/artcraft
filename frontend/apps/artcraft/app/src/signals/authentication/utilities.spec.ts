import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

const m = vi.hoisted(() => ({
  flushMedia: vi.fn(),
  resetCredits: vi.fn(),
  resetSubscription: vi.fn(),
  clearGalleryCache: vi.fn(),
}));

// Real signals (so the assertions read actual state), mocked collaborators.
vi.mock("~/signals", async () => {
  const { signal } = await import("@preact/signals-core");
  return {
    authentication: {
      status: signal("INIT"),
      userInfo: signal(undefined),
      activeSubs: signal(undefined),
    },
    flushAllBackgroundLoadedMedia: m.flushMedia,
  };
});
vi.mock("~/enums", () => ({
  AUTH_STATUS: { INIT: "INIT", LOGGED_IN: "logged_in", LOGGED_OUT: "logged_out" },
}));
vi.mock("@storyteller/credits", () => ({
  useCreditsState: { getState: () => ({ reset: m.resetCredits }) },
}));
vi.mock("@storyteller/subscription", () => ({
  useSubscriptionState: { getState: () => ({ reset: m.resetSubscription }) },
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  clearGalleryCache: m.clearGalleryCache,
}));

import { AUTH_STATUS } from "~/enums";
import type { ActiveSubscriptions, UserInfo } from "~/models";
import { authentication } from "~/signals";
import {
  setLogoutStates,
  updateActiveSubscriptions,
  updateAuthStatus,
  updateUserInfo,
} from "./utilities";

// These tests only care about a few fields of the (very large) UserInfo.
const user = (fields: Record<string, unknown>) => fields as unknown as UserInfo;

let logSpy: MockInstance<typeof console.log>;

beforeEach(() => {
  vi.clearAllMocks();
  // updateAuthStatus logs; keep the test output clean and let us assert on it.
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  authentication.status.value = AUTH_STATUS.INIT;
  authentication.userInfo.value = undefined;
  authentication.activeSubs.value = undefined;
});

afterEach(() => {
  logSpy.mockRestore();
});

describe("updateAuthStatus", () => {
  it("writes the new status to the signal", () => {
    updateAuthStatus(AUTH_STATUS.LOGGED_IN);
    expect(authentication.status.value).toBe(AUTH_STATUS.LOGGED_IN);
  });

  it("can move back to an earlier status (no one-way transition guard)", () => {
    updateAuthStatus(AUTH_STATUS.LOGGED_IN);
    updateAuthStatus(AUTH_STATUS.INIT);
    expect(authentication.status.value).toBe(AUTH_STATUS.INIT);
  });
});

describe("updateUserInfo", () => {
  it("sets the user when there was none", () => {
    updateUserInfo(user({ username: "ada" }));
    expect(authentication.userInfo.value).toEqual({ username: "ada" });
  });

  it("merges a partial update into the existing user", () => {
    authentication.userInfo.value = user({ username: "ada", email: "a@b.c" });
    updateUserInfo(user({ username: "grace", can_use_tts: true }));
    expect(authentication.userInfo.value).toEqual({
      username: "grace",
      email: "a@b.c",
      can_use_tts: true,
    });
  });

  it("replaces the user outright when flush is true, dropping old fields", () => {
    authentication.userInfo.value = user({ username: "ada", email: "a@b.c" });
    updateUserInfo(user({ username: "grace" }), true);
    expect(authentication.userInfo.value).toEqual({ username: "grace" });
  });

  it("clears the user when given undefined, with or without flush", () => {
    authentication.userInfo.value = user({ username: "ada" });
    updateUserInfo(undefined);
    expect(authentication.userInfo.value).toBeUndefined();

    authentication.userInfo.value = user({ username: "ada" });
    updateUserInfo(undefined, true);
    expect(authentication.userInfo.value).toBeUndefined();
  });

  it("produces a new object on a merge instead of mutating the old one", () => {
    const before = user({ username: "ada" });
    authentication.userInfo.value = before;
    updateUserInfo(user({ email: "a@b.c" }));
    expect(authentication.userInfo.value).not.toBe(before);
    expect(before).toEqual({ username: "ada" });
  });

  it("does not write the profile to the console", () => {
    updateUserInfo(user({ username: "ada", email: "secret@example.com" }));
    const logged = JSON.stringify(logSpy.mock.calls);
    expect(logged).not.toContain("secret@example.com");
  });
});

describe("updateActiveSubscriptions", () => {
  it("stores the subscriptions and clears them again", () => {
    const subs: ActiveSubscriptions = { active_subscriptions: [] };
    updateActiveSubscriptions(subs);
    expect(authentication.activeSubs.value).toBe(subs);

    updateActiveSubscriptions(undefined);
    expect(authentication.activeSubs.value).toBeUndefined();
  });
});

describe("setLogoutStates", () => {
  it("marks the user logged out and clears user and subscription state", () => {
    authentication.status.value = AUTH_STATUS.LOGGED_IN;
    authentication.userInfo.value = user({ username: "ada" });
    authentication.activeSubs.value = { active_subscriptions: [] };

    setLogoutStates();

    expect(authentication.status.value).toBe(AUTH_STATUS.LOGGED_OUT);
    expect(authentication.userInfo.value).toBeUndefined();
    expect(authentication.activeSubs.value).toBeUndefined();
  });

  it("also empties the media signals, the credits and subscription stores and the gallery cache", () => {
    setLogoutStates();
    expect(m.flushMedia).toHaveBeenCalledTimes(1);
    expect(m.resetCredits).toHaveBeenCalledTimes(1);
    expect(m.resetSubscription).toHaveBeenCalledTimes(1);
    expect(m.clearGalleryCache).toHaveBeenCalledTimes(1);
  });

  it("is safe to call when already logged out (idempotent)", () => {
    setLogoutStates();
    setLogoutStates();
    expect(authentication.status.value).toBe(AUTH_STATUS.LOGGED_OUT);
    expect(authentication.userInfo.value).toBeUndefined();
    expect(m.clearGalleryCache).toHaveBeenCalledTimes(2);
  });
});
