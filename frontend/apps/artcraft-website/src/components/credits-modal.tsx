import { useState } from "react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { faCoins } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
      className="rounded-2xl max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#16161a] p-0 shadow-2xl"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      childPadding={false}
      backdropClassName="bg-black/80"
    >
      <div className="p-6 sm:p-8">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            Buy Credits
          </h2>
          <p className="text-white/60">
            One-time credit packs. No subscription required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => handlePurchase(pack)}
              disabled={purchasingId !== null}
              className="group relative flex flex-col justify-between rounded-xl border border-white/10 p-5 text-left transition-all hover:border-primary/40 hover:bg-white/[0.03] disabled:opacity-60"
            >
              {pack.badge && (
                <div className="absolute -top-2.5 right-4 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white shadow-lg">
                  {pack.badge}
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faCoins}
                  className="text-2xl text-primary"
                />
                <span className="text-3xl font-bold tracking-tight text-white">
                  {pack.total.toLocaleString()}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-white/60">
                  ${pack.priceUsd}
                </span>
                <Button
                  variant="primary"
                  className="pointer-events-none rounded-lg px-5 py-2 text-sm font-semibold"
                  disabled={purchasingId !== null}
                >
                  {purchasingId === pack.id ? "Loading..." : "Purchase"}
                </Button>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
