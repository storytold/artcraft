import { Hono } from "hono";

import { currentUser } from "../session";
import type { FakeStore } from "../state";

/**
 * Credits and subscription lookups — credits ported from `infra/fake-storyteller-web`
 * (routes/billing.ts); the subscription route written from the spec, which that branch does
 * not fake. Both are session-only upstream (cookie or `session` header), never API key.
 */

const NAMESPACES = new Set(["artcraft", "fakeyou"]);

export function billingRoutes(store: FakeStore): Hono {
  const app = new Hono();

  app.get("/v1/credits/namespace/:namespace", (c) => {
    const namespace = c.req.param("namespace");
    if (!NAMESPACES.has(namespace)) {
      return c.json(badInput(`unknown payments namespace: ${namespace}`), 400);
    }
    const user = currentUser(store, c.req.raw);
    if (user === undefined) return c.json(NOT_AUTHORIZED, 401);
    return c.json({
      success: true,
      free_credits: 0,
      monthly_credits: user.monthlyCredits,
      banked_credits: user.bankedCredits,
      sum_total_credits: user.monthlyCredits + user.bankedCredits,
    });
  });

  app.get("/v1/subscriptions/namespace/:namespace", (c) => {
    const namespace = c.req.param("namespace");
    if (!NAMESPACES.has(namespace)) {
      return c.json(badInput(`unknown payments namespace: ${namespace}`), 400);
    }
    const user = currentUser(store, c.req.raw);
    if (user === undefined) return c.json(NOT_AUTHORIZED, 401);
    const subscription = user.subscription;
    return c.json({
      success: true,
      active_subscription:
        subscription === null
          ? null
          : {
              subscription_token: subscription.subscriptionToken,
              namespace,
              product_slug: subscription.productSlug,
              next_bill_at: subscription.nextBillAt,
              subscription_end_at: null,
            },
    });
  });

  return app;
}

const NOT_AUTHORIZED = {
  success: false,
  error_code: 401,
  error_code_str: "NotAuthorized",
  message: "not authorized",
};

function badInput(message: string): Record<string, unknown> {
  return { success: false, error_code: 400, error_code_str: "BadInput", message };
}
