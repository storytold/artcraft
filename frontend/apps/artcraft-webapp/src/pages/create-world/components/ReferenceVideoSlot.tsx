import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinnerThird, faXmark } from "@fortawesome/pro-solid-svg-icons";
import { MediaUploadApi, EIntermediateFile } from "@storyteller/api";
import type { RefVideoAsset } from "../create-world-store";

// A single optional reference video for splat generation. Uploads via the
// generic new-video endpoint and stores the returned media token.

const SLOT_CLASS =
  "flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10";

export function ReferenceVideoSlot({
  video,
  onChange,
}: {
  video?: RefVideoAsset;
  onChange: (video?: RefVideoAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    try {
      const api = new MediaUploadApi();
      const response = await api.UploadNewVideo({
        blob: file,
        fileName: file.name || `reference-video-${Date.now()}`,
        uuid: crypto.randomUUID(),
        maybe_title: "splat_reference_video",
        is_intermediate_system_file: EIntermediateFile.false,
      });
      if (response?.success && response.data) {
        onChange({
          id: Math.random().toString(36).substring(7),
          previewUrl,
          mediaToken: response.data,
        });
      } else {
        URL.revokeObjectURL(previewUrl);
      }
    } catch {
      URL.revokeObjectURL(previewUrl);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
    onChange(undefined);
  };

  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white/90">Reference video</span>
        <span className="text-[13px] text-white/60">Guide the world (optional)</span>
      </div>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="video/*"
        onChange={handleUpload}
      />
      {video ? (
        <div className="group relative aspect-square w-14 overflow-hidden rounded-lg border-2 border-white/30">
          <video
            src={video.previewUrl}
            muted
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black"
          >
            <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className={SLOT_CLASS}>
          <FontAwesomeIcon icon={faSpinnerThird} spin className="h-5 w-5 text-white" />
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className={SLOT_CLASS}>
          <FontAwesomeIcon icon={faPlus} className="text-xl text-white/80" />
        </button>
      )}
    </div>
  );
}
