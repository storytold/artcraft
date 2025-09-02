import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Label } from "@storyteller/ui-label";
import {
  faCoinFront,
  faInfoCircle,
  faStar,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePricingModalStore } from "@storyteller/ui-pricing-modal";
import { useCreditsModalStore } from "@storyteller/ui-pricing-modal";

interface BillingSettingsPaneProps {}

interface BillingInfo {
  credits: {
    remaining: number;
    total: number;
  };
  plan: string;
  nextPayment: {
    amount: string;
    date: string;
  };
}

export const BillingSettingsPane = (args: BillingSettingsPaneProps) => {
  const [billingInfo] = useState<BillingInfo>({
    credits: {
      remaining: 180,
      total: 1000,
    },
    plan: "Pro Plan",
    nextPayment: {
      amount: "$99",
      date: "Oct 18",
    },
  });

  useEffect(() => {
    const fetchBillingData = async () => {
      // TODO: Replace with actual API call - BFlat
      // const data = await GetBillingInfo();
      // setBillingInfo(data.payload);
    };
    fetchBillingData();
  }, []);

  const { toggleModal } = usePricingModalStore();
  const { toggleModal: toggleCreditsModal } = useCreditsModalStore();

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Current Plan</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-semibold ">
              <FontAwesomeIcon
                icon={faStar}
                className="text-[#C03FFF] text-lg"
              />
              {billingInfo.plan}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-[30px]">
                Cancel plan
              </Button>
              <Button
                variant="primary"
                className="h-[30px]"
                onClick={() => {
                  toggleModal();
                }}
              >
                Upgrade plan
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/50">
          <FontAwesomeIcon icon={faInfoCircle} />
          Next {billingInfo.nextPayment.amount} payment due{" "}
          {billingInfo.nextPayment.date}
        </div>

        <hr className="border-white/10" />

        <div className="flex flex-col">
          <Label htmlFor="credits" className="flex items-center gap-2">
            Your credit balance
          </Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faCoinFront}
                className="text-primary text-lg"
              />
              <span className="text-2xl font-bold">
                {billingInfo.credits.remaining}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="h-[30px]"
                onClick={() => toggleCreditsModal()}
              >
                Buy credits
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
