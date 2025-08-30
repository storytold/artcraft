import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Label } from "@storyteller/ui-label";
import { Progress } from "@storyteller/ui-progress";
import {
  faCircleDollar,
  faInfoCircle,
  faStar,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const creditPercentage =
    (billingInfo.credits.remaining / billingInfo.credits.total) * 100;
  const isLowCredit = creditPercentage < 20; // If used more than 80% of credits, consider it low

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="credits" className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleDollar} />
            Monthly credits left
          </Label>
          <div className="flex items-center gap-2">
            <Progress
              value={creditPercentage}
              isLow={isLowCredit}
              className="h-2 w-full"
            />
            <span className="text-sm text-muted-foreground font-medium">
              {billingInfo.credits.remaining}/{billingInfo.credits.total}
            </span>
          </div>
        </div>

        <hr className="border-white/10" />

        <div className="space-y-1">
          <Label>Current Plan</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faStar} className="text-purple/70" />
              {billingInfo.plan}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-[30px]">
                Cancel plan
              </Button>
              <Button variant="primary" className="h-[30px]">
                Change plan
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/50">
          <FontAwesomeIcon icon={faInfoCircle} />
          Next {billingInfo.nextPayment.amount} payment due{" "}
          {billingInfo.nextPayment.date}
        </div>
      </div>
    </>
  );
};
