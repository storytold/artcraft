import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CoinsIcon, XIcon } from "lucide-react";
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
        className="pointer-events-auto z-10 flex w-72 flex-col overflow-hidden border border-white/15 bg-ui-panel"
      >
        <div className="flex cursor-move select-none items-center justify-between border-b border-white/15 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg">
            <CoinsIcon className="text-primary" />
            Cost Breakdown
          </div>
          <button
            onClick={onClose}
            className="text-base-fg/50 transition-colors hover:text-base-fg"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-4 bg-ui-panel p-4">
          <div className="border border-white/15 bg-white/5 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-base-fg/80">Total Cost</span>
              <span className="text-lg font-semibold tabular-nums tracking-tight text-base-fg">
                {credits} Credits
              </span>
            </div>
            <div className="text-right text-xs text-base-fg/60">
              ≈ {formattedPrice} {currencyOption.value}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
              Currency
            </label>
            <Select
              options={selectOptions}
              value={currency}
              onChange={setCurrency}
              className="w-full"
            />
          </div>

          <div className="mt-2 border-t border-white/15 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-base-fg/40">
            1 Credit = $0.01 USD
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
