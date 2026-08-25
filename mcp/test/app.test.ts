import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { loadConfig } from "../src/config";
import worker from "../src/index";

describe("createApp", () => {
  it("serves /healthz with the environment name", async () => {
    const app = createApp({ environment: "local", upstreamApiHost: "http://localhost:12345" });
    const response = await app.request("/healthz");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, environment: "local" });
  });

  it("returns 404 for unknown routes", async () => {
    const app = createApp({ environment: "local", upstreamApiHost: "http://localhost:12345" });
    const response = await app.request("/nope");
    expect(response.status).toBe(404);
  });
});

describe("worker entry", () => {
  it("boots from the wrangler.toml local bindings", () => {
    // The test runner loads the top-level (local) block of wrangler.toml; it must satisfy the
    // environment invariant or nothing else in this suite is trustworthy.
    expect(loadConfig(env).environment).toBe("local");
  });

  it("serves /healthz through the default export", async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(new Request("https://mcp.test/healthz"), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, environment: "local" });
  });
});
