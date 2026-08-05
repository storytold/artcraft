import { useContext, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faBackwardStep,
  faCrosshairs,
  faForwardStep,
  faChevronDown,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { EngineContext } from "../../contexts/EngineContext/EngineContext";
import {
  cancelTimeline,
  deleteKeyframe,
  pauseTimeline,
  playTimeline,
  removeClipLane,
  saveTimeline,
  seekTimeline,
} from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { DEFAULT_TIMELINE_FPS } from "../../engine/timeline/types";
import {
  formatTimecode,
  formatTimecodeFrames,
  fractionToTime,
  quantizeToFrame,
  timeToFraction,
} from "./timelineUtils";
import { TimelineTrackRow } from "./TimelineTrackRow";
import { TimelineClipRow } from "./TimelineClipRow";
import { MotionPopover } from "./MotionPopover";
import { DurationLabel } from "./DurationLabel";

// Lane geometry: label column (w-32=8rem) + gap-3(0.75rem) … gap-3 + add-btn(w-7=1.75rem).
const LANE_LEFT = "8.75rem";
const LANE_RIGHT = "2.5rem";

// Expanded multi-track keyframe editor. Replaces the prompt box while open.
export const TimelineEditor = () => {
  const editor = useContext(EngineContext);
  const rulerRef = useRef<HTMLDivElement>(null);
  const isScrubbing = useRef(false);

  const tracks = usePageSceneStore((s) => s.timelineTracks);
  const clipLanes = usePageSceneStore((s) => s.timelineClipLanes);
  const characters = usePageSceneStore((s) => s.characters);
  const duration = usePageSceneStore((s) => s.timelineDuration);
  const playhead = usePageSceneStore((s) => s.timelinePlayhead);
  const isPlaying = usePageSceneStore((s) => s.timelineIsPlaying);
  const outlinerItems = usePageSceneStore((s) => s.outlinerItems);
  const selectedKeyframeId = usePageSceneStore(
    (s) => s.timelineSelectedKeyframeId,
  );
  const selectedClipLaneId = usePageSceneStore(
    (s) => s.timelineSelectedClipLaneId,
  );
  const revealObjectUuid = usePageSceneStore(
    (s) => s.timelineRevealObjectUuid,
  );
  const selectedObject = usePageSceneStore((s) => s.selectedObject);
  const focusSelected = usePageSceneStore((s) => s.timelineFocusSelected);
  const setFocusSelected = usePageSceneStore(
    (s) => s.setTimelineFocusSelected,
  );
  const setExpanded = usePageSceneStore((s) => s.setTimelineExpanded);

  // Every scene object gets a track row (empty lanes included), so the
  // editor never looks blank while the scene has content — no selection
  // required to see where keyframes can go. The focus toggle narrows the
  // list to the selected object's row; with nothing selected (or the
  // selection not an outliner row) it falls back to showing everything
  // rather than an empty list.
  const trackByUuid = new Map(tracks.map((t) => [t.objectUuid, t]));
  const focusedRows =
    focusSelected && selectedObject
      ? outlinerItems.filter((item) => item.id === selectedObject.id)
      : [];
  const rows = focusedRows.length > 0 ? focusedRows : outlinerItems;

  // Clip-row eligibility: characters and any skinned object (creatures,
  // rigged uploads) accept animation drags — the bind check still gates the
  // drop — and any object with baked clips gets a row for its picker even
  // without a skeleton (baked transform animations play through the mixer
  // too).
  const characterIds = new Set(characters.map((c) => c.id));
  const acceptsClipDrops = (item: (typeof rows)[number]) =>
    characterIds.has(item.id) || !!item.hasSkeleton;
  const hasClipRow = (item: (typeof rows)[number]) =>
    acceptsClipDrops(item) || (item.bakedClips?.length ?? 0) > 0;
  const clipLanesByChar = new Map<string, typeof clipLanes>();
  for (const lane of clipLanes) {
    const list = clipLanesByChar.get(lane.objectUuid) ?? [];
    list.push(lane);
    clipLanesByChar.set(lane.objectUuid, list);
  }

  const selectedKeyframe = tracks
    .flatMap((t) => t.keyframes)
    .find((k) => k.id === selectedKeyframeId);

  // The Motion popover edits the easing of the segment BETWEEN two
  // keyframes (stored on the left one) and anchors at the segment midpoint.
  const easingKeyframeId = usePageSceneStore((s) => s.timelineEasingKeyframeId);
  let easingAnchor: {
    keyframe: (typeof tracks)[number]["keyframes"][number];
    leftPercent: number;
  } | null = null;
  if (easingKeyframeId) {
    for (const track of tracks) {
      const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);
      const index = sorted.findIndex((k) => k.id === easingKeyframeId);
      if (index === -1) continue;
      if (index < sorted.length - 1) {
        const mid = (sorted[index].time + sorted[index + 1].time) / 2;
        easingAnchor = {
          keyframe: sorted[index],
          leftPercent: timeToFraction(mid, duration) * 100,
        };
      }
      break;
    }
  }

  // Selected keyframe: Delete/Backspace removes it (capture phase, so the
  // engine's document-level Delete — which deletes the selected scene
  // object — never sees the key), and clicking anywhere that isn't a
  // keyframe or the Delete button deselects it.
  useEffect(() => {
    if (!selectedKeyframeId) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (editor) deleteKeyframe(editor, selectedKeyframeId);
      usePageSceneStore.getState().setTimelineSelectedKeyframe(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("[data-keyframe]") ||
        target?.closest("[data-keyframe-delete]")
      ) {
        return;
      }
      usePageSceneStore.getState().setTimelineSelectedKeyframe(null);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [selectedKeyframeId, editor]);

  // Selected clip strip: Del/Backspace removes it (undoable via
  // RemoveClipLaneAction), and clicking anything that isn't a strip
  // deselects. Mirrors the keyframe selection handlers above; both keydown
  // listeners can coexist since strip-selection clears keyframe-selection
  // (a strip isn't [data-keyframe]) and vice versa — the guard below is
  // belt-and-braces for the impossible both-selected case.
  useEffect(() => {
    if (!selectedClipLaneId) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      if (usePageSceneStore.getState().timelineSelectedKeyframeId) return;
      e.preventDefault();
      e.stopPropagation();
      if (editor) removeClipLane(editor, selectedClipLaneId);
      usePageSceneStore.getState().setTimelineSelectedClipLane(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-clip-strip]")) return;
      usePageSceneStore.getState().setTimelineSelectedClipLane(null);
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [selectedClipLaneId, editor]);

  // Scroll the row list to the object whose clip was just added
  // (addClipToCharacter sets the uuid alongside timelineExpanded). A store
  // field rather than a call because the editor is unmounted while
  // collapsed: expanding mounts it, this effect runs post-mount with the
  // uuid already set, scrolls, then clears.
  useEffect(() => {
    if (!revealObjectUuid) return;
    const store = usePageSceneStore.getState();
    // Focus mode can hide the revealed row (clip dropped onto a character
    // that isn't the selected object): fall back to all tracks so the new
    // clip is visible. The effect re-runs off the focusSelected dep once
    // the row exists, then scrolls.
    if (
      store.timelineFocusSelected &&
      store.selectedObject?.id !== revealObjectUuid
    ) {
      store.setTimelineFocusSelected(false);
      return;
    }
    const row = document.querySelector(
      `[data-timeline-row-uuid="${CSS.escape(revealObjectUuid)}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
    store.setTimelineRevealObjectUuid(null);
  }, [revealObjectUuid, focusSelected]);

  // Clicking anywhere outside the popover (canvas included) dismisses it;
  // the easing chips opt out so they can toggle it themselves.
  useEffect(() => {
    if (!easingKeyframeId) return undefined;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest("#motion-popover") ||
        target?.closest("[data-easing-chip]")
      ) {
        return;
      }
      usePageSceneStore.getState().setTimelineEasingKeyframe(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [easingKeyframeId]);

  const playheadFraction = timeToFraction(playhead, duration);

  const togglePlay = () => {
    if (!editor) return;
    if (isPlaying) pauseTimeline(editor);
    else playTimeline(editor);
  };

  // The timeline runs on a frame grid (what Record encodes at).
  const fps = editor?.timelineController.getTimeline()?.fps ?? DEFAULT_TIMELINE_FPS;

  // Scrubbing follows the pointer 1:1 (no magnetism toward keyframes),
  // quantized to the frame grid so times are never arbitrary floats.
  const seekFromRuler = (clientX: number) => {
    const ruler = rulerRef.current;
    if (!ruler || !editor) return;
    const rect = ruler.getBoundingClientRect();
    pauseTimeline(editor);
    seekTimeline(
      editor,
      quantizeToFrame(
        fractionToTime((clientX - rect.left) / rect.width, duration),
        fps,
      ),
    );
  };

  return (
    <div
      id="timeline-editor"
      className="glass glass-no-hover absolute bottom-4 left-1/2 w-[90vw] max-w-5xl -translate-x-1/2 select-none rounded-2xl p-3 text-white shadow-xl"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* transport + collapse */}
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          title="Go to start"
          onClick={() => editor && seekTimeline(editor, 0)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/70 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faBackwardStep} className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/90 hover:bg-white/10"
        >
          <FontAwesomeIcon
            icon={isPlaying ? faPause : faPlay}
            className="h-3.5 w-3.5"
          />
        </button>
        <button
          type="button"
          title="Go to end"
          onClick={() => editor && seekTimeline(editor, duration)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/70 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faForwardStep} className="h-3.5 w-3.5" />
        </button>
        <span className="ml-2 tabular-nums text-xs text-base-fg/60">
          {formatTimecodeFrames(playhead, fps)} / {formatTimecode(duration)}
        </span>
        {/* ml-auto lives on a wrapper: Tooltip's className styles the popup
            panel, and its trigger div is hard-coded to "relative". */}
        <div className="ml-auto">
          <Tooltip
            content={
              focusSelected
                ? "Show all tracks"
                : "Show only the selected object's track"
            }
            position="top"
            delay={300}
            closeOnClick
          >
            <button
              type="button"
              onClick={() => setFocusSelected(!focusSelected)}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                focusSelected
                  ? "bg-primary/20 text-white"
                  : "text-base-fg/60 hover:bg-white/10"
              }`}
            >
              <FontAwesomeIcon icon={faCrosshairs} className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
        <button
          type="button"
          title="Collapse timeline"
          onClick={() => setExpanded(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-base-fg/60 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
        </button>
      </div>

      {/* ruler + tracks (playhead line spans this region) */}
      <div className="relative">
        <div className="mb-1 flex items-center gap-3">
          <div className="w-32 shrink-0" />
          <div
            ref={rulerRef}
            // Tagged so DndAsset can convert an animation drop's pointer-x
            // into a timeline time using this exact rect (lane geometry
            // matches the ruler, same conversion scrubbing uses).
            data-timeline-ruler=""
            className="relative h-5 flex-1 cursor-pointer touch-none text-[10px] text-base-fg/50"
            onPointerDown={(e) => {
              isScrubbing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              seekFromRuler(e.clientX);
            }}
            onPointerMove={(e) => {
              if (isScrubbing.current) seekFromRuler(e.clientX);
            }}
            onPointerUp={() => {
              isScrubbing.current = false;
            }}
            onPointerCancel={() => {
              isScrubbing.current = false;
            }}
          >
            {/* labels are centered on their ticks (the edge ones spill a
                little into the spacer columns, which is intentional) */}
            <span className="absolute left-0 -translate-x-1/2">
              {formatTimecode(0)}
            </span>
            <span className="absolute left-1/2 -translate-x-1/2">
              {formatTimecode(duration / 2)}
            </span>
            <DurationLabel className="absolute right-0 translate-x-1/2" />
            {/* tick marks in three tiers: major every 5 s, second ticks,
                and faint sub-ticks between them. Sub-tick density adapts
                to the timeline length so long timelines don't turn the
                ruler into a solid smear. */}
            {(() => {
              const subsPerSecond = duration <= 15 ? 4 : duration <= 30 ? 2 : 1;
              const count = Math.floor(duration * subsPerSecond) + 1;
              return Array.from({ length: count }, (_, i) => {
                const t = i / subsPerSecond;
                const isSecond = i % subsPerSecond === 0;
                const isMajor = isSecond && t % 5 === 0;
                return (
                  <span
                    key={i}
                    className={`pointer-events-none absolute bottom-0 w-px ${
                      isMajor
                        ? "h-2 bg-white/30"
                        : isSecond
                          ? "h-1.5 bg-white/20"
                          : "h-1 bg-white/10"
                    }`}
                    style={{ left: `${timeToFraction(t, duration) * 100}%` }}
                  />
                );
              });
            })()}
          </div>
          <div className="w-7 shrink-0" />
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-base-fg/40">
            Add objects to the scene to start animating.
          </div>
        ) : (
          /* Cap at ~3.5 rows (row = 36px lane + 8px padding) so the panel
             stays compact; the half row hints that the list scrolls. The
             scrollbar is hidden so the lanes keep the exact same width as
             the ruler — a visible scrollbar would shift keyframes out of
             alignment with the ruler-driven playhead. */
          <div className="max-h-[154px] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {rows.map((item) => {
              const droppable = acceptsClipDrops(item);
              const clipRow = hasClipRow(item);
              const lanes = clipRow ? clipLanesByChar.get(item.id) : undefined;
              return (
                /* Clip-eligible rows advertise themselves as drop targets;
                   DndAsset hit-tests this attribute during animation drags
                   (pointer-based — no HTML5 DnD). Other rows stay untagged.
                   data-timeline-row-uuid tags EVERY row; it's the scroll
                   target for the post-add reveal effect above. */
                <div
                  key={item.id}
                  data-timeline-row-uuid={item.id}
                  data-clip-drop-uuid={droppable ? item.id : undefined}
                >
                  <TimelineTrackRow
                    item={item}
                    track={trackByUuid.get(item.id)}
                    duration={duration}
                  />
                  {clipRow && (
                    <TimelineClipRow
                      objectUuid={item.id}
                      lanes={lanes ?? []}
                      duration={duration}
                      bakedClips={item.bakedClips}
                      droppable={droppable}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* playhead (diamond handle in the ruler + line over the lanes) */}
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ left: LANE_LEFT, right: LANE_RIGHT }}
        >
          <div
            className="absolute inset-y-0 w-px bg-white"
            style={{ left: `${playheadFraction * 100}%` }}
          />
          <div
            className="absolute top-0 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-white"
            style={{ left: `${playheadFraction * 100}%` }}
          />
        </div>

        {/* Anchor the popover in the lane area (same geometry as the
            playhead overlay) so its left % lines up with the easing chip. */}
        {easingAnchor && (
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{ left: LANE_LEFT, right: LANE_RIGHT }}
          >
            <MotionPopover
              keyframe={easingAnchor.keyframe}
              leftPercent={easingAnchor.leftPercent}
            />
          </div>
        )}
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="ms-2 text-[11px] text-base-fg/40">
          Each diamond stores an object's full position, rotation and scale at
          that moment. Tap a diamond to jump to it.
        </span>
        <div className="flex items-center gap-2">
          {selectedKeyframe && (
            /* data-keyframe-delete: exempt from the click-away deselect —
               pointerdown would otherwise clear the selection before this
               button's click fires. */
            <div data-keyframe-delete>
              <Button
                variant="secondary"
                icon={faTrash}
                className="flex h-9 items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg hover:bg-ui-controls/90"
                onClick={() =>
                  editor && deleteKeyframe(editor, selectedKeyframe.id)
                }
              >
                Delete
              </Button>
            </div>
          )}
          <Button
            variant="secondary"
            className="flex h-9 items-center border border-ui-controls-border bg-ui-controls/60 px-3 text-sm text-base-fg hover:bg-ui-controls/90"
            onClick={() => editor && cancelTimeline(editor)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex h-9 items-center border-none bg-brand-primary px-3 text-sm text-white"
            onClick={() => editor && saveTimeline(editor)}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor;
