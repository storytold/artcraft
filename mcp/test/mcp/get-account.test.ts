import { describe, expect, it } from "vitest";

import { getAccount } from "../../src/mcp/tools/get-account";
import { ToolFailure, UpstreamSessionInvalid } from "../../src/mcp/tools/types";
import { principalFromProps } from "../../src/tokens/principal";
import { createUpstreamClient } from "../../src/upstream/client";
import { SESSION_ANONYMOUS, SESSION_OK, SIGNED_SESSION } from "../helpers/fixtures";

const principal = principalFromProps({
  credential: { kind: "session", signedSession: SIGNED_SESSION },
  grantIssuedAt: 1_800_000_000_000,
  userToken: "user_localdev1",
  username: "localdev1",
  displayName: "Local Dev",
  scopes: ["read:account"],
});

function contextWith(status: number, body: unknown) {
  const upstream = createUpstreamClient({
    baseUrl: "https://api.example.test",
    use: "read",
    credential: principal.credential,
    fetch: () =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        }),
      ),
  });
  return { principal, upstream };
}

describe("get_account", () => {
  it("describes the signed-in user, flags, and setup state", async () => {
    const result = await getAccount.handler(contextWith(200, SESSION_OK), {});
    expect(result.structured).toEqual({
      username: "localdev1",
      display_name: "Local Dev",
      feature_flags: ["api_key", "upload_3d"],
      account_setup: {
        email_set: true,
        email_confirmed: false,
        password_set: true,
        username_customized: true,
      },
    });
    expect(result.text).toBe(
      "Signed in as localdev1 (Local Dev). Feature flags: api_key, upload_3d. Still to do: email confirmed.",
    );
  });

  it("says setup is complete when nothing is outstanding", async () => {
    const complete = {
      ...SESSION_OK,
      user: {
        ...SESSION_OK.user,
        onboarding: {
          email_not_set: false,
          email_not_confirmed: false,
          password_not_set: false,
          username_not_customized: false,
        },
        maybe_feature_flags: [],
      },
    };
    const result = await getAccount.handler(contextWith(200, complete), {});
    expect(result.text).toBe(
      "Signed in as localdev1 (Local Dev). Feature flags: none. Account setup complete.",
    );
  });

  it("fails when the session identifies nobody", async () => {
    await expect(getAccount.handler(contextWith(200, SESSION_ANONYMOUS), {})).rejects.toThrow(
      ToolFailure,
    );
  });

  it("signals an invalid upstream session on 401", async () => {
    await expect(
      getAccount.handler(contextWith(401, { success: false, error_code: 401 }), {}),
    ).rejects.toThrow(UpstreamSessionInvalid);
  });
});
