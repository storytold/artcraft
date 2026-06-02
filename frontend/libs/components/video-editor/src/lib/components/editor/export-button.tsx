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
import { Check, Copy, Download, RotateCcw } from "lucide-react";
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

  const handleExport = async () => {
    if (!activeProject) return;

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
      try {
        await exportSink.accept({
          blob: new Blob([result.buffer], { type: mime }),
          filename,
          mime,
          durationMs: durationMs > 0 ? durationMs : undefined,
        });
      } catch (error) {
        console.error("Export sink failed:", error);
        toast.error("Couldn't save exported video", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }
      editor.project.clearExportState();
      onOpenChange(false);
    }
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
            {!isExporting && (
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
                </div>

                <div className="p-3 pt-0">
                  <Button onClick={handleExport} className="w-full gap-2">
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
          </div>
        </>
      )}
    </PopoverContent>
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
