import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Modal } from "@storyteller/ui-modal";
import {
  faCoins,
  faSpinnerThird,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { invoke } from "@tauri-apps/api/core";

interface CreditPack {
  id: string;
  total: number;
  base: number;
  bonus: number;
  priceUsd: number;
  badge?: string;
  priceId?: string;
}

const creditPacks: CreditPack[] = [
  { id: "artcraft_1000", total: 1000, base: 1000, bonus: 0, priceUsd: 10 },
  { id: "artcraft_2500", total: 2500, base: 2500, bonus: 0, priceUsd: 25 },
  {
    id: "artcraft_5000",
    total: 5000,
    base: 5000,
    bonus: 0,
    priceUsd: 50,
    badge: "Popular",
  },
  { id: "artcraft_10000", total: 10000, base: 10000, bonus: 0, priceUsd: 100 },
];

interface CreditsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onPurchase?: (pack: CreditPack) => void;
}

export function CreditsModal({
  isOpen = false,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (pack: CreditPack) => {
    if (onPurchase) {
      onPurchase(pack);
      return;
    }

    setPurchasingId(pack.id);
    try {
      await invoke("storyteller_open_credits_purchase_command", {
        request: {
          credits_pack: pack.id,
        },
      });
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose ?? (() => {})}
      className="rounded-2xl w-full max-w-2xl max-h-[100vh] overflow-y-auto overflow-x-hidden border border-white/5 bg-[#161618] p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
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

        <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-11 sm:pb-9">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
            Buy <span className="text-primary">credits</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            One-time credit packs. No subscription required.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {creditPacks.map((pack) => {
              const isLoading = purchasingId === pack.id;
              const isPopular = !!pack.badge;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasingId !== null}
                  className={twMerge(
                    "group relative flex flex-col gap-6 rounded-2xl border p-6 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                    isPopular
                      ? "border-primary/50 bg-primary/[0.07] hover:border-primary"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]",
                  )}
                >
                  {pack.badge && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                      {pack.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                      <FontAwesomeIcon
                        icon={faCoins}
                        className="text-primary text-lg"
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="text-4xl font-bold leading-none tracking-tight text-white">
                        {pack.total.toLocaleString()}
                      </div>
                      <div className="mt-0 text-sm text-white/40">
                        {pack.bonus > 0 ? (
                          <>
                            {pack.base.toLocaleString()} +{" "}
                            <span className="text-primary font-semibold">
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
                    <span className="text-2xl font-semibold text-white/80">
                      ${pack.priceUsd}
                    </span>
                    <span className="flex items-center gap-1.5 text-base font-semibold text-primary-400">
                      {isLoading ? (
                        <FontAwesomeIcon
                          icon={faSpinnerThird}
                          className="animate-spin"
                        />
                      ) : (
                        <>
                          Buy
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="text-xs transition-transform group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-white/35">
            Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default CreditsModal;
