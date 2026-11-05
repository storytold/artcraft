import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ useFeatureFlagEnabled: vi.fn() }));

vi.mock("posthog-js/react", () => ({ useFeatureFlagEnabled: m.useFeatureFlagEnabled }));

import environmentVariables from "~/Classes/EnvironmentVariables";
import { FeatureFlags } from "~/enums/FeatureFlags";
import { usePosthogFeatureFlag } from "./usePosthogFeatureFlag";

beforeEach(() => {
  m.useFeatureFlagEnabled.mockReset();
  // The env store is a module-level singleton: start each test with no context.
  environmentVariables.initialize({});
});

afterEach(() => {
  cleanup();
  environmentVariables.initialize({});
});

describe("usePosthogFeatureFlag outside development", () => {
  it("asks PostHog about the flag it was given", () => {
    m.useFeatureFlagEnabled.mockReturnValue(true);
    renderHook(() => usePosthogFeatureFlag(FeatureFlags.SHOW_STYLE_PAGE));
    expect(m.useFeatureFlagEnabled).toHaveBeenCalledWith("show-style-page");
  });

  it("returns true when PostHog says the flag is on", () => {
    environmentVariables.initialize({ DEPLOY_CONTEXT: "PRODUCTION" });
    m.useFeatureFlagEnabled.mockReturnValue(true);
    const { result } = renderHook(() => usePosthogFeatureFlag(FeatureFlags.DEV_ONLY));
    expect(result.current).toBe(true);
  });

  it("returns false when PostHog says the flag is off", () => {
    environmentVariables.initialize({ DEPLOY_CONTEXT: "PRODUCTION" });
    m.useFeatureFlagEnabled.mockReturnValue(false);
    const { result } = renderHook(() => usePosthogFeatureFlag(FeatureFlags.DEV_ONLY));
    expect(result.current).toBe(false);
  });

  it("returns false (never undefined) while PostHog has not loaded its flags", () => {
    environmentVariables.initialize({ DEPLOY_CONTEXT: "PRODUCTION" });
    m.useFeatureFlagEnabled.mockReturnValue(undefined);
    const { result } = renderHook(() => usePosthogFeatureFlag(FeatureFlags.DEV_ONLY));
    expect(result.current).toBe(false);
  });

  it("does not force the flag on for staging, or when no deploy context is set", () => {
    m.useFeatureFlagEnabled.mockReturnValue(false);

    environmentVariables.initialize({ DEPLOY_CONTEXT: "STAGING" });
    const staging = renderHook(() => usePosthogFeatureFlag(FeatureFlags.DEV_ONLY));
    expect(staging.result.current).toBe(false);

    environmentVariables.initialize({});
    const unset = renderHook(() => usePosthogFeatureFlag(FeatureFlags.DEV_ONLY));
    expect(unset.result.current).toBe(false);
  });

  it("follows the flag when PostHog's answer changes between renders", () => {
    environmentVariables.initialize({ DEPLOY_CONTEXT: "PRODUCTION" });
    m.useFeatureFlagEnabled.mockReturnValue(undefined);
    const { result, rerender } = renderHook(() =>
      usePosthogFeatureFlag(FeatureFlags.SHOW_SETS_TAB),
    );
    expect(result.current).toBe(false);

    m.useFeatureFlagEnabled.mockReturnValue(true);
    rerender();
    expect(result.current).toBe(true);
  });
});

describe("usePosthogFeatureFlag in the DEVELOPMENT context", () => {
  beforeEach(() => {
    environmentVariables.initialize({ DEPLOY_CONTEXT: "DEVELOPMENT" });
  });

  it("turns every flag on, whatever PostHog says", () => {
    for (const answer of [false, undefined, true]) {
      m.useFeatureFlagEnabled.mockReturnValue(answer);
      const { result } = renderHook(() => usePosthogFeatureFlag(FeatureFlags.SHOW_SKYBOXES_TAB));
      expect(result.current).toBe(true);
    }
  });

  it("still calls the PostHog hook, so the hook order never changes between contexts", () => {
    m.useFeatureFlagEnabled.mockReturnValue(false);
    renderHook(() => usePosthogFeatureFlag(FeatureFlags.SHOW_SKYBOXES_TAB));
    expect(m.useFeatureFlagEnabled).toHaveBeenCalledTimes(1);
  });
});
