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
    features: PricingFeature[];
    isPopular?: boolean;
    colorScheme: "dark" | "green" | "purple" | "orange";
}
//# sourceMappingURL=subscription-plan-details.d.ts.map