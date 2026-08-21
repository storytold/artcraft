import { useRef, useState } from "react";
import { FilmIcon, ImagesIcon, UploadIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";

// Stand-in for the video player while no video is loaded: same card footprint
// as the scrubber, accepts click-to-browse, library pick, and drag & drop.
interface VideoDropZoneProps {
  onFilesSelected: (files: FileList) => void;
  onPickFromLibrary: () => void;
}

export const VideoDropZone = ({
  onFilesSelected,
  onPickFromLibrary,
}: VideoDropZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    onFilesSelected(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-ui-panel-border bg-ui-panel p-3">
      <div
        className={twMerge(
          "flex aspect-video flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-ui-border bg-ui-background/40 p-6 text-center transition-colors",
          isDragActive && "border-primary/60 bg-primary/5",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          handleFiles(e.dataTransfer?.files);
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="video/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <FilmIcon  className="text-2xl text-base-fg/25" />
        <div className="text-sm text-base-fg/55">
          Drag &amp; drop a video, or
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="primary"
            icon={UploadIcon}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-1.5 text-sm font-medium"
          >
            Select video
          </Button>
          <Button
            variant="action"
            icon={ImagesIcon}
            onClick={onPickFromLibrary}
            className="px-4 py-1.5 text-sm font-medium"
          >
            From library
          </Button>
        </div>
      </div>
    </div>
  );
};
