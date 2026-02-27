import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faTimes } from "@fortawesome/pro-solid-svg-icons";
import { Select } from "@storyteller/ui-select";
import { useCurrency } from "@storyteller/ui-pricing-modal";

interface CostModalProps {
  credits?: number;
  onClose: () => void;
}

export const CostModal = ({ credits = 1, onClose }: CostModalProps) => {
  const {
    currency,
    setCurrency,
    currencyOption,
    formatPrice,
    currencyOptions,
  } = useCurrency();

  // Convert credits to USD first (1 credit = $0.01), then to selected currency
  const usdAmount = credits * 0.01;
  const formattedPrice = formatPrice(usdAmount);

  // Select options formatted for the Select component
  const selectOptions = currencyOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        drag
        dragMomentum={false}
        className="pointer-events-auto z-10 flex w-72 flex-col overflow-hidden rounded-xl border border-ui-panel-border bg-ui-panel shadow-2xl"
      >
        <div className="bg-ui-panel-header flex cursor-move select-none items-center justify-between border-b border-ui-panel-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-fg">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
            Cost Breakdown
          </div>
          <button
            onClick={onClose}
            className="text-base-fg/50 transition-colors hover:text-base-fg"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-4 bg-ui-panel p-4">
          <div className="border-ui-controls-border rounded-lg border bg-ui-controls/50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-base-fg/80">Total Cost</span>
              <span className="text-lg font-bold text-base-fg">
                {credits} Credits
              </span>
            </div>
            <div className="text-right text-xs text-base-fg/60">
              ≈ {formattedPrice} {currencyOption.value}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-base-fg/80">
              Currency
            </label>
            <Select
              options={selectOptions}
              value={currency}
              onChange={setCurrency}
              className="w-full"
            />
          </div>

          <div className="mt-2 border-t border-ui-panel-border pt-3 text-center text-[10px] text-base-fg/40">
            1 Credit = $0.01 USD
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
