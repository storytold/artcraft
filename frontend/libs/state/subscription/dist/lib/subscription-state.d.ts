export interface SubscriptionState {
    subscriptionInfo?: SubscriptionInfo;
}
interface SubscriptionInfo {
    subscriptionToken: string;
    productSlug: string;
    namespace: string;
    nextBillAt?: Date;
    subscriptionEndAt?: Date;
}
export type SubscriptionActions = {
    hasPaidPlan: () => boolean;
    canCancelPlan: () => boolean;
    fetchFromServer: () => Promise<void>;
};
export declare const useSubscriptionState: import('zustand').UseBoundStore<import('zustand').StoreApi<SubscriptionState & SubscriptionActions>>;
export {};
//# sourceMappingURL=subscription-state.d.ts.map