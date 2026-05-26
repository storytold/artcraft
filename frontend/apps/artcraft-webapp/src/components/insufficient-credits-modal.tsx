import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { create } from "zustand";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { BillingApi } from "@storyteller/api";
import { CreditsModal } from "./credits-modal";

interface InsufficientCreditsState {
  isOpen: boolean;
  planState: PlanState | null;
  open: () => void;
  close: () => void;
}

const useInsufficientCreditsStore = create<InsufficientCreditsState>((set) => ({
  isOpen: false,
  planState: null,
  // Resolve the user's plan *before* showing the modal, then open with the
  // result in the same update, so the correct copy renders on the first frame
  // (no flash of the no-plan variant while the subscription check is in flight).
  open: () => {
    void fetchPlanState().then((planState) => set({ isOpen: true, planState }));
  },
  close: () => set({ isOpen: false }),
}));

/**
 * Hook that exposes an imperative `openInsufficientCredits()` trigger. Call it
 * from a generate handler when the API replies 402 Payment Required:
 *
 *   const openInsufficientCredits = useInsufficientCredits();
 *   if (result.errorCode === 402) { openInsufficientCredits(); return; }
 */
export function useInsufficientCredits(): () => void {
  return useInsufficientCreditsStore((s) => s.open);
}

// Biggest ArtCraft plan (SubscriptionProduct.ELITE). Users already on it have
// nothing left to upgrade to, so the "Upgrade plan" button is hidden for them.
const BIGGEST_PLAN_SLUG = "fakeyou_elite";

interface CreditsCopy {
  heading: ReactNode;
  subtitle: string;
  perks: string[];
}

// Shown when the user already has an active plan and used up its credits.
const OUT_OF_CREDITS_COPY: CreditsCopy = {
  heading: (
    <>
      You're out of <span className="text-primary">credits</span>.
    </>
  ),
  subtitle: "Upgrade your plan to keep creating.",
  perks: [
    "Unlock more image and video generations",
    "Keep creating without hitting limits",
    "Pick a plan that fits your workflow",
  ],
};

// Shown when the user has no plan yet, so they never had credits to begin with.
const NO_PLAN_COPY: CreditsCopy = {
  heading: (
    <>
      Not enough <span className="text-primary">credits</span>.
    </>
  ),
  subtitle: "Choose a plan to start creating.",
  perks: [
    "Generate images and videos with the latest AI models",
    "Save your work and access it anywhere",
    "Pick a plan that fits your workflow",
  ],
};

interface PlanState {
  // Has an active ArtCraft subscription. Distinguishes "ran out of plan
  // credits" from "never had a plan".
  hasPlan: boolean;
  // Already on the biggest plan, so there is nothing left to upgrade to.
  isOnBiggestPlan: boolean;
}

// Look up the signed-in user's ArtCraft subscription, if any. Mirrors the
// namespace check the topbar uses.
async function fetchPlanState(): Promise<PlanState> {
  try {
    const response = await new BillingApi().ListActiveSubscriptions();
    const artcraftSub = response.success
      ? response.data?.active_subscriptions?.find(
          (sub) => sub.namespace === "artcraft",
        )
      : undefined;
    return {
      hasPlan: !!artcraftSub,
      isOnBiggestPlan: String(artcraftSub?.product_slug) === BIGGEST_PLAN_SLUG,
    };
  } catch {
    return { hasPlan: false, isOnBiggestPlan: false };
  }
}

export function InsufficientCreditsModal() {
  const isOpen = useInsufficientCreditsStore((s) => s.isOpen);
  const planState = useInsufficientCreditsStore((s) => s.planState);
  const close = useInsufficientCreditsStore((s) => s.close);
  const [creditsOpen, setCreditsOpen] = useState(false);

  // `planState` is resolved before the modal opens (see the store's `open`), so
  // the copy below is already correct on the first render.
  const hasPlan = planState?.hasPlan ?? false;
  const isOnBiggestPlan = planState?.isOnBiggestPlan ?? false;
  const copy = hasPlan ? OUT_OF_CREDITS_COPY : NO_PLAN_COPY;

  // "Buy credits" swaps this modal for the credit-packs modal so we never stack
  // two backdrops on top of each other.
  const handleBuyCredits = () => {
    close();
    setCreditsOpen(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={close}
        className="rounded-2xl w-full max-w-md overflow-hidden border border-white/5 bg-[#161618] p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
        allowBackgroundInteraction={false}
        showClose={true}
        closeOnOutsideClick={true}
        resizable={false}
        childPadding={false}
        backdropClassName="bg-black/80"
      >
        <div className="relative overflow-hidden">
          {/* Off-center ambient glow, feels designed, not generic */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/25 blur-[80px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />

          <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
              {copy.heading}
            </h2>
            <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-white/55">
              {copy.subtitle}
            </p>

            <ul className="mt-7 space-y-3">
              {copy.perks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-3 text-[14px] text-white/75"
                >
                  <span className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-[9px] text-primary"
                    />
                  </span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              {hasPlan ? (
                <>
                  {!isOnBiggestPlan && (
                    <Link to="/pricing" onClick={close} className="block">
                      <Button
                        variant="primary"
                        className="w-full h-10 text-sm font-semibold rounded-full"
                      >
                        Upgrade plan
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant={isOnBiggestPlan ? "primary" : "secondary"}
                    onClick={handleBuyCredits}
                    className="w-full h-10 text-sm font-semibold rounded-full"
                  >
                    Buy more credits
                  </Button>
                </>
              ) : (
                <Link to="/pricing" onClick={close} className="block">
                  <Button
                    variant="primary"
                    className="w-full h-10 text-sm font-semibold rounded-full"
                  >
                    Upgrade plan
                  </Button>
                </Link>
              )}
              <button
                type="button"
                onClick={close}
                className="text-center text-[13px] text-white/55 hover:text-white transition-colors py-1"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <CreditsModal
        isOpen={creditsOpen}
        onClose={() => setCreditsOpen(false)}
      />
    </>
  );
}
