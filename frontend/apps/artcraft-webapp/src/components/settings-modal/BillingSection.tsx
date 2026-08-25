import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { LoaderCircleIcon } from "lucide-react";
import { BillingApi } from "@storyteller/api";
import {
  FREE_PLAN,
  SUBSCRIPTION_PLANS_BY_SLUG,
} from "@storyteller/subscription";
import { toast } from "../toast/toast";

interface BillingSectionProps {
  /** Closes the settings modal before navigating to the pricing page. */
  onCloseModal: () => void;
}

export function BillingSection({ onCloseModal }: BillingSectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlanSlug, setActivePlanSlug] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchSubscription = async () => {
      try {
        const response = await new BillingApi().ListActiveSubscriptions();
        if (cancelled) return;
        const artcraftSub = response.data?.active_subscriptions.find(
          (sub) => sub.namespace === "artcraft",
        );
        setActivePlanSlug(artcraftSub?.product_slug ?? null);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleManagePlan = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await new BillingApi().GetPortalUrl();
      if (!response.success || !response.data) {
        throw new Error(
          response.errorMessage || "Failed to open the billing portal",
        );
      }
      // Keep the button in its loading state until the browser navigates
      // away to the Stripe portal.
      window.location.href = response.data.stripePortalUrl;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Could not open the billing portal. Please try again.");
      setIsOpeningPortal(false);
    }
  };

  const handleViewPlans = () => {
    onCloseModal();
    navigate("/pricing");
  };

  if (isLoading) {
    return <div className="text-xs opacity-60">Loading billing details...</div>;
  }

  const hasPaidPlan = activePlanSlug !== null && activePlanSlug !== "free";
  const planName = activePlanSlug
    ? (SUBSCRIPTION_PLANS_BY_SLUG.get(activePlanSlug)?.name ?? activePlanSlug)
    : FREE_PLAN.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">
            Current plan: <span className="font-semibold">{planName}</span>
          </p>
          <p className="text-xs opacity-70">
            {hasPaidPlan
              ? "Update your payment method, view invoices, or cancel your subscription in the billing portal."
              : "Subscribe to a plan for monthly credits and full access to ArtCraft tools."}
          </p>
        </div>
        {hasPaidPlan ? (
          <Button
            type="button"
            variant="primary"
            className="h-9 px-4 shrink-0"
            onClick={handleManagePlan}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Manage Plan"
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            className="h-9 px-4 shrink-0"
            onClick={handleViewPlans}
          >
            View Plans
          </Button>
        )}
      </div>
      {hasPaidPlan && (
        <>
          <hr className="border-ui-panel-border" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">Switch plans</p>
              <p className="text-xs opacity-70">
                Compare plans and upgrade or downgrade on the pricing page.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-3 shrink-0"
              onClick={handleViewPlans}
            >
              View Plans
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
