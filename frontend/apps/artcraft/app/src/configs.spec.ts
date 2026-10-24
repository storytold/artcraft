import { describe, expect, it } from "vitest";

import { BuildEnvironmentType } from "./BuildEnvironment";
import { Configs, Environment } from "./configs";

const urlFields = (config: Configs) => [
  config.baseApi,
  config.cdnApi,
  config.funnelApi,
  config.googleApi,
  config.gravatarApi,
  config.mediaVideoApi,
  config.uploadApiVideo,
  config.uploadVideoApi,
];

describe("Configs per build environment", () => {
  it("Dev talks to the local API for both the API and uploads, and keeps the premium lock", () => {
    const config = new Configs(BuildEnvironmentType.Dev);
    expect(config.deployContext).toBe("DEVELOPMENT");
    expect(config.baseApi).toBe("http://localhost:12345");
    expect(config.uploadApiVideo).toBe("http://localhost:12345");
    expect(config.premiumLock).toBe(true);
  });

  it("Dev still uses the hosted CDN and style server", () => {
    const config = new Configs(BuildEnvironmentType.Dev);
    expect(config.cdnApi).toBe("https://cdn.storyteller.ai");
    expect(config.funnelApi).toBe("https://style.storyteller.ai");
  });

  it("DevProxy is a development context but keeps the hosted API", () => {
    const config = new Configs(BuildEnvironmentType.DevProxy);
    expect(config.deployContext).toBe("DEVELOPMENT");
    expect(config.baseApi).toBe("https://api.storyteller.ai");
    expect(config.uploadApiVideo).toBe("https://upload.storyteller.ai");
    expect(config.premiumLock).toBe(true);
  });

  it("Staging is its own context with the premium lock on", () => {
    const config = new Configs(BuildEnvironmentType.Staging);
    expect(config.deployContext).toBe("STAGING");
    expect(config.baseApi).toBe("https://api.storyteller.ai");
    expect(config.premiumLock).toBe(true);
  });

  it("Production is the only environment that lifts the premium lock", () => {
    const lockFor = (env: BuildEnvironmentType) => new Configs(env).premiumLock;
    expect(new Configs(BuildEnvironmentType.Production).deployContext).toBe("PRODUCTION");
    expect(lockFor(BuildEnvironmentType.Production)).toBe(false);
    expect(lockFor(BuildEnvironmentType.Staging)).toBe(true);
    expect(lockFor(BuildEnvironmentType.DevProxy)).toBe(true);
    expect(lockFor(BuildEnvironmentType.Dev)).toBe(true);
  });

  it("never points staging or production at a plain-http or localhost URL", () => {
    for (const env of [BuildEnvironmentType.Staging, BuildEnvironmentType.Production]) {
      for (const url of urlFields(new Configs(env))) {
        expect(url.startsWith("https://")).toBe(true);
        expect(url).not.toContain("localhost");
      }
    }
  });

  it("keeps the local overrides to the Dev instance (instances do not share state)", () => {
    const dev = new Configs(BuildEnvironmentType.Dev);
    const production = new Configs(BuildEnvironmentType.Production);
    expect(dev.baseApi).not.toBe(production.baseApi);
    expect(production.baseApi).toBe("https://api.storyteller.ai");
    // A third instance built afterwards is unaffected by the Dev one.
    expect(new Configs(BuildEnvironmentType.Staging).baseApi).toBe(
      "https://api.storyteller.ai",
    );
  });

  it("leaves deployContext unset for a value outside the known environments", () => {
    // Edge: BuildEnvironment only ever yields the four known values, so this
    // documents what a stray number does rather than a path that can happen.
    const config = new Configs(99 as unknown as BuildEnvironmentType);
    expect(config.deployContext).toBeUndefined();
    expect(config.premiumLock).toBe(true);
  });
});

describe("Environment enum", () => {
  it("has the same numeric values as BuildEnvironmentType, so they are interchangeable", () => {
    expect(Environment.Dev).toBe(BuildEnvironmentType.Dev);
    expect(Environment.DevProxy).toBe(BuildEnvironmentType.DevProxy);
    expect(Environment.Staging).toBe(BuildEnvironmentType.Staging);
    expect(Environment.Production).toBe(BuildEnvironmentType.Production);
  });
});
