import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { faCoinFront as faCoinFrontLine } from "@fortawesome/pro-regular-svg-icons";
import { faCoinFront } from "@fortawesome/pro-solid-svg-icons";
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
  { id: "artcraft_1000", total: 1000, base: 1000, bonus: 0, priceUsd: 5 },
  { id: "artcraft_2500", total: 2500, base: 2500, bonus: 0, priceUsd: 10 },
  { id: "c_020", total: 1320, base: 1320, bonus: 0, priceUsd: 20 },
  {
    id: "c_050",
    total: 3500,
    base: 3300,
    bonus: 200,
    priceUsd: 50,
  },
  {
    id: "c_100",
    total: 7500,
    base: 6600,
    bonus: 900,
    priceUsd: 100,
  },
  {
    id: "c_200",
    total: 16000,
    base: 13200,
    bonus: 2800,
    priceUsd: 200,
  },
  {
    id: "c_600",
    total: 48000,
    base: 39600,
    bonus: 8400,
    priceUsd: 600,
  },
  {
    id: "c_1200",
    total: 96000,
    base: 79200,
    bonus: 16800,
    priceUsd: 1200,
  },
];

interface CreditsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onPurchase?: (pack: CreditPack) => void;
}

function CoinIcon() {
  return (
    <FontAwesomeIcon
      icon={faCoinFrontLine}
      className=" absolute text-[100px] right-[20px] top-[70px] text-primary/5"
    />
  );
}

export function CreditsModal({
  isOpen = false,
  onClose,
  onPurchase,
}: CreditsModalProps) {
  const handlePurchase = async (pack: CreditPack) => {
    if (onPurchase) {
      onPurchase(pack);
      return;
    }

    await invoke("storyteller_open_credits_purchase_command", {
      request: {
        credits_pack: pack.id,
      }
    });

    // Hook up Stripe/checkout here
    // Example: redirect to checkout with pack.priceId
    // await stripe.redirectToCheckout({ lineItems: [{ price: pack.priceId, quantity: 1 }], mode: 'payment', ... })
    // For now, just log
    // eslint-disable-next-line no-console
    console.log("Purchasing credits pack", pack);
  };

  const cardBase =
    "relative rounded-xl border p-6 h-full flex flex-col justify-between bg-[#1F1F1F] border-white/10 hover:border-white/20 transition-all";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose ?? (() => {})}
      className="rounded-xl bg-[#1A1A1A] max-h-[90vh] max-w-screen-2xl overflow-y-auto flex flex-col"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      backdropClassName="bg-black/80"
    >
      <div className="p-16 py-24 flex-1 overflow-y-auto min-h-0">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4">Buy credits</h1>
          <p className="text-gray-400 text-lg">
            Choose a one-time credits package. No subscription required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {creditPacks.map((pack) => (
            <div key={pack.id} className={cardBase}>
              {pack.badge && (
                <div className="absolute -top-3 right-4 bg-white text-black px-3 py-1 rounded-full text-xs font-semibold shadow-xl">
                  {pack.badge}
                </div>
              )}

              <CoinIcon />

              <div>
                <div className="text-white text-5xl font-bold tracking-tight flex items-center gap-2.5">
                  <FontAwesomeIcon
                    icon={faCoinFront}
                    className="text-primary text-3xl"
                  />
                  {pack.total.toLocaleString()}
                </div>
                {pack.bonus > 0 && (
                  <div className="text-gray-400 text-sm mt-2">
                    Total: {pack.base.toLocaleString()} {" + "}
                    <span className="text-[#faca5a]">
                      {pack.bonus.toLocaleString()} Bonus
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="text-white text-xl font-semibold">
                  ${pack.priceUsd}
                </div>
                <Button
                  onClick={() => handlePurchase(pack)}
                  className="bg-white text-black hover:bg-white/90 px-5 h-10 rounded-xl"
                >
                  Purchase
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default CreditsModal;
