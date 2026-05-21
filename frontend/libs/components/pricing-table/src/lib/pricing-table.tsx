import { faCheck, faStar, faGem } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanDetails,
} from "@storyteller/subscription";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { UsersApi, BillingApi, UserInfo } from "@storyteller/api";
import {
  getLandingUrl,
  getReferralCode,
  getReferralUsername,
  getReferrer,
} from "@storyteller/common";
import { useNavigate } from "react-router-dom";
import { PROMO_PCT, planPricing } from "./promo-discounts";

const DISCOUNT_PILL_CLASS =
  "inline-flex items-center text-xs font-bold uppercase tracking-wide rounded-md px-1.5 py-0.5 border bg-primary/80 text-white border-primary/30";

const billingTabs = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" },
];

const ENTERPRISE_FEATURES = [
  "Bespoke credit allocation",
  "Secure models",
  "Support SLAs",
  "Custom integrations",
];

// Mapping from our plan slugs to API plan slugs
const PLAN_SLUG_MAP: Record<string, string> = {
  artcraft_basic: "artcraft_basic",
  artcraft_pro: "artcraft_pro",
  artcraft_max: "artcraft_max",
};

// Plans that get an eye-catching gradient frame breaking out of the grid.
type HighlightKind = "popular" | "best";
const HIGHLIGHTS: Record<string, HighlightKind> = {
  artcraft_pro: "popular",
  artcraft_max: "best",
};

interface PricingTableProps {
  includeFree?: boolean;
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  showSeedanceFeatures?: boolean;
  showEnterprise?: boolean;
  /** Use the unified landing3-style monochrome theme instead of per-plan
   * green/purple/orange color schemes. */
  unifiedTheme?: boolean;
}

const PricingTable = ({
  includeFree = false,
  showHeader = true,
  title = "Choose Your Plan",
  subtitle = "Support open-source development. Your subscription keeps ArtCraft free and open for everyone.",
  className = "",
  compact = false,
  showSeedanceFeatures = false,
  showEnterprise = false,
  unifiedTheme = false,
}: PricingTableProps) => {
  const navigate = useNavigate();
  const [billingType, setBillingType] = useState("yearly");
  const isYearly = billingType === "yearly";

  // User and subscription state
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [activePlanSlug, setActivePlanSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch user session and subscriptions on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usersApi = new UsersApi();
        const sessionResponse = await usersApi.GetSession();

        if (
          sessionResponse.success &&
          sessionResponse.data?.loggedIn &&
          sessionResponse.data?.user
        ) {
          setUser(sessionResponse.data.user);

          // Fetch active subscriptions
          const billingApi = new BillingApi();
          const subscriptionsResponse =
            await billingApi.ListActiveSubscriptions();

          if (
            subscriptionsResponse.success &&
            subscriptionsResponse.data?.active_subscriptions
          ) {
            // Find ArtCraft subscription
            const artcraftSub =
              subscriptionsResponse.data.active_subscriptions.find(
                (sub) => sub.namespace === "artcraft",
              );
            if (artcraftSub) {
              setActivePlanSlug(artcraftSub.product_slug);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const plans = includeFree
    ? SUBSCRIPTION_PLANS
    : SUBSCRIPTION_PLANS.filter((plan) => plan.slug !== "free");

  const getColorSchemeClasses = (
    colorScheme: SubscriptionPlanDetails["colorScheme"],
  ) => {
    const baseClasses = unifiedTheme
      ? "relative rounded-2xl sm:rounded-[28px] p-5 md:p-6 border flex flex-col transition-all duration-300"
      : "relative rounded-3xl p-6 md:p-8 border flex flex-col transition-all duration-300 backdrop-blur-md";

    switch (colorScheme) {
      case "dark":
        return twMerge(
          baseClasses,
          unifiedTheme
            ? "bg-[#080808] border-white/[0.08] hover:border-white/15"
            : "bg-[#1C1C20] border-white/10 hover:border-white/20",
        );
      case "green":
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#002D23]/80 via-[#006B54]/50 to-[#00D28B]/10 border-[#00a873]/50",
          "hover:border-[#00a873] hover:shadow-[0_0_30px_rgba(0,210,139,0.2)]",
        );
      case "purple":
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#2D004D]/80 via-[#6400A8]/50 to-[#C03FFF]/10 border-[#9D4CFF]/50",
          "hover:border-[#9D4CFF] hover:shadow-[0_0_30px_rgba(192,63,255,0.2)]",
        );
      case "orange":
        return twMerge(
          baseClasses,
          "bg-gradient-to-b from-[#332100]/80 via-[#B35C00]/50 to-[#FFB347]/10 border-[#FF8C00]/50",
          "hover:border-[#FF8C00] hover:shadow-[0_0_30px_rgba(255,179,71,0.2)]",
        );
      default:
        return twMerge(
          baseClasses,
          "bg-white/5 border-white/10 hover:border-white/20",
        );
    }
  };

  const isCurrentPlan = (planSlug: string) => {
    return planSlug === activePlanSlug;
  };

  const getButtonText = (planSlug: string) => {
    if (planSlug === "free") return "Get Started";

    if (isCurrentPlan(planSlug)) {
      return "Current Plan";
    }

    // User has an active paid subscription - show "Switch Plan"
    if (activePlanSlug && activePlanSlug !== "free") {
      return "Switch Plan";
    }

    // No subscription - show "Get Plan"
    return "Get Plan";
  };

  const handlePlanClick = async (planSlug: string) => {
    // Free plan - redirect to download
    if (planSlug === "free") {
      navigate("/download");
      return;
    }

    // If current plan, do nothing
    if (isCurrentPlan(planSlug)) {
      return;
    }

    // Set loading state for this plan
    setProcessingPlan(planSlug);

    try {
      const cadence = isYearly ? "yearly" : "monthly";
      const apiPlanSlug = PLAN_SLUG_MAP[planSlug] || planSlug;

      // Not logged in - use user_signup_subscription_checkout
      if (!user) {
        const billingApi = new BillingApi();
        const response = await billingApi.UserSignupSubscriptionCheckout({
          plan: apiPlanSlug,
          cadence: cadence,
          maybeReferralUrl: getReferrer(),
          maybeLandingUrl: getLandingUrl(),
          maybeReferralUsername: getReferralUsername(),
          maybeReferralCode: getReferralCode(),
        });

        if (!response.success || !response.data) {
          throw new Error(
            response.errorMessage || "Failed to initiate checkout",
          );
        }

        // Redirect to Stripe
        window.location.href = response.data.stripeCheckoutRedirectUrl;
        return;
      }

      // Logged in - user already has an account
      // We use the normal subscription APIs here, not the signup one
      const hasActiveSub = activePlanSlug && activePlanSlug !== "free";
      const billingApi = new BillingApi();

      if (hasActiveSub) {
        // User has active subscription - switch plan via portal
        const response = await billingApi.SwitchPlan({
          plan: apiPlanSlug,
          cadence: cadence,
        });

        if (!response.success || !response.data) {
          throw new Error(
            response.errorMessage || "Failed to initiate plan switch",
          );
        }

        // Redirect to Stripe Portal
        window.location.href = response.data.stripePortalUrl;
      } else {
        // User logged in but no active subscription - use normal subscription checkout
        // This attaches the subscription to the existing account
        const response = await billingApi.SubscriptionCheckout({
          plan: apiPlanSlug,
          cadence: cadence,
        });

        if (!response.success || !response.data) {
          throw new Error(
            response.errorMessage || "Failed to initiate checkout",
          );
        }

        // Redirect to Stripe Checkout
        window.location.href = response.data.stripeCheckoutRedirectUrl;
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelPlan = async () => {
    setIsCancelling(true);
    try {
      const billingApi = new BillingApi();
      // Access general portal where user can cancel
      const response = await billingApi.GetPortalUrl();

      if (!response.success || !response.data) {
        throw new Error(
          response.errorMessage || "Failed to access subscription management",
        );
      }

      // Redirect to Stripe Portal where user can cancel
      window.location.href = response.data.stripePortalUrl;
    } catch (error) {
      console.error("Error accessing subscription management:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatPrice = (plan: SubscriptionPlanDetails) => {
    if (plan.monthlyPrice === 0) {
      return { current: 0, original: null, discountPct: 0 };
    }
    const { current, basePrice, discountPct } = planPricing(plan, isYearly);
    return { current, original: basePrice, discountPct };
  };

  // Determine grid columns based on number of plans + enterprise
  const visibleCols = plans.length + (showEnterprise && !compact ? 1 : 0);
  const gridCols =
    visibleCols <= 3
      ? "grid-cols-1 md:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={twMerge("w-full", className)}>
      {showHeader && (
        <div className={`text-center mx-auto ${compact ? "mb-6" : "mb-10"}`}>
          <h2
            className={`font-medium mb-4 ${compact ? "text-2xl md:text-3xl" : "text-4xl sm:text-4xl md:text-6xl"}`}
          >
            {title}
          </h2>
          <p
            className={`text-white/70 leading-relaxed ${compact ? "text-base mb-4" : "text-xl mb-8"}`}
          >
            {subtitle}
          </p>
        </div>
      )}

      {/* Billing Toggle */}
      <div
        className={`flex items-center justify-center gap-4 relative w-fit mx-auto ${compact ? "mb-14" : "mb-14"}`}
      >
        <TabSelector
          tabs={billingTabs}
          activeTab={billingType}
          onTabChange={setBillingType}
          className="w-fit border border-white/20 rounded-lg bg-white/5"
          tabClassName="w-24 text-md"
          indicatorClassName="bg-primary/30 border border-primary"
          selectedTabClassName="text-white"
        />
        <span className="bg-primary text-white px-3 py-0.5 rounded-full text-sm font-medium -top-3 -right-10 md:-left-6 md:right-auto absolute pointer-events-none transform md:-rotate-12 rotate-12">
          -{PROMO_PCT}%
        </span>
      </div>

      <div
        className={`${unifiedTheme ? "max-w-6xl" : "max-w-7xl"} mx-auto grid ${gridCols} gap-x-4 gap-y-10 md:gap-6 items-stretch`}
      >
        {plans.map((plan) => {
          const highlight = HIGHLIGHTS[plan.slug] ?? null;
          const isCurrent = isCurrentPlan(plan.slug);
          const {
            current: price,
            original: originalPrice,
            discountPct,
          } = formatPrice(plan);
          const isProcessing = processingPlan === plan.slug;
          const frame = highlight ? frameClasses(plan.colorScheme) : null;

          // Inner card body (shared between framed and un-framed plans). When
          // highlighted, the solid color is a 2px border (the frame) — not a
          // background — so the card keeps its subtle gradient.
          const cardBody = (
            <div
              className={twMerge(
                getColorSchemeClasses(plan.colorScheme),
                frame
                  ? `relative z-10 border-2 h-full w-full shadow-2xl bg-[#101014] ${frame.border}`
                  : "",
                isCurrent ? "ring-2 ring-white/50" : "",
              )}
            >
              {isCurrent && (
                <div className="absolute top-3 right-3 bg-white text-black px-3 py-0.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                  CURRENT
                </div>
              )}

              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-semibold text-white">
                  {plan.name}
                </h3>
                {discountPct > 0 && (
                  <span className={DISCOUNT_PILL_CLASS}>
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              <div className="mb-1 flex items-baseline gap-2">
                {originalPrice !== null && (
                  <span className="text-[#f05951]/80 line-through text-lg md:text-xl decoration-[#f05951]/80">
                    ${originalPrice}
                  </span>
                )}
                <span className="text-3xl md:text-4xl font-bold">${price}</span>
                <span className="text-white/60">/month</span>
              </div>
              <div className="text-xs text-white/40 mb-4 md:mb-6 uppercase tracking-wider font-semibold min-h-[1rem]">
                {plan.monthlyPrice === 0
                  ? "Free forever"
                  : isYearly
                    ? "Billed yearly"
                    : "Billed monthly"}
              </div>

              <Button
                className={twMerge(
                  "w-full justify-center border-transparent mb-6 md:mb-8 h-11 rounded-xl",
                  isCurrent
                    ? "bg-white/20 cursor-default"
                    : frame
                      ? `${frame.button} text-white`
                      : "bg-white hover:bg-white/80 text-black",
                )}
                onClick={() => handlePlanClick(plan.slug)}
                disabled={isCurrent || isProcessing || isLoading}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  getButtonText(plan.slug)
                )}
              </Button>

              <ul className="space-y-3 md:space-y-4 flex-1">
                {plan.features
                  .filter((f) => !f.seedanceOnly || showSeedanceFeatures)
                  .map((feature, idx) => (
                    <Feature
                      key={idx}
                      text={feature.text}
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
          // ABOVE the card (out of flow, no push-down) and tucks behind the card
          // top (z-0 vs the card's z-10) so its color fills the rounded-corner
          // notches — the tab reads as one continuous frame with the card.
          return (
            <div key={plan.slug} className="relative">
              <div
                className={twMerge(
                  "absolute inset-x-0 bottom-[calc(100%_-_1.75rem)] z-0 flex items-center justify-center gap-1.5 rounded-t-2xl sm:rounded-t-[28px] pt-2 pb-8 text-xs font-bold uppercase tracking-[0.1em] text-white",
                  frame?.tab,
                )}
              >
                <FontAwesomeIcon
                  icon={highlight === "popular" ? faStar : faGem}
                  className="text-xs pb-0.5"
                />
                {highlight === "popular" ? "Most Popular" : "Best Value"}
              </div>

              {cardBody}
            </div>
          );
        })}

        {/* Enterprise card - inline in grid for normal view */}
        {showEnterprise && !compact && (
          <div
            className={
              unifiedTheme
                ? "relative rounded-2xl sm:rounded-[28px] p-5 md:p-6 border flex flex-col transition-all duration-300 bg-gradient-to-b from-[#0d1f4a]/90 via-[#183878]/60 to-[#2456b8]/15 border-[#3568c9]/40 hover:border-[#3568c9] hover:shadow-[0_0_30px_rgba(53,104,201,0.25)]"
                : "relative rounded-3xl p-6 md:p-8 border flex flex-col transition-all duration-300 backdrop-blur-md bg-gradient-to-b from-[#0d1f4a]/90 via-[#183878]/60 to-[#2456b8]/15 border-[#3568c9]/40 hover:border-[#3568c9] hover:shadow-[0_0_30px_rgba(53,104,201,0.25)]"
            }
          >
            <h3 className="text-xl md:text-2xl font-semibold mb-2 text-white">
              Enterprise
            </h3>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-bold">Custom</span>
            </div>
            <div className="text-xs text-white/40 mb-4 md:mb-6 uppercase tracking-wider font-semibold min-h-[1rem]">
              For bespoke solutions
            </div>

            <a
              href="mailto:hello@storyteller.ai"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white px-4 py-2 text-sm font-medium transition-colors mb-6 md:mb-8 h-11"
            >
              Contact Us
            </a>

            <div className="text-sm text-white/50 mb-3">
              Everything in Max, plus:
            </div>
            <ul className="space-y-3 md:space-y-4 flex-1">
              {ENTERPRISE_FEATURES.map((text, idx) => (
                <Feature key={idx} text={text} />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Enterprise card - horizontal bar below grid for compact/sd2 view */}
      {showEnterprise && compact && (
        <div
          className={
            unifiedTheme
              ? "mt-4 relative rounded-2xl sm:rounded-[28px] p-6 border flex flex-col md:flex-row md:items-center gap-4 md:gap-8 transition-all duration-300 bg-gradient-to-b from-[#0d1f4a]/90 via-[#183878]/60 to-[#2456b8]/15 border-[#3568c9]/40 hover:border-[#3568c9] hover:shadow-[0_0_30px_rgba(53,104,201,0.25)]"
              : "mt-4 relative rounded-3xl p-6 border flex flex-col md:flex-row md:items-center gap-4 md:gap-8 transition-all duration-300 backdrop-blur-md bg-gradient-to-b from-[#0d1f4a]/90 via-[#183878]/60 to-[#2456b8]/15 border-[#3568c9]/40 hover:border-[#3568c9] hover:shadow-[0_0_30px_rgba(53,104,201,0.25)]"
          }
        >
          <div className="flex-shrink-0">
            <h3 className="text-lg font-semibold text-white">Enterprise</h3>
            <div className="text-2xl font-bold mt-1">Custom</div>
            <div className="text-xs text-white/50 mt-1">
              For bespoke solutions
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/40 mb-2">
              Everything in Max, plus:
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {ENTERPRISE_FEATURES.map((text, idx) => (
                <Feature key={idx} text={text} />
              ))}
            </div>
          </div>
          <a
            href="mailto:hello@storyteller.ai"
            className="md:self-center flex-shrink-0 flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Contact Us
          </a>
        </div>
      )}

      {/* Manage Plan Button - Only shown if user has active subscription */}
      {activePlanSlug && activePlanSlug !== "free" && (
        <div className="mt-8 text-center">
          <button
            onClick={handleCancelPlan}
            disabled={isCancelling}
            className="text-sm text-white/40 hover:text-white/60 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? "Loading..." : "Manage Plan"}
          </button>
        </div>
      )}
    </div>
  );
};

// Solid frame color for highlighted plans — uses each plan's own color scheme
// (Pro = purple, Max = orange) so the frame matches the card it wraps. The frame
// is a solid border + a label tab (not a background), so the card keeps its own
// subtle gradient and the color never bleeds through.
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
  highlighted = false,
}: {
  text: string;
  highlighted?: boolean;
}) => (
  <li className="flex items-start gap-3">
    <div
      className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${highlighted ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}
    >
      <FontAwesomeIcon icon={faCheck} className="text-xs" />
    </div>
    <span
      className={`text-sm mt-[3px] ${highlighted ? "text-white" : "text-white/80"}`}
    >
      {text}
    </span>
  </li>
);

export default PricingTable;
