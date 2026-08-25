import { describe, expect, it } from "vitest";

import { expectValid } from "../../test/helpers/contract";
import { createFakeUpstream } from "../src/index";
import { SEEDED_USER } from "../src/state";

async function signedIn() {
  const app = createFakeUpstream();
  const login = await app.request("/v1/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username_or_email: SEEDED_USER.username,
      password: SEEDED_USER.password,
    }),
  });
  const { signed_session } = await login.json<{ signed_session: string }>();
  return { app, headers: { session: signed_session } };
}

describe("credits", () => {
  it("returns the seeded balances in the spec shape", async () => {
    const { app, headers } = await signedIn();
    const response = await app.request("/v1/credits/namespace/artcraft", { headers });
    expect(response.status).toBe(200);
    const body = await response.json();
    expectValid("GetSessionCreditsResponse", body);
    expect(body).toEqual({
      success: true,
      free_credits: 0,
      monthly_credits: 500,
      banked_credits: 120,
      sum_total_credits: 620,
    });
  });

  it("is session-only: anonymous callers get the common 401 envelope", async () => {
    const response = await createFakeUpstream().request("/v1/credits/namespace/artcraft");
    expect(response.status).toBe(401);
    expectValid("CommonWebError", await response.json());
  });

  it("rejects an unknown namespace", async () => {
    const { app, headers } = await signedIn();
    const response = await app.request("/v1/credits/namespace/nope", { headers });
    expect(response.status).toBe(400);
    expectValid("CommonWebError", await response.json());
  });
});

describe("subscription", () => {
  it("returns the seeded subscription in the spec shape", async () => {
    const { app, headers } = await signedIn();
    const response = await app.request("/v1/subscriptions/namespace/artcraft", { headers });
    expect(response.status).toBe(200);
    const body = await response.json<{ active_subscription: { product_slug: string } | null }>();
    expectValid("GetSessionSubscriptionResponse", body);
    expect(body.active_subscription?.product_slug).toBe("artcraft_creator_monthly");
  });

  it("is session-only too", async () => {
    const response = await createFakeUpstream().request("/v1/subscriptions/namespace/artcraft");
    expect(response.status).toBe(401);
  });
});
