import { parse } from "smol-toml";
import { describe, expect, it } from "vitest";

import { PRODUCTION_UPSTREAM_API_HOST } from "../src/config";
import wranglerToml from "../wrangler.toml?raw";
import {
  environmentMappingViolations,
  type EnvBlock,
  type WranglerConfig,
} from "./helpers/environment-mapping";

/**
 * The deployment configuration is part of the security boundary: it decides which upstream
 * each environment may reach. The first block pins the real file; the second proves the
 * checks actually fire, by mutating a copy the way a careless edit would.
 */

const REAL_CONFIG = parse(wranglerToml) as unknown as WranglerConfig;

function mutated(mutate: (config: WranglerConfig) => void): WranglerConfig {
  const copy = structuredClone(REAL_CONFIG);
  mutate(copy);
  return copy;
}

function setVar(block: EnvBlock, key: string, value: string): void {
  block.vars = { ...block.vars, [key]: value };
}

function envBlock(config: WranglerConfig, name: "preview" | "production"): EnvBlock {
  const block = config.env?.[name];
  if (!block) throw new Error(`wrangler.toml has no [env.${name}] block`);
  return block;
}

describe("wrangler.toml environment mapping", () => {
  it("is sound as committed", () => {
    expect(environmentMappingViolations(REAL_CONFIG)).toEqual([]);
  });

  it("commits the expected literal hosts", () => {
    expect(REAL_CONFIG.env?.production?.vars?.UPSTREAM_API_HOST).toBe(PRODUCTION_UPSTREAM_API_HOST);
    expect(REAL_CONFIG.env?.preview?.vars?.UPSTREAM_API_HOST).toMatch(/\.workers\.dev$/);
    expect(REAL_CONFIG.vars?.UPSTREAM_API_HOST).toMatch(/^http:\/\/localhost/);
  });
});

describe("wrangler.toml checks fire on a broken mapping", () => {
  it("catches preview pointed at production", () => {
    const config = mutated((c) => {
      setVar(envBlock(c, "preview"), "UPSTREAM_API_HOST", PRODUCTION_UPSTREAM_API_HOST);
    });
    expect(environmentMappingViolations(config)).toEqual([
      "preview: must never point at the production API",
      `preview: must use a workers.dev fake upstream, got ${PRODUCTION_UPSTREAM_API_HOST}`,
    ]);
  });

  it("catches production pointed at a fake", () => {
    const config = mutated((c) => {
      setVar(
        envBlock(c, "production"),
        "UPSTREAM_API_HOST",
        "https://artcraft-api-fake.workers.dev",
      );
    });
    expect(environmentMappingViolations(config)).toEqual([
      "production: must use https://api.storyteller.ai, got https://artcraft-api-fake.workers.dev",
    ]);
  });

  it("catches local pointed at production", () => {
    const config = mutated((c) => {
      setVar(c, "UPSTREAM_API_HOST", PRODUCTION_UPSTREAM_API_HOST);
    });
    expect(environmentMappingViolations(config)).toContain(
      "local: must never point at the production API",
    );
  });

  it("catches a mislabelled environment", () => {
    const config = mutated((c) => {
      setVar(envBlock(c, "preview"), "MCP_ENVIRONMENT", "production");
    });
    expect(environmentMappingViolations(config)).toEqual([
      'preview: MCP_ENVIRONMENT must be "preview"',
    ]);
  });

  it("catches a shared KV namespace", () => {
    const config = mutated((c) => {
      envBlock(c, "preview").kv_namespaces = structuredClone(
        envBlock(c, "production").kv_namespaces ?? [],
      );
    });
    expect(environmentMappingViolations(config)).toEqual([
      "OAUTH_KV namespace ids must differ between environments",
    ]);
  });

  it("catches an extra environment such as staging", () => {
    const config = mutated((c) => {
      c.env = { ...c.env, staging: structuredClone(envBlock(c, "preview")) };
    });
    expect(environmentMappingViolations(config)[0]).toMatch(/expected exactly the environments/);
  });

  it("catches a changed entry point", () => {
    const config = mutated((c) => {
      c.main = "src/other.ts";
    });
    expect(environmentMappingViolations(config)).toEqual([
      "main must be src/index.ts, got src/other.ts",
    ]);
  });
});
