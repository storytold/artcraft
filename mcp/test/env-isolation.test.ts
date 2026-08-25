import { describe, expect, it } from "vitest";

import { environmentNameOffenders } from "./helpers/environment-name-offenders";

/**
 * `MCP_ENVIRONMENT` exists so the Worker can assert its configuration at startup. It must not
 * become a behaviour switch. The only file allowed to mention it is src/config.ts; anything
 * else reading it is, by construction, an `if (env)` branch — exactly what this project
 * forbids (mcp/CLAUDE.md → Environments).
 */
const sources = import.meta.glob<string>("../src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ALLOWED_FILES = ["../src/config.ts"];

describe("environment-name isolation", () => {
  it("has loaded the server sources", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0);
    expect(Object.keys(sources)).toContain("../src/config.ts");
  });

  it("finds no offenders in the committed tree", () => {
    expect(environmentNameOffenders(sources, ALLOWED_FILES)).toEqual({
      readsBinding: [],
      branches: [],
    });
  });
});

describe("environment-name checks fire on an offender", () => {
  it("catches a file that reads the binding", () => {
    const result = environmentNameOffenders(
      { "../src/leak.ts": 'const isProd = env.MCP_ENVIRONMENT === "production";' },
      ALLOWED_FILES,
    );
    expect(result.readsBinding).toEqual(["../src/leak.ts"]);
  });

  it("catches a file that branches on the environment name", () => {
    const result = environmentNameOffenders(
      { "../src/leak.ts": 'if (config.environment !== "production") { grantFreeCredits(); }' },
      ALLOWED_FILES,
    );
    expect(result.branches).toEqual(["../src/leak.ts"]);
  });

  it("still allows config.ts itself", () => {
    const result = environmentNameOffenders(
      { "../src/config.ts": "MCP_ENVIRONMENT: z.enum([...])" },
      ALLOWED_FILES,
    );
    expect(result).toEqual({ readsBinding: [], branches: [] });
  });
});
