import { getOAuthApi } from "@cloudflare/workers-oauth-provider";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import type { AuthenticatedUser } from "../../src/auth/authenticator";
import { finishAuthorization, grantedScopes } from "../../src/auth/finish-authorization";
import { GRANT_ISSUED_AT_PROP } from "../../src/auth/grant-age";
import { SCOPES } from "../../src/auth/oauth";
import { oauthProviderOptions } from "../../src/index";
import { createSessionCredential } from "../../src/upstream/credential";
import {
  authorizeUrl,
  call,
  callMcp,
  exchangeCode,
  ORIGIN,
  pkce,
  type TokenResponse,
} from "../helpers/oauth-client";

const REDIRECT_URI = "https://client.example/callback";
const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

const USER: AuthenticatedUser = {
  userToken: "user_finish",
  username: "finisher",
  displayName: "Finisher",
  credential: createSessionCredential(SIGNED_SESSION),
};

describe("grantedScopes", () => {
  it("narrows to what is requested and supported", () => {
    expect(grantedScopes(["read:jobs", "read:account"])).toEqual(["read:account", "read:jobs"]);
    expect(grantedScopes(["read:jobs", "generate", "admin"])).toEqual(["read:jobs"]);
  });

  it("grants everything supported when nothing specific is requested", () => {
    expect(grantedScopes([])).toEqual([...SCOPES]);
  });

  it("never invents scopes", () => {
    expect(grantedScopes(["generate"])).toEqual([]);
  });
});

describe("finishAuthorization", () => {
  it("records the grant under the Artcraft user token with the credential and issue time in props", async () => {
    const registration = await call("/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_name: "Finish test client",
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      }),
    });
    const { client_id } = await registration.json<{ client_id: string }>();
    const helpers = getOAuthApi(oauthProviderOptions, env);
    const { verifier, challenge } = await pkce();
    const authRequest = await helpers.parseAuthRequest(
      new Request(
        authorizeUrl({
          response_type: "code",
          client_id,
          redirect_uri: REDIRECT_URI,
          scope: "read:jobs bogus",
          state: "st",
          code_challenge: challenge,
          code_challenge_method: "S256",
          resource: `${ORIGIN}/mcp`,
        }),
      ),
    );
    const client = await helpers.lookupClient(client_id);
    if (!client) throw new Error("client not found");

    const now = 1_800_000_000_000;
    const redirectTo = new URL(await finishAuthorization(helpers, authRequest, client, USER, now));
    expect(redirectTo.origin + redirectTo.pathname).toBe(REDIRECT_URI);
    expect(redirectTo.searchParams.get("state")).toBe("st");

    const grants = await helpers.listUserGrants("user_finish");
    const grant = grants.items.find((g) => g.clientId === client_id);
    expect(grant?.scope).toEqual(["read:jobs"]);
    expect(grant?.metadata).toEqual({ clientName: "Finish test client" });

    const exchanged = await exchangeCode(
      client_id,
      redirectTo.searchParams.get("code") ?? "",
      verifier,
      REDIRECT_URI,
    );
    expect(exchanged.status).toBe(200);
    const tokens = await exchanged.json<TokenResponse>();
    expect(tokens.scope).toBe("read:jobs");

    const mcp = await callMcp(tokens.access_token);
    expect(await mcp.json()).toMatchObject({
      authenticated: true,
      credential: "session credential",
    });

    // The props round-tripped through the provider's encryption: the token unwraps to them.
    const unwrapped = await helpers.unwrapToken(tokens.access_token);
    expect(unwrapped?.grant.props).toMatchObject({
      credential: { kind: "session", signedSession: SIGNED_SESSION },
      [GRANT_ISSUED_AT_PROP]: now,
      userToken: "user_finish",
      username: "finisher",
      displayName: "Finisher",
      scopes: ["read:jobs"],
    });
  });
});
