import { create } from 'zustand'
import { ArtcraftGetSubscription } from "@storyteller/tauri-api";

export interface SubscriptionState {
  /// If the user doesn't have a subscription, this will be undefined.
  subscriptionInfo?: SubscriptionInfo,
}

interface SubscriptionInfo {
  /// The internal user unique ID for the subscription
  subscriptionToken: string,

  // TODO: This should be an enum! 
  /// The internal identifier of the subscription
  productSlug: string,
  
  /// The namespace for the subscription ("artcraft" or "fakeyou")
  namespace: string,

  /// The next billing date for the subscription (if it's active and not set to expire/cancel)
  nextBillAt?: Date,

  /// The end date for the subscription (if it's expired or set to expire/cancel)
  subscriptionEndAt?: Date,
}

export type SubscriptionActions = {
  // Returns true if the user has a paid plan.
  // (We do not store "free" as a plan.)
  hasPaidPlan: () => boolean;

  // Returns true if the user can cancel their plan.
  // (The user can't cancel an already set to cancel/expire plan again)
  canCancelPlan: () => boolean;

  // Call to fetch credits from the server
  fetchFromServer: () => Promise<void>
};

export const useSubscriptionState = create<SubscriptionState & SubscriptionActions>((set, get) => ({
  subscriptionInfo: undefined,

  // Returns true if the user has a paid plan.
  // (We do not store "free" as a plan.)
  hasPaidPlan: () => get().subscriptionInfo?.subscriptionToken !== undefined,

  // Returns true if the user can cancel their plan.
  // (The user can't cancel an already set to cancel/expire plan again)
  canCancelPlan: () => {
    const info = get().subscriptionInfo;
    return info?.subscriptionToken !== undefined 
        && info?.subscriptionEndAt === undefined;
  },

  // Call to fetch credits from the server
  fetchFromServer: async () => {
    let data;
    try {
      data = await ArtcraftGetSubscription(); 
    } catch (error) {
      console.error("Error fetching subscription", error);
      return;
    }
    console.log("Fetched subscription from server: ", data);
    if (!!data.payload) {
      let activeSubscription = undefined;
      if (!!data.payload.active_subscription) {
        activeSubscription = {
          subscriptionToken: data.payload.active_subscription.subscription_token,
          productSlug: data.payload.active_subscription.product_slug,
          namespace: data.payload.active_subscription.namespace,
          nextBillAt: data.payload.active_subscription.next_bill_at ? new Date(data.payload.active_subscription.next_bill_at) : undefined,
          subscriptionEndAt: data.payload.active_subscription.subscription_end_at ? new Date(data.payload.active_subscription.subscription_end_at) : undefined,
        };
      }
      set((state) => ({
        subscriptionInfo: activeSubscription,
      }));
    }
  }
}))