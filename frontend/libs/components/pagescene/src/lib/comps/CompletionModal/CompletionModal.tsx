import { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faCloudArrowUp,
  faPenToSquare,
  faWandMagicSparkles,
  faFilm,
  faCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { EngineContext } from "../../contexts/EngineContext";
import { usePageSceneStore } from "../../PageSceneStore";

// Preview hub shown after Capture/Record. Previews the still (image) or plays
// the clip (video), then routes it: Delete (discard), Upload (persist to
// library), or Edit (hand off to 2D / video to prompt + generate). The
// artifact is cached locally (object URL) — Edit keeps it alive for the
// destination; only Delete revokes it.
export const CompletionModal = () => {
  const editor = useContext(EngineContext);
  const artifact = usePageSceneStore((s) => s.producedArtifact);
  const setProducedArtifact = usePageSceneStore((s) => s.setProducedArtifact);
  const clearProducedArtifact = usePageSceneStore(
    (s) => s.clearProducedArtifact,
  );
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  if (!artifact) return null;

  const isVideo = artifact.kind === "video";

  const handleDelete = () => {
    clearProducedArtifact(); // revokes the object URL
  };

  // Detach from the store WITHOUT revoking — the destination editor keeps
  // using the object URL / blob.
  const handoffAndClose = (invoke: () => void) => {
    invoke();
    setProducedArtifact(null);
  };

  const handleUpload = async () => {
    if (!editor?.adapter.uploadMedia || uploading) return;
    setUploading(true);
    try {
      await editor.adapter.uploadMedia({
        kind: artifact.kind,
        blob: artifact.blob,
        fileName: artifact.fileName,
      });
      setUploaded(true);
    } catch {
      // Upload failed (e.g. offline / no backend). Leave un-uploaded so the
      // user can retry; don't throw an unhandled rejection.
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="glass glass-no-hover flex w-full max-w-xl flex-col gap-4 rounded-2xl p-5 text-white shadow-2xl">
        <div className="text-sm font-semibold text-base-fg/90">
          {isVideo ? "Recording complete" : "Capture complete"}
        </div>

        {/* preview */}
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

        {/* actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-sm text-base-fg/60 transition-colors hover:bg-white/10 hover:text-base-fg"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || uploaded}
              className="flex h-9 items-center gap-2 rounded-full border border-ui-controls-border bg-ui-controls/60 px-4 text-sm text-base-fg backdrop-blur-lg transition-colors hover:bg-ui-controls/90 disabled:opacity-60"
            >
              <FontAwesomeIcon
                icon={uploaded ? faCheck : faCloudArrowUp}
                className="h-3.5 w-3.5"
              />
              {uploaded ? "Saved" : uploading ? "Saving…" : "Upload"}
            </button>

            {isVideo ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handoffAndClose(() =>
                      editor?.adapter.openVideoInEditor?.(artifact, "edit"),
                    )
                  }
                  className="flex h-9 items-center gap-2 rounded-full border border-ui-controls-border bg-ui-controls/60 px-4 text-sm text-base-fg transition-colors hover:bg-ui-controls/90"
                >
                  <FontAwesomeIcon icon={faFilm} className="h-3.5 w-3.5" />
                  Video editor
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handoffAndClose(() =>
                      editor?.adapter.openVideoInEditor?.(artifact, "generate"),
                    )
                  }
                  className="flex h-9 items-center gap-2 rounded-full bg-brand-primary px-4 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
                >
                  <FontAwesomeIcon
                    icon={faWandMagicSparkles}
                    className="h-3.5 w-3.5"
                  />
                  Prompt to video
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  handoffAndClose(() =>
                    editor?.adapter.openImageInEditor?.(artifact),
                  )
                }
                className="flex h-9 items-center gap-2 rounded-full bg-brand-primary px-4 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
                Edit in 2D
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
