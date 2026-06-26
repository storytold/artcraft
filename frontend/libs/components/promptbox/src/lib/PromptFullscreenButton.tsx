import { Tooltip } from "@storyteller/ui-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightAndDownLeftFromCenter } from "@fortawesome/pro-solid-svg-icons";

// Circular "expand to focus mode" icon, anchored top-right of a prompt editor.
// Shared so all promptbox variants render an identical control.
//
// The absolute positioning lives on an OUTER wrapper (not the button) because
// Tooltip wraps its child in its own `position: relative` div — putting the
// absolute styles on the button would anchor it to that inline wrapper instead
// of the editor, landing it in the wrong spot.

interface PromptFullscreenButtonProps {
  onClick: () => void;
  className?: string;
}

export const PromptFullscreenButton = ({
  onClick,
  className,
}: PromptFullscreenButtonProps) => {
  return (
    <div className={`absolute right-0 top-0 z-10 ${className ?? ""}`}>
      <Tooltip content="Focus mode" position="left">
        <button
          type="button"
          aria-label="Expand prompt to focus mode"
          onClick={onClick}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-base-fg/5 text-base-fg/50 transition-colors hover:bg-base-fg/10 hover:text-base-fg/90 focus:outline-none"
        >
          <FontAwesomeIcon
            icon={faUpRightAndDownLeftFromCenter}
            className="h-3 w-3"
          />
        </button>
      </Tooltip>
    </div>
  );
};
