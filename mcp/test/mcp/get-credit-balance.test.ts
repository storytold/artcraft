import { describe, expect, it } from "vitest";

import { getCreditBalance } from "../../src/mcp/tools/get-credit-balance";
import { ToolFailure, UpstreamSessionInvalid } from "../../src/mcp/tools/types";
import { principalFromProps } from "../../src/tokens/principal";
import { createUpstreamClient } from "../../src/upstream/client";
import { SESSION_HEADER_NAME } from "../../src/upstream/credential";
import { fixture } from "../helpers/contract";

const UPSTREAM = "https://api.example.test";
const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

const CREDITS = fixture("GetSessionCreditsResponse", {
  success: true,
  free_credits: 0,
  monthly_credits: 500,
  banked_credits: 120,
  sum_total_credits: 620,
});
const SUBSCRIPTION = fixture("GetSessionSubscriptionResponse", {
  success: true,
  active_subscription: {
    subscription_token: "usub_x",
    namespace: "artcraft",
    product_slug: "artcraft_creator_monthly",
    next_bill_at: "2026-09-24T00:00:00Z",
    subscription_end_at: null,
  },
});
const NO_SUBSCRIPTION = fixture("GetSessionSubscriptionResponse", {
  success: true,
  active_subscription: null,
});
const NOT_AUTHORIZED = fixture("CommonWebError", {
  success: false,
  error_code: 401,
  error_code_str: "NotAuthorized",
  message: "not authorized",
});

const principal = principalFromProps({
  credential: { kind: "session", signedSession: SIGNED_SESSION },
  grantIssuedAt: 1_800_000_000_000,
  userToken: "user_x",
  username: "x",
  displayName: "X",
  scopes: ["read:account"],
});

function scripted(routes: Record<string, { status: number; body: unknown }>) {
  const requests: Request[] = [];
  const fetchImpl: typeof globalThis.fetch = (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    const route = routes[new URL(request.url).pathname];
    return Promise.resolve(
      route
        ? new Response(JSON.stringify(route.body), {
            status: route.status,
            headers: { "content-type": "application/json" },
          })
        : new Response("not scripted", { status: 599 }),
    );
  };
  const upstream = createUpstreamClient({
    baseUrl: UPSTREAM,
    use: "read",
    credential: principal.credential,
    fetch: fetchImpl,
  });
  return { requests, context: { principal, upstream } };
}

describe("get_credit_balance", () => {
  it("combines credits and the active plan, and describes them in text", async () => {
    const { requests, context } = scripted({
      "/v1/credits/namespace/artcraft": { status: 200, body: CREDITS },
      "/v1/subscriptions/namespace/artcraft": { status: 200, body: SUBSCRIPTION },
    });
    const result = await getCreditBalance.handler(context, {});
    expect(result.structured).toEqual({
      free_credits: 0,
      monthly_credits: 500,
      banked_credits: 120,
      total_credits: 620,
      subscription: {
        product_slug: "artcraft_creator_monthly",
        next_bill_at: "2026-09-24T00:00:00Z",
        ends_at: null,
      },
    });
    expect(result.text).toBe(
      "620 credits available (500 monthly, 120 banked, 0 free). Plan: artcraft_creator_monthly — renews 2026-09-24T00:00:00Z.",
    );
    expect(requests.map((r) => new URL(r.url).pathname).sort()).toEqual([
      "/v1/credits/namespace/artcraft",
      "/v1/subscriptions/namespace/artcraft",
    ]);
    expect(requests.every((r) => r.headers.get(SESSION_HEADER_NAME) === SIGNED_SESSION)).toBe(true);
  });

  it("reports no subscription plainly", async () => {
    const { context } = scripted({
      "/v1/credits/namespace/artcraft": { status: 200, body: CREDITS },
      "/v1/subscriptions/namespace/artcraft": { status: 200, body: NO_SUBSCRIPTION },
    });
    const result = await getCreditBalance.handler(context, {});
    expect(result.structured.subscription).toBeNull();
    expect(result.text).toContain("No active subscription.");
  });

  it("signals an invalid upstream session on 401", async () => {
    const { context } = scripted({
      "/v1/credits/namespace/artcraft": { status: 401, body: NOT_AUTHORIZED },
      "/v1/subscriptions/namespace/artcraft": { status: 401, body: NOT_AUTHORIZED },
    });
    await expect(getCreditBalance.handler(context, {})).rejects.toThrow(UpstreamSessionInvalid);
  });

  it("turns a 5xx into a user-facing failure without upstream details", async () => {
    const { context } = scripted({
      "/v1/credits/namespace/artcraft": {
        status: 500,
        body: { success: false, error_code: 500, message: "stack trace" },
      },
      "/v1/subscriptions/namespace/artcraft": { status: 200, body: NO_SUBSCRIPTION },
    });
    const error = await getCreditBalance.handler(context, {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ToolFailure);
    expect((error as Error).message).not.toContain("stack trace");
  });

  it("passes a 4xx message through", async () => {
    const { context } = scripted({
      "/v1/credits/namespace/artcraft": {
        status: 400,
        body: { success: false, error_code: 400, message: "unknown payments namespace" },
      },
      "/v1/subscriptions/namespace/artcraft": { status: 200, body: NO_SUBSCRIPTION },
    });
    await expect(getCreditBalance.handler(context, {})).rejects.toThrow(
      /unknown payments namespace/,
    );
  });

  it("is declared read-only and scoped to read:account", () => {
    expect(getCreditBalance.requiredScope).toBe("read:account");
    expect(getCreditBalance.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
    });
  });
});
