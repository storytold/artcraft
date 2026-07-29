import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "@storyteller/ui-tooltip";

// Copies a prompt to the clipboard, with copy→check feedback. Sits at the
// right of a row's prompt line. Shared by the completed / pending / failed
// rows. stopPropagation keeps a tap from also triggering the row's onClick.
// Hosts surface success/failure feedback (e.g. a toast) via `onCopyResult`.
export function CopyPromptButton({
  text,
  onCopyResult,
}: {
  text: string;
  onCopyResult?: (success: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(text);
        onCopyResult?.(true);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        onCopyResult?.(false);
      }
    },
    [text, onCopyResult],
  );

  return (
    <Tooltip content={copied ? "Copied" : "Copy prompt"} position="top">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy prompt"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
      >
        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-sm" />
      </button>
    </Tooltip>
  );
}
