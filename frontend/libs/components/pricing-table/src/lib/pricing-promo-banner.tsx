import { faTag } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { PROMO_PCT } from "./promo-discounts";

interface PricingPromoBannerProps {
  className?: string;
}

export const PricingPromoBanner = ({ className }: PricingPromoBannerProps) => (
  <div
    className={twMerge(
      "relative overflow-hidden rounded-2xl sm:rounded-[24px] border border-primary/30 bg-gradient-to-r from-primary-600/35 via-primary-500/15 to-primary/10 px-6 py-6 sm:px-10 sm:py-8",
      className,
    )}
  >
    {/* Decorative glow, top-right */}
    <div
      aria-hidden
      className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
    />

    <div className="relative flex flex-col gap-3">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
        <FontAwesomeIcon icon={faTag} className="text-[10px]" />
        Limited-time offer
      </span>

      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight tracking-[-0.02em] text-white">
        Save <span className="text-primary-300">{PROMO_PCT}%</span> on all
        monthly &amp; yearly plans
      </h2>

      <p className="max-w-2xl text-sm sm:text-base text-white/60">
        Every ArtCraft plan is discounted for a limited time - lock in the
        lowest price and start creating.
      </p>
    </div>
  </div>
);

export default PricingPromoBanner;
