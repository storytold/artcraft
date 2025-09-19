import { LoyaltyProgram, SubscriptionNamespace, SubscriptionProduct } from '../enums/Billing.js';
export interface ActiveSubscriptions {
    active_subscriptions: Subscription[];
    maybe_loyalty_program?: LoyaltyProgram;
}
export interface Subscription {
    namespace: SubscriptionNamespace;
    product_slug: SubscriptionProduct;
}
//# sourceMappingURL=Billing.d.ts.map