import { SubscriptionPlanDetails } from "./subscription-plan-details.js";

export const FREE_PLAN : SubscriptionPlanDetails = {
  slug: "free",
  name: "Free",
  isPaidPlan: false,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    { text: "Free daily generations", included: true },
    { text: "Limited access to ArtCraft tools", included: true },
  ],
  colorScheme: "dark" as const,
};

export const SUBSCRIPTION_PLANS : SubscriptionPlanDetails[] = [
  FREE_PLAN,
  {
    slug: "artcraft_basic",
    name: "Basic",
    isPaidPlan: true,
    monthlyPrice: 8,
    yearlyPrice: 96,
    originalMonthlyPrice: 10,
    originalYearlyPrice: 120,
    features: [
      { text: "~1,010 Flux images", included: true },
      { text: "~36,000 real-time images", included: true },
      { text: "~180 enhanced images", included: true },
      { text: "~6 training jobs", included: true },
      { text: "Commercial license", included: true },
    ],
    colorScheme: "green" as const,
  },
  {
    slug: "artcraft_pro",
    name: "Pro",
    isPaidPlan: true,
    monthlyPrice: 28,
    yearlyPrice: 336,
    originalMonthlyPrice: 35,
    originalYearlyPrice: 420,
    features: [
      { text: "~5,048 Flux images", included: true },
      { text: "~180,000 real-time images", included: true },
      { text: "~900 enhanced images", included: true },
      { text: "~30 training jobs", included: true },
      { text: "Commercial license", included: true },
    ],
    colorScheme: "purple" as const,
  },
  {
    slug: "artcraft_max",
    name: "Max",
    isPaidPlan: true,
    monthlyPrice: 48,
    yearlyPrice: 576,
    originalMonthlyPrice: 60,
    originalYearlyPrice: 720,
    features: [
      { text: "~15,142 Flux images", included: true },
      { text: "~540,000 real-time images", included: true },
      { text: "~2,700 enhanced images", included: true },
      { text: "~90 training jobs", included: true },
      { text: "Commercial license", included: true },
    ],
    colorScheme: "orange" as const,
  },
]

export const SUBSCRIPTION_PLANS_BY_SLUG : Map<string, SubscriptionPlanDetails> = new Map(
  SUBSCRIPTION_PLANS.map((plan) => [plan.slug, plan])
);
