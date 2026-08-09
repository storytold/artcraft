import {
  MouseEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import WaveSurfer from "wavesurfer.js";
import { addCorsParam } from "@storyteller/common";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import {
  notifyAudioStopped,
  registerAudioPlayer,
  requestAudioPlayback,
  unregisterAudioPlayer,
} from "./audio-playback-controller.js";

const WAVE_COLOR = "rgba(255, 255, 255, 0.35)";
// Tailwind `primary` (#2d81ff) — canvas fillStyle can't resolve CSS vars, so
// the hex is inlined. Keep in sync with the apps' tailwind primary color.
const WAVE_PROGRESS_COLOR = "#2d81ff";
const PLACEHOLDER_BAR_COUNT = 48;

// Decoded waveforms are expensive (full fetch + AudioContext decode), so we
// keep them per URL for the lifetime of the session. Re-mounts (view toggles,
// lightbox, scroll-recycling) reuse the peaks instead of re-downloading.
const peaksCache = new Map<string, { peaks: number[][]; duration: number }>();

export interface WaveformAudioPlayerProps {
  src: string;
  // Known duration (e.g. MediaFile.maybe_duration_millis) shown before the
  // audio metadata loads.
  durationMillis?: number | null;
  // Tighter layout for list rows.
  compact?: boolean;
  className?: string;
}

export function WaveformAudioPlayer({
  src,
  durationMillis,
  compact = false,
  className = "",
}: WaveformAudioPlayerProps) {
  const playerId = useId();
  const waveContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    durationMillis ? durationMillis / 1000 : 0,
  );
  // "pending" until the card scrolls into view, then "ready" once wavesurfer
  // has drawn, or "failed" if fetch/decode errored (CORS etc.) — playback
  // still works through the bare <audio> element in that case.
  const [waveState, setWaveState] = useState<"pending" | "ready" | "failed">(
    "pending",
  );
  const [volume, setVolume] = useState(100);
  const [showVolume, setShowVolume] = useState(false);

  const waveHeight = compact ? 32 : 44;

  // ── Audio element (owns playback in both wave and fallback modes) ──────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = src;
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      requestAudioPlayback(playerId);
    };
    const onPause = () => {
      setIsPlaying(false);
      notifyAudioStopped(playerId);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    registerAudioPlayer(playerId, () => audio.pause());

    return () => {
      unregisterAudioPlayer(playerId);
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [src, playerId]);

  // ── Wavesurfer visualization (lazy: only once scrolled into view) ──────
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;

    const initWaveSurfer = () => {
      const container = waveContainerRef.current;
      const media = audioRef.current;
      if (cancelled || !container || !media || waveSurferRef.current) return;

      const cached = peaksCache.get(src);
      try {
        const ws = WaveSurfer.create({
          container,
          media,
          // The waveform decode goes through fetch(), which needs CORS
          // headers from the CDN; playback (the media element) does not.
          url: addCorsParam(src) ?? src,
          height: waveHeight,
          waveColor: WAVE_COLOR,
          progressColor: WAVE_PROGRESS_COLOR,
          cursorColor: "transparent",
          barWidth: 2,
          barGap: 1.5,
          barRadius: 2,
          normalize: true,
          interact: true,
          ...(cached
            ? { peaks: cached.peaks, duration: cached.duration }
            : {}),
        });
        waveSurferRef.current = ws;

        ws.on("decode", (decodedDuration: number) => {
          if (cancelled) return;
          setWaveState("ready");
          if (decodedDuration > 0) setDuration(decodedDuration);
          if (!peaksCache.has(src)) {
            try {
              peaksCache.set(src, {
                peaks: ws.exportPeaks({ maxLength: 1024 }),
                duration: decodedDuration,
              });
            } catch {
              // Peaks export is a cache optimization only — safe to skip.
            }
          }
        });
        ws.on("error", () => {
          if (cancelled) return;
          setWaveState("failed");
          waveSurferRef.current = null;
          try {
            ws.destroy();
          } catch {
            // Already torn down.
          }
        });
      } catch {
        if (!cancelled) setWaveState("failed");
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      initWaveSurfer();
      return () => {
        cancelled = true;
        destroyWaveSurfer(waveSurferRef);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          initWaveSurfer();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(root);

    return () => {
      cancelled = true;
      observer.disconnect();
      destroyWaveSurfer(waveSurferRef);
    };
  }, [src, waveHeight]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    const audio = audioRef.current;
    if (audio) audio.volume = value / 100;
  }, []);

  // Seek on the placeholder / fallback progress bar (the real waveform has
  // built-in click-to-seek via wavesurfer).
  const handleBarSeek = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      audio.currentTime = Math.max(0, Math.min(1, ratio)) * duration;
    },
    [duration],
  );

  // Close the volume flyout on outside clicks.
  useEffect(() => {
    if (!showVolume) return;
    const onDocClick = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setShowVolume(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showVolume]);

  const placeholderBars = useMemo(() => buildPlaceholderBars(src), [src]);
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const showWave = waveState !== "failed";

  return (
    <div
      ref={rootRef}
      className={`flex items-center gap-2.5 ${compact ? "px-2.5 py-2" : "px-3 py-2.5"} ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={togglePlay}
        className={`flex shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 ${compact ? "h-8 w-8" : "h-10 w-10"}`}
      >
        <DynamicIcon
          icon={isPlaying ? PauseIcon : PlayIcon}
          className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} ${isPlaying ? "" : "ml-0.5"}`}
        />
      </button>

      <div className="relative min-w-0 flex-1" style={{ height: waveHeight }}>
        {showWave && (
          <div ref={waveContainerRef} className="absolute inset-0" />
        )}
        {(waveState === "pending" || waveState === "failed") && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center gap-[1.5px]"
            onClick={handleBarSeek}
          >
            {waveState === "failed" ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>
            ) : (
              placeholderBars.map((barHeight, index) => (
                <div
                  key={index}
                  className="w-[2px] shrink-0 rounded-full bg-white/25"
                  style={{ height: `${barHeight}%` }}
                />
              ))
            )}
          </div>
        )}
      </div>

      <span
        className={`shrink-0 tabular-nums text-white/70 ${compact ? "text-[11px]" : "text-xs"}`}
      >
        {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : "-:--"}
      </span>

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Volume"
          onClick={() => setShowVolume((visible) => !visible)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <DynamicIcon
            icon={volume === 0 ? VolumeXIcon : Volume2Icon}
            className="h-3.5 w-3.5"
          />
        </button>
        {showVolume && (
          <div className="absolute bottom-full right-0 z-20 mb-2 w-28 rounded-lg border border-white/10 bg-neutral-900/95 px-3 py-2.5 shadow-xl backdrop-blur">
            <SliderV2
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={handleVolumeChange}
              variant="filled"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function destroyWaveSurfer(ref: { current: WaveSurfer | null }): void {
  if (!ref.current) return;
  try {
    ref.current.destroy();
  } catch {
    // Already torn down.
  }
  ref.current = null;
}

function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

// Deterministic pseudo-waveform so unloaded cards still read as audio and
// don't all look identical. Seeded by the URL, not random — stable renders.
function buildPlaceholderBars(seedSource: string): number[] {
  let seed = 0;
  for (let index = 0; index < seedSource.length; index++) {
    seed = (seed * 31 + seedSource.charCodeAt(index)) >>> 0;
  }
  const bars: number[] = [];
  for (let index = 0; index < PLACEHOLDER_BAR_COUNT; index++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    bars.push(25 + (seed % 65));
  }
  return bars;
}
