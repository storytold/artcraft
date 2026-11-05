// Two small icons from the lucide icon set: a calculator for the button's label and a coin stack for the credits chip.
import { CalculatorIcon, CoinsIcon } from "lucide-react";
// The app's shared Button component; variant "action" is its toolbar-button look.
import { Button } from "@storyteller/ui-button";
// ModelPage is the enum naming the app's eight pages; it is the key under which each page's price quote is stored.
import { ModelPage } from "@storyteller/ui-model-selector";
// The Costs dialog's store: openModal opens the dialog, estimatedCreditsByPage holds the latest quote per page (filled by the four quote hooks).
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

// What a page can pass in: an optional extra CSS class for placement, and the page whose quote the chip should show.
export interface CostCalculatorButtonProps {
  className?: string;
  modelPage?: ModelPage;
}

// The "Costs" button that sits in a corner of each generation page. A click opens the Costs dialog (CostBreakdownModal);
// when this page already has a price quote, the button also shows it as a small coins chip.
// Live callers (all pass modelPage): ImageTo3DExperience (World or Object page, by variant), ImageToVideo (ImageToVideo), Angles (Angles),
// TextToImage (TextToImage), BaseImageSelector (ImageEditor), PageDraw (Canvas2D) and Stage3DBody (Stage3D).
export function CostCalculatorButton({
  className,
  modelPage,
}: CostCalculatorButtonProps) {
  // Reads the whole store with no selector, so this button re-renders on every store change, including every quote write by the hooks.
  // That is cheap here: the button is tiny.
  const { openModal, estimatedCreditsByPage } = useCostBreakdownModalStore();

  // This page's current quote in credits, or undefined when no page was passed. Also null/undefined while a quote is being fetched or has failed.
  const credits =
    modelPage != null ? estimatedCreditsByPage[modelPage] : undefined;

  return (
    // onClick={openModal} hands the store function straight to the button; openModal takes no arguments, so the click event it is given is ignored.
    <Button
      variant="action"
      onClick={openModal}
      className={className}
      title="Cost Calculator"
    >
      {/* Calculator icon, coloured with the theme's foreground colour. */}
      <CalculatorIcon  className="text-base-fg" />
      {/* The button's visible word. */}
      <span>Costs</span>
      {/* The chip appears only when there is a quote (credits is neither null nor undefined); a quote of 0 would still show as "0". */}
      {credits != null && (
        <span className="text-xs font-semibold flex items-center gap-1">
          {/* Coin icon next to the number of credits. */}
          <CoinsIcon  className="text-base-fg" />
          {credits}
        </span>
      )}
    </Button>
  );
}

// Also the default export, so a page may import it either by name or as the default.
export default CostCalculatorButton;
