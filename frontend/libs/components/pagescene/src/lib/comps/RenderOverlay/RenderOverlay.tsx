import { LoadingDots } from "@storyteller/ui-loading";
import { usePageSceneStore } from "../../PageSceneStore";

// Opaque full-viewport cover shown while a Capture/Record is in flight. It
// hides the 3D scene (freeing GPU during frame encoding) and shows progress.
export const RenderOverlay = () => {
  const progress = usePageSceneStore((s) => s.recordingProgress);

  const pct = Math.round((progress?.pct ?? 0) * 100);
  const message =
    progress?.phase === "encoding"
      ? `Rendering video… ${pct}%`
      : progress?.phase === "uploading"
        ? "Uploading to gallery…"
        : "Capturing frame…";

  return (
    <LoadingDots
      className="absolute left-0 top-0 z-[60]"
      isShowing={progress !== null}
      type="bricks"
      message={message}
    />
  );
};

export default RenderOverlay;
