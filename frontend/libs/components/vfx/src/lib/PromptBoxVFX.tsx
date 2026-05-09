import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faSpinnerThird,
  faVideo,
  faImage,
  faXmark,
  faSparkles,
  faPlus,
  faImages,
  faPenToSquare,
} from "@fortawesome/pro-solid-svg-icons";
import { Button, GenerateButton } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";
import { UploaderStates, type UploaderState } from "@storyteller/common";
import { useVFXStore } from "./store";
import {
  MAX_SOURCE_DURATION_S,
  RESOLUTION_OPTIONS,
  VFX_MODELS,
  type VFXModelId,
  type VFXResolution,
} from "./types";

export type VFXUploadFn = (args: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;

interface PromptBoxVFXProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  uploadVideo: VFXUploadFn;
  uploadImage: VFXUploadFn;
  onError: (message: string) => void;
  containerClassName?: string;
  hideResolution?: boolean;
}

type SlotKind = "source" | "mask" | "reference";

export const PromptBoxVFX = ({
  onSubmit,
  isSubmitting,
  uploadVideo,
  uploadImage,
  onError,
  containerClassName,
  hideResolution = false,
}: PromptBoxVFXProps) => {
  const source = useVFXStore((s) => s.source);
  const reference = useVFXStore((s) => s.reference);
  const prompt = useVFXStore((s) => s.prompt);
  const resolution = useVFXStore((s) => s.resolution);
  const selectedModelId = useVFXStore((s) => s.selectedModelId);
  const setSource = useVFXStore((s) => s.setSource);
  const setMask = useVFXStore((s) => s.setMask);
  const setReference = useVFXStore((s) => s.setReference);
  const setPrompt = useVFXStore((s) => s.setPrompt);
  const setResolution = useVFXStore((s) => s.setResolution);
  const setSelectedModelId = useVFXStore((s) => s.setSelectedModelId);
  const selectedModel =
    VFX_MODELS.find((m) => m.id === selectedModelId) ?? VFX_MODELS[0];

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [sourceUploading, setSourceUploading] = useState(false);
  const [maskUploading, setMaskUploading] = useState(false);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [showPromptPopover, setShowPromptPopover] = useState(false);

  useEffect(() => {
    if (showPromptPopover) {
      requestAnimationFrame(() => promptTextareaRef.current?.focus());
    }
  }, [showPromptPopover]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<SlotKind>("source");
  const [gallerySelected, setGallerySelected] = useState<string[]>([]);

  const handleSourceUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (sourceInputRef.current) sourceInputRef.current.value = "";
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      const duration = await measureVideoDuration(previewUrl);
      if (duration > MAX_SOURCE_DURATION_S) {
        onError(`Source video must be ${MAX_SOURCE_DURATION_S}s or shorter`);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      setSourceUploading(true);
      await uploadVideo({
        title: `vfx-source-${Math.random().toString(36).slice(2, 10)}`,
        assetFile: file,
        progressCallback: (state) => {
          if (state.status === UploaderStates.success && state.data) {
            setSource({
              id: Math.random().toString(36).slice(2),
              url: previewUrl,
              mediaToken: state.data,
            });
            setSourceUploading(false);
          } else if (
            state.status === UploaderStates.assetError ||
            state.status === UploaderStates.imageCreateError
          ) {
            onError("Failed to upload source video. Use an MP4 file.");
            setSourceUploading(false);
            URL.revokeObjectURL(previewUrl);
          }
        },
      });
    },
    [setSource, uploadVideo, onError],
  );

  const handleImageUpload = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      kind: "mask" | "reference",
    ) => {
      const file = event.target.files?.[0];
      const inputRef = kind === "mask" ? maskInputRef : referenceInputRef;
      if (inputRef.current) inputRef.current.value = "";
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      const setUploading =
        kind === "mask" ? setMaskUploading : setReferenceUploading;
      const setRef = kind === "mask" ? setMask : setReference;

      setUploading(true);
      await uploadImage({
        title: `vfx-${kind}-${Math.random().toString(36).slice(2, 10)}`,
        assetFile: file,
        progressCallback: (state) => {
          if (state.status === UploaderStates.success && state.data) {
            setRef({
              id: Math.random().toString(36).slice(2),
              url: previewUrl,
              mediaToken: state.data,
            });
            setUploading(false);
          } else if (
            state.status === UploaderStates.assetError ||
            state.status === UploaderStates.imageCreateError
          ) {
            onError(
              kind === "mask"
                ? "Failed to upload mask image."
                : "Failed to upload reference image.",
            );
            setUploading(false);
            URL.revokeObjectURL(previewUrl);
          }
        },
      });
    },
    [setMask, setReference, uploadImage, onError],
  );

  const openGallery = useCallback((target: SlotKind) => {
    setGalleryTarget(target);
    setGallerySelected([]);
    setGalleryOpen(true);
  }, []);

  const handleGallerySelectItem = useCallback((id: string) => {
    // Single-select: replace.
    setGallerySelected([id]);
  }, []);

  const handleGalleryUseSelected = useCallback(
    (items: GalleryItem[]) => {
      const item = items[0];
      if (!item) {
        setGalleryOpen(false);
        return;
      }
      const ref = {
        id: Math.random().toString(36).slice(2),
        url: item.fullImage || item.thumbnail || "",
        mediaToken: item.id,
      };
      if (galleryTarget === "source") setSource(ref);
      else if (galleryTarget === "mask") setMask(ref);
      else setReference(ref);
      setGalleryOpen(false);
      setGallerySelected([]);
    },
    [galleryTarget, setSource, setMask, setReference],
  );

  const triggerUpload = useCallback((target: SlotKind) => {
    if (target === "source") sourceInputRef.current?.click();
    else if (target === "mask") maskInputRef.current?.click();
    else referenceInputRef.current?.click();
  }, []);

  const resolutionItems: PopoverItem[] = RESOLUTION_OPTIONS.map((r) => ({
    label: r,
    selected: r === resolution,
    action: r,
  }));

  const handleResolutionSelect = useCallback(
    (item: PopoverItem) => {
      const next = (item.action ?? item.label) as VFXResolution;
      if (RESOLUTION_OPTIONS.includes(next)) setResolution(next);
    },
    [setResolution],
  );

  const modelItems: PopoverItem[] = VFX_MODELS.map((m) => ({
    label: m.label,
    description: m.description,
    selected: m.id === selectedModelId,
    action: m.id,
  }));

  const handleModelSelect = useCallback(
    (item: PopoverItem) => {
      const next = (item.action ?? "") as VFXModelId;
      if (VFX_MODELS.some((m) => m.id === next)) setSelectedModelId(next);
    },
    [setSelectedModelId],
  );

  const canSubmit =
    !!source &&
    !!reference &&
    !isSubmitting &&
    !sourceUploading &&
    !maskUploading &&
    !referenceUploading;

  const hasPrompt = prompt.trim().length > 0;

  return (
    <div className="relative w-full">
      {showPromptPopover && (
        <div className="absolute bottom-full left-1/2 mb-2 w-full -translate-x-1/2">
          <div className="glass flex flex-col gap-1.5 rounded-2xl px-3 py-2 shadow-2xl sm:px-4 sm:py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-fg/60">
                Prompt (optional)
              </span>
              <button
                type="button"
                onClick={() => setShowPromptPopover(false)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-base-fg/50 hover:bg-base-fg/10 hover:text-base-fg"
                aria-label="Close prompt"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
              </button>
            </div>
            <textarea
              ref={promptTextareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the new scene, lighting, or change..."
              rows={3}
              className="max-h-40 min-h-[3.5rem] w-full resize-none bg-transparent text-sm text-base-fg placeholder-base-fg/50 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowPromptPopover(false);
                } else if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
          </div>
        </div>
      )}

      <div
        className={twMerge(
          "glass flex w-full flex-col gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 shadow-2xl",
          containerClassName,
        )}
      >
        <input
          ref={sourceInputRef}
          type="file"
          className="hidden"
          accept="video/mp4,.mp4"
          onChange={handleSourceUpload}
        />
        <input
          ref={maskInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, "mask")}
        />
        <input
          ref={referenceInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, "reference")}
        />

        {/* Primary inputs — centered, all aspect-video. Source + Reference are required, Mask is optional */}
        <div className="flex items-end justify-center gap-3">
          <UploadTile
            label="Source Video"
            icon={faVideo}
            previewUrl={source?.url}
            isVideo
            uploading={sourceUploading}
            onUpload={() => triggerUpload("source")}
            onPickFromLibrary={() => openGallery("source")}
            onClear={() => setSource(undefined)}
            tileClassName="h-20 aspect-video sm:h-24"
            required
          />
          {/* Mask is hidden for now — backend endpoint doesn't accept it yet. */}
          <UploadTile
            label="Reference Image"
            icon={faImage}
            previewUrl={reference?.url}
            uploading={referenceUploading}
            onUpload={() => triggerUpload("reference")}
            onPickFromLibrary={() => openGallery("reference")}
            onClear={() => setReference(undefined)}
            tileClassName="h-20 aspect-video sm:h-24"
            required
          />
        </div>

        {/* Bottom row: model + resolution chips on left, prompt toggle + Generate on right.
            Wraps on narrow widths so Generate stays visible on mobile. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <Tooltip content="Model" position="top" closeOnClick>
            <PopoverMenu
              items={modelItems}
              onSelect={handleModelSelect}
              mode="toggle"
              panelTitle="Model"
              triggerIcon={
                <FontAwesomeIcon icon={faSparkles} className="h-3 w-3" />
              }
              triggerLabel={selectedModel.label}
            />
          </Tooltip>
          {!hideResolution && (
            <Tooltip content="Resolution" position="top" closeOnClick>
              <PopoverMenu
                items={resolutionItems}
                onSelect={handleResolutionSelect}
                mode="toggle"
                panelTitle="Resolution"
                triggerLabel={resolution}
              />
            </Tooltip>
          )}

          <Tooltip
            content={hasPrompt ? "Edit prompt" : "Add an optional prompt"}
            position="top"
          >
            <button
              type="button"
              onClick={() => setShowPromptPopover((v) => !v)}
              className={twMerge(
                "flex items-center gap-2 rounded-lg border border-ui-controls-border bg-ui-controls px-3 py-1.5 text-sm font-medium text-base-fg shadow-sm outline-none transition-all duration-150 hover:bg-ui-controls/80 active:scale-95",
                showPromptPopover && "bg-base-fg/15",
                hasPrompt &&
                  "border-primary/30 bg-primary/15 text-primary-300 hover:bg-primary/20",
              )}
            >
              <FontAwesomeIcon
                icon={hasPrompt ? faPenToSquare : faPlus}
                className="hidden h-3 w-3 sm:inline-block"
              />
              <span className="truncate">
                <span className="sm:hidden">Prompt</span>
                <span className="hidden sm:inline">
                  {hasPrompt ? "Prompt" : "Add prompt"}
                </span>
              </span>
            </button>
          </Tooltip>

          <div className="ml-auto">
            <GenerateButton
              onClick={onSubmit}
              disabled={!canSubmit}
              loading={isSubmitting}
              className="border-none bg-primary px-4 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate
            </GenerateButton>
          </div>
        </div>

        <GalleryModal
          key={galleryTarget}
          isOpen={galleryOpen}
          onClose={() => {
            setGalleryOpen(false);
            setGallerySelected([]);
          }}
          mode="select"
          selectedItemIds={gallerySelected}
          onSelectItem={handleGallerySelectItem}
          maxSelections={1}
          onUseSelected={handleGalleryUseSelected}
          forceFilter={galleryTarget === "source" ? "video" : "image"}
          hideFilter
        />
      </div>
    </div>
  );
};

interface UploadTileProps {
  label: string;
  icon: IconDefinition;
  previewUrl?: string;
  isVideo?: boolean;
  uploading?: boolean;
  optional?: boolean;
  required?: boolean;
  tileClassName?: string;
  onUpload: () => void;
  onPickFromLibrary: () => void;
  onClear: () => void;
}

const UploadTile = ({
  label,
  icon,
  previewUrl,
  isVideo,
  uploading,
  optional,
  required,
  tileClassName,
  onUpload,
  onPickFromLibrary,
  onClear,
}: UploadTileProps) => {
  const showHoverMenu = !previewUrl && !uploading;
  const tileSize = tileClassName ?? "h-12 w-12";
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider leading-none text-base-fg/70">
        <span>{label}</span>
        {required && <span className="text-primary-400">*</span>}
        {optional && (
          <span className="rounded bg-base-fg/10 px-1 py-px text-[9px] font-medium normal-case tracking-normal text-base-fg/40">
            optional
          </span>
        )}
      </div>

      {showHoverMenu ? (
        <Tooltip
          interactive
          position="top"
          delay={100}
          closeOnClick
          className="bg-ui-controls text-base-fg border border-ui-controls-border p-2 -mb-0.5"
          content={
            <div className="flex flex-col gap-1.5">
              <Button
                variant="primary"
                onClick={onUpload}
                icon={faPlus}
                className="w-full"
              >
                Upload
              </Button>
              <Button
                variant="action"
                onClick={onPickFromLibrary}
                icon={faImages}
                className="w-full bg-base-fg/10 hover:bg-base-fg/20"
              >
                Pick from library
              </Button>
            </div>
          }
        >
          <Button
            variant="action"
            className={twMerge(
              "bg-ui-controls/40 hover:bg-ui-controls/60 overflow-hidden rounded-lg border-dashed border-2 border-black/10 dark:border-white/25 transition-all",
              tileSize,
            )}
            onClick={onUpload}
          >
            <FontAwesomeIcon
              icon={icon}
              className="text-2xl opacity-80 text-base-fg"
            />
          </Button>
        </Tooltip>
      ) : (
        <div
          className={twMerge(
            "glass group relative flex items-center justify-center overflow-hidden rounded-lg border-2 transition-all",
            "border-white/30 hover:border-white/80",
            tileSize,
          )}
        >
          {uploading ? (
            <FontAwesomeIcon
              icon={faSpinnerThird}
              className="h-6 w-6 animate-spin text-base-fg"
            />
          ) : (
            <>
              {isVideo ? (
                <video
                  src={previewUrl}
                  muted
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={label}
                  className="h-full w-full object-contain"
                />
              )}
              <button
                type="button"
                onClick={onClear}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500/70 group-hover:opacity-100"
              >
                <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const measureVideoDuration = (src: string): Promise<number> =>
  new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(v.duration);
    v.onerror = () => resolve(0);
    v.src = src;
  });
