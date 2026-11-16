import { useState } from "react";
import type { MouseEvent } from "react";
import { CopyIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { toast } from "@storyteller/ui-toaster";

export function CopyErrorButton({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  return (
    <>
      <Tooltip
        content="Copy error details"
        position="bottom"
        strategy="fixed"
        zIndex={100}
      >
        <Button
          type="button"
          variant={compact ? "ghost" : "secondary"}
          icon={CopyIcon}
          aria-label="Copy error details"
          className={
            compact ? "h-6 w-6 shrink-0 p-0 text-base-fg/60" : undefined
          }
          onClick={async (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            setFeedback("");
            try {
              await navigator.clipboard.writeText(text);
              setFeedback("Error details copied");
              toast.success("Error details copied", {
                ariaProps: { role: "status", "aria-live": "off" },
              });
            } catch {
              setFeedback("Unable to copy error details");
              toast.error("Unable to copy error details", {
                ariaProps: { role: "status", "aria-live": "off" },
              });
            }
          }}
        >
          {!compact && "Copy error details"}
        </Button>
      </Tooltip>
      {/* Keep announcements inside the dialog/popover accessibility tree. */}
      <span role="status" className="sr-only">
        {feedback}
      </span>
    </>
  );
}
