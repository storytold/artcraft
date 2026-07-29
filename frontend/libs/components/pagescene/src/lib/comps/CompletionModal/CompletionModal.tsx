import { useContext, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faCloudArrowUp,
  faSpinnerThird,
  faTriangleExclamation,
  faRotateRight,
} from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";

// Output modal shown immediately after Capture/Record — it previews the local
// artifact (object URL, works offline), then uploads to the gallery and shows
// status. On success it opens the app Lightbox (all destinations) on the
// uploaded token; on failure it stays put with a Retry. Images auto-upload;
// videos wait for a manual Upload (they're large).
type UploadStatus = "idle" | "uploading" | "error";

export const CompletionModal = () => {
  const editor = useContext(EngineContext);
  const artifact = usePageSceneStore((s) => s.producedArtifact);
  const clearProducedArtifact = usePageSceneStore(
    (s) => s.clearProducedArtifact,
  );
  const [status, setStatus] = useState<UploadStatus>("idle");
  const autoStartedRef = useRef(false);

  const isVideo = artifact?.kind === "video";

  const upload = async () => {
    if (!editor?.adapter.uploadMedia || !artifact) return;
    setStatus("uploading");
    try {
      const token = await editor.adapter.uploadMedia({
        kind: artifact.kind,
        blob: artifact.blob,
        fileName: artifact.fileName,
      });
      // Hand off to the app Lightbox (destinations for this kind). It shows via
      // the uploaded CDN URL, so revoking the local object URL now is safe.
      editor.adapter.openMediaLightbox?.(token, artifact.kind);
      clearProducedArtifact();
    } catch {
      setStatus("error");
    }
  };

  // Images auto-upload as soon as the modal appears; reset when it closes.
  useEffect(() => {
    if (artifact?.kind === "image" && !autoStartedRef.current) {
      autoStartedRef.current = true;
      void upload();
    }
    if (!artifact) {
      autoStartedRef.current = false;
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact]);

  if (!artifact) return null;

  const busy = status === "uploading";

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="glass glass-no-hover flex w-full max-w-xl flex-col gap-4 rounded-2xl p-5 text-white shadow-2xl">
        <div className="text-sm font-semibold text-base-fg/90">
          {isVideo ? "Recording complete" : "Capture complete"}
        </div>

        <div className="flex max-h-[52vh] items-center justify-center overflow-hidden rounded-xl bg-black/30">
          {isVideo ? (
            <video
              src={artifact.objectUrl}
              controls
              autoPlay
              loop
              className="max-h-[52vh] w-full object-contain"
            />
          ) : (
            <img
              src={artifact.objectUrl}
              alt="Captured frame"
              className="max-h-[52vh] w-full object-contain"
            />
          )}
        </div>

        {/* upload status */}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-base-fg/70">
            <FontAwesomeIcon
              icon={faSpinnerThird}
              className="h-4 w-4 animate-spin"
            />
            Uploading to gallery…
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-red">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="h-4 w-4"
            />
            Upload failed — check your connection and retry.
          </div>
        )}

        {/* actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => clearProducedArtifact()}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-sm text-base-fg/60 transition-colors hover:bg-white/10 hover:text-base-fg disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
            Discard
          </button>

          {status === "error" ? (
            <button
              type="button"
              onClick={() => void upload()}
              className="flex h-9 items-center gap-2 rounded-full bg-brand-primary px-4 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              <FontAwesomeIcon icon={faRotateRight} className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : isVideo && status === "idle" ? (
            <button
              type="button"
              onClick={() => void upload()}
              className="flex h-9 items-center gap-2 rounded-full bg-brand-primary px-4 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
            >
              <FontAwesomeIcon icon={faCloudArrowUp} className="h-3.5 w-3.5" />
              Upload &amp; continue
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
