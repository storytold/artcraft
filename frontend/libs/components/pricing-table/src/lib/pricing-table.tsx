import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { SUBSCRIPTION_PLANS } from "@storyteller/subscription";
import {
  BillingCadence,
  WebsitePricingTable,
} from "./website-pricing-table";

export type { BillingCadence };

export interface PricingTableProps {
  /** Slug of the user's active ArtCraft plan, if any. */
  activePlanSlug?: string | null;
  displayName?: string;
  loading?: boolean;
  includeFree?: boolean;
  showSeedanceFeatures?: boolean;
  showEnterprise?: boolean;
  className?: string;
  defaultCadence?: BillingCadence;
  /** Called when a plan CTA is clicked (never for the active plan). */
  onChoosePlan: (
    planSlug: string,
    cadence: BillingCadence,
  ) => Promise<unknown> | unknown;
  /** Opens the subscription management portal. */
  onManagePlan?: () => Promise<unknown> | unknown;
  /** Opens a mailto link; defaults to regular link navigation. */
  onContact?: (mailtoUrl: string) => void;
}

// Website-style plan grid. Account state and checkout are supplied by the
// host app, so this stays free of any platform-specific billing APIs.
export const PricingTable = ({
  activePlanSlug = null,
  displayName,
  loading = false,
  includeFree = false,
  showSeedanceFeatures = true,
  showEnterprise = true,
  className,
  defaultCadence = "yearly",
  onChoosePlan,
  onManagePlan,
  onContact,
}: PricingTableProps) => {
  const [cadence, setCadence] = useState<BillingCadence>(defaultCadence);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);

  const plans = includeFree
    ? SUBSCRIPTION_PLANS
    : SUBSCRIPTION_PLANS.filter((plan) => plan.slug !== "free");

  const handleChoose = async (planSlug: string) => {
    if (planSlug === activePlanSlug) return;
    setProcessingPlan(planSlug);
    try {
      await onChoosePlan(planSlug, cadence);
    } catch (error) {
      console.error("Error initiating checkout:", error);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManage = async () => {
    if (!onManagePlan) return;
    setManaging(true);
    try {
      await onManagePlan();
    } catch (error) {
      console.error("Error accessing subscription management:", error);
    } finally {
      setManaging(false);
    }
  };

  return (
    <div className={twMerge("w-full", className)}>
      <WebsitePricingTable
        plans={plans}
        cadence={cadence}
        onCadenceChange={setCadence}
        showSeedanceFeatures={showSeedanceFeatures}
        showEnterprise={showEnterprise}
        activePlanSlug={activePlanSlug}
        displayName={displayName}
        loading={loading}
        processingPlan={processingPlan}
        managing={managing}
        onChoose={handleChoose}
        onManage={handleManage}
        onContact={onContact}
      />
    </div>
  );
};

interface PricingSectionLabelProps {
  index: string;
  label: string;
  annotation?: string;
  className?: string;
}

// "01 / Pricing" hairline strip that heads each pricing section.
export const PricingSectionLabel = ({
  index,
  label,
  annotation,
  className,
}: PricingSectionLabelProps) => (
  <div
    className={twMerge(
      "pricing-hud flex items-center justify-between gap-4 border-b border-white/15 px-6 py-3 text-white/55 md:px-10",
      className,
    )}
  >
    <p>
      <span className="text-white/40">{index} / </span>
      {label}
    </p>
    {annotation && <p className="hidden text-white/40 sm:block">{annotation}</p>}
  </div>
);

export default PricingTable;
