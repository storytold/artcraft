import { CheckIcon, CircleAlertIcon, LoaderIcon, RotateCwIcon } from "lucide-react";

/** The end of an upload modal's file row: a spinner while working, a check when done, and on error a retry button. */
export const UploadStatus = ({
  status,
  onRetry,
}: {
  status: string;
  onRetry: () => void;
}) => {
  if (status === "uploading" || status === "converting") {
    return <LoaderIcon className="animate-spin opacity-60" />;
  }
  if (status === "success") return <CheckIcon className="text-green-400" />;
  if (status !== "error") return null;
  return (
    <span className="flex items-center gap-1">
      <CircleAlertIcon className="text-red-400" />
      <button
        className="hidden items-center text-xs text-white/60 transition-colors hover:text-white group-hover:inline-flex"
        onClick={(e) => {
          e.stopPropagation();
          onRetry();
        }}
        title="Retry"
      >
        <RotateCwIcon />
      </button>
    </span>
  );
};
