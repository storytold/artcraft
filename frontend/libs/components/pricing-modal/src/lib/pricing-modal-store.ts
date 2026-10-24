// zustand: a tiny state library. `create` builds a store (a shared object any component can read from or change) and returns a hook to use it.
import { create } from "zustand";

// A record of the user's plan. Nothing in the app reads or writes it today (see the note on the store below).
interface SubscriptionState {
  currentPlanId: string;
  hasActiveSubscription: boolean;
  customerId?: string;
  subscriptionId?: string;
  billingCycle?: "monthly" | "yearly";
}

// Everything the Pricing dialog's store holds and offers.
interface PricingModalState {
  // Whether the Pricing dialog is showing.
  isOpen: boolean;
  // Unused leftover: no code outside this file reads `subscription` or calls setSubscription / updateCurrentPlan. The real plan comes
  // from @storyteller/subscription (hasPaidPlan), not from here.
  subscription: SubscriptionState;
  // Optional heading and sub-heading the dialog shows. openModal can set them; closeModal clears them.
  title?: string;
  subtitle?: string;
  openModal: (options?: { title?: string; subtitle?: string }) => void;
  closeModal: () => void;
  toggleModal: () => void;
  setSubscription: (subscription: Partial<SubscriptionState>) => void;
  updateCurrentPlan: (planId: string, hasActiveSubscription: boolean) => void;
}

// The Pricing dialog's store. The dialog itself (pricing-modal.tsx) reads isOpen / title / subtitle / closeModal; TopBar.tsx and
// BillingSettingsPane.tsx call toggleModal to open it; pricing-modal.tsx's own "Buy credits" handler calls closeModal.
// No caller in the app uses openModal, so title and subtitle stay undefined in practice.
export const usePricingModalStore = create<PricingModalState>((set) => ({
  // Starts closed.
  isOpen: false,
  // Starting values for the unused plan record: the free plan, no active subscription.
  subscription: {
    currentPlanId: "free",
    hasActiveSubscription: false,
  },
  // No custom heading or sub-heading until openModal supplies them.
  title: undefined,
  subtitle: undefined,
  // Opens the dialog and sets (or, with no options, clears) its title and subtitle in the same update.
  openModal: (options) => set({
    isOpen: true,
    title: options?.title,
    subtitle: options?.subtitle
  }),
  // Closes the dialog and clears the title and subtitle, so the next opening starts clean.
  closeModal: () => set({ isOpen: false, title: undefined, subtitle: undefined }),
  // Flips open <-> closed. Unlike closeModal it leaves title and subtitle alone, which only matters if a caller had set them (none does today).
  toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),
  // Merges the given fields into the (unused) plan record.
  setSubscription: (subscription) =>
    set((state) => ({
      subscription: { ...state.subscription, ...subscription },
    })),
  // Sets the plan id and the active flag in the (unused) plan record, keeping its other fields.
  updateCurrentPlan: (planId, hasActiveSubscription) =>
    set((state) => ({
      subscription: {
        ...state.subscription,
        currentPlanId: planId,
        hasActiveSubscription,
      },
    })),
}));
