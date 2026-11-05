// useEffect runs a side effect after drawing; useState keeps values the screen depends on.
import { useEffect, useState } from "react";
// twMerge joins Tailwind CSS class strings and lets a later class win over an earlier conflicting one.
import { twMerge } from "tailwind-merge";
// The shared pop-up window component (backdrop, close button, click-outside handling).
import { Modal } from "@storyteller/ui-modal";
// Icons from the lucide-react icon set: arrow on the Buy label, coin on each pack, spinner while a checkout opens.
import { ArrowRightIcon, CoinsIcon, LoaderCircleIcon } from "lucide-react";
// invoke calls a Rust command in the desktop app's backend (Tauri's bridge between the web page and Rust).
import { invoke } from "@tauri-apps/api/core";

// One credit pack that can be bought.
interface CreditPack {
  // The pack's id, sent to the backend to say which pack to buy (for example "artcraft_1000").
  id: string;
  // Credits the buyer ends up with, bonus included.
  total: number;
  // Credits that are paid for.
  base: number;
  // Extra free credits on top of `base` (0 means no bonus line is shown).
  bonus: number;
  // Price in US dollars, shown on the card.
  priceUsd: number;
  // Optional ribbon text on the card (for example "Popular").
  badge?: string;
  // Optional payment-provider price id (not used by this component).
  priceId?: string;
}

// The four packs on offer, in the order they are drawn.
const creditPacks: CreditPack[] = [
  // 1,000 credits for $10.
  { id: "artcraft_1000", total: 1000, base: 1000, bonus: 0, priceUsd: 10 },
  // 2,500 credits for $25.
  { id: "artcraft_2500", total: 2500, base: 2500, bonus: 0, priceUsd: 25 },
  {
    // 5,000 credits for $50, with the "Popular" ribbon and a stronger border.
    id: "artcraft_5000",
    total: 5000,
    base: 5000,
    bonus: 0,
    priceUsd: 50,
    badge: "Popular",
  },
  // 10,000 credits for $100.
  { id: "artcraft_10000", total: 10000, base: 10000, bonus: 0, priceUsd: 100 },
];

// What the caller of <CreditsModal /> may pass. All are optional.
interface CreditsModalProps {
  // Whether the window is showing. The app draws this component once and flips this on and off.
  isOpen?: boolean;
  // Called when the user closes the window (close button, outside click or Escape, as the Modal decides).
  onClose?: () => void;
  // If given, a click on a pack calls this instead of opening the real checkout (used by callers that handle buying themselves).
  onPurchase?: (pack: CreditPack) => void;
}

// The "Buy credits" window: four credit packs, each button opens the Stripe checkout page in the user's browser.
export function CreditsModal({
  isOpen = false,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  // The id of the pack whose checkout is being opened right now (shows a spinner and disables every button), or null.
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  // The message shown under the packs when the checkout could not be opened, or null for none.
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // The app draws this dialog once and only flips `isOpen`, so the state above outlives a close. Clear the checkout complaint
  // each time the dialog opens, so a new visit never starts with the error from an earlier attempt (including a launch that
  // failed after the dialog had already been closed).
  useEffect(() => {
    // Only on opening; closing leaves the value alone (the window is hidden anyway).
    if (isOpen) setPurchaseError(null);
  }, [isOpen]);

  // Runs when the user clicks a pack.
  const handlePurchase = async (pack: CreditPack) => {
    // A caller that handles buying itself gets the pack and nothing else happens here.
    if (onPurchase) {
      onPurchase(pack);
      return;
    }

    // Show the spinner on this pack and lock all the packs.
    setPurchasingId(pack.id);
    // Forget any earlier complaint before trying again.
    setPurchaseError(null);
    try {
      // Ask the Rust backend to open the Stripe checkout page for this pack in the system browser.
      await invoke("storyteller_open_credits_purchase_command", {
        request: {
          // The backend expects the pack id under this snake_case name.
          credits_pack: pack.id,
        },
      });
    } catch (error) {
      // WHY: try/finally alone re-threw into an unhandled promise rejection,
      // so a failed checkout launch looked like a button that did nothing.
      // Show a short message under the packs and log the real error for developers.
      setPurchaseError("Could not open checkout. Please try again.");
      console.error("Failed to open credits purchase", error);
    } finally {
      // Success or failure, unlock the packs.
      setPurchasingId(null);
    }
  };

  return (
    // The pop-up window. Its look is set by the classes below; the options turn off features this dialog does not want.
    <Modal
      isOpen={isOpen}
      // A no-op stands in when the caller gave no onClose, so the Modal always has a function to call.
      onClose={onClose ?? (() => {})}
      className="w-full max-w-2xl max-h-[100vh] overflow-y-auto overflow-x-hidden border border-white/15 bg-[#101014] p-0"
      // The app behind the window cannot be clicked while it is open.
      allowBackgroundInteraction={false}
      // Show the X button and let a click on the backdrop close the window.
      showClose={true}
      closeOnOutsideClick={true}
      // Fixed size: no resize grip.
      resizable={false}
      // The content brings its own padding.
      childPadding={false}
      backdropClassName="bg-black/80"
    >
      <div className="relative overflow-hidden">
        <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-11 sm:pb-9">
          {/* Heading, with the word "credits" in the app's accent color. */}
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
            Buy <span className="text-primary">credits</span>
          </h2>
          {/* One-line explanation under the heading. */}
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            One-time credit packs. No subscription required.
          </p>

          {/* The pack cards: one column on narrow windows, two from the `sm` breakpoint up. */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {creditPacks.map((pack) => {
              // True while THIS pack's checkout is opening (shows the spinner instead of "Buy").
              const isLoading = purchasingId === pack.id;
              // A pack with a badge gets the highlighted border.
              const isPopular = !!pack.badge;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePurchase(pack)}
                  // While any checkout is opening, no pack can be clicked (prevents two checkouts at once).
                  disabled={purchasingId !== null}
                  className={twMerge(
                    "group relative flex flex-col gap-6 border p-6 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                    isPopular
                      ? "border-white/60 bg-white/[0.06] hover:border-white"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]",
                  )}
                >
                  {/* Ribbon in the card's top-right corner, only for packs that have a badge. */}
                  {pack.badge && (
                    <span className="absolute -top-2.5 right-3 bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
                      {pack.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Coin icon in a square tile. */}
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-white/10">
                      <CoinsIcon className="text-white text-lg" />
                    </span>
                    <div className="min-w-0">
                      {/* The big number: total credits, with thousands separators for the user's locale. */}
                      <div className="text-4xl font-bold leading-none tracking-tight text-white">
                        {pack.total.toLocaleString()}
                      </div>
                      <div className="mt-0 text-sm text-white/40">
                        {/* Packs with a bonus show "base + N bonus"; the others just say "credits". */}
                        {pack.bonus > 0 ? (
                          <>
                            {pack.base.toLocaleString()} +{" "}
                            <span className="font-semibold text-white">
                              {pack.bonus.toLocaleString()} bonus
                            </span>
                          </>
                        ) : (
                          "credits"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Price in dollars. */}
                    <span className="text-2xl font-semibold text-white/80">
                      ${pack.priceUsd}
                    </span>
                    <span className="flex items-center gap-1.5 text-base font-semibold text-white">
                      {/* Spinner while this pack's checkout is opening, otherwise the "Buy" label with an arrow that nudges right on hover. */}
                      {isLoading ? (
                        <LoaderCircleIcon className="animate-spin" />
                      ) : (
                        <>
                          Buy
                          <ArrowRightIcon className="text-xs transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* The checkout complaint. role="alert" makes screen readers announce it when it appears. */}
          {purchaseError && (
            <p role="alert" className="mt-4 text-center text-xs text-red-400">
              {purchaseError}
            </p>
          )}

          {/* Reassurance line: payment is handled by Stripe, not by the app. */}
          <p className="mt-6 text-center text-xs text-white/35">
            Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// Also export the component as the default so it can be imported without braces.
export default CreditsModal;
