import { create } from "zustand";

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

export const usePricingModalStore = create<PricingModalState>((set) => ({
  isOpen: false,
  subscription: {
    currentPlanId: "free",
    hasActiveSubscription: false,
  },
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
  setSubscription: (subscription) =>
    set((state) => ({
      subscription: { ...state.subscription, ...subscription },
    })),
  updateCurrentPlan: (planId, hasActiveSubscription) =>
    set((state) => ({
      subscription: {
        ...state.subscription,
        currentPlanId: planId,
        hasActiveSubscription,
      },
    })),
}));
