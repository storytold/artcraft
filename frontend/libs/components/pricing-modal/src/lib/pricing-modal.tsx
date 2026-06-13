import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import {
  faCheck,
  faStar,
  faGem,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    title: "Subscribe to ArtCraft",
    subtitle:
      "Support ArtCraft development and get generation credits without having to add 3rd party services. We directly invest your support into building a powerful tool you own forever.",
  },
  yearlyDiscount: 20,
};

// Plans that get an eye-catching gradient frame breaking out of the grid.
type HighlightKind = "popular" | "best";
const HIGHLIGHTS: Record<string, HighlightKind> = {
  artcraft_pro: "popular",
  artcraft_max: "best",
};

interface PricingContentProps {
  title?: string;
  subtitle?: string;
}

export function PricingContent({ title, subtitle }: PricingContentProps) {
  const subscriptionStore = useSubscriptionState();
  const hasActiveSub = subscriptionStore.hasPaidPlan();
  const activePlanId = subscriptionStore.subscriptionInfo?.productSlug || "free";

  const [billingType, setBillingType] = useState("yearly");
  const isYearly = billingType === "yearly";

  // ── Billing actions (Tauri portal/checkout — unchanged) ──────────────────
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

  const formatPrice = (plan: SubscriptionPlanDetails) => {
    if (plan.monthlyPrice === 0) {
      return {
        current: "$0",
        original: null as string | null,
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
        original: null as string | null,
      };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 md:p-10 min-h-0 text-white">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
          {title || pricingConfig.header.title}
        </h1>
        <p className="mx-auto mb-6 max-w-3xl text-md leading-relaxed text-white/60 md:text-lg">
          {subtitle || pricingConfig.header.subtitle}
        </p>

        {/* Billing Toggle */}
        <div className="relative mx-auto mb-8 flex w-fit items-center justify-center gap-4">
          <TabSelector
            tabs={billingTabs}
            activeTab={billingType}
            onTabChange={setBillingType}
            className="w-fit rounded-lg border border-white/20 bg-white/5"
            tabClassName="w-24 text-md"
            indicatorClassName="bg-primary/30 border border-primary"
            selectedTabClassName="text-white"
          />
          <span className="pointer-events-none absolute -left-6 -top-3 rounded-full bg-primary px-3 py-0.5 text-sm font-medium text-white">
            -{pricingConfig.yearlyDiscount}%
          </span>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-x-4 gap-y-10 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const highlight = HIGHLIGHTS[plan.slug] ?? null;
          const isCurrent = isCurrentPlan(plan.slug);
          const pricing = formatPrice(plan);
          const frame = highlight ? frameClasses(plan.colorScheme) : null;

          // Inner card body, shared between framed and un-framed plans.
          const cardBody = (
            <div
              className={twMerge(
                getColorSchemeClasses(plan.colorScheme),
                frame
                  ? `relative z-10 h-full w-full border-2 bg-[#101014] shadow-2xl ${frame.border}`
                  : "",
                isCurrent ? "ring-2 ring-white/50" : "",
              )}
            >
              {isCurrent && (
                <div className="absolute right-3 top-3 whitespace-nowrap rounded-full bg-white px-3 py-0.5 text-xs font-bold text-black shadow-lg">
                  CURRENT
                </div>
              )}

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-white md:text-2xl">
                  {plan.name}
                </h3>
                {pricing.original && (
                  <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/80 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                    -{pricingConfig.yearlyDiscount}%
                  </span>
                )}
              </div>

              <div className="mb-1 flex items-baseline gap-2">
                {pricing.original && (
                  <span className="text-lg text-[#f05951]/80 line-through decoration-[#f05951]/80 md:text-xl">
                    {pricing.original}
                  </span>
                )}
                <span className="text-3xl font-bold md:text-4xl">
                  {pricing.current}
                </span>
                <span className="text-white/60">/month</span>
              </div>
              <div className="mb-4 min-h-[1rem] text-xs font-semibold uppercase tracking-wider text-white/40 md:mb-6">
                {plan.monthlyPrice === 0
                  ? "Free forever"
                  : isYearly
                    ? "Billed yearly"
                    : "Billed monthly"}
              </div>

              <Button
                className={twMerge(
                  "mb-6 h-11 w-full justify-center rounded-xl border-transparent md:mb-8",
                  isCurrent
                    ? "cursor-default bg-white/20"
                    : frame
                      ? `${frame.button} text-white`
                      : "bg-white text-black hover:bg-white/80",
                )}
                onClick={() => handleSetPlan(plan.slug)}
                disabled={isCurrent}
              >
                {getButtonText(plan)}
              </Button>

              <ul className="flex-1 space-y-3 md:space-y-4">
                {plan.features.map((feature, idx) => (
                  <Feature
                    key={idx}
                    text={feature.text}
                    included={feature.included}
                    highlighted={!!highlight}
                  />
                ))}
              </ul>
            </div>
          );

          // Un-highlighted plans render the card directly into the grid.
          if (!highlight) {
            return (
              <div key={plan.slug} className="contents">
                {cardBody}
              </div>
            );
          }

          // Highlighted plans keep the same footprint; the solid label tab sits
          // ABOVE the card and tucks behind the card top so it reads as one
          // continuous frame.
          return (
            <div key={plan.slug} className="relative">
              <div
                className={twMerge(
                  "absolute inset-x-0 bottom-[calc(100%_-_1.75rem)] z-0 flex items-center justify-center gap-1.5 rounded-t-2xl pb-8 pt-2 text-xs font-bold uppercase tracking-[0.1em] text-white sm:rounded-t-[28px]",
                  frame?.tab,
                )}
              >
                <FontAwesomeIcon
                  icon={highlight === "popular" ? faStar : faGem}
                  className="pb-0.5 text-xs"
                />
                {highlight === "popular" ? "Most Popular" : "Best Value"}
              </div>
              {cardBody}
            </div>
          );
        })}
      </div>

      {/* Manage Subscription — only when the user has a paid plan */}
      {hasActiveSub && activePlanId !== "free" && (
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleUpdatePaymentMethod}
            className="rounded-xl border border-white/25 bg-transparent px-8 py-3 text-white hover:bg-white/10"
          >
            Update your payment method
          </Button>
          <Button
            onClick={handleManageSubscription}
            className="rounded-xl border border-white/25 bg-transparent px-8 py-3 text-white hover:bg-white/10"
          >
            Manage your subscription
          </Button>
        </div>
      )}
    </div>
  );
}

// Per-plan colored card scheme (mirrors the webapp pricing-table's
// non-unified theme: green/purple/orange gradient tints + matching borders).
// All hexes are arbitrary values, so they don't depend on the Tailwind config.
const getColorSchemeClasses = (
  colorScheme: SubscriptionPlanDetails["colorScheme"],
) => {
  const base =
    "relative flex flex-col rounded-3xl border p-6 transition-all duration-300 backdrop-blur-md md:p-8";

  switch (colorScheme) {
    case "green":
      return twMerge(
        base,
        "bg-gradient-to-b from-[#002D23]/80 via-[#006B54]/50 to-[#00D28B]/10 border-[#00a873]/50",
        "hover:border-[#00a873] hover:shadow-[0_0_30px_rgba(0,210,139,0.2)]",
      );
    case "purple":
      return twMerge(
        base,
        "bg-gradient-to-b from-[#2D004D]/80 via-[#6400A8]/50 to-[#C03FFF]/10 border-[#9D4CFF]/50",
        "hover:border-[#9D4CFF] hover:shadow-[0_0_30px_rgba(192,63,255,0.2)]",
      );
    case "orange":
      return twMerge(
        base,
        "bg-gradient-to-b from-[#332100]/80 via-[#B35C00]/50 to-[#FFB347]/10 border-[#FF8C00]/50",
        "hover:border-[#FF8C00] hover:shadow-[0_0_30px_rgba(255,179,71,0.2)]",
      );
    case "dark":
      return twMerge(
        base,
        "bg-[#1C1C20] border-white/10 hover:border-white/20",
      );
    default:
      return twMerge(base, "bg-white/5 border-white/10 hover:border-white/20");
  }
};

// Solid frame color for highlighted plans, keyed to each plan's color scheme.
const frameClasses = (colorScheme: SubscriptionPlanDetails["colorScheme"]) => {
  switch (colorScheme) {
    case "green":
      return {
        tab: "bg-[#00a873]",
        border: "border-[#00a873]",
        button: "bg-[#00a873] hover:bg-[#008a5e]",
      };
    case "purple":
      return {
        tab: "bg-[#9D4CFF]",
        border: "border-[#9D4CFF]",
        button: "bg-[#9D4CFF] hover:bg-[#8633f2]",
      };
    case "orange":
      return {
        tab: "bg-[#D97700]",
        border: "border-[#D97700]",
        button: "bg-[#D97700] hover:bg-[#b86400]",
      };
    default:
      return {
        tab: "bg-primary",
        border: "border-primary",
        button: "bg-primary hover:bg-primary-600",
      };
  }
};

const Feature = ({
  text,
  included,
  highlighted = false,
}: {
  text: string;
  included: boolean;
  highlighted?: boolean;
}) => (
  <li className="flex items-start gap-3">
    <div
      className={twMerge(
        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        included
          ? highlighted
            ? "bg-white/20 text-white"
            : "bg-white/10 text-white/70"
          : "border border-white/20 text-transparent",
      )}
    >
      {included && <FontAwesomeIcon icon={faCheck} className="text-xs" />}
    </div>
    <span
      className={twMerge(
        "mt-[3px] text-sm",
        included
          ? highlighted
            ? "text-white"
            : "text-white/80"
          : "text-white/40",
      )}
    >
      {text}
    </span>
  </li>
);

interface PricingModalProps {}

export function PricingModal({}: PricingModalProps = {}) {
  const { isOpen, closeModal, title, subtitle } = usePricingModalStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      className="flex max-h-[90vh] max-w-screen-2xl flex-col overflow-y-auto rounded-2xl border border-white/5 bg-[#101014]"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      backdropClassName="bg-black/80"
    >
      <PricingContent title={title} subtitle={subtitle} />
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
