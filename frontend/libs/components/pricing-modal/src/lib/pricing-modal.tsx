// ReactNode is the type for "anything React can render" (text, elements, arrays); used only as a type here, for the PricingSection helper's children.
import { ReactNode } from "react";
// Modal is the shared popup shell (backdrop, close button, Esc/outside-click handling) from the modal library.
import { Modal } from "@storyteller/ui-modal";
// Button is the shared button component; this file only uses its "secondary" look.
import { Button } from "@storyteller/ui-button";
// Three small icons from the lucide icon set: coins (credits), credit card (payment method), tag (the promo banner).
import { CoinsIcon, CreditCardIcon, TagIcon } from "lucide-react";
// invoke is how the web page calls a Rust command in the desktop app (Tauri); every billing action below goes through it.
import { invoke } from "@tauri-apps/api/core";
// OpenUrl asks the operating system to open a link (here a mailto: link) in the user's default app; it rejects if the open fails.
import { OpenUrl } from "@storyteller/tauri-api";
// useSubscriptionState is the shared store that holds the signed-in user's paid plan (if any); filled by fetchFromServer elsewhere.
import { useSubscriptionState } from "@storyteller/subscription";
// BillingCadence is the "monthly" | "yearly" type; PricingSectionLabel draws the "01 Pricing" strip labels;
// PricingTable draws the plan cards; PROMO_PCT is the promo discount number (20) the whole pricing UI shares.
import {
  BillingCadence,
  PricingSectionLabel,
  PricingTable,
  PROMO_PCT,
} from "@storyteller/ui-pricing-table";
// The store that remembers whether THIS pricing dialog is open, plus its optional custom title and subtitle.
import { usePricingModalStore } from "./pricing-modal-store";
// The store for the sibling "buy credits" dialog; this file only opens it (see handleBuyCredits).
import { useCreditsModalStore } from "./credits-modal-store";

// Default words for the big heading and the paragraph under it; a caller can override both through the title/subtitle props.
const pricingConfig = {
  header: {
    title: "Pick a plan",
    subtitle:
      "Get a ton of generations and invest in a tool you'll always own. Your subscription helps keep ArtCraft free and open for everyone.",
  },
};

// Tailwind class string shared by the three "secondary" buttons below (Buy more credits, Update payment method, Buy credits).
// One constant so the three buttons cannot drift apart in size, border or hover look.
const SECONDARY_BUTTON_CLASSES =
  "gap-2 rounded-none border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-none hover:bg-white/10";

// The two optional text overrides PricingContent accepts.
interface PricingContentProps {
  // Replaces the big "Pick a plan" heading when given (an empty string also falls back to the default, see the || below).
  title?: string;
  // Replaces the paragraph under the heading when given.
  subtitle?: string;
}

// The pricing page body without any popup around it. It is exported because two places use it:
// PricingModal below (wrapped in a popup) and the Artcraft block inside the provider-billing dialog (ArtcraftBillingBlock), which shows it inline.
export function PricingContent({ title, subtitle }: PricingContentProps) {
  // Subscribe to the subscription store so this component re-renders when the user's plan changes.
  const subscriptionStore = useSubscriptionState();
  // True when the user has a paid plan (the store treats "has a subscription token" as "paid"; free is not stored as a plan).
  const hasActiveSub = subscriptionStore.hasPaidPlan();
  // The slug (internal plan id) of the plan to mark as "current" in the table; null when there is no paid plan.
  // PricingTable ignores a click on the plan whose slug equals this value.
  const activePlanSlug = hasActiveSub
    ? (subscriptionStore.subscriptionInfo?.productSlug ?? null)
    : null;

  // "Manage plan" button inside the table: asks the Rust side to open the payment provider's customer portal (manage-plan flow).
  // It has no catch of its own; PricingTable (onManagePlan) logs a failure to the console and shows the user nothing (see N-108 in BUGS.md).
  const handleManageSubscription = async () => {
    // The Rust side starts the portal flow; this page uses no return value from it.
    await invoke("storyteller_open_customer_portal_manage_plan_command");
  };

  // "Update payment method" button in the header area (only shown with a paid plan): opens the portal on the payment-method page.
  // Unlike the two handlers around it, nothing catches a failure here at all: the click handler's promise rejection goes
  // unhandled and the user sees nothing (N-108 in BUGS.md).
  const handleUpdatePaymentMethod = async () => {
    // Same kind of call as above, aimed at the payment-method page of the portal.
    await invoke(
      "storyteller_open_customer_portal_update_payment_method_command",
    );
  };

  // Called by PricingTable when the user picks a plan card; planSlug is the plan's id and cadence is monthly or yearly.
  // PricingTable catches a rejection from here, logs it, and then clears its "working" spinner; the user gets no message (N-108).
  const handleSetPlan = async (planSlug: string, cadence: BillingCadence) => {
    // A user who already pays switches plans through the portal; a new subscriber goes to checkout instead.
    if (hasActiveSub) {
      // Existing subscriber: the Rust command opens the portal's switch-plan page for the chosen plan and cadence.
      await invoke("storyteller_open_customer_portal_switch_plan_command", {
        // Rust expects the arguments wrapped in an object named "request".
        request: {
          // Which plan the user picked.
          plan: planSlug,
          // Monthly or yearly billing.
          cadence: cadence,
        },
      });
    } else {
      // No paid plan yet: the Rust command opens the checkout page for the chosen plan and cadence.
      await invoke("storyteller_open_subscription_purchase_command", {
        // Same "request" wrapper as above.
        request: {
          // Which plan the user picked.
          plan: planSlug,
          // Monthly or yearly billing.
          cadence: cadence,
        },
      });
    }
  };

  // Both "Buy credits" buttons call this: it swaps this dialog for the credits dialog (it does not call Rust itself).
  const handleBuyCredits = () => {
    // Close the pricing dialog first so the two popups never stack on top of each other.
    usePricingModalStore.getState().closeModal();
    // Then open the credits dialog (credits-modal.tsx), which handles the actual purchase.
    useCreditsModalStore.getState().openModal();
  };

  // The page layout, top to bottom: promo banner, section 01 (heading), section 02 (plan table), credit packs + footnote.
  return (
    // Outer wrapper: near-black background and white text; min-h-0 + flex-1 lets it shrink and scroll inside the popup's flex column.
    <div className="min-h-0 flex-1 bg-[#101014] text-white">
      {/* Promo strip across the top in the brand color. */}
      <div className="bg-primary text-white">
        {/* The large right padding (pr-14) keeps the text clear of the popup's X button, which sits in the top-right corner. */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5 pl-6 pr-14 md:pl-10">
          {/* Left side: a tag icon and "Limited-time offer" in the small uppercase mono "HUD" style (class defined in website-pricing-table.css). */}
          <p className="pricing-hud flex items-center gap-2 font-bold">
            {/* aria-hidden: the icon is decoration, so screen readers skip it. */}
            <TagIcon aria-hidden className="h-3.5 w-3.5" />
            Limited-time offer
          </p>
          {/* Right side: the discount sentence; the number comes from PROMO_PCT so it matches every other price shown. */}
          <p className="text-sm">
            Save {PROMO_PCT}% on every plan, monthly or yearly — lock in the
            lowest price today.
          </p>
        </div>
      </div>

      {/* Section 01: the page heading, subtitle and (for subscribers) two quick-action buttons. */}
      <PricingSection>
        {/* The "01 / Pricing" strip label with a small right-hand note; the † points at the footnote at the bottom of the page. */}
        <PricingSectionLabel
          index="01"
          label="Pricing"
          annotation="Free & open source · Subscriptions optional†"
        />
        {/* Padding box around the heading block. */}
        <div className="px-6 py-12 md:px-10 md:py-16">
          {/* Big heading: the caller's title if it is non-empty, otherwise "Pick a plan". */}
          <h1 className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl">
            {title || pricingConfig.header.title}
          </h1>
          {/* Paragraph under the heading: the caller's subtitle if non-empty, otherwise the default sentence. */}
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">
            {subtitle || pricingConfig.header.subtitle}
          </p>
          {/* These two buttons only make sense for someone who already pays, so they are hidden for everyone else. */}
          {hasActiveSub && (
            <div className="mt-6 flex flex-wrap gap-3">
              {/* Opens the credits dialog (handleBuyCredits closes this one first). */}
              <Button
                variant="secondary"
                className={SECONDARY_BUTTON_CLASSES}
                onClick={handleBuyCredits}
              >
                <CoinsIcon aria-hidden className="h-4 w-4" />
                Buy more credits
              </Button>
              {/* Starts the portal's payment-method flow (handleUpdatePaymentMethod); a failure here is silent (N-108). */}
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

      {/* Section 02: the plan cards. */}
      <PricingSection>
        {/* The "02 / Choose your plan" strip label. */}
        <PricingSectionLabel
          index="02"
          label="Choose your plan"
          annotation="Every paid plan includes video credits"
        />
        {/* activePlanSlug marks the user's current plan; the show* flags turn on the Seedance feature rows and the Enterprise card. */}
        {/* onChoosePlan / onManagePlan run the billing launches above; onContact hands the Enterprise "contact us" mailto link to the operating system. */}
        <PricingTable
          activePlanSlug={activePlanSlug}
          showSeedanceFeatures
          showEnterprise
          onChoosePlan={handleSetPlan}
          onManagePlan={handleManageSubscription}
          onContact={(mailtoUrl) => OpenUrl(mailtoUrl)}
        />
      </PricingSection>

      {/* Last block: a two-column strip (one-time credit packs on the left, the † footnote on the right); stacks to one column on narrow widths. */}
      <PricingSection>
        <div className="grid md:grid-cols-2">
          {/* Left column: the credit-pack pitch. */}
          <div className="p-6 md:p-10">
            {/* Small uppercase label above the headline. */}
            <p className="pricing-hud text-white/40">Need more credits?</p>
            {/* Column headline. */}
            <h2 className="mt-4 font-display text-2xl font-medium tracking-[-0.02em] text-white">
              One-time credit packs
            </h2>
            {/* One-sentence explanation. */}
            <p className="mt-2 max-w-md leading-relaxed text-white/55">
              Top up without changing your plan. Credit packs never expire.
            </p>
            {/* Same action as "Buy more credits" above, but shown to everyone (subscribed or not). */}
            <Button
              variant="secondary"
              className={`mt-6 ${SECONDARY_BUTTON_CLASSES}`}
              onClick={handleBuyCredits}
            >
              <CoinsIcon aria-hidden className="h-4 w-4 text-primary" />
              Buy credits
            </Button>
          </div>
          {/* Right column: the footnote the † in section 01 points at; has a top border when stacked and a left border side by side. */}
          <div className="border-t border-white/15 p-6 md:border-l md:border-t-0 md:p-10">
            {/* Small uppercase label for the footnote. */}
            <p className="pricing-hud text-white/40">† Footnote</p>
            {/* The footnote text: the app works without a subscription (bring your own compute and third-party subscriptions). */}
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

// A thin wrapper that draws one horizontal band of the page with a faint line along its top edge.
// Not exported: it only exists so the three bands above are drawn the same way.
function PricingSection({ children }: { children: ReactNode }) {
  return <section className="border-t border-white/15">{children}</section>;
}

// PricingModal takes no props (the text comes from the store); the empty interface and the "= {}" default keep the call signature uniform.
interface PricingModalProps {}

// The popup version of the pricing page. It is mounted once, always, and shows or hides itself from the store's isOpen flag.
export function PricingModal({}: PricingModalProps = {}) {
  // isOpen: whether to show the popup; closeModal: the function that closes it; title/subtitle: optional text overrides stored
  // by whoever opened it (undefined when they did not ask for different wording).
  const { isOpen, closeModal, title, subtitle } = usePricingModalStore();

  // Hand the page body to the shared Modal shell. This component keeps no state of its own (it only reads the store),
  // so nothing from a previous visit can be left over in it (checked while looking for the B-167/B-168 pattern).
  return (
    // isOpen / onClose connect the popup to the store. The class string sizes it (up to 90% of the window height, very wide, scrolls
    // vertically) and gives it the same square, dark, thin-bordered look as the page inside it.
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      className="flex max-h-[90vh] max-w-screen-xl flex-col overflow-y-auto rounded-none border border-white/15 bg-[#101014]"
      // false = a normal blocking popup: clicks on the app behind it are not passed through.
      allowBackgroundInteraction={false}
      // Show the X button in the corner (hence the large right padding on the promo strip).
      showClose={true}
      // Clicking the dark backdrop closes the popup.
      closeOnOutsideClick={true}
      // The user cannot drag its edges to resize it.
      resizable={false}
      // false = no built-in padding around the children; PricingContent lays out its own edge-to-edge bands.
      childPadding={false}
      // A darker, 80%-black backdrop behind the popup.
      backdropClassName="bg-black/80"
    >
      {/* title/subtitle may be undefined, in which case PricingContent uses its own defaults. */}
      <PricingContent title={title} subtitle={subtitle} />
    </Modal>
  );
}

// Additional interfaces for Stripe integration
// Shape of a subscription record for a Stripe-style billing backend. Nothing in the code base imports this type (checked by search),
// so it is dead weight today; the live data shape is SubscriptionInfo in the subscription store instead.
export interface SubscriptionData {
  // Id of the plan the user is on.
  currentPlanId: string;
  // Whether the user pays for anything right now.
  hasActiveSubscription: boolean;
  // The payment provider's customer id, when known.
  customerId?: string;
  // The payment provider's subscription id, when known.
  subscriptionId?: string;
  // Monthly or yearly billing.
  billingCycle?: "monthly" | "yearly";
  // When the next charge will happen, when known.
  nextBillingDate?: Date;
}

// Also the default export, so a caller can write `import PricingModal from ...` as well as the named import.
export default PricingModal;
