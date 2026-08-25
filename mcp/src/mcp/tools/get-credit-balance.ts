import { z } from "zod";

import { READ_ONLY_ANNOTATIONS, type ToolDefinition, unwrapUpstream } from "./types";

/**
 * "How many credits do I have?" — the headline read-only tool. Credits and the active
 * subscription come from two session-only endpoints; both are fetched in parallel.
 */

const PAYMENTS_NAMESPACE = "artcraft";

const outputSchema = {
  free_credits: z.number().int().nonnegative().describe("Credits granted free (e.g. daily)."),
  monthly_credits: z
    .number()
    .int()
    .nonnegative()
    .describe("Credits from the monthly plan that refill on renewal."),
  banked_credits: z
    .number()
    .int()
    .nonnegative()
    .describe("Purchased credits that do not expire with the month."),
  total_credits: z
    .number()
    .int()
    .nonnegative()
    .describe("All credits combined; what a generation can spend."),
  subscription: z
    .object({
      product_slug: z
        .string()
        .describe("Artcraft's key for the plan, e.g. artcraft_creator_monthly."),
      next_bill_at: z.string().nullable().describe("ISO-8601 time of the next renewal, or null."),
      ends_at: z
        .string()
        .nullable()
        .describe("ISO-8601 time the plan ends if it was cancelled, or null."),
    })
    .nullable()
    .describe("The active plan, or null when the account has none."),
};

export const getCreditBalance: ToolDefinition<Record<string, never>, typeof outputSchema> = {
  name: "get_credit_balance",
  title: "Get credit balance",
  description:
    "Returns the signed-in user's Artcraft credit balance (free, monthly, banked and total) and " +
    "their active subscription plan, if any. Call this before estimating or discussing the cost " +
    "of a generation, or whenever the user asks how many credits they have. Takes no arguments.",
  requiredScope: "read:account",
  inputSchema: {},
  outputSchema,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "Get credit balance" },

  async handler({ upstream }) {
    const params = { params: { path: { namespace: PAYMENTS_NAMESPACE } } } as const;
    const [credits, subscription] = await Promise.all([
      upstream.GET("/v1/credits/namespace/{namespace}", params),
      upstream.GET("/v1/subscriptions/namespace/{namespace}", params),
    ]);
    const balance = unwrapUpstream(credits);
    const plan = unwrapUpstream(subscription).active_subscription ?? null;

    const structured = {
      free_credits: balance.free_credits,
      monthly_credits: balance.monthly_credits,
      banked_credits: balance.banked_credits,
      total_credits: balance.sum_total_credits,
      subscription: plan
        ? {
            product_slug: plan.product_slug,
            next_bill_at: plan.next_bill_at ?? null,
            ends_at: plan.subscription_end_at ?? null,
          }
        : null,
    };
    return { structured, text: describe(structured) };
  },
};

function describe(balance: z.infer<z.ZodObject<typeof outputSchema>>): string {
  const parts = [
    `${String(balance.total_credits)} credits available`,
    `(${String(balance.monthly_credits)} monthly, ${String(balance.banked_credits)} banked, ${String(balance.free_credits)} free).`,
  ];
  if (balance.subscription) {
    parts.push(`Plan: ${balance.subscription.product_slug}`);
    if (balance.subscription.ends_at) parts.push(`— ends ${balance.subscription.ends_at}.`);
    else if (balance.subscription.next_bill_at)
      parts.push(`— renews ${balance.subscription.next_bill_at}.`);
    else parts.push(".");
  } else {
    parts.push("No active subscription.");
  }
  return parts.join(" ");
}
