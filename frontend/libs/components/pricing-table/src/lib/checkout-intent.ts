import { BillingApi } from "@storyteller/api";
import { SUBSCRIPTION_PLANS } from "@storyteller/subscription";

/**
 * A plan purchase the user clicked before having an account. Carried through
 * the signup/login pages as query params so Stripe checkout can resume as
 * soon as the user is authenticated.
 */
export interface CheckoutIntent {
  plan: string;
  cadence: "yearly" | "monthly";
}

const PLAN_PARAM = "plan";
const CADENCE_PARAM = "cadence";

const PAID_PLAN_SLUGS = new Set(
  SUBSCRIPTION_PLANS.filter((plan) => plan.slug !== "free").map(
    (plan) => plan.slug,
  ),
);

export const signupUrlForCheckoutIntent = (intent: CheckoutIntent) =>
  `/signup?${PLAN_PARAM}=${encodeURIComponent(intent.plan)}&${CADENCE_PARAM}=${intent.cadence}`;

export const checkoutIntentFromSearchParams = (
  params: URLSearchParams,
): CheckoutIntent | null => {
  const plan = params.get(PLAN_PARAM);
  if (!plan || !PAID_PLAN_SLUGS.has(plan)) {
    return null;
  }
  const cadence =
    params.get(CADENCE_PARAM) === "monthly" ? "monthly" : "yearly";
  return { plan, cadence };
};

/**
 * Starts Stripe checkout for the given intent. Requires a logged-in session.
 * On success the browser navigates away to Stripe and this never settles from
 * the caller's perspective; returns false if checkout could not be started so
 * the caller can fall back to its normal post-auth navigation.
 */
export const redirectToCheckout = async (
  intent: CheckoutIntent,
): Promise<boolean> => {
  const billingApi = new BillingApi();
  const response = await billingApi.SubscriptionCheckout({
    plan: intent.plan,
    cadence: intent.cadence,
  });

  if (!response.success || !response.data?.stripeCheckoutRedirectUrl) {
    console.error("Failed to start checkout:", response.errorMessage);
    return false;
  }

  window.location.href = response.data.stripeCheckoutRedirectUrl;
  return true;
};
