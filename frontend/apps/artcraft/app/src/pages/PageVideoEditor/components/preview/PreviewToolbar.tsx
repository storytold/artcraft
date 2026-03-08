import {
  faPlay,
  faPause,
  faVolumeHigh,
  faVolumeXmark,
  faBackwardStep,
  faForwardStep,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import { formatTimeCode } from "../../lib/time";

export function PreviewToolbar() {
  const editor = useVideoEditor();
  const isPlaying = editor.playback.getIsPlaying();
  const currentTime = editor.playback.getCurrentTime();
  const totalDuration = editor.timeline.getTotalDuration();
  const isMuted = editor.playback.isMutedState();

  return (
    <div className="flex h-10 items-center justify-center gap-1 border-t border-ui-panel-border bg-ui-panel px-3">
      {/* Skip to start */}
      <Tooltip content="Go to start" position="top" delay={300}>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => editor.playback.seek({ time: 0 })}
        >
          <FontAwesomeIcon icon={faBackwardStep} className="text-xs" />
        </Button>
      </Tooltip>

      {/* Play / Pause */}
      <Tooltip
        content={isPlaying ? "Pause (Space)" : "Play (Space)"}
        position="top"
        delay={300}
      >
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => editor.playback.toggle()}
        >
          <FontAwesomeIcon
            icon={isPlaying ? faPause : faPlay}
            className="text-sm"
          />
        </Button>
      </Tooltip>

      {/* Skip to end */}
      <Tooltip content="Go to end" position="top" delay={300}>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => editor.playback.seek({ time: totalDuration })}
        >
          <FontAwesomeIcon icon={faForwardStep} className="text-xs" />
        </Button>
      </Tooltip>

      {/* Timecode */}
      <span className="ml-3 font-mono text-xs text-base-fg/60">
        {formatTimeCode(currentTime)} / {formatTimeCode(totalDuration)}
      </span>

      {/* Volume */}
      <div className="ml-auto flex items-center gap-1">
        <Tooltip content={isMuted ? "Unmute" : "Mute"} position="top" delay={300}>
          <Button
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => editor.playback.toggleMute()}
          >
            <FontAwesomeIcon
              icon={isMuted ? faVolumeXmark : faVolumeHigh}
              className="text-xs"
            />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
