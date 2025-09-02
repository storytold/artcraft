import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { pricingConfig, PricingTier } from "./pricing-config";
import { usePricingModalStore } from "./pricing-modal-store";
import { TabSelector } from "@storyteller/ui-tab-selector";

const billingTabs = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" },
];

interface PricingModalProps {
  currentPlanId?: string;
  hasActiveSubscription?: boolean;
}

export function PricingModal({
  currentPlanId,
  hasActiveSubscription,
}: PricingModalProps = {}) {
  const { isOpen, closeModal, subscription } = usePricingModalStore();

  // Use props if provided or fall back to store
  const activePlanId = currentPlanId ?? subscription.currentPlanId;
  const hasActiveSub =
    hasActiveSubscription ?? subscription.hasActiveSubscription;
  const [billingType, setBillingType] = useState("yearly");
  const isYearly = billingType === "yearly";

  const handleUpgrade = async (tierId: string) => {
    // TODO: Implement Stripe checkout
    const tier = pricingConfig.tiers.find((t) => t.id === tierId);
    const priceId = isYearly ? tier?.yearlyPriceId : tier?.monthlyPriceId;

    console.log(
      `Upgrading to ${tierId} plan with ${
        isYearly ? "yearly" : "monthly"
      } billing`,
      { priceId, tierId }
    );

    // Example Stripe checkout implementation:
    // await stripe.redirectToCheckout({
    //   lineItems: [{ price: priceId, quantity: 1 }],
    //   mode: 'subscription',
    //   successUrl: `${window.location.origin}/success`,
    //   cancelUrl: `${window.location.origin}/cancel`,
    // });
  };

  const handleManageSubscription = () => {
    // TODO: Redirect to Stripe customer portal
    console.log("Managing subscription");
  };

  const tierHierarchy = { free: 0, basic: 1, pro: 2, max: 3 };

  const isCurrentPlan = (tierId: string) => {
    return tierId === activePlanId;
  };

  const getButtonText = (tier: PricingTier) => {
    if (isCurrentPlan(tier.id)) {
      return "Current Plan";
    }

    if (activePlanId && activePlanId !== "free") {
      const currentTierLevel =
        tierHierarchy[activePlanId as keyof typeof tierHierarchy];
      const thisTierLevel =
        tierHierarchy[tier.id as keyof typeof tierHierarchy];

      if (thisTierLevel < currentTierLevel) {
        return "Switch Plan";
      }
    }

    return "Upgrade Plan";
  };

  const getColorSchemeClasses = (
    colorScheme: PricingTier["colorScheme"],
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

  const formatPrice = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) {
      return {
        current: "$0",
        original: null,
      };
    }

    if (isYearly) {
      const discountedMonthlyPrice = Math.round(tier.yearlyPrice / 12);
      const originalMonthlyPrice = tier.originalYearlyPrice
        ? Math.round(tier.originalYearlyPrice / 12)
        : null;

      return {
        current: `$${discountedMonthlyPrice}`,
        original: originalMonthlyPrice ? `$${originalMonthlyPrice}` : null,
      };
    } else {
      const monthlyPrice = tier.originalMonthlyPrice || tier.monthlyPrice;

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
      className="rounded-xl bg-[#1A1A1A] max-h-[90vh] max-w-screen-2xl overflow-y-auto flex flex-col"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      backdropClassName="bg-black/80"
    >
      <div className="p-16 py-24 flex-1 overflow-y-auto min-h-0">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4">
            {pricingConfig.header.title}
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            {pricingConfig.header.subtitle}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8 relative w-fit mx-auto">
            <TabSelector
              tabs={billingTabs}
              activeTab={billingType}
              onTabChange={setBillingType}
              className="w-fit"
              tabClassName="w-24 text-md"
              indicatorClassName="bg-white"
              selectedTabClassName="text-black"
            />
            <span className="bg-primary text-white px-3 py-0.5 rounded-full text-sm font-medium -top-3 -left-6 absolute pointer-events-none">
              -{pricingConfig.yearlyDiscount}%
            </span>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {pricingConfig.tiers.map((tier) => {
            const pricing = formatPrice(tier);

            return (
              <div
                key={tier.id}
                className={getColorSchemeClasses(
                  tier.colorScheme,
                  isCurrentPlan(tier.id)
                )}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan(tier.id) && (
                  <div className="absolute -top-4 right-5 bg-white text-black px-3 py-1 rounded-full text-md font-semibold shadow-xl">
                    Active
                  </div>
                )}

                {/* Tier Header */}
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-bold text-white mb-4">
                    {tier.name}
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

                  <p className="text-gray-300 text-xs mt-1">
                    {isYearly ? "billed yearly" : "billed monthly"}
                  </p>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
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
                          feature.included ? "text-white" : "text-gray-400"
                        )}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={isCurrentPlan(tier.id)}
                  className="w-full bg-white text-black hover:bg-white/90 h-12 rounded-xl"
                >
                  {getButtonText(tier)}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Manage Subscription Button - only show if user has a paid plan */}
        {hasActiveSub && activePlanId !== "free" && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleManageSubscription}
              className="bg-transparent border border-white/25 text-white hover:bg-white/10 px-8 py-3 rounded-xl"
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
