import { useRef, useState } from "react";
import { LoaderCircleIcon, PlusIcon, VideoIcon, XIcon } from "lucide-react";
import { UploaderStates } from "@storyteller/common";
import {
  uploadVideo,
  getVideoDuration,
} from "../../../components/prompt-box/upload-media";
import type { RefVideo } from "../../../components/prompt-box";

// A single optional reference video for splat generation (mobile form band;
// the desktop prompt box renders the same ref in its reference deck).

const SLOT_CLASS =
  "flex aspect-square w-14 items-center justify-center overflow-hidden border border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10";

export function ReferenceVideoSlot({
  video,
  onChange,
}: {
  video?: RefVideo;
  onChange: (video?: RefVideo) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    const duration = await getVideoDuration(file);
    await uploadVideo({
      title: "splat_reference",
      assetFile: file,
      progressCallback: (state) => {
        if (state.status === UploaderStates.success && state.data) {
          onChange({
            id: Math.random().toString(36).substring(7),
            url: previewUrl,
            file,
            mediaToken: state.data,
            duration,
          });
          setUploading(false);
        } else if (
          state.status === UploaderStates.assetError ||
          state.status === UploaderStates.imageCreateError
        ) {
          URL.revokeObjectURL(previewUrl);
          setUploading(false);
        }
      },
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    if (video?.url.startsWith("blob:")) URL.revokeObjectURL(video.url);
    onChange(undefined);
  };

  return (
    // Title on the left, upload slot right-aligned + top-aligned (matches
    // ImagePromptRow).
    <div className="glass flex items-start gap-3 px-3 py-2">
      <div className="flex grow flex-col gap-1 min-w-32">
        <div className="flex items-center gap-2 text-white/90">
          <VideoIcon  className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em]">Reference video</span>
        </div>
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
        <div className="group relative aspect-square w-14 overflow-hidden border border-white/30">
          <video
            src={video.url}
            muted
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center bg-black/50 text-white transition-colors hover:bg-black"
          >
            <XIcon  className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className={SLOT_CLASS}>
          <LoaderCircleIcon className="h-5 w-5 animate-spin text-white" />
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className={SLOT_CLASS}>
          <PlusIcon  className="text-xl text-white/80" />
        </button>
      )}
    </div>
  );
}
