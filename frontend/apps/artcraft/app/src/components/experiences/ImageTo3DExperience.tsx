import { useEffect, useMemo, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { Button, GenerateButton } from "@storyteller/ui-button";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faImages,
  faPlus,
  faUpload,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useImageTo3DStore } from "../../pages/PageImageTo3DObject/ImageTo3DStore";
import { useImageTo3DWorldStore } from "../../pages/PageImageTo3DWorld/ImageTo3DWorldStore";
import { MediaUploadApi, downloadFileFromUrl } from "@storyteller/api";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import {
  EnqueueImageTo3dObject,
  EnqueueImageTo3dObjectModel,
  EnqueueImageToGaussian,
} from "@storyteller/tauri-api";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useTabStore } from "../../pages/Stores/TabState";
import { addObject } from "../../pages/PageEnigma/signals/objectGroup/addObject";
import { set3DPageMounted } from "../../pages/PageEnigma/Editor/editor";
import { AssetType } from "~/enums";
import type { MediaItem } from "../../pages/PageEnigma/models";
import { GAUSSIAN_MODELS } from "@storyteller/model-list";

type Mode = "image" | "text";
type Variant = "object" | "world";

interface ImageTo3DExperienceProps {
  title: string;
  subtitle: string;
  variant: Variant;
  backgroundImage?: string;
}

const MODE_TABS = [
  { id: "image", label: "Image to 3D" },
  // { id: "text", label: "Text to 3D" },
] satisfies { id: Mode; label: string }[];

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const MODEL_OPTIONS = [
  { id: EnqueueImageTo3dObjectModel.Hunyuan3d3, label: "Hunyuan 3.0" },
  { id: EnqueueImageTo3dObjectModel.Hunyuan3d2_0, label: "Hunyuan 2.0" },
];

export const ImageTo3DExperience = ({
  title,
  subtitle,
  variant,
  backgroundImage,
}: ImageTo3DExperienceProps) => {
  const [activeMode, setActiveMode] = useState<Mode>("image");
  const [selectedModel, setSelectedModel] =
    useState<EnqueueImageTo3dObjectModel>(
      EnqueueImageTo3dObjectModel.Hunyuan3d3,
    );
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const promptContentRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState<number>(400);
  const [vh, setVh] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 800,
  );

  const objectResults = useImageTo3DStore((s) => s.results);
  const objectStartGeneration = useImageTo3DStore((s) => s.startGeneration);
  const objectReset = useImageTo3DStore((s) => s.reset);

  const worldResults = useImageTo3DWorldStore((s) => s.results);
  const worldStartGeneration = useImageTo3DWorldStore((s) => s.startGeneration);
  const worldReset = useImageTo3DWorldStore((s) => s.reset);
  const pendingExternalImage = useImageTo3DWorldStore(
    (s) => s.pendingExternalImage,
  );
  const clearPendingExternalImage = useImageTo3DWorldStore(
    (s) => s.clearPendingExternalImage,
  );

  const results = variant === "object" ? objectResults : worldResults;
  const resetResults = variant === "object" ? objectReset : worldReset;
  const [uploadedMediaToken, setUploadedMediaToken] = useState<string | null>(
    null,
  );
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );

  useEffect(() => {
    if (variant === "world" && pendingExternalImage) {
      setUploadedPreview(pendingExternalImage.url);
      setUploadedMediaToken(pendingExternalImage.mediaToken);
      setUploadedName("Library Image");
      clearPendingExternalImage();
    }
  }, [variant, pendingExternalImage, clearPendingExternalImage]);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = promptContentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  const handleFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    setUploadedName(file.name);
    setUploadedMediaToken(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedPreview(dataUrl);
    };
    reader.readAsDataURL(file);

    try {
      const mediaUploadApi = new MediaUploadApi();
      const uuid = uuidv4();

      const uploadResult = await mediaUploadApi.UploadImage({
        blob: file,
        fileName: file.name,
        uuid: uuid,
      });

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error("Failed to upload image");
      }

      setUploadedMediaToken(uploadResult.data);
    } catch (error) {
      toast.error("Failed to upload image");
      setUploadedPreview(null);
      setUploadedName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleFiles(event.dataTransfer?.files);
  };

  const handlePickFromLibrary = () => {
    setIsGalleryModalOpen(true);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [id];
    });
  };

  const handleGallerySelect = async (selectedItems: GalleryItem[]) => {
    const item = selectedItems[0];
    if (!item || !item.fullImage) {
      toast.error("No image selected");
      return;
    }

    if (isUploading) return;

    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);

    setUploadedName(item.label || "Library Image");
    setUploadedPreview(item.fullImage);
    setUploadedMediaToken(item.id);
  };

  const handleGenerate = async () => {
    if (isGenerating || isUploading) return;
    if (activeMode === "image" && !uploadedMediaToken) return;
    if (activeMode === "text" && prompt.trim().length <= 3) return;

    console.log("Set is generating...");
    setIsGenerating(true);

    const snapshotPrompt = prompt.trim();
    const snapshotPreview = uploadedPreview || undefined;
    const snapshotName = uploadedName;

    try {
      const subscriberId = generateId();
      const note =
        activeMode === "text"
          ? snapshotPrompt
          : snapshotName || "Generated Model";

      if (variant === "object") {
        objectStartGeneration(
          activeMode,
          note,
          snapshotPreview,
          false,
          subscriberId,
        );
      } else {
        worldStartGeneration(activeMode, note, snapshotPreview, subscriberId);
      }
      setSelectedResultId(subscriberId);

      const result =
        variant === "object"
          ? await EnqueueImageTo3dObject({
              image_media_token: uploadedMediaToken || undefined,
              model: selectedModel,
              frontend_caller: "mini_app",
              frontend_subscriber_id: subscriberId,
            })
          : await EnqueueImageToGaussian({
              image_media_tokens: uploadedMediaToken
                ? [uploadedMediaToken]
                : undefined,
              model: GAUSSIAN_MODELS[0],
              frontend_caller: "mini_app",
              frontend_subscriber_id: subscriberId,
            });

      if ("error_type" in result) {
        throw new Error(result.error_message || result.error_type);
      }

      if (activeMode === "text") {
        setPrompt("");
      } else {
        setUploadedPreview(null);
        setUploadedName(null);
        setUploadedMediaToken(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(`Failed to generate 3D model: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = useMemo(() => {
    if (isGenerating || isUploading) return false;
    if (activeMode === "image") {
      return Boolean(uploadedMediaToken);
    }
    if (activeMode === "text") {
      return prompt.trim().length > 3;
    }
    return true;
  }, [activeMode, uploadedMediaToken, prompt, isGenerating, isUploading]);

  const hasResults = results.length > 0;
  const showPromptAtBottom = hasResults;

  // Animation logic
  const bottomMarginPx = 24;
  const bottomOffsetPx = promptHeight + bottomMarginPx;

  const centerTop = vh / 2 - promptHeight / 2 + 80;
  const bottomTop = vh - bottomOffsetPx;

  const targetTop = showPromptAtBottom
    ? Math.max(0, bottomTop)
    : Math.max(0, centerTop);

  const promptAnim = useSpring({
    top: targetTop,
    config: { tension: 200, friction: 28, mass: 1.1 },
  });

  const renderAddImageTile = () => (
    <Tooltip
      interactive
      position="top"
      delay={100}
      zIndex={50}
      content={
        <div className="flex flex-col gap-1.5 text-left">
          <Button
            variant="primary"
            icon={faUpload}
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Upload image
          </Button>
          <Button
            variant="action"
            icon={faImages}
            onClick={handlePickFromLibrary}
            className="w-full"
          >
            Pick from library
          </Button>
        </div>
      }
    >
      <div
        role="button"
        tabIndex={0}
        className={twMerge(
          "flex flex-col items-center justify-center rounded-2xl border-[3px] border-dashed border-primary/40 bg-primary/5 text-center text-xs transition-all hover:border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40",
          hasResults ? "aspect-square w-24" : "aspect-square w-48",
          dragActive && "border-primary bg-primary/10",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragActive(false);
          }
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <FontAwesomeIcon
          icon={faPlus}
          className={twMerge(
            "text-base-fg opacity-90 drop-shadow",
            hasResults ? "text-2xl" : "text-4xl",
          )}
        />
        {!hasResults && (
          <span className="mt-3 text-[15px] font-medium text-base-fg opacity-60">
            Add Image
          </span>
        )}
      </div>
    </Tooltip>
  );

  const renderImageMode = () => (
    <div className="flex justify-center">
      {uploadedPreview ? (
        <div
          className={twMerge(
            "group relative cursor-pointer overflow-hidden rounded-2xl border-[3px] border-primary/40 bg-black/30 transition-all",
            hasResults ? "aspect-square w-24" : "aspect-square w-48",
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <img
            src={uploadedPreview}
            alt="Reference"
            className={twMerge(
              "h-full w-full object-cover transition-opacity",
              isUploading && "opacity-50",
            )}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-primary" />
            </div>
          )}
          {!isUploading && (
            <button
              type="button"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation();
                setUploadedPreview(null);
                setUploadedName(null);
                setUploadedMediaToken(null);
              }}
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          )}
        </div>
      ) : (
        renderAddImageTile()
      )}
    </div>
  );

  const promptInputId = `image-to-3d-${variant}-prompt`;

  const renderTextMode = () => (
    <div>
      <textarea
        ref={textareaRef}
        id={promptInputId}
        rows={1}
        className="text-md max-h-[5.5em] w-full resize-none overflow-y-auto rounded bg-transparent pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
        value={prompt}
        placeholder="Describe any object you want to generate from scratch..."
        onChange={(event) => setPrompt(event.target.value)}
      />
    </div>
  );

  const renderActiveMode = () => {
    if (activeMode === "text") return renderTextMode();
    return renderImageMode();
  };

  const activeResult =
    results.find((r) => r.id === selectedResultId) || results[0];

  useEffect(() => {
    console.log("[ImageTo3D] Active result changed:", activeResult);
  }, [activeResult]);

  return (
    <div className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full bg-ui-panel text-base-fg">
      {backgroundImage && !hasResults && (
        <>
          <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[radial-gradient(50%_50%_at_50%_50%,_transparent_49%,_rgb(var(--st-controls-rgb)_/_var(--st-gallery-vignette-alpha))_100%)]" />
          <div className="fixed inset-0 z-0 overflow-hidden">
            <div
              className="h-full w-full opacity-30 transition-opacity duration-1000"
              style={{
                backgroundImage: `linear-gradient(0deg, rgb(var(--st-photo-tint-rgb) / var(--st-photo-tint-alpha)), rgb(var(--st-photo-tint-rgb) / var(--st-photo-tint-alpha))), url(${backgroundImage})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(var(--st-photo-grayscale))",
              }}
            />
          </div>
        </>
      )}

      <div className="relative z-10 h-full w-full p-8">
        {!hasResults && (
          <div className="pointer-events-none absolute left-0 top-[calc(50%-280px)] w-full text-center">
            <h1 className="mb-3 text-7xl font-bold tracking-tight">{title}</h1>
            <p className="text-xl text-base-fg/70">{subtitle}</p>
          </div>
        )}

        {/* Split View: Viewer + History */}
        {hasResults && (
          <div
            className={twMerge(
              "mx-auto grid h-full w-full grid-cols-[1fr_300px] gap-4 overflow-hidden pb-10",
              variant === "world" ? "max-w-[1600px]" : "max-w-7xl",
            )}
            style={{ height: `calc(100vh - ${bottomOffsetPx + 80}px)` }}
          >
            {/* Left: Viewer */}
            <div className="glass relative h-full overflow-hidden rounded-xl border border-ui-panel-border">
              <Viewer3D
                modelUrl={activeResult?.modelUrl}
                previewUrl={activeResult?.previewUrl}
                isActive={true}
                className="h-full"
              />
              {activeResult?.modelUrl && activeResult?.mediaToken && (
                <div className="absolute right-4 top-4 z-10 flex gap-2">
                  <Button
                    variant="primary"
                    className="min-w-[120px]"
                    onClick={() => {
                      set3DPageMounted(true);
                      useTabStore.getState().setActiveTab("3D");
                      setTimeout(() => {
                        const mediaItem = {
                          version: 1,
                          type: AssetType.OBJECT,
                          media_id: activeResult.mediaToken!,
                          name: activeResult.note || "3D Object",
                          position: { x: 0, y: 0, z: 0 },
                        } as MediaItem & {
                          position: { x: number; y: number; z: number };
                        };
                        addObject(mediaItem);
                        toast.success("Added to 3D scene");
                      }, 500);
                    }}
                  >
                    Open in 3D Editor
                  </Button>
                  <Button
                    variant="action"
                    icon={faCube}
                    onClick={() => {
                      toast.promise(
                        downloadFileFromUrl(activeResult.modelUrl!),
                        {
                          loading: "Downloading GLB...",
                          success: "Downloaded GLB file",
                          error: "Failed to download file",
                        },
                      );
                    }}
                  >
                    GLB
                  </Button>
                </div>
              )}
            </div>

            {/* Right: History List */}
            <div className="glass flex h-full flex-col overflow-hidden rounded-xl border border-ui-panel-border">
              <div className="flex items-center justify-between border-b border-ui-panel-border p-4">
                <h3 className="font-semibold text-base-fg/80">History</h3>
                {results.length > 0 && (
                  <button
                    onClick={resetResults}
                    className="rounded-md bg-red/20 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-red/30"
                  >
                    Clear Session
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-3">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedResultId(result.id)}
                      className={twMerge(
                        "flex w-full gap-3 rounded-xl border p-2 text-left transition-all hover:bg-ui-controls/40",
                        selectedResultId === result.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-transparent bg-ui-controls/20",
                      )}
                    >
                      <div className="aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/20">
                        {result.previewUrl ? (
                          <img
                            src={result.previewUrl}
                            alt="thumb"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-base-fg/20">
                            <FontAwesomeIcon icon={faCube} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <div className="truncate text-sm font-medium">
                          {result.note || "Generated Model"}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs opacity-50">
                          {result.status === "pending" ? (
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                              Generating...
                            </span>
                          ) : (
                            <span>{formatTime(result.timestamp)}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animated Input Area */}
        <animated.div
          className="fixed left-1/2 z-20 w-full max-w-md -translate-x-1/2"
          style={promptAnim}
        >
          <div ref={promptContentRef}>
            <div className="glass w-full rounded-xl p-5 shadow-2xl ring-1 ring-white/10">
              <div className="space-y-5">{renderActiveMode()}</div>

              <div className="mt-6 flex justify-between">
                {variant === "object" && (
                  <div className="flex justify-center">
                    <TabSelector
                      tabs={MODEL_OPTIONS}
                      activeTab={selectedModel}
                      onTabChange={(id) =>
                        setSelectedModel(id as EnqueueImageTo3dObjectModel)
                      }
                      className="w-fit"
                      indicatorClassName="bg-primary/25"
                    />
                  </div>
                )}

                <GenerateButton
                  variant="primary"
                  icon={undefined}
                  disabled={!canGenerate}
                  onClick={handleGenerate}
                  loading={isGenerating}
                >
                  {`Generate ${variant === "object" ? "Object" : "World"}`}
                </GenerateButton>
              </div>
            </div>

            {MODE_TABS.length > 1 && (
              <div className="mt-6 flex justify-center">
                <TabSelector
                  tabs={MODE_TABS}
                  activeTab={activeMode}
                  onTabChange={(tabId) => setActiveMode(tabId as Mode)}
                  className="w-fit"
                  indicatorClassName="bg-primary/25"
                />
              </div>
            )}
          </div>
        </animated.div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false);
          setSelectedGalleryImages([]);
        }}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={1}
        onUseSelected={handleGallerySelect}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </div>
  );
};

export default ImageTo3DExperience;
