import { SubscriptionPlanDetails } from "@storyteller/subscription";

// Every plan is shown at this single discount off a higher "before" price, on
// BOTH the monthly and yearly tabs. The charged prices are unchanged — this
// only drives the "% OFF" pills, the crossed-out anchor, and the banner copy.
export const PROMO_PCT = 20;

export interface PlanPricing {
  /** Displayed price (per month) for the active cadence — a whole dollar amount. */
  current: number;
  /** Crossed-out "before" price the discount is applied to — a whole dollar amount. */
  basePrice: number;
  /** Discount of `current` vs `basePrice` — always PROMO_PCT. */
  discountPct: number;
}

/** Pricing for a plan in the given cadence. The current price is unchanged; the
 *  base/anchor is current ÷ (1 − PROMO_PCT), rounded to a whole dollar so prices
 *  never show cents. */
export const planPricing = (
  plan: SubscriptionPlanDetails,
  isYearly: boolean,
): PlanPricing => {
  const current = isYearly
    ? Math.round(plan.yearlyPrice / 12)
    : (plan.originalMonthlyPrice ?? plan.monthlyPrice);
  const basePrice = Math.round(current / (1 - PROMO_PCT / 100));
  return { current, basePrice, discountPct: PROMO_PCT };
};
