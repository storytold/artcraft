import { describe, expect, it } from "vitest";

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

  it("references MCP_ENVIRONMENT only in src/config.ts", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !ALLOWED_FILES.includes(path))
      .filter(([, source]) => source.includes("MCP_ENVIRONMENT"))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("never branches on the environment name outside src/config.ts", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !ALLOWED_FILES.includes(path))
      .filter(([, source]) =>
        /environment\s*(===|!==|==|!=)\s*["'](local|preview|production)["']/.test(source),
      )
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
