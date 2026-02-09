import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

export interface CostCalculatorButtonProps {
  className?: string;
}

export function CostCalculatorButton({ className }: CostCalculatorButtonProps) {
  const { openModal } = useCostBreakdownModalStore();

  return (
    <Button
      variant="action"
      onClick={openModal}
      className={className}
      title="Cost Calculator"
    >
      <FontAwesomeIcon icon={faCalculator} className="text-base-fg" />
      <span>Costs</span>
    </Button>
  );
}

export default CostCalculatorButton;
