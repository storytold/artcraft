import { PRODUCTION_UPSTREAM_API_HOST } from "../../src/config";

/**
 * The wrangler.toml invariants, as a pure function over the parsed file so the tests can prove
 * they fire against a broken configuration, not only that they pass against the real one.
 */

export interface EnvBlock {
  vars?: Record<string, unknown>;
  kv_namespaces?: { binding: string; id: string }[];
}

export interface WranglerConfig extends EnvBlock {
  name: string;
  main: string;
  env?: Record<string, EnvBlock>;
}

const PREVIEW_HOST_PATTERN = /^https:\/\/[a-z0-9.-]+\.workers\.dev$/;
const LOCAL_HOST_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Returns human-readable violations; an empty array means the mapping is sound. */
export function environmentMappingViolations(config: WranglerConfig): string[] {
  const violations: string[] = [];
  const envNames = Object.keys(config.env ?? {}).sort();
  if (envNames.join(",") !== "preview,production") {
    violations.push(
      `expected exactly the environments preview,production; got ${envNames.join(",")}`,
    );
  }

  const blocks: Record<string, EnvBlock | undefined> = {
    local: config,
    preview: config.env?.preview,
    production: config.env?.production,
  };

  for (const [name, block] of Object.entries(blocks)) {
    if (!block) {
      violations.push(`${name}: block missing`);
      continue;
    }
    if (block.vars?.MCP_ENVIRONMENT !== name) {
      violations.push(`${name}: MCP_ENVIRONMENT must be "${name}"`);
    }
    const host = block.vars?.UPSTREAM_API_HOST;
    if (typeof host !== "string") {
      violations.push(`${name}: UPSTREAM_API_HOST missing`);
      continue;
    }
    if (name === "production" && host !== PRODUCTION_UPSTREAM_API_HOST) {
      violations.push(`production: must use ${PRODUCTION_UPSTREAM_API_HOST}, got ${host}`);
    }
    if (name !== "production" && host === PRODUCTION_UPSTREAM_API_HOST) {
      violations.push(`${name}: must never point at the production API`);
    }
    if (name === "preview" && !PREVIEW_HOST_PATTERN.test(host)) {
      violations.push(`preview: must use a workers.dev fake upstream, got ${host}`);
    }
    if (name === "local" && !LOCAL_HOST_PATTERN.test(host)) {
      violations.push(`local: must use a localhost upstream, got ${host}`);
    }
  }

  const kvIds = Object.entries(blocks).map(([name, block]) => {
    const kv = block?.kv_namespaces?.find((namespace) => namespace.binding === "OAUTH_KV");
    if (!kv) violations.push(`${name}: OAUTH_KV binding missing`);
    return kv?.id;
  });
  if (new Set(kvIds).size !== kvIds.length) {
    violations.push("OAUTH_KV namespace ids must differ between environments");
  }

  if (config.main !== "src/index.ts") {
    violations.push(`main must be src/index.ts, got ${config.main}`);
  }

  return violations;
}
