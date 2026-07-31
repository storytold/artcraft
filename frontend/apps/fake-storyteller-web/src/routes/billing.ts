/**
 * Credits, subscriptions, and Stripe checkout.
 *
 * There is no Stripe to redirect to, so the checkout endpoints return a URL
 * pointing back at this server, which explains itself when opened. Grant
 * credits with `POST /__fake/credits` instead of going through a checkout.
 */

import { currentUser } from "../auth.ts";
import { publicOrigin } from "../config.ts";
import type { RequestContext } from "../http/context.ts";
import { HttpResult, failure, success, unauthorized } from "../http/respond.ts";
import type { Router } from "../http/router.ts";

const VALID_PLANS = new Set(["artcraft_basic", "artcraft_pro", "artcraft_max"]);
const VALID_CADENCES = new Set(["monthly", "yearly"]);

export function registerBillingRoutes(router: Router): void {
  router.get("/v1/credits/namespace/:namespace", getCredits);
  router.get("/v1/billing/active_subscriptions", listActiveSubscriptions);

  router.post("/v1/stripe_artcraft/checkout/subscription", subscriptionCheckout);
  router.post("/v1/stripe_artcraft/user_signup_subscription_checkout", signupSubscriptionCheckout);
  router.post("/v1/stripe_artcraft/checkout/credits_pack", creditsPackCheckout);
  router.post("/v1/stripe_artcraft/portal/switch_plan", switchPlan);
  router.post("/v1/stripe_artcraft/portal/manage_plan", managePlan);
  router.post("/v1/stripe_artcraft/portal/cancel_plan", managePlan);
  router.post("/v1/stripe_artcraft/portal/update_payment_method", managePlan);
}

function getCredits(context: RequestContext): HttpResult {
  const namespace = context.params["namespace"] ?? "";
  if (namespace !== "artcraft" && namespace !== "fakeyou") {
    return failure(400, "BadInput", `unknown payments namespace: ${namespace}`);
  }

  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  return success({
    free_credits: 0,
    monthly_credits: user.monthlyCredits,
    banked_credits: user.bankedCredits,
    sum_total_credits: user.monthlyCredits + user.bankedCredits,
  });
}

function listActiveSubscriptions(context: RequestContext): HttpResult {
  const user = currentUser(context);
  if (user === undefined) {
    return unauthorized();
  }

  const subscriptions = user.subscriptionSlug === undefined
    ? []
    : [{ namespace: "artcraft", product_slug: user.subscriptionSlug }];

  return success({ maybe_loyalty_program: null, active_subscriptions: subscriptions });
}

function subscriptionCheckout(context: RequestContext): HttpResult {
  const body = context.json<{ plan: string; cadence: string }>();

  const checked = checkPlan(body.plan, body.cadence);
  if (!checked.ok) {
    return checked.error;
  }

  return success({ stripe_checkout_redirect_url: explainerUrl("subscription", checked.plan) });
}

function signupSubscriptionCheckout(context: RequestContext): HttpResult {
  const body = context.json<{ plan: string; cadence: string }>();

  const checked = checkPlan(body.plan, body.cadence);
  if (!checked.ok) {
    return checked.error;
  }

  return success({
    stripe_checkout_redirect_url: explainerUrl("subscription", checked.plan),
    generated_user: null,
    session: null,
  });
}

function creditsPackCheckout(context: RequestContext): HttpResult {
  const body = context.json<{ credits_pack: string }>();
  if (body.credits_pack === undefined) {
    return failure(400, "BadInput", "no credits pack supplied");
  }
  return success({ stripe_checkout_redirect_url: explainerUrl("credits_pack", body.credits_pack) });
}

function switchPlan(context: RequestContext): HttpResult {
  const body = context.json<{ plan: string; cadence: string }>();

  const checked = checkPlan(body.plan, body.cadence);
  if (!checked.ok) {
    return checked.error;
  }

  const user = currentUser(context);
  if (user !== undefined) {
    user.subscriptionSlug = checked.plan;
  }

  return success({ stripe_portal_url: explainerUrl("switch_plan", checked.plan) });
}

function managePlan(): HttpResult {
  return success({ stripe_portal_url: explainerUrl("manage_plan", "") });
}

type CheckedPlan = { ok: true; plan: string } | { ok: false; error: HttpResult };

function checkPlan(plan: string | undefined, cadence: string | undefined): CheckedPlan {
  if (plan === undefined) {
    return { ok: false, error: failure(400, "BadInput", "no plan supplied") };
  }
  if (!VALID_PLANS.has(plan)) {
    return { ok: false, error: failure(400, "BadInput", `unknown plan: ${plan}`) };
  }
  if (cadence === undefined) {
    return { ok: false, error: failure(400, "BadInput", "no cadence supplied") };
  }
  if (!VALID_CADENCES.has(cadence)) {
    return { ok: false, error: failure(400, "BadInput", `unknown cadence: ${cadence}`) };
  }
  return { ok: true, plan };
}

function explainerUrl(flow: string, detail: string): string {
  const query = new URLSearchParams({ flow, detail });
  return `${publicOrigin()}/__fake/checkout?${query}`;
}
