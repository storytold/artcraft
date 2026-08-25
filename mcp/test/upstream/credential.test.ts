import { describe, expect, it } from "vitest";

import {
  createSessionCredential,
  CredentialError,
  credentialFromProps,
  SESSION_HEADER_NAME,
} from "../../src/upstream/credential";

// Shaped like the upstream's signed session (an HS256 JWT) but not a real one.
const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

describe("session credential", () => {
  it("attaches itself as the `session` header and nothing else", () => {
    const headers = new Headers({ accept: "application/json" });
    createSessionCredential(SIGNED_SESSION).applyTo(headers);
    expect(headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
    expect(headers.get("cookie")).toBeNull();
    expect(headers.get("authorization")).toBeNull();
    expect([...headers.keys()].sort()).toEqual(["accept", "session"]);
  });

  it("replaces an existing session header rather than appending", () => {
    const headers = new Headers({ session: "stale" });
    createSessionCredential(SIGNED_SESSION).applyTo(headers);
    expect(headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
  });

  it("round-trips through grant props", () => {
    const props = createSessionCredential(SIGNED_SESSION).toProps();
    expect(props).toEqual({ kind: "session", signedSession: SIGNED_SESSION });
    const headers = new Headers();
    credentialFromProps(props).applyTo(headers);
    expect(headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
  });

  it("never reveals the secret through describe, toString, or JSON", () => {
    const credential = createSessionCredential(SIGNED_SESSION);
    expect(credential.describe()).not.toContain(SIGNED_SESSION);
    expect(String(credential)).not.toContain(SIGNED_SESSION);
    expect(credential.toString()).toBe(credential.describe());
    expect(JSON.stringify(credential)).not.toContain(SIGNED_SESSION);
    expect(JSON.stringify({ credential })).not.toContain(SIGNED_SESSION);
    expect(Object.keys(credential)).toEqual(["kind"]);
  });
});

describe("credential validation fires", () => {
  it("rejects an empty session", () => {
    expect(() => createSessionCredential("")).toThrow(CredentialError);
  });

  it("rejects header-injection characters", () => {
    expect(() => createSessionCredential("abc\r\nx-injected: 1")).toThrow(
      /whitespace or non-ASCII/,
    );
    expect(() => createSessionCredential("abc def")).toThrow(CredentialError);
    expect(() => createSessionCredential("abcé")).toThrow(CredentialError);
  });

  it("rejects props of an unknown kind", () => {
    expect(() => credentialFromProps({ kind: "api_key", apiKey: "artcraft_api_x" })).toThrow(
      /recognised upstream credential/,
    );
  });

  it("rejects props missing the secret", () => {
    expect(() => credentialFromProps({ kind: "session" })).toThrow(CredentialError);
    expect(() => credentialFromProps({ kind: "session", signedSession: "" })).toThrow(
      CredentialError,
    );
  });

  it("rejects non-object props", () => {
    expect(() => credentialFromProps(null)).toThrow(CredentialError);
    expect(() => credentialFromProps(SIGNED_SESSION)).toThrow(CredentialError);
  });
});
