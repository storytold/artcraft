import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinnerThird,
  faCircleExclamation,
  faXmark,
  faWandMagicSparkles,
  faCopy,
  faCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

export interface VFXResultCardData {
  prompt: string;
  resolution: string;
  source?: { url: string };
  mask?: { url: string };
  reference?: { url: string };
  outputUrl?: string;
  status: "pending" | "complete" | "failed";
  failureReason?: string;
  title?: string;
}

interface VFXResultCardProps {
  data: VFXResultCardData;
  onTryThis?: () => void;
  onDismiss?: () => void;
  className?: string;
  /** Promptbox/side-column accent classes that vary per app theme. */
  panelGlassClassName?: string;
  promptTextClassName?: string;
  promptLabelClassName?: string;
  tryButtonClassName?: string;
}

export const VFXResultCard = ({
  data,
  onTryThis,
  onDismiss,
  className,
  panelGlassClassName = "bg-white/5 ring-1 ring-white/10 backdrop-blur-sm",
  promptTextClassName = "text-white/85 line-clamp-2",
  promptLabelClassName = "text-white/50",
  tryButtonClassName = "border-primary/40 bg-primary/15 text-white hover:bg-primary/25",
}: VFXResultCardProps) => {
  return (
    <div
      className={twMerge(
        "mx-auto grid w-[min(1000px,calc(100vw-48px))] grid-cols-[1fr_18%] items-start gap-3",
        className,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        {data.status === "complete" && data.outputUrl ? (
          <video
            src={data.outputUrl}
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : data.status === "pending" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/70">
            <FontAwesomeIcon
              icon={faSpinnerThird}
              className="h-8 w-8 animate-spin"
            />
            <span className="text-sm">Generating background change...</span>
          </div>
        ) : data.status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-red-300">
            <FontAwesomeIcon icon={faCircleExclamation} className="h-8 w-8" />
            <span className="text-sm">
              {data.failureReason || "Generation failed"}
            </span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="mt-1 flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
              >
                <FontAwesomeIcon icon={faXmark} />
                Dismiss
              </button>
            )}
          </div>
        ) : null}
        {data.title && data.status === "complete" && (
          <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm">
            Output
          </div>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-2">
        {data.source && (
          <SidePanelMedia label="Source" url={data.source.url} isVideo />
        )}
        {data.mask && <SidePanelMedia label="Alpha" url={data.mask.url} />}
        {data.reference && (
          <SidePanelMedia label="Reference" url={data.reference.url} />
        )}
        {data.prompt && data.prompt.trim().length > 0 && (
          <div
            className={twMerge(
              "group relative max-h-44 min-h-0 overflow-y-auto rounded-lg px-3 py-2 text-xs",
              panelGlassClassName,
              promptTextClassName,
            )}
          >
            <div
              className={twMerge(
                "mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider",
                promptLabelClassName,
              )}
            >
              <span>Prompt</span>
              <CopyPromptButton text={data.prompt} />
            </div>
            <div className="leading-relaxed">{data.prompt}</div>
          </div>
        )}
        {onTryThis && (
          <button
            onClick={onTryThis}
            className={twMerge(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              tryButtonClassName,
            )}
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3 w-3" />
            Try this
          </button>
        )}
      </aside>
    </div>
  );
};

interface CopyPromptButtonProps {
  text: string;
}

const CopyPromptButton = ({ text }: CopyPromptButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors (permissions, insecure context, etc.)
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-[10px] font-medium normal-case tracking-normal text-white/60 transition-colors hover:text-white"
    >
      <FontAwesomeIcon
        icon={copied ? faCheck : faCopy}
        className="h-2.5 w-2.5"
      />
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

interface SidePanelMediaProps {
  label: string;
  url: string;
  isVideo?: boolean;
}

const SidePanelMedia = ({ label, url, isVideo }: SidePanelMediaProps) => (
  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
    {isVideo ? (
      <video
        src={url}
        muted
        loop
        autoPlay
        playsInline
        className="h-full w-full object-cover"
      />
    ) : (
      <img src={url} alt={label} className="h-full w-full object-cover" />
    )}
    <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
      {label}
    </span>
  </div>
);
