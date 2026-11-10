import { useTranslation } from "@storyteller/i18n";
import { CalculatorIcon, CoinsIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { ModelPage } from "@storyteller/ui-model-selector";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

export interface CostCalculatorButtonProps {
  className?: string;
  modelPage?: ModelPage;
}

export function CostCalculatorButton({
  className,
  modelPage,
}: CostCalculatorButtonProps) {
  const { t: tr } = useTranslation();
  const { openModal, estimatedCreditsByPage } = useCostBreakdownModalStore();

  const credits =
    modelPage != null ? estimatedCreditsByPage[modelPage] : undefined;

  return (
    <Button
      variant="action"
      onClick={openModal}
      className={className}
      title={tr("Cost Calculator")}
    >
      <CalculatorIcon  className="text-base-fg" />
      <span>{tr("Costs")}</span>
      {credits != null && (
        <span className="text-xs font-semibold flex items-center gap-1">
          <CoinsIcon  className="text-base-fg" />
          {credits}
        </span>
      )}
    </Button>
  );
}

export default CostCalculatorButton;
