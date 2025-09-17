import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { usePricingModalStore } from "./pricing-modal-store";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { invoke } from "@tauri-apps/api/core";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanDetails,
} from "@storyteller/subscription";
import { useSubscriptionState } from "@storyteller/subscription";

const billingTabs = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" },
];

const pricingConfig = {
  header: {
    title: "Purchase a subscription",
    subtitle:
      "Upgrade to gain access to Pro features and generate more, faster.",
  },
  yearlyDiscount: 20,
};

interface PricingModalProps {}

export function PricingModal({}: PricingModalProps = {}) {
  const { isOpen, closeModal } = usePricingModalStore();

  const subscriptionStore = useSubscriptionState();

  const hasActiveSub = subscriptionStore.hasPaidPlan();

  const activePlanId = subscriptionStore.subscriptionInfo?.productSlug;

  const [billingType, setBillingType] = useState("yearly");
  const isYearly = billingType === "yearly";

  const handleUnsubscribe = async () => {
    await invoke("storyteller_open_customer_portal_cancel_plan_command");
  };

  const handleManageSubscription = async () => {
    await invoke("storyteller_open_customer_portal_manage_plan_command");
  };

  const handleUpdatePaymentMethod = async () => {
    await invoke(
      "storyteller_open_customer_portal_update_payment_method_command"
    );
  };

  const handleSetPlan = async (tierSlug: string) => {
    const tier = SUBSCRIPTION_PLANS.find((t) => t.slug === tierSlug);
    const planSlug = tier?.slug;
    const cadence = isYearly ? "yearly" : "monthly";

    if (planSlug === "free") {
      if (hasActiveSub) {
        await handleUnsubscribe();
        return;
      } else {
        return;
      }
    }

    if (hasActiveSub) {
      await invoke("storyteller_open_customer_portal_switch_plan_command", {
        request: {
          plan: planSlug,
          cadence: cadence,
        },
      });
    } else {
      await invoke("storyteller_open_subscription_purchase_command", {
        request: {
          plan: planSlug,
          cadence: cadence,
        },
      });
    }
  };

  const tierHierarchy = {
    free: 0,
    artcraft_basic: 1,
    artcraft_pro: 2,
    artcraft_max: 3,
  };

  const isCurrentPlan = (tierId: string) => {
    return tierId === activePlanId;
  };

  const getButtonText = (tier: SubscriptionPlanDetails) => {
    if (isCurrentPlan(tier.slug)) {
      return "Current Plan";
    }

    if (activePlanId && activePlanId !== "free") {
      const currentTierLevel =
        tierHierarchy[activePlanId as keyof typeof tierHierarchy];
      const thisTierLevel =
        tierHierarchy[tier.slug as keyof typeof tierHierarchy];

      if (thisTierLevel < currentTierLevel) {
        if (tier.slug === "free") {
          return "Cancel Plan";
        }
        return "Switch Plan";
      }
    }

    return "Upgrade Plan";
  };

  const getColorSchemeClasses = (
    colorScheme: SubscriptionPlanDetails["colorScheme"],
    isCurrent: boolean
  ) => {
    const baseClasses =
      "relative rounded-xl border p-8 h-full flex flex-col transition-all duration-300 ring-[6px] ring-transparent";

    switch (colorScheme) {
      case "dark":
        return twMerge(
          baseClasses,
          "bg-[#2C2C2C] border-gray-600",
          isCurrent && "ring-white/70"
        );
      case "green":
        // Basic
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#002D23] via-[#006B54] to-[#00D28B] border-[#00a873]",
          "hover:shadow-[0_0_30px_rgba(0,210,139,0.4)]",
          isCurrent && "ring-[#00D28B] shadow-[0_0_30px_rgba(0,210,139,0.4)]"
        );
      case "purple":
        // Pro
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#2D004D] via-[#6400A8] to-[#C03FFF] border-[#9D4CFF]",
          "hover:shadow-[0_0_30px_rgba(192,63,255,0.4)]",
          isCurrent && "ring-[#C03FFF] shadow-[0_0_30px_rgba(192,63,255,0.4)]"
        );
      case "orange":
        // Max
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#332100] via-[#B35C00] to-[#FFB347] border-[#FF8C00]",
          "hover:shadow-[0_0_30px_rgba(255,179,71,0.4)]",
          isCurrent && "ring-[#FFB347] shadow-[0_0_30px_rgba(255,179,71,0.4)]"
        );
      default:
        return twMerge(
          baseClasses,
          "bg-[#2C2C2C] border-gray-600",
          "hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]",
          isCurrent && "ring-white/70"
        );
    }
  };

  const formatPrice = (plan: SubscriptionPlanDetails) => {
    if (plan.monthlyPrice === 0) {
      return {
        current: "$0",
        original: null,
      };
    }

    if (isYearly) {
      const discountedMonthlyPrice = Math.round(plan.yearlyPrice / 12);
      const originalMonthlyPrice = plan.originalYearlyPrice
        ? Math.round(plan.originalYearlyPrice / 12)
        : null;

      return {
        current: `$${discountedMonthlyPrice}`,
        original: originalMonthlyPrice ? `$${originalMonthlyPrice}` : null,
      };
    } else {
      const monthlyPrice = plan.originalMonthlyPrice || plan.monthlyPrice;

      return {
        current: `$${monthlyPrice}`,
        original: null,
      };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      className="rounded-xl bg-ui-panel max-h-[90vh] max-w-screen-2xl overflow-y-auto flex flex-col border border-ui-panel-border"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      backdropClassName=""
    >
      <div className="p-16 py-24 flex-1 overflow-y-auto min-h-0 text-base-fg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-base-fg mb-4">
            {pricingConfig.header.title}
          </h1>
          <p className="text-base-fg/60 text-lg mb-6">
            {pricingConfig.header.subtitle}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8 relative w-fit mx-auto">
            <TabSelector
              tabs={billingTabs}
              activeTab={billingType}
              onTabChange={setBillingType}
              className="w-fit border border-base-fg/20 rounded-lg"
              tabClassName="w-24 text-md"
              indicatorClassName="bg-primary/30 border border-primary"
              selectedTabClassName="text-base-fg"
            />
            <span className="bg-primary text-white px-3 py-0.5 rounded-full text-sm font-medium -top-3 -left-6 absolute pointer-events-none">
              -{pricingConfig.yearlyDiscount}%
            </span>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const pricing = formatPrice(plan);

            return (
              <div
                key={plan.slug}
                className={getColorSchemeClasses(
                  plan.colorScheme,
                  isCurrentPlan(plan.slug)
                )}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan(plan.slug) && (
                  <div className="absolute -top-4 right-5 bg-white text-black px-3 py-1 rounded-full text-md font-semibold shadow-xl">
                    Active
                  </div>
                )}

                {/* Tier Header */}
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-bold text-white mb-4">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2">
                    {pricing.original && (
                      <span className="text-white/60 line-through text-2xl">
                        {pricing.original}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-white">
                      {pricing.current}
                    </span>
                    <span className="text-white/60 text-sm">/month</span>
                  </div>

                  <p className="text-white/60 text-xs mt-1">
                    {isYearly ? "billed yearly" : "billed monthly"}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={twMerge(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          feature.included
                            ? "bg-white text-black"
                            : "bg-transparent border border-gray-400"
                        )}
                      >
                        {feature.included && (
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={twMerge(
                          "text-sm mt-0.5",
                          feature.included ? "text-white" : "text-white/60"
                        )}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSetPlan(plan.slug)}
                  disabled={isCurrentPlan(plan.slug)}
                  className="w-full h-12 rounded-xl bg-white text-black border hover:bg-white/90"
                >
                  {getButtonText(plan)}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Manage Subscription Button - only show if user has a paid plan */}
        {hasActiveSub && activePlanId !== "free" && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleUpdatePaymentMethod}
              className="bg-transparent border border-white/25 text-white hover:bg-white/10 px-8 py-3 mx-3 rounded-xl"
            >
              Update your payment method
            </Button>
            <Button
              onClick={handleManageSubscription}
              className="bg-transparent border border-white/25 text-white hover:bg-white/10 px-8 py-3 mx-3 rounded-xl"
            >
              Manage your subscription
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Additional interfaces for Stripe integration
export interface SubscriptionData {
  currentPlanId: string;
  hasActiveSubscription: boolean;
  customerId?: string;
  subscriptionId?: string;
  billingCycle?: "monthly" | "yearly";
  nextBillingDate?: Date;
}

export default PricingModal;
