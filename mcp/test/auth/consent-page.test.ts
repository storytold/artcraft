import { describe, expect, it } from "vitest";

import {
  CONSENT_FORM_FIELDS,
  type ConsentView,
  renderConsentPage,
  SCOPE_DESCRIPTIONS,
} from "../../src/auth/consent-page";
import { SCOPES } from "../../src/auth/oauth";

const BASE: ConsentView = {
  clientName: "Claude",
  redirectHost: "claude.ai",
  isLoopbackRedirect: false,
  scopes: SCOPES,
  authRequestQuery: "response_type=code&client_id=abc&state=s%26t",
  csrfToken: "csrf-token-value",
  scriptNonce: "nonce-value",
};

describe("consent page", () => {
  it("tells the user who is asking, what they get, and where they go next", () => {
    const html = renderConsentPage(BASE);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Allow <strong>Claude</strong> to read your Artcraft account?");
    for (const scope of SCOPES) expect(html).toContain(SCOPE_DESCRIPTIONS[scope]);
    expect(html).toContain("cannot generate anything or spend credits");
    expect(html).toContain("<code>claude.ai</code>");
    expect(html).not.toContain("on your own computer");
  });

  it("carries the auth request and CSRF token as hidden fields, escaped", () => {
    const html = renderConsentPage(BASE);
    expect(html).toContain(
      `name="${CONSENT_FORM_FIELDS.authRequest}" value="response_type=code&amp;client_id=abc&amp;state=s%26t"`,
    );
    expect(html).toContain(`name="${CONSENT_FORM_FIELDS.csrf}" value="csrf-token-value"`);
    expect(html).toContain(`name="${CONSENT_FORM_FIELDS.action}" value="allow"`);
    expect(html).toContain(`name="${CONSENT_FORM_FIELDS.action}" value="deny"`);
    expect(html).toContain('method="post" action="/authorize"');
  });

  it("escapes a hostile client name instead of rendering it", () => {
    const html = renderConsentPage({ ...BASE, clientName: `<img src=x onerror="alert(1)">` });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("escapes a hostile error message and prefilled username", () => {
    const html = renderConsentPage({
      ...BASE,
      error: `<script>bad()</script>`,
      usernameOrEmail: `" autofocus onfocus="x`,
    });
    expect(html).not.toContain("<script>bad()");
    expect(html).toContain("&lt;script&gt;bad()&lt;/script&gt;");
    expect(html).toContain('value="&quot; autofocus onfocus=&quot;x"');
  });

  it("warns explicitly about loopback redirects", () => {
    const html = renderConsentPage({
      ...BASE,
      redirectHost: "localhost:3118",
      isLoopbackRedirect: true,
    });
    expect(html).toContain("<code>localhost:3118</code>");
    expect(html).toContain("on your own computer");
  });

  it("renders the Google button and its nonce'd callback only when a client id is configured", () => {
    const without = renderConsentPage(BASE);
    expect(without).not.toContain("accounts.google.com");
    expect(without).not.toContain("g_id_onload");

    const withGoogle = renderConsentPage({
      ...BASE,
      googleClientId: "123.apps.googleusercontent.com",
    });
    expect(withGoogle).toContain('data-client_id="123.apps.googleusercontent.com"');
    expect(withGoogle).toContain('<script nonce="nonce-value">');
    expect(withGoogle).toContain('src="https://accounts.google.com/gsi/client"');
    expect(withGoogle).toContain(`id="google-credential"`);
  });

  it("never inlines anything but the view: no session, no password field value", () => {
    const html = renderConsentPage(BASE);
    expect(html).toMatch(/name="password"[^>]*>/);
    expect(html).not.toMatch(/name="password"[^>]*value=/);
  });
});
