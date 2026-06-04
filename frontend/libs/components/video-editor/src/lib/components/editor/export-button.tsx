"use client";

import { useState } from "react";
import { TransitionTopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../utils/ui";
import { getExportMimeType, getExportFileExtension } from "../../export";
import { AlertCircle, Check, Copy, Download, Library, Loader2, RotateCcw } from "lucide-react";
import {
  EXPORT_FORMAT_VALUES,
  EXPORT_QUALITY_VALUES,
  type ExportFormat,
  type ExportQuality,
} from "../../export";
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "../section";
import { useEditor } from "../../editor/use-editor";
import { useEditorAdapters } from "../../EditorProvider";
import { DEFAULT_EXPORT_OPTIONS } from "../../export/defaults";
import { mediaTimeToSeconds } from "../../wasm";
import type {
  ExportDestination,
  ExportSinkProgressEvent,
} from "../../adapters";

type DestinationStatus =
  | "skipped"
  | "pending"
  | "uploading"
  | "success"
  | "error";

interface SaveState {
  // "idle" before the user clicks Export; "saving" while the adapter
  // is in flight; "settled" when all requested destinations have
  // resolved (success or error).
  phase: "idle" | "saving" | "settled";
  disk: { status: DestinationStatus; error?: string };
  library: { status: DestinationStatus; error?: string };
}

const INITIAL_SAVE_STATE: SaveState = {
  phase: "idle",
  disk: { status: "skipped" },
  library: { status: "skipped" },
};

function updateDestinationStatus(
  state: SaveState,
  event: ExportSinkProgressEvent,
): SaveState {
  if (state.phase !== "saving") return state;
  const update =
    event.status === "error"
      ? { status: "error" as const, error: event.error }
      : { status: event.status };
  return event.destination === "disk"
    ? { ...state, disk: update }
    : { ...state, library: update };
}

function isTerminalStatus(status: DestinationStatus): boolean {
  return status === "success" || status === "error" || status === "skipped";
}

function finalizeSaveState(state: SaveState): SaveState {
  // If accept() resolved while a destination is still mid-flight we
  // promote it to success — the adapter contract requires resolving
  // only after every destination settled, so anything still
  // "pending"/"uploading" here is a coding mistake we'd rather show
  // as success than leave the user looking at a stuck spinner.
  return {
    phase: "settled",
    disk: isTerminalStatus(state.disk.status)
      ? state.disk
      : { status: "success" },
    library: isTerminalStatus(state.library.status)
      ? state.library
      : { status: "success" },
  };
}

function isExportFormat(value: string): value is ExportFormat {
  return EXPORT_FORMAT_VALUES.some((formatValue) => formatValue === value);
}

function isExportQuality(value: string): value is ExportQuality {
  return EXPORT_QUALITY_VALUES.some((qualityValue) => qualityValue === value);
}

export function ExportButton() {
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
  const editor = useEditor();
  const activeProject = useEditor((e) => e.project.getActiveOrNull());
  const hasProject = !!activeProject;

  const handlePopoverOpenChange = ({ open }: { open: boolean }) => {
    if (!open) {
      editor.project.cancelExport();
      editor.project.clearExportState();
    }
    setIsExportPopoverOpen(open);
  };

  return (
    <Popover
      open={isExportPopoverOpen}
      onOpenChange={(open) => handlePopoverOpenChange({ open })}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          className={cn(
            hasProject ? "cursor-pointer" : "cursor-not-allowed opacity-50",
          )}
          onClick={hasProject ? () => setIsExportPopoverOpen(true) : undefined}
          disabled={!hasProject}
          onKeyDown={(event) => {
            if (hasProject && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              setIsExportPopoverOpen(true);
            }
          }}
        >
          <HugeiconsIcon icon={TransitionTopIcon} className="z-50 size-3.5" />
          <span className="z-50 text-[0.875rem]">Export</span>
        </Button>
      </PopoverTrigger>
      {hasProject && <ExportPopover onOpenChange={setIsExportPopoverOpen} />}
    </Popover>
  );
}

function ExportPopover({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const editor = useEditor();
  const { exportSink, toast } = useEditorAdapters();
  const activeProject = useEditor((e) => e.project.getActive());
  const exportState = useEditor((e) => e.project.getExportState());
  const { isExporting, progress, result: exportResult } = exportState;
  const [format, setFormat] = useState<ExportFormat>(
    DEFAULT_EXPORT_OPTIONS.format,
  );
  const [quality, setQuality] = useState<ExportQuality>(
    DEFAULT_EXPORT_OPTIONS.quality,
  );
  const [shouldIncludeAudio, setShouldIncludeAudio] = useState<boolean>(
    DEFAULT_EXPORT_OPTIONS.includeAudio ?? true,
  );
  const [saveToDisk, setSaveToDisk] = useState<boolean>(true);
  const [saveToLibrary, setSaveToLibrary] = useState<boolean>(true);
  const [saveState, setSaveState] = useState<SaveState>(INITIAL_SAVE_STATE);

  const canExport = saveToDisk || saveToLibrary;

  const handleExport = async () => {
    if (!activeProject || !canExport) return;

    setSaveState(INITIAL_SAVE_STATE);

    const result = await editor.project.export({
      options: {
        format,
        quality,
        fps: activeProject.settings.fps,
        includeAudio: shouldIncludeAudio,
      },
    });

    if (result.cancelled) {
      editor.project.clearExportState();
      return;
    }

    if (result.success && result.buffer) {
      const mime = getExportMimeType({ format });
      const filename = `${activeProject.metadata.name}${getExportFileExtension({ format })}`;
      const projectDurationTicks = editor.timeline.getTotalDuration();
      const durationMs = Math.round(
        mediaTimeToSeconds({ time: projectDurationTicks }) * 1000,
      );

      // Seed the saving phase with whichever destinations the user
      // picked. Destinations that are off stay "skipped" so the UI
      // only renders rows for what's actually running.
      setSaveState({
        phase: "saving",
        disk: { status: saveToDisk ? "pending" : "skipped" },
        library: { status: saveToLibrary ? "pending" : "skipped" },
      });

      const handleProgress = (event: ExportSinkProgressEvent) => {
        setSaveState((prev) => updateDestinationStatus(prev, event));
      };

      try {
        await exportSink.accept(
          {
            blob: new Blob([result.buffer], { type: mime }),
            filename,
            mime,
            durationMs: durationMs > 0 ? durationMs : undefined,
          },
          {
            saveToDisk,
            saveToLibrary,
            onProgress: handleProgress,
          },
        );
        setSaveState((prev) => finalizeSaveState(prev));
      } catch (error) {
        console.error("Export sink failed:", error);
        toast.error("Couldn't save exported video", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setSaveState((prev) => finalizeSaveState(prev));
        return;
      }
      editor.project.clearExportState();
    }
  };

  const handleDismiss = () => {
    setSaveState(INITIAL_SAVE_STATE);
    onOpenChange(false);
  };

  const handleCancel = () => {
    editor.project.cancelExport();
  };

  return (
    <PopoverContent className="bg-ui-controls mr-4 flex w-80 flex-col p-0">
      {exportResult && !exportResult.success ? (
        <ExportError
          error={exportResult.error || "Unknown error occurred"}
          onRetry={handleExport}
        />
      ) : (
        <>
          <div className="flex items-center justify-between p-3 border-b border-ui-controls-border">
            <h3 className="font-medium text-sm">
              {isExporting ? "Exporting project" : "Export project"}
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            {!isExporting && saveState.phase === "idle" && (
              <>
                <div className="flex flex-col">
                  <Section
                    collapsible
                    defaultOpen={false}
                    showTopBorder={false}
                  >
                    <SectionHeader>
                      <SectionTitle>Format</SectionTitle>
                    </SectionHeader>
                    <SectionContent>
                      <RadioGroup
                        value={format}
                        onValueChange={(value) => {
                          if (isExportFormat(value)) {
                            setFormat(value);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mp4" id="mp4" />
                          <Label htmlFor="mp4">
                            MP4 (H.264) - Better compatibility
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="webm" id="webm" />
                          <Label htmlFor="webm">
                            WebM (VP9) - Smaller file size
                          </Label>
                        </div>
                      </RadioGroup>
                    </SectionContent>
                  </Section>

                  <Section collapsible defaultOpen={false}>
                    <SectionHeader>
                      <SectionTitle>Quality</SectionTitle>
                    </SectionHeader>
                    <SectionContent>
                      <RadioGroup
                        value={quality}
                        onValueChange={(value) => {
                          if (isExportQuality(value)) {
                            setQuality(value);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low" />
                          <Label htmlFor="low">Low - Smallest file size</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium - Balanced</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <Label htmlFor="high">High - Recommended</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="very_high" id="very_high" />
                          <Label htmlFor="very_high">
                            Very high - Largest file size
                          </Label>
                        </div>
                      </RadioGroup>
                    </SectionContent>
                  </Section>

                  <Section collapsible defaultOpen={false}>
                    <SectionHeader>
                      <SectionTitle>Audio</SectionTitle>
                    </SectionHeader>
                    <SectionContent>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-audio"
                          checked={shouldIncludeAudio}
                          onCheckedChange={(checked) =>
                            setShouldIncludeAudio(!!checked)
                          }
                        />
                        <Label htmlFor="include-audio">
                          Include audio in export
                        </Label>
                      </div>
                    </SectionContent>
                  </Section>

                  <Section collapsible defaultOpen={true}>
                    <SectionHeader>
                      <SectionTitle>Destination</SectionTitle>
                    </SectionHeader>
                    <SectionContent>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="save-to-disk"
                            checked={saveToDisk}
                            onCheckedChange={(checked) =>
                              setSaveToDisk(!!checked)
                            }
                          />
                          <Label htmlFor="save-to-disk">
                            Save to disk
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="save-to-library"
                            checked={saveToLibrary}
                            onCheckedChange={(checked) =>
                              setSaveToLibrary(!!checked)
                            }
                          />
                          <Label htmlFor="save-to-library">
                            Save to my media library
                          </Label>
                        </div>
                        {!canExport && (
                          <p className="text-muted-foreground text-xs">
                            Pick at least one destination.
                          </p>
                        )}
                      </div>
                    </SectionContent>
                  </Section>
                </div>

                <div className="p-3 pt-0">
                  <Button
                    onClick={handleExport}
                    disabled={!canExport}
                    className="w-full gap-2"
                  >
                    <Download className="size-4" />
                    Export
                  </Button>
                </div>
              </>
            )}

            {isExporting && (
              <div className="space-y-4 p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-center">
                    <p className="text-muted-foreground text-sm">
                      {Math.round(progress * 100)}%
                    </p>
                    <p className="text-muted-foreground text-sm">100%</p>
                  </div>
                  <Progress value={progress * 100} className="w-full" />
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-md"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            )}

            {!isExporting && saveState.phase !== "idle" && (
              <SavePhasePanel
                saveState={saveState}
                onDismiss={handleDismiss}
              />
            )}
          </div>
        </>
      )}
    </PopoverContent>
  );
}

function SavePhasePanel({
  saveState,
  onDismiss,
}: {
  saveState: SaveState;
  onDismiss: () => void;
}) {
  const settled = saveState.phase === "settled";
  const visibleDestinations = (["disk", "library"] as ExportDestination[])
    .map((destination) => ({
      destination,
      ...(destination === "disk" ? saveState.disk : saveState.library),
    }))
    .filter((entry) => entry.status !== "skipped");

  const allSucceeded = visibleDestinations.every(
    (entry) => entry.status === "success",
  );
  const headerLabel = settled
    ? allSucceeded
      ? "Export saved"
      : "Export finished with errors"
    : "Saving export";

  return (
    <div className="space-y-4 p-3">
      <p className="text-foreground text-sm font-medium">{headerLabel}</p>
      <div className="flex flex-col gap-2">
        {visibleDestinations.map((entry) => (
          <DestinationRow
            key={entry.destination}
            destination={entry.destination}
            status={entry.status}
            error={entry.error}
          />
        ))}
      </div>
      {settled && (
        <Button
          variant="outline"
          className="w-full rounded-md"
          onClick={onDismiss}
        >
          Close
        </Button>
      )}
    </div>
  );
}

function DestinationRow({
  destination,
  status,
  error,
}: {
  destination: ExportDestination;
  status: DestinationStatus;
  error?: string;
}) {
  const label =
    destination === "disk" ? "Saving to disk" : "Saving to media library";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs">
        <DestinationIcon destination={destination} status={status} />
        <span className="text-foreground">
          {status === "success"
            ? destination === "disk"
              ? "Saved to disk"
              : "Saved to media library"
            : status === "error"
              ? destination === "disk"
                ? "Disk save failed"
                : "Library upload failed"
              : label}
        </span>
      </div>
      {status === "error" && error && (
        <p className="text-destructive ml-6 text-[11px]">{error}</p>
      )}
    </div>
  );
}

function DestinationIcon({
  destination,
  status,
}: {
  destination: ExportDestination;
  status: DestinationStatus;
}) {
  if (status === "success") {
    return <Check className="text-foreground size-3.5" />;
  }
  if (status === "error") {
    return <AlertCircle className="text-destructive size-3.5" />;
  }
  if (status === "pending" || status === "uploading") {
    return <Loader2 className="text-muted-foreground size-3.5 animate-spin" />;
  }
  return destination === "disk" ? (
    <Download className="text-muted-foreground size-3.5" />
  ) : (
    <Library className="text-muted-foreground size-3.5" />
  );
}

function ExportError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(error);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex flex-col gap-1.5">
        <p className="text-destructive text-sm font-medium">Export failed</p>
        <p className="text-muted-foreground text-xs">{error}</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={handleCopy}
        >
          {copied ? <Check className="text-constructive" /> : <Copy />}
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={onRetry}
        >
          <RotateCcw />
          Retry
        </Button>
      </div>
    </div>
  );
}
