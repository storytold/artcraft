import { useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  GemIcon,
  MailIcon,
  StarIcon,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "@storyteller/ui-button";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { SubscriptionPlanDetails } from "@storyteller/subscription";
import { PROMO_PCT, planPricing } from "./promo-discounts";
import "./website-pricing-table.css";

export type BillingCadence = "yearly" | "monthly";
const BILLING_TABS = [
  { id: "yearly", label: "Yearly" },
  { id: "monthly", label: "Monthly" },
];
const HIGHLIGHT_ICONS = { "Most popular": StarIcon, "Best value": GemIcon };
const PLAN_STYLE: Record<
  string,
  { tagline: string; highlight?: keyof typeof HIGHLIGHT_ICONS }
> = {
  artcraft_basic: { tagline: "For getting started" },
  artcraft_pro: { tagline: "For serious creators", highlight: "Most popular" },
  artcraft_max: {
    tagline: "For studios and power users",
    highlight: "Best value",
  },
};
const PLAN_BUTTON_CLASSES =
  "h-11 w-full font-mono text-[11px] font-semibold uppercase tracking-[0.12em] rounded-none bg-[var(--plan)] hover:bg-[var(--plan)] text-white hover:opacity-90";
const CONTACT_EMAIL = "hello@storyteller.ai";
const ENTERPRISE_FEATURES = [
  "Bespoke credit allocation",
  "Secure models",
  "Support SLAs",
  "Custom integrations",
];
const TRUST_POINTS = [
  "Cancel anytime",
  "Secure checkout via Stripe",
  "Credits refunded if a generation fails",
  "Open source — yours forever",
];

interface WebsitePricingTableProps {
  plans: SubscriptionPlanDetails[];
  cadence: BillingCadence;
  onCadenceChange: (cadence: BillingCadence) => void;
  showSeedanceFeatures: boolean;
  showEnterprise: boolean;
  activePlanSlug: string | null;
  displayName?: string;
  loading: boolean;
  processingPlan: string | null;
  managing: boolean;
  onChoose: (slug: string) => void;
  onManage: () => void;
  onContact?: (mailtoUrl: string) => void;
}

// Website presentation reuses the shared table's account and checkout handlers.
export function WebsitePricingTable({
  plans,
  cadence,
  onCadenceChange: setCadence,
  showSeedanceFeatures,
  showEnterprise,
  activePlanSlug,
  displayName,
  loading,
  processingPlan,
  managing,
  onChoose,
  onManage,
  onContact,
}: WebsitePricingTableProps) {
  const hasActivePlan = !!activePlanSlug && activePlanSlug !== "free";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 px-6 py-4 md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <TabSelector
            tabs={BILLING_TABS}
            activeTab={cadence}
            onTabChange={(id) => setCadence(id as BillingCadence)}
            className="w-fit"
            listClassName="rounded-none"
            indicatorClassName="rounded-none"
            tabClassName="w-24 font-mono text-[11px] uppercase tracking-[0.1em]"
          />
          <span className="pricing-hud pricing-sale-badge bg-primary px-2 py-1 text-white">
            {PROMO_PCT}% off · ends soon
          </span>
          <p className="pricing-hud hidden text-primary sm:block">
            {cadence === "yearly"
              ? "2 months free"
              : "Switch to yearly, save 20%"}
          </p>
        </div>
        <p className="pricing-hud hidden text-white/40 sm:block">
          {displayName ? `Signed in as ${displayName}` : "Prices in USD"}
        </p>
      </div>

      <div className="grid gap-px bg-white/15 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, i) => (
          <PlanCell
            key={plan.slug}
            plan={plan}
            index={String(i + 1).padStart(2, "0")}
            cadence={cadence}
            showSeedanceFeatures={showSeedanceFeatures}
            isCurrent={plan.slug === activePlanSlug}
            ctaLabel={
              plan.slug === activePlanSlug
                ? "Current plan"
                : hasActivePlan
                  ? `Switch to ${plan.name}`
                  : `Get ${plan.name}`
            }
            disabled={loading || processingPlan !== null}
            processing={processingPlan === plan.slug}
            onChoose={() => onChoose(plan.slug)}
          />
        ))}
        {showEnterprise && (
          <EnterpriseCell
            index={String(plans.length + 1).padStart(2, "0")}
            onContact={onContact}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-white/15 px-6 py-4 md:px-10">
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
          {TRUST_POINTS.map((point) => (
            <li
              key={point}
              className="pricing-hud flex items-center gap-2 text-white/55"
            >
              <CheckIcon aria-hidden className="h-3.5 w-3.5 text-primary" />
              {point}
            </li>
          ))}
        </ul>
        {hasActivePlan && (
          <button
            type="button"
            onClick={onManage}
            disabled={managing}
            className="pricing-hud text-white/55 underline underline-offset-4 hover:text-white/80 disabled:opacity-50"
          >
            {managing ? "Opening portal…" : "Manage plan"}
          </button>
        )}
      </div>
    </>
  );
}

function PlanCell({
  plan,
  index,
  cadence,
  showSeedanceFeatures,
  isCurrent,
  ctaLabel,
  disabled,
  processing,
  onChoose,
}: {
  plan: SubscriptionPlanDetails;
  index: string;
  cadence: BillingCadence;
  showSeedanceFeatures: boolean;
  isCurrent: boolean;
  ctaLabel: string;
  disabled: boolean;
  processing: boolean;
  onChoose: () => void;
}) {
  const { current, basePrice } = planPricing(plan, cadence === "yearly");
  const yearlySavings =
    (plan.originalMonthlyPrice ?? plan.monthlyPrice) * 12 - plan.yearlyPrice;
  const highlight = PLAN_STYLE[plan.slug]?.highlight;
  const HighlightIcon = highlight ? HIGHLIGHT_ICONS[highlight] : null;
  const features = plan.features.filter(
    (f) => !f.seedanceOnly || showSeedanceFeatures,
  );

  return (
    <article
      data-highlight={
        PLAN_STYLE[plan.slug]?.highlight || isCurrent ? "" : undefined
      }
      className={`website-plan-card plan-${plan.colorScheme} flex flex-col`}
    >
      <CellIndexRow index={index}>
        {isCurrent ? (
          <>
            <CheckIcon aria-hidden className="h-3 w-3" />
            Your plan
          </>
        ) : (
          <>
            {HighlightIcon && <HighlightIcon aria-hidden className="h-3 w-3" />}
            {PLAN_STYLE[plan.slug]?.highlight ?? "Plan"}
          </>
        )}
      </CellIndexRow>

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
            {plan.name}
          </h3>
          <span className="pricing-hud bg-[var(--plan)] hover:bg-[var(--plan)] px-2 py-1 font-bold text-white">
            {PROMO_PCT}% off
          </span>
        </div>
        <p className="mt-1 text-sm text-white/55">
          {PLAN_STYLE[plan.slug]?.tagline}
        </p>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-mono text-base text-[#f05951]/80 line-through">
            ${basePrice}
          </span>
          <span className="font-display text-5xl font-medium tracking-[-0.03em] text-white">
            ${current}
          </span>
          <span className="text-white/55">/mo</span>
        </div>
        <p className="pricing-hud mt-2 text-white/40">
          {cadence === "yearly" ? (
            <>
              ${plan.yearlyPrice} billed yearly ·{" "}
              <span className="text-[var(--plan-ink)]">
                Save ${yearlySavings}
              </span>
            </>
          ) : (
            "Billed monthly · cancel anytime"
          )}
        </p>

        <Button
          type="button"
          onClick={onChoose}
          disabled={disabled || isCurrent}
          loading={processing}
          className={twMerge(
            PLAN_BUTTON_CLASSES,
            "mt-6",
            isCurrent && "opacity-60",
          )}
        >
          {ctaLabel}
          {!isCurrent && <ArrowRightIcon aria-hidden className="h-3.5 w-3.5" />}
        </Button>

        <p className="pricing-hud mt-8 text-white/40">What you get</p>
        <FeatureList items={features.map((f) => f.text)} className="mt-3" />
      </div>
    </article>
  );
}

function EnterpriseCell({
  index,
  onContact,
}: {
  index: string;
  onContact?: (mailtoUrl: string) => void;
}) {
  return (
    <article
      id="enterprise"
      className="website-plan-card plan-enterprise flex flex-col"
    >
      <CellIndexRow index={index}>For teams</CellIndexRow>

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
          Enterprise
        </h3>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-5xl font-medium tracking-[-0.03em] text-white">
            Custom
          </span>
        </div>
        <p className="pricing-hud mt-2 text-white/40">
          Bespoke volume &amp; terms
        </p>

        <ContactButtons className="mt-6" onContact={onContact} />

        <p className="pricing-hud mt-8 text-white/40">
          Everything in Max, plus
        </p>
        <FeatureList items={ENTERPRISE_FEATURES} className="mt-3" />
      </div>
    </article>
  );
}

// Solid plan-colored index strip at the top of every cell.
function CellIndexRow({
  index,
  children,
}: {
  index: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[var(--plan)] hover:bg-[var(--plan)] px-6 py-2.5 text-white md:px-8">
      <p className="pricing-hud flex items-center gap-1.5 font-bold">
        {children}
      </p>
      <p className="pricing-hud opacity-70">{index}</p>
    </div>
  );
}

function FeatureList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={twMerge("flex flex-col gap-2.5", className)}>
      {items.map((text) => (
        <li
          key={text}
          className="flex items-start gap-2.5 text-sm text-white/80"
        >
          <span className="website-plan-check mt-px flex h-4 w-4 shrink-0 items-center justify-center">
            <CheckIcon aria-hidden className="h-3 w-3" />
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}

// Mailto plus copy-to-clipboard, so visitors without a configured mail
// client can still grab the address.
function ContactButtons({
  className,
  onContact,
}: {
  className?: string;
  onContact?: (mailtoUrl: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const mailtoUrl = `mailto:${CONTACT_EMAIL}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — the mailto still works.
    }
  };

  return (
    <div className={twMerge("flex gap-px bg-white/30", className)}>
      <Button
        as="link"
        href={mailtoUrl}
        onClick={
          onContact
            ? (e) => {
                e.preventDefault();
                onContact(mailtoUrl);
              }
            : undefined
        }
        className={twMerge(PLAN_BUTTON_CLASSES, "flex-1")}
      >
        <MailIcon aria-hidden className="h-3.5 w-3.5" />
        Contact us
      </Button>
      <Button
        type="button"
        onClick={copy}
        aria-label={copied ? "Email copied" : "Copy email address"}
        className={twMerge(PLAN_BUTTON_CLASSES, "w-12 px-0")}
      >
        {copied ? (
          <CheckIcon aria-hidden className="h-4 w-4" />
        ) : (
          <CopyIcon aria-hidden className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
