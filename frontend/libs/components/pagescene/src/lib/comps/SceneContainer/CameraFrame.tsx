import { useContext, useEffect, useMemo, useState } from "react";
import { usePageSceneStore } from "../../PageSceneStore";
import { EngineContext } from "../../contexts/EngineContext";
import { CameraAspectRatio } from "../../enums";

// Camera-view framing overlay: an inset, aspect-correct frame showing the
// EXACT render framing (the engine offsets the viewport projection into this
// rect via CameraController.setCameraFrameRect), with the surrounding scene
// dimmed, rule-of-thirds guides, and the focal-length label. The frame is
// fitted into the area left free by the surrounding chrome so the bottom
// timeline/record controls never cover the shot.

// Reserved chrome, in px. Vertical insets differ per mode:
// build/camera-view has the mode pill + transform toolbar up top and the
// collapsed timeline bar + exit-view button at the bottom; record mode has
// only the pill up top but the playback bar + capture/record cluster below.
const TOP_INSET_BUILD = 124;
const TOP_INSET_RECORD = 76;
const BOTTOM_INSET_BUILD = 88;
// Fallback while the expanded editor hasn't been measured yet.
const BOTTOM_INSET_BUILD_TIMELINE_EXPANDED = 240;
const BOTTOM_INSET_RECORD = 152;
// The expanded timeline editor sits at bottom-4 (16px); keep a little air
// between it and the frame.
const TIMELINE_EDITOR_CLEARANCE = 28;
const SIDE_INSET = 24;
// Below this the insets don't fit; fall back to a slim uniform margin so
// tiny windows still get a usable frame.
const MIN_FRAME_EDGE = 120;
const FALLBACK_MARGIN = 16;

const RATIO_VALUE: Record<CameraAspectRatio, number> = {
  [CameraAspectRatio.HORIZONTAL_16_9]: 16 / 9,
  [CameraAspectRatio.HORIZONTAL_3_2]: 3 / 2,
  [CameraAspectRatio.SQUARE_1_1]: 1,
  [CameraAspectRatio.VERTICAL_2_3]: 2 / 3,
  [CameraAspectRatio.VERTICAL_9_16]: 9 / 16,
};

type FrameRect = { x: number; y: number; width: number; height: number };

const fitFrame = (
  width: number,
  height: number,
  ratio: number,
  top: number,
  bottom: number,
): FrameRect => {
  let safeWidth = width - SIDE_INSET * 2;
  let safeHeight = height - top - bottom;
  let safeTop = top;
  if (safeWidth < MIN_FRAME_EDGE || safeHeight < MIN_FRAME_EDGE) {
    safeWidth = width - FALLBACK_MARGIN * 2;
    safeHeight = height - FALLBACK_MARGIN * 2;
    safeTop = FALLBACK_MARGIN;
  }
  const frameWidth = Math.min(safeWidth, safeHeight * ratio);
  const frameHeight = frameWidth / ratio;
  return {
    x: (width - frameWidth) / 2,
    y: safeTop + (safeHeight - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  };
};

export const CameraFrame = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  const editor = useContext(EngineContext);
  const camAspect = usePageSceneStore((s) => s.cameraAspectRatio);
  const sceneMode = usePageSceneStore((s) => s.sceneMode);
  const timelineExpanded = usePageSceneStore((s) => s.timelineExpanded);
  const cameras = usePageSceneStore((s) => s.cameras);
  const selectedCameraId = usePageSceneStore((s) => s.selectedCameraId);

  const isRecord = sceneMode === "record";

  // The expanded timeline editor's height depends on its track count, so
  // measure it live instead of guessing a fixed inset.
  const [editorPanelHeight, setEditorPanelHeight] = useState(0);
  useEffect(() => {
    if (isRecord || !timelineExpanded) return undefined;
    const el = document.getElementById("timeline-editor");
    if (!el) return undefined;
    setEditorPanelHeight(el.offsetHeight);
    const observer = new ResizeObserver(() =>
      setEditorPanelHeight(el.offsetHeight),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isRecord, timelineExpanded]);

  const frame = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const top = isRecord ? TOP_INSET_RECORD : TOP_INSET_BUILD;
    const bottom = isRecord
      ? BOTTOM_INSET_RECORD
      : timelineExpanded
        ? editorPanelHeight > 0
          ? editorPanelHeight + TIMELINE_EDITOR_CLEARANCE
          : BOTTOM_INSET_BUILD_TIMELINE_EXPANDED
        : BOTTOM_INSET_BUILD;
    return fitFrame(width, height, RATIO_VALUE[camAspect], top, bottom);
  }, [width, height, camAspect, isRecord, timelineExpanded, editorPanelHeight]);

  // Hand the rect to the engine so the viewport projection maps the exact
  // render framing into it; clear on unmount (leaving camera view/record).
  useEffect(() => {
    if (!editor || !frame) return;
    editor.cameraController.setCameraFrameRect({
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      canvasWidth: width,
      canvasHeight: height,
    });
  }, [editor, frame, width, height]);
  useEffect(() => {
    return () => editor?.cameraController.setCameraFrameRect(null);
  }, [editor]);

  if (!frame) return null;

  const focalLength = cameras.find((c) => c.id === selectedCameraId)
    ?.focalLength;
  const right = frame.x + frame.width;
  const bottomEdge = frame.y + frame.height;

  return (
    <div
      id="letterbox"
      className="pointer-events-none absolute inset-0 select-none"
    >
      {/* Dim everything outside the frame (still visible, won't render). */}
      <div
        className="absolute left-0 right-0 top-0 bg-black/60"
        style={{ height: frame.y }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-black/60"
        style={{ height: height - bottomEdge }}
      />
      <div
        className="absolute left-0 bg-black/60"
        style={{ top: frame.y, height: frame.height, width: frame.x }}
      />
      <div
        className="absolute right-0 bg-black/60"
        style={{ top: frame.y, height: frame.height, width: width - right }}
      />

      {/* The frame itself: border, rule-of-thirds guides, focal label. */}
      <div
        className="absolute border border-white/40"
        style={{
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
        }}
      >
        <div className="absolute bottom-0 left-1/3 top-0 w-px bg-white/15" />
        <div className="absolute bottom-0 left-2/3 top-0 w-px bg-white/15" />
        <div className="absolute left-0 right-0 top-1/3 h-px bg-white/15" />
        <div className="absolute left-0 right-0 top-2/3 h-px bg-white/15" />
        {focalLength !== undefined && (
          <div className="absolute left-3 top-2 text-sm font-medium text-white/80">
            {focalLength}mm
          </div>
        )}
      </div>
    </div>
  );
};
