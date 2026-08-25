import { describe, expect, it } from "vitest";

import {
  CSRF_COOKIE_NAME,
  csrfCookieHeader,
  csrfTokensMatch,
  generateCsrfToken,
  readCsrfCookie,
} from "../../src/auth/csrf";

describe("csrf tokens", () => {
  it("generates 43-character base64url tokens that differ every time", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });

  it("matches only identical well-formed tokens", () => {
    const token = generateCsrfToken();
    expect(csrfTokensMatch(token, token)).toBe(true);
    expect(csrfTokensMatch(token, generateCsrfToken())).toBe(false);
    expect(csrfTokensMatch(token, undefined)).toBe(false);
    expect(csrfTokensMatch(undefined, token)).toBe(false);
    expect(csrfTokensMatch("", "")).toBe(false);
    expect(csrfTokensMatch("short", "short")).toBe(false);
    expect(csrfTokensMatch(`${token.slice(0, 42)}!`, `${token.slice(0, 42)}!`)).toBe(false);
  });

  it("round-trips through the cookie header", () => {
    const token = generateCsrfToken();
    const header = csrfCookieHeader(token, true);
    expect(header).toBe(
      `${CSRF_COOKIE_NAME}=${token}; Path=/authorize; Max-Age=900; HttpOnly; SameSite=Lax; Secure`,
    );
    const request = new Request("https://mcp.test/authorize", {
      headers: { cookie: `other=1; ${CSRF_COOKIE_NAME}=${token}; more=2` },
    });
    expect(readCsrfCookie(request)).toBe(token);
  });

  it("omits Secure over plain http (local development)", () => {
    expect(csrfCookieHeader(generateCsrfToken(), false)).not.toContain("Secure");
  });

  it("reads nothing when the cookie is absent", () => {
    expect(readCsrfCookie(new Request("https://mcp.test/authorize"))).toBeUndefined();
  });
});
