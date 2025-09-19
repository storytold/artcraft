interface SubscriptionState {
    currentPlanId: string;
    hasActiveSubscription: boolean;
    customerId?: string;
    subscriptionId?: string;
    billingCycle?: "monthly" | "yearly";
}
interface PricingModalState {
    isOpen: boolean;
    subscription: SubscriptionState;
    openModal: () => void;
    closeModal: () => void;
    toggleModal: () => void;
    setSubscription: (subscription: Partial<SubscriptionState>) => void;
    updateCurrentPlan: (planId: string, hasActiveSubscription: boolean) => void;
}
export declare const usePricingModalStore: import('zustand').UseBoundStore<import('zustand').StoreApi<PricingModalState>>;
export {};
//# sourceMappingURL=pricing-modal-store.d.ts.map