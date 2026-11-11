import { CheckIcon, CircleAlertIcon, LoaderIcon, RotateCwIcon, XIcon } from "lucide-react";

interface UploadFileRowProps {
  entry: { file: File; status: string };
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

/** One file in an upload modal's list: its name, Remove while idle, then a spinner, a check, or an error with Retry. */
export const UploadFileRow = ({ entry, selected, onSelect, onRemove, onRetry }: UploadFileRowProps) => (
  <li
    className={`group flex cursor-pointer items-center justify-between gap-1.5 rounded-[3px] px-2 py-1 text-sm transition-colors ${
      selected ? "bg-white/10" : "hover:bg-white/5"
    }`}
    onClick={onSelect}
  >
    <span className="flex-1 truncate" title={entry.file.name}>
      {entry.file.name.slice(0, entry.file.name.lastIndexOf("."))}
    </span>
    <span className="shrink-0">
      {entry.status === "idle" && (
        <button
          className="opacity-40 transition-opacity hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove"
        >
          <XIcon />
        </button>
      )}
      {(entry.status === "uploading" || entry.status === "converting") && (
        <LoaderIcon className="animate-spin opacity-60" />
      )}
      {entry.status === "success" && <CheckIcon className="text-green-400" />}
      {entry.status === "error" && (
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
      )}
    </span>
  </li>
);
