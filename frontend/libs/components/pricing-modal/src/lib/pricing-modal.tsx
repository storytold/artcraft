import { ReactNode } from "react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { CoinsIcon, CreditCardIcon, TagIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { OpenUrl } from "@storyteller/tauri-api";
import { useSubscriptionState } from "@storyteller/subscription";
import {
  BillingCadence,
  PricingSectionLabel,
  PricingTable,
  PROMO_PCT,
} from "@storyteller/ui-pricing-table";
import { usePricingModalStore } from "./pricing-modal-store";
import { useCreditsModalStore } from "./credits-modal-store";

const pricingConfig = {
  header: {
    title: "Pick a plan",
    subtitle:
      "Get a ton of generations and invest in a tool you'll always own. Your subscription helps keep ArtCraft free and open for everyone.",
  },
};

const SECONDARY_BUTTON_CLASSES =
  "gap-2 rounded-none border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-none hover:bg-white/10";

interface PricingContentProps {
  title?: string;
  subtitle?: string;
}

export function PricingContent({ title, subtitle }: PricingContentProps) {
  const subscriptionStore = useSubscriptionState();
  const hasActiveSub = subscriptionStore.hasPaidPlan();
  const activePlanSlug = hasActiveSub
    ? (subscriptionStore.subscriptionInfo?.productSlug ?? null)
    : null;

  const handleManageSubscription = async () => {
    await invoke("storyteller_open_customer_portal_manage_plan_command");
  };

  const handleUpdatePaymentMethod = async () => {
    await invoke(
      "storyteller_open_customer_portal_update_payment_method_command",
    );
  };

  const handleSetPlan = async (planSlug: string, cadence: BillingCadence) => {
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

  const handleBuyCredits = () => {
    usePricingModalStore.getState().closeModal();
    useCreditsModalStore.getState().openModal();
  };

  return (
    <div className="min-h-0 flex-1 bg-[#101014] text-white">
      <div className="bg-primary text-white">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5 pl-6 pr-14 md:pl-10">
          <p className="pricing-hud flex items-center gap-2 font-bold">
            <TagIcon aria-hidden className="h-3.5 w-3.5" />
            Limited-time offer
          </p>
          <p className="text-sm">
            Save {PROMO_PCT}% on every plan, monthly or yearly — lock in the
            lowest price today.
          </p>
        </div>
      </div>

      <PricingSection>
        <PricingSectionLabel
          index="01"
          label="Pricing"
          annotation="Free & open source · Subscriptions optional†"
        />
        <div className="px-6 py-12 md:px-10 md:py-16">
          <h1 className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">
            {title || pricingConfig.header.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">
            {subtitle || pricingConfig.header.subtitle}
          </p>
          {hasActiveSub && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                className={SECONDARY_BUTTON_CLASSES}
                onClick={handleBuyCredits}
              >
                <CoinsIcon aria-hidden className="h-4 w-4" />
                Buy more credits
              </Button>
              <Button
                variant="secondary"
                className={SECONDARY_BUTTON_CLASSES}
                onClick={handleUpdatePaymentMethod}
              >
                <CreditCardIcon aria-hidden className="h-4 w-4" />
                Update payment method
              </Button>
            </div>
          )}
        </div>
      </PricingSection>

      <PricingSection>
        <PricingSectionLabel
          index="02"
          label="Choose your plan"
          annotation="Every paid plan includes video credits"
        />
        <PricingTable
          activePlanSlug={activePlanSlug}
          showSeedanceFeatures
          showEnterprise
          onChoosePlan={handleSetPlan}
          onManagePlan={handleManageSubscription}
          onContact={(mailtoUrl) => OpenUrl(mailtoUrl)}
        />
      </PricingSection>

      <PricingSection>
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-10">
            <p className="pricing-hud text-white/40">Need more credits?</p>
            <h2 className="mt-4 font-display text-2xl font-medium tracking-[-0.02em] text-white">
              One-time credit packs
            </h2>
            <p className="mt-2 max-w-md leading-relaxed text-white/55">
              Top up without changing your plan. Credit packs never expire.
            </p>
            <Button
              variant="secondary"
              className={`mt-6 ${SECONDARY_BUTTON_CLASSES}`}
              onClick={handleBuyCredits}
            >
              <CoinsIcon aria-hidden className="h-4 w-4 text-primary" />
              Buy credits
            </Button>
          </div>
          <div className="border-t border-white/15 p-6 md:border-l md:border-t-0 md:p-10">
            <p className="pricing-hud text-white/40">† Footnote</p>
            <p className="mt-4 max-w-md leading-relaxed text-white/55">
              ArtCraft can be used without paying for a subscription. You can
              bring your own compute and third-party subscriptions. We hope
              you’ll subscribe, though, as that helps accelerate our
              development.
            </p>
          </div>
        </div>
      </PricingSection>
    </div>
  );
}

function PricingSection({ children }: { children: ReactNode }) {
  return <section className="border-t border-white/15">{children}</section>;
}

interface PricingModalProps {}

export function PricingModal({}: PricingModalProps = {}) {
  const { isOpen, closeModal, title, subtitle } = usePricingModalStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      className="flex max-h-[90vh] max-w-screen-xl flex-col overflow-y-auto rounded-none border border-white/15 bg-[#101014]"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      childPadding={false}
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
