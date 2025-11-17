import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faVolumeHigh,
  faVolumeMute,
  faPhotoFilm,
  faSparkles,
  faUpload,
  faImages,
  faStepBackward,
  faStepForward,
  faArrowRotateRight,
  faSave,
  faVideo,
  faCheck,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import {
  downloadFileFromUrl,
  MediaUploadApi,
  EIntermediateFile,
} from "@storyteller/api";
import { TopBar } from "~/components";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { usePromptVideoStore, RefImage } from "@storyteller/ui-promptbox";
import { useTabStore } from "~/pages/Stores/TabState";

export const VideoFrameExtractor = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [numFrames, setNumFrames] = useState(10);
  const [frameDistance, setFrameDistance] = useState(100);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryVideos, setSelectedGalleryVideos] = useState<string[]>(
    [],
  );
  const [extractedFrames, setExtractedFrames] = useState<
    { id: string; url: string; timestamp: number }[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [savingFrames, setSavingFrames] = useState<Set<string>>(new Set());
  const [savedFrames, setSavedFrames] = useState<Set<string>>(new Set());
  const [convertingFrames, setConvertingFrames] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingFromGallery, setIsLoadingFromGallery] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const extractedFramesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (!video.paused) {
        setStartTime(video.currentTime);
      }
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
      setStartTime(0);
      setDuration(0);
      setExtractedFrames([]);
      setSavingFrames(new Set());
      setSavedFrames(new Set());
      setConvertingFrames(new Set());

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
    setStartTime(0);
    setDuration(0);
    setExtractedFrames([]);
    setSavingFrames(new Set());
    setSavedFrames(new Set());
    setConvertingFrames(new Set());
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
    setStartTime(newTime);
  };

  const seekToFrame = (direction: "first" | "last") => {
    if (!videoRef.current || !duration) return;

    if (direction === "first") {
      videoRef.current.currentTime = 0;
      setStartTime(0);
    } else {
      videoRef.current.currentTime = duration;
      setStartTime(duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimePrecise = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
  };

  const handleExtract = async () => {
    if (!videoRef.current) return;

    setIsExtracting(true);
    setExtractedFrames([]);
    setSavingFrames(new Set());
    setSavedFrames(new Set());
    setConvertingFrames(new Set());

    const video = videoRef.current;

    // Ensure video metadata is loaded before extraction
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video failed to load metadata"));
        }, 5000);

        const handleLoadedData = () => {
          clearTimeout(timeout);
          video.removeEventListener("loadeddata", handleLoadedData);
          resolve();
        };

        video.addEventListener("loadeddata", handleLoadedData);
      }).catch((error) => {
        console.error("Video loading error:", error);
        setIsExtracting(false);
        return;
      });
    }

    const originalTime = video.currentTime;
    const wasPlaying = !video.paused;

    if (wasPlaying) {
      video.pause();
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExtracting(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const frames: { id: string; url: string; timestamp: number }[] = [];
    let corsError = false;

    for (let i = 0; i < numFrames; i++) {
      const timestamp = startTime + (i * frameDistance) / 1000;

      if (timestamp > duration) break;

      video.currentTime = timestamp;

      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/png");

            frames.push({
              id: `frame-${i + 1}`,
              url: dataUrl,
              timestamp,
            });
          } catch (error) {
            console.error("Error extracting frame:", error);
            if (error instanceof Error && error.name === "SecurityError") {
              corsError = true;
            }
          }

          video.removeEventListener("seeked", handleSeeked);
          resolve();
        };

        video.addEventListener("seeked", handleSeeked, { once: true });
      });

      if (corsError) break;
    }

    video.currentTime = originalTime;

    await new Promise<void>((resolve) => {
      const handleRestored = () => {
        video.removeEventListener("seeked", handleRestored);
        resolve();
      };
      video.addEventListener("seeked", handleRestored, { once: true });
    });

    if (wasPlaying) {
      video.play();
    }

    if (corsError) {
      toast.error(
        "CORS error: Cannot extract frames from this video. Try uploading the video file directly instead.",
      );
      setIsExtracting(false);
      return;
    }

    if (frames.length === 0) {
      toast.error("Failed to extract any frames");
      setIsExtracting(false);
      return;
    }

    setExtractedFrames(frames);
    setIsExtracting(false);

    setTimeout(() => {
      extractedFramesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleSaveFrame = async (
    frameId: string,
    frameUrl: string,
    timestamp: number,
  ) => {
    if (savedFrames.has(frameId) || savingFrames.has(frameId)) {
      return;
    }

    setSavingFrames((prev) => new Set(prev).add(frameId));

    try {
      const response = await fetch(frameUrl);
      const blob = await response.blob();
      const fileName = `frame-${formatTimePrecise(timestamp)}.png`;

      const mediaUploadApi = new MediaUploadApi();
      const uploadResponse = await mediaUploadApi.UploadImage({
        uuid: uuidv4(),
        blob: blob,
        fileName: fileName,
        maybe_title: `video-frame-${timestamp}`,
        is_intermediate_system_file: EIntermediateFile.false,
      });

      if (uploadResponse.success) {
        setSavedFrames((prev) => new Set(prev).add(frameId));
        setSavingFrames((prev) => {
          const next = new Set(prev);
          next.delete(frameId);
          return next;
        });
        toast.success("Frame saved to library!");
      } else {
        setSavingFrames((prev) => {
          const next = new Set(prev);
          next.delete(frameId);
          return next;
        });
        toast.error(uploadResponse.errorMessage || "Failed to save frame");
      }
    } catch (error) {
      setSavingFrames((prev) => {
        const next = new Set(prev);
        next.delete(frameId);
        return next;
      });
      toast.error("Failed to save frame");
      console.error("Error saving frame:", error);
    }
  };

  const handleTurnIntoVideo = async (
    frameId: string,
    frameUrl: string,
    timestamp: number,
  ) => {
    if (convertingFrames.has(frameId)) {
      return;
    }

    setConvertingFrames((prev) => new Set(prev).add(frameId));

    try {
      const response = await fetch(frameUrl);
      const blob = await response.blob();
      const fileName = `frame-${formatTimePrecise(timestamp)}.png`;

      const mediaUploadApi = new MediaUploadApi();
      const uploadResponse = await mediaUploadApi.UploadImage({
        uuid: uuidv4(),
        blob: blob,
        fileName: fileName,
        maybe_title: `video-frame-${timestamp}`,
        is_intermediate_system_file: EIntermediateFile.true,
      });

      if (uploadResponse.success && uploadResponse.data) {
        const file = new File([blob], fileName, { type: "image/png" });

        const referenceImage: RefImage = {
          id: Math.random().toString(36).substring(7),
          url: frameUrl,
          file: file,
          mediaToken: uploadResponse.data,
        };

        usePromptVideoStore.getState().setReferenceImages([referenceImage]);
        useTabStore.getState().setActiveTab("VIDEO");

        setConvertingFrames((prev) => {
          const next = new Set(prev);
          next.delete(frameId);
          return next;
        });
      } else {
        setConvertingFrames((prev) => {
          const next = new Set(prev);
          next.delete(frameId);
          return next;
        });
        toast.error(
          uploadResponse.errorMessage || "Failed to convert to video",
        );
      }
    } catch (error) {
      setConvertingFrames((prev) => {
        const next = new Set(prev);
        next.delete(frameId);
        return next;
      });
      toast.error("Failed to convert frame to video");
      console.error("Error converting frame:", error);
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
          <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-rose-400/30 bg-rose-500/40 shadow-xl backdrop-blur-sm">
            <FontAwesomeIcon
              icon={faPhotoFilm}
              className="text-5xl text-white drop-shadow-lg"
            />
          </div>
        </div>
        <div className="space-y-3 text-center">
          <h3 className="text-4xl font-bold tracking-tight text-base-fg">
            Extract Video Frames
          </h3>
          <p className="max-w-md text-base leading-relaxed text-base-fg/70">
            Capture perfect moments from your videos. Select frames at precise
            timestamps and save them as images.
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
      <TopBar pageName="Video Frame Extractor" loginSignUpPressed={() => {}} />
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
              <div className="w-full overflow-hidden rounded-xl border border-ui-panel-border bg-ui-controls/40">
                <div className="relative aspect-video w-full bg-black">
                  <Button
                    icon={faArrowRotateRight}
                    variant="action"
                    onClick={() => {
                      setVideoUrl("");
                      setStartTime(0);
                      setCurrentTime(0);
                      setExtractedFrames([]);
                      setSavingFrames(new Set());
                      setSavedFrames(new Set());
                      setConvertingFrames(new Set());
                    }}
                    className="absolute right-3 top-3 z-10 border-2 border-red/50 px-3 py-1.5 text-sm hover:border-red/80 hover:bg-red/80"
                  >
                    Switch Video
                  </Button>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="h-full w-full bg-black"
                    onClick={togglePlayPause}
                    preload="metadata"
                    playsInline
                    crossOrigin="anonymous"
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
                      <div
                        className="absolute top-1/2 h-6 w-1.5 -translate-y-1/2 cursor-ew-resize rounded-full bg-yellow-400 shadow-lg"
                        style={{
                          left: `${duration ? (startTime / duration) * 100 : 0}%`,
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            if (!progressBarRef.current || !duration) return;
                            const rect =
                              progressBarRef.current.getBoundingClientRect();
                            const moveX = moveEvent.clientX - rect.left;
                            const percentage = Math.max(
                              0,
                              Math.min(1, moveX / rect.width),
                            );
                            const newTime = percentage * duration;
                            setStartTime(newTime);
                            if (videoRef.current) {
                              videoRef.current.currentTime = newTime;
                              setCurrentTime(newTime);
                            }
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener(
                              "mousemove",
                              handleMouseMove,
                            );
                            document.removeEventListener(
                              "mouseup",
                              handleMouseUp,
                            );
                          };
                          document.addEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.addEventListener("mouseup", handleMouseUp);
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
                  icon={isExtracting ? undefined : faSparkles}
                  loading={isExtracting}
                  onClick={handleExtract}
                  className="px-12 py-3 text-lg font-semibold"
                  disabled={isExtracting}
                >
                  {isExtracting ? "Extracting..." : "Extract Frames"}
                </Button>
              </div>

              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-5">
                  <div className="group rounded-2xl border border-ui-panel-border bg-ui-background p-6 shadow-lg">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-base-fg/60">
                        Start Time
                      </div>
                      <div className="font-mono text-3xl font-bold text-primary drop-shadow-sm">
                        {formatTimePrecise(startTime)}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-base-fg/60">
                        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
                        <span>Adjust via the yellow marker on the video</span>
                      </div>
                    </div>
                  </div>

                  <div className="group rounded-2xl border border-ui-panel-border bg-ui-background p-6 shadow-lg">
                    <div>
                      <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-base-fg/60">
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

                <div className="rounded-2xl border border-ui-panel-border bg-ui-background p-6 shadow-lg">
                  <div>
                    <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-base-fg/60">
                      <FontAwesomeIcon
                        icon={faSparkles}
                        className="text-primary"
                      />
                      Extraction Settings
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="numFrames"
                          className="mb-2.5 block text-sm font-semibold text-base-fg"
                        >
                          Number of Frames
                        </label>
                        <input
                          id="numFrames"
                          type="number"
                          min="1"
                          max="50"
                          value={numFrames}
                          onChange={(e) =>
                            setNumFrames(
                              Math.max(
                                1,
                                Math.min(50, parseInt(e.target.value) || 1),
                              ),
                            )
                          }
                          className="border-ui-controls-border w-full rounded-xl border-2 bg-ui-controls px-4 py-3.5 text-base-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="frameDistance"
                          className="mb-2.5 block text-sm font-semibold text-base-fg"
                        >
                          Distance (ms)
                        </label>
                        <input
                          id="frameDistance"
                          type="number"
                          min="1"
                          max="10000"
                          value={frameDistance}
                          onChange={(e) =>
                            setFrameDistance(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="border-ui-controls-border w-full rounded-xl border-2 bg-ui-controls px-4 py-3.5 text-base-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="text-xs leading-relaxed text-base-fg/80">
                        Extracting multiple frames helps capture a sharp,
                        non-blurred frame.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {extractedFrames.length > 0 && (
                <div
                  ref={extractedFramesRef}
                  className="rounded-2xl border border-ui-panel-border bg-ui-controls p-6 shadow-lg"
                >
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-base-fg">
                        <FontAwesomeIcon
                          icon={faPhotoFilm}
                          className="text-primary"
                        />
                        Extracted Frames
                      </h3>
                      <div className="bg-ui-badge rounded-full border-2 border-primary/30 px-5 py-2 text-sm font-bold text-base-fg shadow-lg">
                        {extractedFrames.length}{" "}
                        {extractedFrames.length === 1 ? "Frame" : "Frames"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      {extractedFrames.map((frame, index) => (
                        <div
                          key={frame.id}
                          className="group relative overflow-hidden rounded-xl border-2 border-ui-panel-border bg-ui-controls"
                        >
                          <div className="aspect-video overflow-hidden bg-black">
                            <img
                              src={frame.url}
                              alt={`Frame ${index + 1}`}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="space-y-2 bg-ui-background p-3">
                            <div className="flex items-center justify-between">
                              <span className="bg-ui-badge rounded border border-ui-panel-border px-2 py-1 text-xs font-bold text-base-fg">
                                #{index + 1}
                              </span>
                              <div className="font-mono text-xs font-semibold text-base-fg/70">
                                {formatTimePrecise(frame.timestamp)}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="action"
                                icon={
                                  savingFrames.has(frame.id)
                                    ? undefined
                                    : savedFrames.has(frame.id)
                                      ? faCheck
                                      : faSave
                                }
                                loading={savingFrames.has(frame.id)}
                                onClick={() =>
                                  handleSaveFrame(
                                    frame.id,
                                    frame.url,
                                    frame.timestamp,
                                  )
                                }
                                disabled={
                                  savingFrames.has(frame.id) ||
                                  savedFrames.has(frame.id)
                                }
                                className="flex-1 px-3 py-1.5 text-xs font-semibold"
                              >
                                {savingFrames.has(frame.id)
                                  ? "Saving..."
                                  : savedFrames.has(frame.id)
                                    ? "Saved"
                                    : "Save"}
                              </Button>
                              <Button
                                variant="primary"
                                icon={
                                  convertingFrames.has(frame.id)
                                    ? undefined
                                    : faVideo
                                }
                                loading={convertingFrames.has(frame.id)}
                                onClick={() =>
                                  handleTurnIntoVideo(
                                    frame.id,
                                    frame.url,
                                    frame.timestamp,
                                  )
                                }
                                disabled={convertingFrames.has(frame.id)}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold"
                              >
                                Turn into Video
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
