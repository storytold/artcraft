import { describe, expect, it } from "vitest";

import {
  CONNECTIONS_FORM_FIELDS,
  CONNECTIONS_PATHS,
  type ConnectionsView,
  renderConnectionsPage,
} from "../../src/pages/connections-page";

const BASE: ConnectionsView = { csrfToken: "csrf-value", scriptNonce: "nonce-value" };

describe("connections page, signed out", () => {
  it("offers sign-in with a CSRF field and explains the purpose", () => {
    const html = renderConnectionsPage(BASE);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`action="${CONNECTIONS_PATHS.signIn}"`);
    expect(html).toContain(`name="${CONNECTIONS_FORM_FIELDS.csrf}" value="csrf-value"`);
    expect(html).toContain("disconnect any of them");
    expect(html).not.toContain("accounts.google.com");
    expect(html).not.toMatch(/name="password"[^>]*value=/);
  });

  it("renders the Google button only with a client id", () => {
    const html = renderConnectionsPage({
      ...BASE,
      googleClientId: "123.apps.googleusercontent.com",
    });
    expect(html).toContain('data-client_id="123.apps.googleusercontent.com"');
    expect(html).toContain('<script nonce="nonce-value">');
  });

  it("escapes an error and a prefilled username", () => {
    const html = renderConnectionsPage({
      ...BASE,
      error: "<b>x</b>",
      usernameOrEmail: '" onfocus="y',
    });
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).toContain('value="&quot; onfocus=&quot;y"');
  });
});

describe("connections page, signed in", () => {
  const signedIn = {
    username: "localdev1",
    personalTokens: [],
    connections: [
      {
        grantId: "grant_1",
        clientName: "Claude",
        scopes: ["read:account", "read:jobs"],
        createdAt: "2026-08-24",
      },
      {
        grantId: "grant_2",
        clientName: `<img src=x onerror=alert(1)>`,
        scopes: ["read:catalog"],
        createdAt: "2026-08-23",
      },
    ],
  };

  it("lists each connection with what it can do and a disconnect form", () => {
    const html = renderConnectionsPage({ ...BASE, signedIn });
    expect(html).toContain("Signed in as <strong>localdev1</strong>");
    expect(html).toContain("<strong>Claude</strong>");
    expect(html).toContain("see your account and credits, see your generations");
    expect(html).toContain(`action="${CONNECTIONS_PATHS.revoke}"`);
    expect(html).toContain(`name="${CONNECTIONS_FORM_FIELDS.grantId}" value="grant_1"`);
    expect(html).toContain(`action="${CONNECTIONS_PATHS.signOut}"`);
    expect(html).not.toContain("accounts.google.com");
  });

  it("escapes a hostile client name", () => {
    const html = renderConnectionsPage({ ...BASE, signedIn });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("says so when nothing is connected", () => {
    const html = renderConnectionsPage({
      ...BASE,
      signedIn: { username: "u", connections: [], personalTokens: [] },
    });
    expect(html).toContain("No AI apps are connected");
    expect(html).not.toContain(CONNECTIONS_PATHS.revoke);
  });

  it("shows a notice after an action", () => {
    const html = renderConnectionsPage({
      ...BASE,
      notice: "Disconnected Claude.",
      signedIn: { username: "u", connections: [], personalTokens: [] },
    });
    expect(html).toContain("Disconnected Claude.");
  });
});

describe("connections page, personal tokens", () => {
  const signedIn = {
    username: "localdev1",
    connections: [],
    personalTokens: [
      {
        id: "tok_1",
        label: `<script>alert(1)</script>`,
        hint: "artcraft_pat_…abcd",
        createdAt: "2026-08-25",
        expiresAt: "2026-11-23",
      },
    ],
  };

  it("lists tokens with their hint and a revoke form, and offers the create form", () => {
    const html = renderConnectionsPage({ ...BASE, signedIn });
    expect(html).toContain("artcraft_pat_…abcd");
    expect(html).toContain(`action="${CONNECTIONS_PATHS.revokeToken}"`);
    expect(html).toContain(`name="${CONNECTIONS_FORM_FIELDS.tokenId}" value="tok_1"`);
    expect(html).toContain(`action="${CONNECTIONS_PATHS.createToken}"`);
    expect(html).toContain(`name="${CONNECTIONS_FORM_FIELDS.tokenLabel}"`);
    expect(html).toContain(`name="${CONNECTIONS_FORM_FIELDS.tokenLifetime}"`);
    expect(html).toContain('<option value="30">30 days</option>');
    expect(html).toContain('<option value="90">90 days</option>');
    expect(html).toContain("authorization_token");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("shows a newly created secret exactly where the user can copy it", () => {
    const html = renderConnectionsPage({
      ...BASE,
      signedIn: {
        ...signedIn,
        newToken: { label: "OpenAI", secret: "artcraft_pat_SECRET", expiresAt: "2026-09-24" },
      },
    });
    expect(html).toContain('<code class="secret">artcraft_pat_SECRET</code>');
    expect(html).toContain("Copy it now");
    expect(html).toContain("Expires 2026-09-24");
  });

  it("puts the Google button on the create form only when configured", () => {
    const plain = renderConnectionsPage({ ...BASE, signedIn });
    expect(plain).not.toContain("accounts.google.com");
    const withGoogle = renderConnectionsPage({ ...BASE, signedIn, googleClientId: "1.apps" });
    expect(withGoogle).toContain('data-client_id="1.apps"');
    expect(withGoogle).toContain('id="create-token-form"');
  });
});
