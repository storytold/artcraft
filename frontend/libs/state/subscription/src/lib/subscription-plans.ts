import { SubscriptionPlanDetails } from "./subscription-plan-details.js";

export const FREE_PLAN: SubscriptionPlanDetails = {
  slug: "free",
  name: "Free",
  isPaidPlan: false,
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    { text: "Free daily generations", included: true },
    { text: "Limited access to ArtCraft tools", included: true },
    { text: "~10 GPT-Image-1 images", included: true },
    { text: "~1 minute Kling video", included: true },
  ],
  colorScheme: "dark" as const,
};

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
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
      { text: "1,000 credits / month", included: true },
      { text: "~250 Nano Banana images", included: true },
      { text: "~67 Nano Banana Pro images", included: true },
      { text: "~33 Nano Banana Pro 4K images", included: true },
      { text: "~200 GPT-Image-1.5 images", included: true },
      { text: "~63 seconds Seedance 2.0 video", included: true, seedanceOnly: true },
      { text: "~45 seconds Kling 3.0 Pro video", included: true },
      { text: "You Own ArtCraft Forever", included: true },
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
      { text: "3,750 credits / month", included: true },
      { text: "~938 Nano Banana images", included: true },
      { text: "~250 Nano Banana Pro images", included: true },
      { text: "~125 Nano Banana Pro 4K images", included: true },
      { text: "~750 GPT-Image-1.5 images", included: true },
      { text: "~234 seconds Seedance 2.0 video", included: true, seedanceOnly: true },
      { text: "~167 seconds Kling 3.0 Pro video", included: true },
      { text: "You Own ArtCraft Forever", included: true },
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
      { text: "6,600 credits / month", included: true },
      { text: "~1,650 Nano Banana images", included: true },
      { text: "~440 Nano Banana Pro images", included: true },
      { text: "~220 Nano Banana Pro 4K images", included: true },
      { text: "~1,320 GPT-Image-1.5 images", included: true },
      { text: "~413 seconds Seedance 2.0 video", included: true, seedanceOnly: true },
      { text: "~295 seconds Kling 3.0 Pro video", included: true },
      { text: "You Own ArtCraft Forever", included: true },
    ],
    colorScheme: "orange" as const,
  },
];

export const SUBSCRIPTION_PLANS_BY_SLUG: Map<string, SubscriptionPlanDetails> =
  new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.slug, plan]));
