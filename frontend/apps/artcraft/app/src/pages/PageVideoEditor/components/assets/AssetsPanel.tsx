import { useCallback, useRef, useState } from "react";
import {
  faUpload,
  faFilm,
  faFont,
  faImage,
  faVolumeHigh,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import {
  getMediaDuration,
  createVideoThumbnail,
  createImageThumbnail,
} from "../../lib/media";
import {
  DEFAULT_TRANSFORM,
  DEFAULT_OPACITY,
  DEFAULT_VOLUME,
  DEFAULT_ELEMENT_DURATION,
} from "../../constants/timeline";
import type { CreateTimelineElement, MediaAsset } from "../../types";

type Tab = "media" | "text";

export function AssetsPanel() {
  const editor = useVideoEditor();
  const assets = editor.media.getAssets();
  const [activeTab, setActiveTab] = useState<Tab>("media");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);
        const duration = await getMediaDuration(file);
        let thumbnailUrl = "";
        let type: MediaAsset["type"] = "image";

        if (file.type.startsWith("video/")) {
          type = "video";
          thumbnailUrl = await createVideoThumbnail(file);
        } else if (file.type.startsWith("audio/")) {
          type = "audio";
        } else {
          type = "image";
          thumbnailUrl = await createImageThumbnail(file);
        }

        editor.media.addMediaAsset({
          asset: {
            name: file.name,
            type,
            file,
            url,
            thumbnailUrl,
            duration,
          },
        });
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor],
  );

  const handleAddToTimeline = useCallback(
    (asset: MediaAsset) => {
      const tracks = editor.timeline.getTracks();
      const playheadTime = editor.playback.getCurrentTime();

      let element: CreateTimelineElement;
      let targetTrackType: "video" | "audio" | "text";

      if (asset.type === "video") {
        element = {
          type: "video",
          name: asset.name,
          mediaId: asset.id,
          duration: asset.duration ?? DEFAULT_ELEMENT_DURATION,
          startTime: playheadTime,
          trimStart: 0,
          trimEnd: 0,
          transform: { ...DEFAULT_TRANSFORM },
          opacity: DEFAULT_OPACITY,
        };
        targetTrackType = "video";
      } else if (asset.type === "audio") {
        element = {
          type: "audio",
          name: asset.name,
          mediaId: asset.id,
          duration: asset.duration ?? DEFAULT_ELEMENT_DURATION,
          startTime: playheadTime,
          trimStart: 0,
          trimEnd: 0,
          volume: DEFAULT_VOLUME,
        };
        targetTrackType = "audio";
      } else {
        element = {
          type: "image",
          name: asset.name,
          mediaId: asset.id,
          duration: DEFAULT_ELEMENT_DURATION,
          startTime: playheadTime,
          trimStart: 0,
          trimEnd: 0,
          transform: { ...DEFAULT_TRANSFORM },
          opacity: DEFAULT_OPACITY,
        };
        targetTrackType = "video";
      }

      // Find matching track or create one
      let targetTrack = tracks.find((t) => t.type === targetTrackType);
      let trackId: string;

      if (targetTrack) {
        trackId = targetTrack.id;
      } else {
        trackId = editor.timeline.addTrack({ type: targetTrackType });
      }

      editor.timeline.insertElement({ trackId, element });
    },
    [editor],
  );

  const handleAddText = useCallback(() => {
    const tracks = editor.timeline.getTracks();
    const playheadTime = editor.playback.getCurrentTime();

    const element: CreateTimelineElement = {
      type: "text",
      name: "Text",
      content: "Your text here",
      duration: 3,
      startTime: playheadTime,
      trimStart: 0,
      trimEnd: 0,
      fontSize: 48,
      fontFamily: "sans-serif",
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "normal",
      fontStyle: "normal",
      transform: { ...DEFAULT_TRANSFORM },
      opacity: DEFAULT_OPACITY,
    };

    let textTrack = tracks.find((t) => t.type === "text");
    let trackId: string;

    if (textTrack) {
      trackId = textTrack.id;
    } else {
      trackId = editor.timeline.addTrack({ type: "text" });
    }

    editor.timeline.insertElement({ trackId, element });
  }, [editor]);

  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col border-r border-ui-panel-border bg-ui-panel">
      {/* Tabs */}
      <div className="flex border-b border-ui-panel-border">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === "media" ? "border-b-2 border-primary text-primary" : "text-base-fg/50 hover:text-base-fg/70"}`}
          onClick={() => setActiveTab("media")}
        >
          <FontAwesomeIcon icon={faFilm} className="mr-1.5" />
          Media
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === "text" ? "border-b-2 border-primary text-primary" : "text-base-fg/50 hover:text-base-fg/70"}`}
          onClick={() => setActiveTab("text")}
        >
          <FontAwesomeIcon icon={faFont} className="mr-1.5" />
          Text
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "media" && (
          <>
            <Button
              variant="secondary"
              className="mb-2 w-full"
              icon={faUpload}
              onClick={handleUpload}
            >
              Upload Media
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*,image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {assets.length === 0 ? (
              <div className="mt-8 text-center text-xs text-base-fg/30">
                No media imported yet.
                <br />
                Upload videos, images, or audio.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    className="group relative aspect-video overflow-hidden rounded border border-ui-panel-border/50 bg-ui-background transition-all hover:border-primary/50"
                    onClick={() => handleAddToTimeline(asset)}
                    title={`Add "${asset.name}" to timeline`}
                  >
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FontAwesomeIcon
                          icon={
                            asset.type === "audio" ? faVolumeHigh : faImage
                          }
                          className="text-lg text-base-fg/20"
                        />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 px-1 py-0.5">
                      <span className="block truncate text-[9px] text-white/80">
                        {asset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "text" && (
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              icon={faFont}
              onClick={handleAddText}
            >
              Add Text
            </Button>
            <div className="mt-2 text-center text-xs text-base-fg/30">
              Click to add a text element to the timeline.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
