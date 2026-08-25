import { describe, expect, it } from "vitest";

import { GRANT_ISSUED_AT_PROP } from "../../src/auth/grant-age";
import { hasScope, principalFromProps, PrincipalError } from "../../src/tokens/principal";
import { SESSION_HEADER_NAME } from "../../src/upstream/credential";

const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

const PROPS = {
  credential: { kind: "session", signedSession: SIGNED_SESSION },
  [GRANT_ISSUED_AT_PROP]: 1_800_000_000_000,
  userToken: "user_abc",
  username: "abc",
  displayName: "Abc",
  scopes: ["read:account", "read:jobs"],
};

describe("principalFromProps", () => {
  it("rebuilds the principal from grant props", () => {
    const principal = principalFromProps(PROPS);
    expect(principal.userToken).toBe("user_abc");
    expect(principal.username).toBe("abc");
    expect(principal.displayName).toBe("Abc");
    expect(principal.scopes).toEqual(["read:account", "read:jobs"]);
    const headers = new Headers();
    principal.credential.applyTo(headers);
    expect(headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
  });

  it("answers scope questions", () => {
    const principal = principalFromProps(PROPS);
    expect(hasScope(principal, "read:account")).toBe(true);
    expect(hasScope(principal, "read:catalog")).toBe(false);
  });

  it("never leaks the credential through the principal's string forms", () => {
    const principal = principalFromProps(PROPS);
    expect(JSON.stringify(principal)).not.toContain(SIGNED_SESSION);
  });
});

describe("principalFromProps fails closed", () => {
  it("on props from a grant this build does not understand", () => {
    expect(() => principalFromProps({ userId: "user_abc" })).toThrow(PrincipalError);
    expect(() => principalFromProps(null)).toThrow(PrincipalError);
    expect(() => principalFromProps("nope")).toThrow(PrincipalError);
  });

  it("on a user token with the wrong prefix", () => {
    expect(() => principalFromProps({ ...PROPS, userToken: "session_abc" })).toThrow(
      PrincipalError,
    );
  });

  it("on unknown scopes (a future build's grant must not run on this one)", () => {
    expect(() => principalFromProps({ ...PROPS, scopes: ["read:account", "generate"] })).toThrow(
      PrincipalError,
    );
  });

  it("on an unrecognised credential kind", () => {
    expect(() =>
      principalFromProps({ ...PROPS, credential: { kind: "api_key", apiKey: "artcraft_api_x" } }),
    ).toThrow(PrincipalError);
  });

  it("on a missing issue time", () => {
    const withoutIssuedAt = Object.fromEntries(
      Object.entries(PROPS).filter(([key]) => key !== GRANT_ISSUED_AT_PROP),
    );
    expect(() => principalFromProps(withoutIssuedAt)).toThrow(PrincipalError);
  });
});
