import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@storyteller/ui-button";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, LoaderIcon, RotateCwIcon, XIcon } from "lucide-react";

interface UploadFileRowProps {
  entry: { file: File; status: string };
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

/** One file in an upload modal's list: its name, Remove while idle, then a spinner, a check, or an error with Retry. */
const UploadFileRow = ({ entry, selected, onSelect, onRemove, onRetry }: UploadFileRowProps) => (
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
            className="inline-flex items-center text-xs text-white/60 opacity-0 transition hover:text-white group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
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

interface UploadFilesPanelsProps {
  entries: { file: File; status: string }[];
  previewIndex: number;
  setPreviewIndex: Dispatch<SetStateAction<number>>;
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
  /** The preview of the selected file, above the previous / next buttons. */
  children: ReactNode;
}

/** An upload modal with several files: the file list, a resize handle, and the selected file's preview with previous / next. */
export const UploadFilesPanels = ({
  entries,
  previewIndex,
  setPreviewIndex,
  onRemove,
  onRetry,
  children,
}: UploadFilesPanelsProps) => (
  <PanelGroup direction="horizontal">
    <Panel defaultSize={33} minSize={20}>
      <ul className="flex h-full flex-col gap-1 overflow-y-auto rounded-none border border-white/15 bg-black/30 p-2">
        {entries.map((entry, i) => (
          <UploadFileRow
            key={i}
            entry={entry}
            selected={i === previewIndex}
            onSelect={() => setPreviewIndex(i)}
            onRemove={() => onRemove(i)}
            onRetry={() => onRetry(i)}
          />
        ))}
      </ul>
    </Panel>

    <PanelResizeHandle className="flex w-4 items-center justify-center">
      <div
        className="h-8 w-1 rounded-none bg-white/20 transition-colors hover:bg-white/40"
        onPointerDown={(e) => e.stopPropagation()}
      />
    </PanelResizeHandle>

    <Panel defaultSize={67} minSize={25}>
      <div className="flex h-full flex-col gap-2">
        {children}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
            disabled={previewIndex === 0}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm opacity-60">
            {previewIndex + 1} / {entries.length}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPreviewIndex((p) => Math.min(entries.length - 1, p + 1))}
            disabled={previewIndex === entries.length - 1}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </Panel>
  </PanelGroup>
);
