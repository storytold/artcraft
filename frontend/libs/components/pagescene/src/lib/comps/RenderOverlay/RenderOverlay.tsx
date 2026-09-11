import { LoadingDots } from "@storyteller/ui-loading";
import { usePageSceneStore } from "../../PageSceneStore";

// Opaque full-viewport cover shown while a Capture/Record is in flight. It
// hides the 3D scene (freeing GPU during frame encoding) and shows progress.
// Video encodes are abortable: the Cancel button (and the Escape keybind)
// flip the store's encodeCancelSignal, which recordTimeline polls per frame.
export const RenderOverlay = () => {
  const progress = usePageSceneStore((s) => s.recordingProgress);
  const cancellable = usePageSceneStore((s) => s.encodeCancelSignal !== null);
  const requestEncodeCancel = usePageSceneStore((s) => s.requestEncodeCancel);

  const pct = Math.round((progress?.pct ?? 0) * 100);
  const message =
    progress?.phase === "encoding"
      ? `Rendering video… ${pct}%`
      : progress?.phase === "uploading"
        ? "Uploading to gallery…"
        : "Capturing frame…";

  return (
    <>
      <LoadingDots
        className="absolute left-0 top-0 z-[60]"
        isShowing={progress !== null}
        type="bricks"
        message={message}
      />
      {progress?.phase === "encoding" && cancellable && (
        <div className="absolute bottom-10 left-1/2 z-[61] -translate-x-1/2">
          <button
            type="button"
            onClick={requestEncodeCancel}
            className="glass glass-no-hover rounded-full px-5 py-2 text-sm font-medium text-base-fg shadow-xl hover:bg-white/10"
          >
            Cancel (Esc)
          </button>
        </div>
      )}
    </>
  );
};

export default RenderOverlay;
