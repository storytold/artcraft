// The small "copy prompt" button shown on every card in the task queue. It lives in its own file so it can be tested.
import { Tooltip } from "@storyteller/ui-tooltip";
import { CheckIcon, CopyIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { useState } from "react";

export const CopyPromptButton = ({ prompt }: { prompt: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip
      content={copied ? "Copied!" : "Copy prompt"}
      position="bottom"
      strategy="fixed"
      className="text-xs"
      zIndex={50}
      delay={300}
    >
      <button
        className="flex h-6 w-6 items-center justify-center text-base-fg/60 hover:bg-ui-controls"
        aria-label="Copy prompt"
        onClick={async (e) => {
          e.stopPropagation();
          // FIX: the check mark and "Copied!" used to show straight away, even when the browser refused the write
          // (no permission, window not focused), and the refusal surfaced as an unhandled promise rejection. Wait for
          // the write, and only say "Copied!" when it worked, as the other copy buttons in the app do.
          try {
            await navigator.clipboard.writeText(prompt);
          } catch {
            return;
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        }}
      >
        <DynamicIcon
          icon={copied ? CheckIcon : CopyIcon}
          className={copied ? "text-green-400" : ""}
        />
      </button>
    </Tooltip>
  );
};
