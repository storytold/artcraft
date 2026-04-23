import { memo, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeHigh,
  faVolumeXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { VideoNode as VideoNodeData } from "../../PageMoodboard/types";
import { useMoodboardStore } from "../../PageMoodboard/MoodboardStore";

interface Props {
  node: VideoNodeData;
  draggable: boolean;
  selected: boolean;
  onSelect: (id: string, additive: boolean) => void;
}

const VideoNodeHtmlInner = ({ node, draggable, selected, onSelect }: Props) => {
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);
  const zoom = useMoodboardStore((s) => s.viewport.zoom);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrubHitRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(node.autoplay);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const dragStateRef = useRef<{
    active: boolean;
    startClient: { x: number; y: number };
    startNode: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("loadedmetadata", onDur);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("loadedmetadata", onDur);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!draggable) return;
    e.stopPropagation();
    const additive = e.shiftKey;
    onSelect(node.id, additive);
    dragStateRef.current = {
      active: true,
      startClient: { x: e.clientX, y: e.clientY },
      startNode: { x: node.x, y: node.y },
      moved: false,
    };
    const onMove = (ev: PointerEvent) => {
      const st = dragStateRef.current;
      if (!st || !st.active) return;
      const { zoom: z } = useMoodboardStore.getState().viewport;
      const dx = (ev.clientX - st.startClient.x) / z;
      const dy = (ev.clientY - st.startClient.y) / z;
      if (!st.moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
        st.moved = true;
        pushHistory();
      }
      if (st.moved) {
        updateNode(node.id, {
          x: st.startNode.x + dx,
          y: st.startNode.y + dy,
        });
      }
    };
    const onUp = () => {
      dragStateRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNode(node.id, { muted: !node.muted });
  };

  // Stop pointerdown on control buttons so clicking a control doesn't
  // also start the node-drag gesture wired on the outer div.
  const stopDown = (e: React.PointerEvent) => e.stopPropagation();

  // Seek to the clientX position within the scrub hit-area. Returns early
  // if duration is unknown (metadata still loading).
  const seekToClientX = (clientX: number) => {
    const el = scrubHitRef.current;
    const v = videoRef.current;
    if (!el || !v || !duration) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
  };

  const handleScrubDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    seekToClientX(e.clientX);
    const onMove = (ev: PointerEvent) => seekToClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const controlBtnStyle = (
    visible: boolean,
    size: number,
  ): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.42,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? "auto" : "none",
    transition: "opacity 180ms ease",
    padding: 0,
  });

  const showPlayBtn = !isPlaying || isHovered;

  return (
    <div
      data-moodboard-html-node={node.id}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `rotate(${node.rotation}deg)`,
        transformOrigin: "0 0",
        cursor: draggable ? "move" : "default",
        userSelect: "none",
        touchAction: "none",
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        border: selected ? `${1 / zoom}px solid #3b82f6` : "none",
        boxSizing: "border-box",
      }}
    >
      <video
        ref={videoRef}
        src={node.src}
        autoPlay={node.autoplay}
        muted={node.muted}
        loop={node.loop}
        playsInline
        preload="metadata"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "fill",
          pointerEvents: "none",
        }}
      />
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        onPointerDown={stopDown}
        onClick={togglePlay}
        style={{
          ...controlBtnStyle(showPlayBtn, 56),
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
      </button>
      <button
        type="button"
        aria-label={node.muted ? "Unmute" : "Mute"}
        onPointerDown={stopDown}
        onClick={toggleMute}
        style={{
          ...controlBtnStyle(isHovered, 32),
          right: 8,
          bottom: 28,
        }}
      >
        <FontAwesomeIcon icon={node.muted ? faVolumeXmark : faVolumeHigh} />
      </button>
      {/* Scrub bar — bottom strip with a tall hit area so it's easy to grab. */}
      <div
        ref={scrubHitRef}
        onPointerDown={handleScrubDown}
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 4,
          height: 16,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transition: "opacity 180ms ease",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "#3b82f6",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const VideoNodeHtml = memo(VideoNodeHtmlInner);
