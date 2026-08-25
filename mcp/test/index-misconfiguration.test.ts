import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";

/**
 * The Worker entry memoizes its app per isolate. These tests re-import the module for a fresh
 * isolate-equivalent so each scenario starts from an empty cache.
 */
async function freshWorker() {
  vi.resetModules();
  const module = await import("../src/index");
  return module.default;
}

function bindings(overrides: Partial<Record<keyof Cloudflare.Env, unknown>>): Cloudflare.Env {
  return { ...env, ...overrides } as unknown as Cloudflare.Env;
}

async function fetchHealth(
  worker: Awaited<ReturnType<typeof freshWorker>>,
  workerEnv: Cloudflare.Env,
) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(new Request("https://mcp.test/healthz"), workerEnv, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

describe("worker entry with misconfigured bindings", () => {
  it("fails with a 500 that names the mismatch", async () => {
    const worker = await freshWorker();
    const response = await fetchHealth(
      worker,
      bindings({ MCP_ENVIRONMENT: "production", UPSTREAM_API_HOST: "http://localhost:12345" }),
    );
    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toMatch(/^text\/plain/);
    expect(await response.text()).toBe(
      "Worker misconfigured: production must use https://api.storyteller.ai, got http://localhost:12345",
    );
  });

  it("keeps failing on subsequent requests (the failure is memoized, not retried)", async () => {
    const worker = await freshWorker();
    const bad = bindings({
      MCP_ENVIRONMENT: "preview",
      UPSTREAM_API_HOST: "https://api.storyteller.ai",
    });
    const first = await fetchHealth(worker, bad);
    const second = await fetchHealth(worker, bad);
    expect(first.status).toBe(500);
    expect(second.status).toBe(500);
    expect(await second.text()).toMatch(/preview must never point at the production API/);
  });

  it("reports missing bindings rather than crashing", async () => {
    const worker = await freshWorker();
    const response = await fetchHealth(worker, bindings({ UPSTREAM_API_HOST: undefined }));
    expect(response.status).toBe(500);
    expect(await response.text()).toMatch(/invalid Worker bindings: UPSTREAM_API_HOST/);
  });

  it("serves normally when the bindings are sound", async () => {
    const worker = await freshWorker();
    const response = await fetchHealth(worker, env);
    expect(response.status).toBe(200);
  });
});
