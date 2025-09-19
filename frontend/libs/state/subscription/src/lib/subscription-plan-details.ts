export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface SubscriptionPlanDetails {
  slug: string;
  name: string;

  isPaidPlan: boolean;
  monthlyPrice: number;
  yearlyPrice: number;

  originalMonthlyPrice?: number;
  originalYearlyPrice?: number;

  //monthlyPriceId?: string;
  //yearlyPriceId?: string;

  features: PricingFeature[];
  isPopular?: boolean;
  colorScheme: "dark" | "green" | "purple" | "orange";
}
