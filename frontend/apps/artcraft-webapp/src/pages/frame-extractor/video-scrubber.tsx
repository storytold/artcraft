import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Tooltip } from "@storyteller/ui-tooltip";
import { formatTime, formatTimePrecise } from "./lib/frame-actions";

// Browsers don't expose the real frame rate, so stepping assumes 30fps —
// close enough for "nudge to the sharp frame" purposes.
const FRAME_STEP_SEC = 1 / 30;

interface VideoScrubberProps {
  src: string;
  // Set for remote (library) sources so canvas capture isn't tainted.
  useCrossOrigin: boolean;
  // Parent owns the element ref — extraction needs direct access to it.
  videoRef: RefObject<HTMLVideoElement | null>;
  onTimeChange: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onResolutionChange: (resolution: { w: number; h: number }) => void;
  onCaptureRequest: () => void;
  onVideoError: () => void;
  disabled?: boolean;
}

export const VideoScrubber = ({
  src,
  useCrossOrigin,
  videoRef,
  onTimeChange,
  onDurationChange,
  onResolutionChange,
  onCaptureRequest,
  onVideoError,
  disabled,
}: VideoScrubberProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  // Mirror media element state into React (play/pause/seek can come from
  // anywhere: clicks, keyboard, extraction restoring the playhead).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeChange(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentTime(0);
      onDurationChange(video.duration);
      onTimeChange(0);
      if (video.videoWidth && video.videoHeight) {
        onResolutionChange({ w: video.videoWidth, h: video.videoHeight });
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [videoRef, src, onTimeChange, onDurationChange, onResolutionChange]);

  // Page-level shortcuts, active whenever a video is loaded. Window-scoped
  // (not focus-scoped): clicking anywhere on the page must not kill them.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabledRef.current || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          seekByRef.current(e.shiftKey ? -1 : -FRAME_STEP_SEC);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekByRef.current(e.shiftKey ? 1 : FRAME_STEP_SEC);
          break;
        case " ":
          e.preventDefault();
          togglePlayPauseRef.current();
          break;
        case "Enter":
        case "c":
        case "C":
          e.preventDefault();
          onCaptureRequestRef.current();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration) || duration === 0) return;
    const clamped = Math.max(0, Math.min(time, duration));
    video.currentTime = clamped;
    // timeupdate can lag a seek; reflect it immediately for a snappy readout.
    setCurrentTime(clamped);
    onTimeChange(clamped);
  };

  const seekBy = (deltaSec: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    seekTo(video.currentTime + deltaSec);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || disabled) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
  };

  // Latest-value refs so the mount-once window key listener never calls into
  // stale closures.
  const disabledRef = useRef(!!disabled);
  disabledRef.current = !!disabled;
  const seekByRef = useRef(seekBy);
  seekByRef.current = seekBy;
  const togglePlayPauseRef = useRef(togglePlayPause);
  togglePlayPauseRef.current = togglePlayPause;
  const onCaptureRequestRef = useRef(onCaptureRequest);
  onCaptureRequestRef.current = onCaptureRequest;

  const ratioFromPointer = (clientX: number): number => {
    const timeline = timelineRef.current;
    if (!timeline) return 0;
    const rect = timeline.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  // One pointer interaction covers click-seek and drag-scrub, and works for
  // touch via pointer capture.
  const handleTimelinePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (disabled || !Number.isFinite(duration) || duration === 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isScrubbingRef.current = true;
    videoRef.current?.pause();
    seekTo(ratioFromPointer(e.clientX) * duration);
  };

  const handleTimelinePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (isScrubbingRef.current) {
      seekTo(ratioFromPointer(e.clientX) * duration);
    } else {
      setHoverRatio(ratioFromPointer(e.clientX));
    }
  };

  const handleTimelinePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const progressPercent =
    Number.isFinite(duration) && duration > 0
      ? (currentTime / duration) * 100
      : 0;

  const stepButtons: {
    label: string;
    tooltip: string;
    icon: typeof ChevronLeftIcon;
    delta: number;
  }[] = [
    { label: "-1s", tooltip: "Back 1s (Shift+←)", icon: SkipBackIcon, delta: -1 },
    { label: "-1f", tooltip: "Back 1 frame (←)", icon: ChevronLeftIcon, delta: -FRAME_STEP_SEC },
    { label: "+1f", tooltip: "Forward 1 frame (→)", icon: ChevronRightIcon, delta: FRAME_STEP_SEC },
    { label: "+1s", tooltip: "Forward 1s (Shift+→)", icon: SkipForwardIcon, delta: 1 },
  ];

  return (
    <div className="group/scrubber overflow-hidden border border-ui-panel-border bg-ui-panel">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full bg-black"
          onClick={togglePlayPause}
          onError={onVideoError}
          preload="metadata"
          playsInline
          crossOrigin={useCrossOrigin ? "anonymous" : undefined}
        />
        {!isPlaying && !disabled && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover/scrubber:opacity-100"
            aria-label="Play"
          >
            <PlayIcon  className="ml-0.5" />
          </button>
        )}
      </div>

      <div className={`space-y-3 p-4 ${disabled ? "pointer-events-none opacity-50" : ""}`}>
        <div
          ref={timelineRef}
          className="group/timeline relative h-8 cursor-pointer touch-none select-none"
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerUp}
          onPointerCancel={handleTimelinePointerUp}
          onPointerLeave={() => setHoverRatio(null)}
        >
          <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 bg-white/10 transition-all group-hover/timeline:h-3">
            <div
              className="h-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 bg-white"
            style={{ left: `${progressPercent}%` }}
          />
          {hoverRatio !== null &&
            Number.isFinite(duration) &&
            duration > 0 && (
              <div
                className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded-[3px] bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white"
                style={{ left: `${hoverRatio * 100}%` }}
              >
                {formatTimePrecise(hoverRatio * duration)}
              </div>
            )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {stepButtons.slice(0, 2).map((step) => (
              <Tooltip key={step.label} content={step.tooltip} position="top" className="z-50">
                <button
                  onClick={() => seekBy(step.delta)}
                  className="flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={step.tooltip}
                >
                  <DynamicIcon icon={step.icon} className="text-xs" />
                </button>
              </Tooltip>
            ))}
            <Tooltip content="Play/Pause (Space)" position="top" className="z-50">
              <button
                onClick={togglePlayPause}
                className="mx-0.5 flex h-9 w-9 items-center justify-center bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Play or pause"
              >
                <DynamicIcon icon={isPlaying ? PauseIcon : PlayIcon} />
              </button>
            </Tooltip>
            {stepButtons.slice(2).map((step) => (
              <Tooltip key={step.label} content={step.tooltip} position="top" className="z-50">
                <button
                  onClick={() => seekBy(step.delta)}
                  className="flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={step.tooltip}
                >
                  <DynamicIcon icon={step.icon} className="text-xs" />
                </button>
              </Tooltip>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={toggleMute}
                className="flex h-7 w-7 items-center justify-center text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                <DynamicIcon
                  icon={isMuted ? VolumeXIcon : Volume2Icon}
                  className="text-xs"
                />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) video.volume = parseFloat(e.target.value);
                }}
                className="w-20 accent-white"
                aria-label="Volume"
              />
            </div>
            <div className="font-mono text-sm text-base-fg/80">
              {formatTimePrecise(currentTime)}
              <span className="text-base-fg/40"> / {formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
