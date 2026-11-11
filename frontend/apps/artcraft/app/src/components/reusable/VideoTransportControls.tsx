import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";

interface VideoTransportControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  onSeek: (to: "first" | "last") => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  formatTime: (seconds: number) => string;
}

/** The row under a video page's player: first / play / last frame, mute and volume, and the time. */
export const VideoTransportControls = ({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  onSeek,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  formatTime,
}: VideoTransportControlsProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSeek("first")}
        className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-white/10 transition-colors hover:bg-white/20"
        title="First Frame"
      >
        <SkipBackIcon className="text-sm text-white" />
      </button>
      <button
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-white/20 transition-colors hover:bg-white/30"
      >
        <DynamicIcon icon={isPlaying ? PauseIcon : PlayIcon} className="text-white" />
      </button>
      <button
        onClick={() => onSeek("last")}
        className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-white/10 transition-colors hover:bg-white/20"
        title="Last Frame"
      >
        <SkipForwardIcon className="text-sm text-white" />
      </button>
      <div className="mx-1 h-6 w-px bg-white/20" />
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-white/10 transition-colors hover:bg-white/20"
      >
        <DynamicIcon icon={isMuted ? VolumeXIcon : Volume2Icon} className="text-sm text-white" />
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolumeChange(Number.parseFloat(e.target.value))}
        className="w-20 accent-white"
      />
    </div>
    <div className="font-mono text-sm tabular-nums text-white">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  </div>
);
