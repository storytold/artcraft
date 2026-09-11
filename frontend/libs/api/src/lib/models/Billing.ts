import {
  LoyaltyProgram,
  SubscriptionNamespace,
  SubscriptionProduct,
} from "../enums/Billing.js";

export interface ActiveSubscriptions {
  // user's list of subscriptions
  active_subscriptions: Subscription[];
  // special programs that the user could be in
  maybe_loyalty_program?: LoyaltyProgram;
}

export interface Subscription {
  namespace: SubscriptionNamespace;
  product_slug: SubscriptionProduct;
}
