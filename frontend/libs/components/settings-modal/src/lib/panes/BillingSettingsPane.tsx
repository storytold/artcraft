import { useEffect } from "react";
import { Button } from "@storyteller/ui-button";
import { Label } from "@storyteller/ui-label";
import { CoinsIcon, InfoIcon, StarIcon } from "lucide-react";
import { usePricingModalStore } from "@storyteller/ui-pricing-modal";
import { useCreditsModalStore } from "@storyteller/ui-pricing-modal";
import { useCreditsState, CreditsState } from "@storyteller/credits";
import {
  FREE_PLAN,
  SubscriptionPlanDetails,
  useSubscriptionState,
} from "@storyteller/subscription";
import { SUBSCRIPTION_PLANS_BY_SLUG } from "@storyteller/subscription";
import { invoke } from "@tauri-apps/api/core";

interface BillingSettingsPaneProps {}

export const BillingSettingsPane = (args: BillingSettingsPaneProps) => {
  const { toggleModal: toggleSubscriptionModal } = usePricingModalStore();

  const creditsStore = useCreditsState();

  const sumTotalCredits = creditsStore.totalCredits;

  const subscriptionStore = useSubscriptionState();

  const maybePlanSlug = subscriptionStore.subscriptionInfo?.productSlug;

  const currentPlanDetails: SubscriptionPlanDetails = maybePlanSlug
    ? SUBSCRIPTION_PLANS_BY_SLUG.get(maybePlanSlug) || FREE_PLAN
    : FREE_PLAN;

  const canCancelPlan = subscriptionStore.canCancelPlan();

  const nextBillAt =
    subscriptionStore.subscriptionInfo?.nextBillAt?.toLocaleDateString();
  const subscriptionEndAt =
    subscriptionStore.subscriptionInfo?.subscriptionEndAt?.toLocaleDateString();

  const changeOrUpgradePlanButtonLabel = canCancelPlan
    ? "Change plan"
    : "Upgrade plan";

  useEffect(() => {
    creditsStore.fetchFromServer();
    subscriptionStore.fetchFromServer();
  }, []);

  return (
    <>
      <div className="space-y-4 text-base-fg">
        <Label>Support ArtCraft</Label>
        <p className="text-sm opacity-70">
          You do not have to purchase anything from us to use ArtCraft, but you
          can support ArtCraft development by subscribing or buying credits.
        </p>
      </div>

      <br />

      <div className="space-y-4 text-base-fg">
        <div className="space-y-2">
          <Label>Current ArtCraft Plan</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-semibold ">
              <StarIcon
                
                className="text-[#C03FFF] text-lg" />
              {currentPlanDetails.name}
            </div>
            <div className="flex gap-2">
              {canCancelPlan && <CancelPlanButton />}

              <Button
                variant="primary"
                className="h-[30px]"
                onClick={() => toggleSubscriptionModal()}
              >
                {changeOrUpgradePlanButtonLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* TODO(bt): expose this information via API
        <div className="flex items-center gap-2 text-white/50">
          <InfoIcon />
          Next {billingInfo.nextPayment.amount} payment due{" "}
          {billingInfo.nextPayment.date}
        </div>
        */}

        {subscriptionEndAt && (
          <div className="flex items-center gap-2 text-white/50">
            <InfoIcon />
            Subscription ends on {subscriptionEndAt}
          </div>
        )}

        {nextBillAt && (
          <div className="flex items-center gap-2 text-white/50">
            <InfoIcon />
            Next payment on {nextBillAt}
          </div>
        )}

        <hr className="border-ui-panel-border" />

        <div className="flex flex-col">
          <Label htmlFor="credits" className="flex items-center gap-2">
            Your ArtCraft credit balance
          </Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CoinsIcon
                
                className="text-primary text-lg" />
              <span className="text-2xl font-bold">{sumTotalCredits}</span>
            </div>
            <div className="flex gap-2">
              <BuyCreditsButton />
            </div>
          </div>

          <CreditsTally creditsStore={creditsStore} />
        </div>
      </div>
    </>
  );
};

const CancelPlanButton = () => {
  const handleClick = async () => {
    await invoke("storyteller_open_customer_portal_cancel_plan_command");
  };

  return (
    <Button variant="secondary" className="h-[30px]" onClick={handleClick}>
      Cancel plan
    </Button>
  );
};

const BuyCreditsButton = () => {
  const { toggleModal: toggleCreditsModal } = useCreditsModalStore();

  return (
    <Button
      variant="primary"
      className="h-[30px]"
      onClick={() => toggleCreditsModal()}
    >
      Buy credits
    </Button>
  );
};

const CreditsTally = ({ creditsStore }: { creditsStore: CreditsState }) => {
  return (
    <div className="flex pl-5 pt-3">
      <ul className="list-disc">
        <li>
          {" "}
          {creditsStore.monthlyCredits} monthly credits (refilled monthly){" "}
        </li>
        <li> {creditsStore.bankedCredits} purchased credits </li>
      </ul>
    </div>
  );
};
