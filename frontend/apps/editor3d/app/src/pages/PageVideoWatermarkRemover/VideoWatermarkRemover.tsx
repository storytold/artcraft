import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeHigh,
  faVolumeMute,
  faUpload,
  faImages,
  faStepBackward,
  faStepForward,
  faArrowRotateRight,
  faDroplet,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl } from "@storyteller/api";
import { TopBar } from "~/components";
import toast from "react-hot-toast";

export const VideoWatermarkRemover = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryVideos, setSelectedGalleryVideos] = useState<string[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFromGallery, setIsLoadingFromGallery] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentTime(0);
    };
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      if (videoUrl && videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }

      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleVideoSelect = (id: string) => {
    setSelectedGalleryVideos((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const maxSelections = 1;
      if (prev.length >= maxSelections) {
        return maxSelections === 1 ? [id] : prev;
      }
      return [...prev, id];
    });
  };

  const handleGallerySelect = async (selectedItems: GalleryItem[]) => {
    const item = selectedItems[0];
    if (!item || !item.fullImage) {
      toast.error("No video selected");
      return;
    }

    if (isLoadingFromGallery) {
      return;
    }

    setIsLoadingFromGallery(true);

    if (videoUrl && videoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVideoUrl(item.fullImage);

    setIsGalleryModalOpen(false);
    setSelectedGalleryVideos([]);
    setIsLoadingFromGallery(false);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.error("Play failed:", err);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    videoRef.current.currentTime = newTime;
  };

  const seekToFrame = (direction: "first" | "last") => {
    if (!videoRef.current || !duration) return;

    if (direction === "first") {
      videoRef.current.currentTime = 0;
    } else {
      videoRef.current.currentTime = duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRemoveWatermark = async () => {
    if (!videoRef.current || !videoUrl) {
      toast.error("Please select a video first");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing watermark removal...", {
      id: "watermark-removal",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Watermark removal completed!", {
        id: "watermark-removal",
      });
    } catch (error) {
      toast.error("Failed to remove watermark", { id: "watermark-removal" });
      console.error("Error removing watermark:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderUploadArea = () => (
    <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleFileSelect}
      />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-cyan-400/30 bg-cyan-500/40 shadow-xl backdrop-blur-sm">
            <FontAwesomeIcon
              icon={faDroplet}
              className="text-5xl text-white drop-shadow-lg"
            />
          </div>
        </div>
        <div className="space-y-3 text-center">
          <h3 className="text-4xl font-bold tracking-tight text-base-fg">
            Remove Video Watermark
          </h3>
          <p className="max-w-md text-base leading-relaxed text-base-fg/70">
            Clean up your videos by removing unwanted watermarks. Upload your
            video and let AI do the magic.
          </p>
        </div>
      </div>
      <div className="relative z-10 mt-4 flex gap-4">
        <Button
          variant="primary"
          icon={faUpload}
          onClick={handleUploadClick}
          className="px-8 py-3 text-base font-semibold shadow-lg"
        >
          Select Video
        </Button>
        <Button
          variant="action"
          icon={faImages}
          onClick={() => setIsGalleryModalOpen(true)}
          className="border-2 px-8 py-3 text-base font-semibold"
        >
          Pick from Library
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full overflow-hidden bg-ui-panel text-base-fg">
      <TopBar
        pageName="Video Watermark Remover"
        loginSignUpPressed={() => {}}
      />
      <div className="mt-[56px] h-[calc(100vh-56px)] w-full overflow-y-auto">
        <main
          className={
            !videoUrl
              ? "flex min-h-full w-full items-center justify-center p-8"
              : "flex w-full justify-center px-8 py-6"
          }
        >
          {!videoUrl ? (
            <div className="w-full max-w-5xl">
              <div className="aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
                {renderUploadArea()}
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-5xl flex-col gap-5">
              <div className="w-full overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
                <div className="relative aspect-video w-full bg-black">
                  <Button
                    icon={faArrowRotateRight}
                    variant="action"
                    onClick={() => {
                      setVideoUrl("");
                      setCurrentTime(0);
                    }}
                    className="absolute right-3 top-3 z-10 border-2 border-red/50 px-3 py-1.5 text-sm hover:border-red/80 hover:bg-red/80"
                  >
                    Switch Video
                  </Button>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="h-full w-full"
                    onClick={togglePlayPause}
                    preload="metadata"
                    playsInline
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <div
                      ref={progressBarRef}
                      className="group relative mb-3 h-3 cursor-pointer rounded-full bg-white/20"
                      onClick={handleProgressBarClick}
                    >
                      <div
                        className="absolute h-full overflow-hidden rounded-full bg-primary"
                        style={{
                          width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => seekToFrame("first")}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                          title="First Frame"
                        >
                          <FontAwesomeIcon
                            icon={faStepBackward}
                            className="text-sm text-white"
                          />
                        </button>
                        <button
                          onClick={togglePlayPause}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
                        >
                          <FontAwesomeIcon
                            icon={isPlaying ? faPause : faPlay}
                            className="text-white"
                          />
                        </button>
                        <button
                          onClick={() => seekToFrame("last")}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                          title="Last Frame"
                        >
                          <FontAwesomeIcon
                            icon={faStepForward}
                            className="text-sm text-white"
                          />
                        </button>
                        <div className="mx-1 h-6 w-px bg-white/20" />
                        <button
                          onClick={toggleMute}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                        >
                          <FontAwesomeIcon
                            icon={isMuted ? faVolumeMute : faVolumeHigh}
                            className="text-sm text-white"
                          />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) =>
                            setVolume(parseFloat(e.target.value))
                          }
                          className="w-20 accent-white"
                        />
                      </div>
                      <div className="font-mono text-sm text-white">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  icon={isProcessing ? undefined : faDroplet}
                  loading={isProcessing}
                  onClick={handleRemoveWatermark}
                  className="px-12 py-3 text-lg font-semibold"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Remove Watermark"}
                </Button>
              </div>

              <div className="rounded-2xl border border-ui-panel-border bg-ui-background p-6 shadow-lg">
                <div>
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-base-fg/60">
                    <FontAwesomeIcon icon={faVideo} className="text-primary" />
                    Video Information
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b border-ui-divider py-2">
                      <span className="font-medium text-base-fg/70">
                        Duration
                      </span>
                      <span className="font-mono text-lg font-bold text-base-fg">
                        {formatTime(duration)}
                      </span>
                    </div>
                    {videoRef.current && (
                      <div className="flex items-center justify-between py-2">
                        <span className="font-medium text-base-fg/70">
                          Resolution
                        </span>
                        <span className="font-mono font-bold text-base-fg">
                          {videoRef.current.videoWidth} ×{" "}
                          {videoRef.current.videoHeight}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={() => {
          if (!isLoadingFromGallery) {
            setIsGalleryModalOpen(false);
            setSelectedGalleryVideos([]);
          }
        }}
        mode="select"
        selectedItemIds={selectedGalleryVideos}
        onSelectItem={handleVideoSelect}
        maxSelections={1}
        onUseSelected={handleGallerySelect}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="video"
      />
    </div>
  );
};
