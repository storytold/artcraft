import { useEffect, useState } from "react";
import { useEditor } from "../../editor/use-editor";
import { useCommittedRef } from "../../hooks/use-committed-ref";
import { useShiftKey } from "../../hooks/use-shift-key";
import { useEdgeAutoScroll } from "./use-edge-auto-scroll";
import { timelineTimeToPixels } from "../pixel-utils";
import {
  PlayheadController,
  type PlayheadConfig,
} from "../controllers/playhead-controller";
import type { MediaTime } from "../../wasm";

interface UseTimelinePlayheadProps {
  zoomLevel: number;
  rulerRef: React.RefObject<HTMLDivElement | null>;
  rulerScrollRef: React.RefObject<HTMLDivElement | null>;
  tracksScrollRef: React.RefObject<HTMLDivElement | null>;
  playheadRef?: React.RefObject<HTMLDivElement | null>;
}

export function useTimelinePlayhead({
  zoomLevel,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  playheadRef,
}: UseTimelinePlayheadProps) {
  const editor = useEditor();
  const isShiftHeldRef = useShiftKey();
  // isScrubbing drives useEdgeAutoScroll — the controller sets it on the editor,
  // so this reactive read naturally reflects whether scrubbing is active.
  const isScrubbing = useEditor((e) => e.playback.getIsScrubbing());

  const config: PlayheadConfig = {
    zoomLevel,
    duration: editor.timeline.getTotalDuration(),
    getActiveProjectFps: () => editor.project.getActive()?.settings.fps ?? null,
    isShiftHeld: () => isShiftHeldRef.current,
    getIsPlaying: () => editor.playback.getIsPlaying(),
    getRulerEl: () => rulerRef.current,
    getRulerScrollEl: () => rulerScrollRef.current,
    getTracksScrollEl: () => tracksScrollRef.current,
    getPlayheadEl: () => playheadRef?.current ?? null,
    getSceneTracks: () => editor.scenes.getActiveScene().tracks,
    getSceneBookmarks: () => editor.scenes.getActiveScene()?.bookmarks ?? [],
    seek: (time) => editor.playback.seek({ time }),
    setScrubbing: (scrubbing) =>
      editor.playback.setScrubbing({ isScrubbing: scrubbing }),
    setTimelineViewState: ({ zoomLevel, scrollLeft, playheadTime }) =>
      editor.project.setTimelineViewState({
        timelineViewState: {
          zoomLevel,
          scrollLeft,
          playheadTime,
        },
      }),
  };
  const configRef = useCommittedRef(config);
  const [ctrl] = useState(() => new PlayheadController({ configRef }));

  // Scroll → keep playhead position in sync with scroll offset.
  useEffect(() => {
    const scrollEl = rulerScrollRef.current;
    if (!scrollEl) return;
    const handler = () =>
      ctrl.updatePlayheadLeft(editor.playback.getCurrentTime());
    scrollEl.addEventListener("scroll", handler, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handler);
  }, [ctrl, editor.playback, rulerScrollRef]);

  // Playback events → update playhead position and auto-scroll during playback.
  useEffect(() => {
    const handler = (time: MediaTime) => ctrl.handlePlaybackUpdate(time);
    ctrl.updatePlayheadLeft(editor.playback.getCurrentTime());
    const unsubscribeUpdate = editor.playback.onUpdate(handler);
    const unsubscribeSeek = editor.playback.onSeek(handler);
    return () => {
      unsubscribeUpdate();
      unsubscribeSeek();
    };
  }, [ctrl, editor.playback]);

  useEdgeAutoScroll({
    isActive: isScrubbing,
    getMouseClientX: () => ctrl.getLastMouseClientX(),
    rulerScrollRef,
    tracksScrollRef,
    contentWidth: timelineTimeToPixels({
      time: editor.timeline.getTotalDuration(),
      zoomLevel,
    }),
  });

  useEffect(() => () => ctrl.destroy(), [ctrl]);

  return {
    handlePlayheadMouseDown: ctrl.onPlayheadMouseDown,
    handleRulerMouseDown: ctrl.onRulerMouseDown,
  };
}
