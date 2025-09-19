interface PricingModalProps {
}
export declare function PricingModal({}?: PricingModalProps): import("react/jsx-runtime").JSX.Element;
export interface SubscriptionData {
    currentPlanId: string;
    hasActiveSubscription: boolean;
    customerId?: string;
    subscriptionId?: string;
    billingCycle?: "monthly" | "yearly";
    nextBillingDate?: Date;
}
export default PricingModal;
//# sourceMappingURL=pricing-modal.d.ts.map