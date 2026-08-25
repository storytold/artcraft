import { describe, expect, it } from "vitest";

import { SCOPE_DESCRIPTIONS } from "../../src/auth/consent-page";
import { SCOPES } from "../../src/auth/oauth";
import { mcpEndpoint, renderLandingPage } from "../../src/pages/landing";
import { call } from "../helpers/oauth-client";

const VIEW = { origin: "https://mcp.getartcraft.com", scriptNonce: "nonce-value" };

describe("landing page", () => {
  it("states the endpoint once per client, from the public origin", () => {
    const html = renderLandingPage(VIEW);
    expect(mcpEndpoint(VIEW.origin)).toBe("https://mcp.getartcraft.com/mcp");
    expect(html).toContain("<code>https://mcp.getartcraft.com/mcp</code>");
    expect(html).toContain(
      "claude mcp add --transport http artcraft https://mcp.getartcraft.com/mcp",
    );
    expect(html).toContain("&quot;httpUrl&quot;: &quot;https://mcp.getartcraft.com/mcp&quot;");
    expect(html).toContain("&quot;url&quot;: &quot;https://mcp.getartcraft.com/mcp&quot;");
  });

  it("says what it can do — exactly the granted scopes — and what it cannot", () => {
    const html = renderLandingPage(VIEW);
    for (const scope of SCOPES) expect(html).toContain(SCOPE_DESCRIPTIONS[scope]);
    expect(html).toContain(
      "cannot generate anything, spend credits, upload, or change your account",
    );
    expect(html).toContain("public pricing");
  });

  it("links to the connections page and states the 90-day lifetime", () => {
    const html = renderLandingPage(VIEW);
    expect(html).toContain('href="/connections"');
    expect(html).toContain("expire after 90 days");
  });

  it("carries the style nonce and nothing executable", () => {
    const html = renderLandingPage(VIEW);
    expect(html).toContain('<style nonce="nonce-value">');
    expect(html).not.toContain("<script");
  });
});

describe("GET /", () => {
  it("serves the landing page for the request's own origin with a CSP", async () => {
    const response = await call("/");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    expect(response.headers.get("content-security-policy")).toMatch(/style-src 'nonce-/);
    const html = await response.text();
    expect(html).toContain("<code>https://mcp.test/mcp</code>");
  });
});
