import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Modal } from "@storyteller/ui-modal";
import { ArrowRightIcon, CoinsIcon, LoaderCircleIcon } from "lucide-react";
import { BillingApi } from "@storyteller/api";
import { toast } from "./toast/toast";

interface CreditPack {
  id: string;
  total: number;
  priceUsd: number;
  badge?: string;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: "artcraft_1000", total: 1000, priceUsd: 10 },
  { id: "artcraft_2500", total: 2500, priceUsd: 25 },
  { id: "artcraft_5000", total: 5000, priceUsd: 50, badge: "Popular" },
  { id: "artcraft_10000", total: 10000, priceUsd: 100 },
];

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (pack: CreditPack) => {
    setPurchasingId(pack.id);
    try {
      const api = new BillingApi();
      const response = await api.CreditsPackCheckout({
        creditsPack: pack.id,
      });

      if (response.success && response.data?.stripeCheckoutRedirectUrl) {
        window.location.href = response.data.stripeCheckoutRedirectUrl;
      } else {
        toast.error(response.errorMessage ?? "Failed to start checkout");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-2xl max-h-[100vh] overflow-y-auto overflow-x-hidden border border-white/15 bg-ui-modal p-0"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      childPadding={false}
      backdropClassName="bg-black/80"
    >
      <div className="relative overflow-hidden">
        <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-11 sm:pb-9">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
            Buy <span className="text-primary">credits</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            One-time credit packs. No subscription required.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {CREDIT_PACKS.map((pack) => {
              const isLoading = purchasingId === pack.id;
              const isPopular = !!pack.badge;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasingId !== null}
                  className={twMerge(
                    "group relative flex flex-col gap-6 border p-6 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                    isPopular
                      ? "border-white/60 bg-white/[0.06] hover:border-white"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]",
                  )}
                >
                  {pack.badge && (
                    <span className="absolute -top-2.5 right-3 bg-white px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
                      {pack.badge}
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-white/10">
                      <CoinsIcon className="text-white text-lg" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-4xl font-bold leading-none tracking-tight text-white">
                        {pack.total.toLocaleString()}
                      </div>
                      <div className="mt-0 text-sm text-white/40">credits</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-semibold text-white/80">
                      ${pack.priceUsd}
                    </span>
                    <span className="flex items-center gap-1.5 text-base font-semibold text-white">
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

          <p className="mt-6 text-center text-xs text-white/35">
            Secure checkout via Stripe.
          </p>
        </div>
      </div>
    </Modal>
  );
}
