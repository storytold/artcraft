"use client";

import { useState, useEffect } from "react";
import { useEditor } from "../../editor/use-editor";
import { formatTimecode } from "opencut-wasm";
// TODO: invokeAction is exported from
// opencut-classic/apps/web/src/actions/index.ts and dispatches keyboard
// actions like "toggle-play" through the keybinding system. The actions
// registry isn't ported yet, so the play/pause button calls the playback
// manager directly for now. Replace this with `invokeAction("toggle-play")`
// once `../../actions` lands.
// TODO: EditableTimecode is exported from
// opencut-classic/apps/web/src/components/editable-timecode.tsx. It renders
// an inline-editable timecode input. The component pulls in the
// `NumberField`/scrub-input primitives which aren't ported yet, so this
// toolbar falls back to a plain read-only timecode display until that
// component ports over.
import { Button } from "../../components/ui/button";
import {
  FullScreenIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from "../../components/ui/select";
import { PREVIEW_ZOOM_PRESETS } from "../zoom";
import { usePreviewViewport } from "./preview-viewport";
import type { MediaTime } from "../../wasm";

export function PreviewToolbar({
  onToggleFullscreen,
}: {
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center pb-3 pt-5 px-5">
      <TimecodeDisplay />
      <PlayPauseButton />
      <div className="justify-self-end flex items-center gap-2.5">
        <ZoomSelect />
        <Separator orientation="vertical" className="h-4" />
        {/* v0.4.0 */}
        {/* <GridPopover>
          <Button
            variant={activeGuideDefinition ? "secondary" : "text"}
            size="icon"
          >
            {activeGuideDefinition ? (
              activeGuideDefinition.renderTriggerIcon()
            ) : (
              <HugeiconsIcon icon={GridTableIcon} />
            )}
          </Button>
        </GridPopover> */}
        <Button variant="text" onClick={onToggleFullscreen}>
          <HugeiconsIcon icon={FullScreenIcon} />
        </Button>
      </div>
    </div>
  );
}

function TimecodeDisplay() {
  const editor = useEditor();
  const totalDuration = useEditor((e) => e.timeline.getTotalDuration());
  const fps = useEditor((e) => e.project.getActive().settings.fps);
  const [currentTime, setCurrentTime] = useState<MediaTime>(() =>
    editor.playback.getCurrentTime(),
  );

  useEffect(() => {
    const unsubscribeUpdate = editor.playback.onUpdate(setCurrentTime);
    const unsubscribeSeek = editor.playback.onSeek(setCurrentTime);
    return () => {
      unsubscribeUpdate();
      unsubscribeSeek();
    };
  }, [editor.playback]);

  // TODO(EditableTimecode): swap this read-only span for the editable
  // timecode input once `components/editable-timecode` is ported.
  return (
    <div className="flex items-center">
      <span className="text-center font-mono text-xs tabular-nums">
        {formatTimecode({
          time: currentTime,
          format: "HH:MM:SS:FF",
          rate: fps,
        })}
      </span>
      <span className="text-muted-foreground px-2 font-mono text-xs">/</span>
      <span className="text-muted-foreground font-mono text-xs">
        {formatTimecode({
          time: totalDuration,
          format: "HH:MM:SS:FF",
          rate: fps,
        })}
      </span>
    </div>
  );
}

function ZoomSelect() {
  const { isAtFit, zoomPercent, fitToScreen, setViewportPercent } =
    usePreviewViewport();

  const displayLabel = isAtFit ? "Fit" : `${zoomPercent}%`;

  const onValueChange = (value: string) => {
    if (value === "fit") {
      fitToScreen();
    } else {
      setViewportPercent({ percent: Number(value) });
    }
  };

  return (
    <Select
      value={isAtFit ? "fit" : String(zoomPercent)}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="tabular-nums">{displayLabel}</SelectTrigger>
      <SelectContent>
        <SelectItem value="fit">Fit</SelectItem>
        <SelectSeparator />
        {PREVIEW_ZOOM_PRESETS.map((preset) => (
          <SelectItem key={preset} value={String(preset)}>
            {preset}%
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PlayPauseButton() {
  const editor = useEditor();
  const isPlaying = useEditor((e) => e.playback.getIsPlaying());

  return (
    <Button
      variant="text"
      size="icon"
      onClick={() => {
        // TODO(invokeAction): use `invokeAction("toggle-play")` once the
        // actions registry is ported. Direct manager call works because the
        // PlaybackManager owns the play state and is reactive.
        if (editor.playback.getIsPlaying()) {
          editor.playback.pause();
        } else {
          editor.playback.play();
        }
      }}
    >
      <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} />
    </Button>
  );
}
