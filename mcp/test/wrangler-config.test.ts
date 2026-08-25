import { parse } from "smol-toml";
import { describe, expect, it } from "vitest";

import { PRODUCTION_UPSTREAM_API_HOST } from "../src/config";
import wranglerToml from "../wrangler.toml?raw";

/**
 * The deployment configuration is part of the security boundary: it decides which upstream
 * each environment may reach. These tests pin the mapping so a wrangler.toml edit that points
 * preview at production (or production anywhere else) fails CI before it can deploy.
 */

interface EnvBlock {
  vars?: Record<string, unknown>;
  kv_namespaces?: { binding: string; id: string }[];
}

interface WranglerConfig extends EnvBlock {
  name: string;
  main: string;
  env?: Record<string, EnvBlock>;
}

const config = parse(wranglerToml) as unknown as WranglerConfig;
const envs = {
  local: config,
  preview: config.env?.preview,
  production: config.env?.production,
};

describe("wrangler.toml environment mapping", () => {
  it("declares exactly the three environments", () => {
    expect(Object.keys(config.env ?? {}).sort()).toEqual(["preview", "production"]);
    expect(envs.preview).toBeDefined();
    expect(envs.production).toBeDefined();
  });

  it("names each environment in MCP_ENVIRONMENT", () => {
    expect(envs.local.vars?.MCP_ENVIRONMENT).toBe("local");
    expect(envs.preview?.vars?.MCP_ENVIRONMENT).toBe("preview");
    expect(envs.production?.vars?.MCP_ENVIRONMENT).toBe("production");
  });

  it("points production at the real API, and nothing else at it", () => {
    expect(envs.production?.vars?.UPSTREAM_API_HOST).toBe(PRODUCTION_UPSTREAM_API_HOST);
    expect(envs.preview?.vars?.UPSTREAM_API_HOST).not.toBe(PRODUCTION_UPSTREAM_API_HOST);
    expect(envs.local.vars?.UPSTREAM_API_HOST).not.toBe(PRODUCTION_UPSTREAM_API_HOST);
  });

  it("points preview at a workers.dev fake and local at localhost", () => {
    expect(envs.preview?.vars?.UPSTREAM_API_HOST).toMatch(/^https:\/\/[a-z0-9.-]+\.workers\.dev$/);
    expect(envs.local.vars?.UPSTREAM_API_HOST).toMatch(
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    );
  });

  it("gives every environment its own OAUTH_KV namespace", () => {
    const ids = [envs.local, envs.preview, envs.production].map((block) => {
      const kv = block?.kv_namespaces?.find((namespace) => namespace.binding === "OAUTH_KV");
      expect(kv).toBeDefined();
      return kv?.id;
    });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses the same entry point for every environment", () => {
    expect(config.main).toBe("src/index.ts");
  });
});
