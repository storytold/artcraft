import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// BuildEnvironment caches its answer in a static field, so every test loads a
// fresh copy of the module after setting the env var it wants to read.
const load = async (label: string | undefined) => {
  vi.resetModules();
  if (label === undefined) {
    vi.stubEnv("VITE_ENVIRONMENT_TYPE", undefined);
  } else {
    vi.stubEnv("VITE_ENVIRONMENT_TYPE", label);
  }
  return await import("./BuildEnvironment");
};

beforeEach(() => {
  // The module logs what it read; keep test output clean.
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("BuildEnvironment.getInstance maps VITE_ENVIRONMENT_TYPE", () => {
  it.each([
    ["dev", "Dev"],
    ["development", "Dev"],
    ["dev-proxy", "DevProxy"],
    ["devproxy", "DevProxy"],
    ["stage", "Staging"],
    ["staging", "Staging"],
  ] as const)("%s -> %s", async (label, expected) => {
    const mod = await load(label);
    expect(mod.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
      mod.BuildEnvironmentType[expected],
    );
  });

  it("ignores case, so DEVELOPMENT and Staging work", async () => {
    const dev = await load("DEVELOPMENT");
    expect(dev.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
      dev.BuildEnvironmentType.Dev,
    );
    const staging = await load("Staging");
    expect(staging.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
      staging.BuildEnvironmentType.Staging,
    );
  });

  it("falls back to Production when the variable is unset", async () => {
    const mod = await load(undefined);
    expect(mod.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
      mod.BuildEnvironmentType.Production,
    );
  });

  it("falls back to Production for an empty, unknown or misspelled value", async () => {
    for (const label of ["", "production", "prod", "stagging", "dev "]) {
      const mod = await load(label);
      expect(mod.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
        mod.BuildEnvironmentType.Production,
      );
    }
  });
});

describe("BuildEnvironment singleton", () => {
  it("returns the same instance every time", async () => {
    const mod = await load("staging");
    expect(mod.BuildEnvironment.getInstance()).toBe(mod.BuildEnvironment.getInstance());
    expect(mod.GetBuildEnvironment()).toBe(mod.BuildEnvironment.getInstance());
  });

  it("keeps the first answer even if the variable changes afterwards", async () => {
    const mod = await load("dev");
    expect(mod.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
      mod.BuildEnvironmentType.Dev,
    );
    vi.stubEnv("VITE_ENVIRONMENT_TYPE", "staging");
    expect(mod.GetBuildEnvironment().getBuildEnvironmentType()).toBe(
      mod.BuildEnvironmentType.Dev,
    );
  });

  it("does not read the variable at import time, only on first use", async () => {
    const mod = await load("staging");
    expect(console.log).not.toHaveBeenCalled();
    mod.GetBuildEnvironment();
    expect(console.log).toHaveBeenCalled();
  });
});
