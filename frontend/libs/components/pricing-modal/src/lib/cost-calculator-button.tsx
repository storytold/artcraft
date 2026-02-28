import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/pro-solid-svg-icons";
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
  const { openModal, estimatedCreditsByPage } = useCostBreakdownModalStore();

  const credits =
    modelPage != null ? estimatedCreditsByPage[modelPage] : undefined;

  return (
    <Button
      variant="action"
      onClick={openModal}
      className={className}
      title="Cost Calculator"
    >
      <FontAwesomeIcon icon={faCalculator} className="text-base-fg" />
      <span>Costs</span>
      {credits != null && (
        <span className="text-xs font-semibold">{credits} cr</span>
      )}
    </Button>
  );
}

export default CostCalculatorButton;
