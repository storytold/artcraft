import { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faImages,
  faPlus,
  faSpinnerThird,
  faXmark,
  faArrowRight,
  faSliders,
} from "@fortawesome/pro-solid-svg-icons";
import { faImage as faImageRegular } from "@fortawesome/pro-regular-svg-icons";
import { twMerge } from "tailwind-merge";
import { UploadImageMedia, UploadVideoMedia } from "@storyteller/api";
import { UploaderState, UploaderStates } from "@storyteller/common";
import {
  ClassyModelSelector,
  MOTION_CONTROL_PAGE_MODEL_LIST,
  ModelPage,
  useSelectedVideoModel,
  useSelectedProviderForModel,
} from "@storyteller/ui-model-selector";
import { CostCalculatorButton } from "@storyteller/ui-pricing-modal";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import { Button, ToggleButton, GenerateButton } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { useMotionControlStore } from "./MotionControlStore";
import {
  useMotionControlCompleteEvent,
  MotionControlCompleteEvent,
} from "@storyteller/tauri-events";
import BackgroundGallery from "../PageVideo/BackgroundGallery";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";

type UploadMediaFn = (args: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;

const PAGE_ID: ModelPage = ModelPage.MotionControl;

const ORIENTATION_TABS = [
  { id: "video", label: "Video" },
  { id: "image", label: "Image" },
];

type CharacterOrientation = "video" | "image";
type Resolution = "720p" | "1080p";

interface UploadedMedia {
  url: string;
  mediaToken: string;
  file: File;
}

const MotionControl = () => {
  const completeBatch = useMotionControlStore((s) => s.completeBatch);
  const startBatch = useMotionControlStore((s) => s.startBatch);

  const selectedVideoModel = useSelectedVideoModel(PAGE_ID);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _selectedProvider = useSelectedProviderForModel(
    PAGE_ID,
    selectedVideoModel?.id,
  );

  // Upload state
  const [motionVideo, setMotionVideo] = useState<UploadedMedia | undefined>();
  const [characterImage, setCharacterImage] = useState<
    UploadedMedia | undefined
  >();
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [orientation, setOrientation] = useState<CharacterOrientation>("video");
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<Resolution>("720p");

  const resolutionOptions: PopoverItem[] = (
    ["720p", "1080p"] as Resolution[]
  ).map((r) => ({
    label: r,
    selected: r === resolution,
  }));

  const handleResolutionSelect = useCallback(
    (item: PopoverItem) => setResolution(item.label as Resolution),
    [],
  );

  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Listen for generation complete events
  useMotionControlCompleteEvent(async (event: MotionControlCompleteEvent) => {
    if (!event.generated_video) return;
    completeBatch(
      {
        cdn_url: event.generated_video.cdn_url,
        media_token: event.generated_video.media_token,
      },
      event.maybe_frontend_subscriber_id,
    );
  });

  const handleUpload = useCallback(
    (
      file: File,
      uploadFn: UploadMediaFn,
      setUploading: (v: boolean) => void,
      setMedia: (m: UploadedMedia | undefined) => void,
      prefix: string,
    ) => {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        await uploadFn({
          title: `${prefix}-${Math.random().toString(36).substring(2, 15)}`,
          assetFile: file,
          progressCallback: (newState) => {
            if (newState.status === UploaderStates.success && newState.data) {
              setMedia({
                url: reader.result as string,
                mediaToken: newState.data,
                file,
              });
              setUploading(false);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              setUploading(false);
            }
          },
        });
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handleUpload(
        file,
        UploadVideoMedia,
        setUploadingVideo,
        setMotionVideo,
        "motion-ref",
      );
      if (videoInputRef.current) videoInputRef.current.value = "";
    },
    [handleUpload],
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handleUpload(
        file,
        UploadImageMedia,
        setUploadingImage,
        setCharacterImage,
        "motion-char",
      );
      if (imageInputRef.current) imageInputRef.current.value = "";
    },
    [handleUpload],
  );

  // Library picker state
  type PickerTarget = "video" | "image";
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("video");
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);

  const openPicker = useCallback((target: PickerTarget) => {
    setPickerTarget(target);
    setPickerSelectedIds([]);
    setPickerOpen(true);
  }, []);

  const handlePickerSelect = useCallback((id: string) => {
    setPickerSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id],
    );
  }, []);

  const handlePickerUse = useCallback(
    (items: GalleryItem[]) => {
      const item = items[0];
      if (!item) return;
      const url = item.fullImage || item.thumbnail || "";
      const media: UploadedMedia = {
        url,
        mediaToken: item.id,
        file: new File([], "library-pick"),
      };
      if (pickerTarget === "video") {
        setMotionVideo(media);
      } else {
        setCharacterImage(media);
      }
      setPickerOpen(false);
      setPickerSelectedIds([]);
    },
    [pickerTarget],
  );

  const canGenerate = !!motionVideo && !!characterImage;

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    const subscriberId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    const modelLabel = selectedVideoModel?.fullName ?? "Motion Control";
    startBatch(prompt, modelLabel, subscriberId);

    // TODO: Send to backend when API is ready
    // The payload would be:
    // {
    //   prompt,
    //   image_url / image_media_token: characterImage.mediaToken,
    //   video_url / video_media_token: motionVideo.mediaToken,
    //   character_orientation: orientation,
    //   resolution,
    //   model, provider, subscriberId, etc.
    // }
  }, [
    canGenerate,
    prompt,
    orientation,
    resolution,
    selectedVideoModel,
    startBatch,
    motionVideo,
    characterImage,
  ]);

  return (
    <div className="flex h-[calc(100vh-56px)] w-full bg-ui-background">
      <div className="relative h-full w-full p-16">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md pb-12">
          {/* Title */}
          <div className="relative z-20 mb-52 flex flex-col items-center justify-center text-center drop-shadow-xl">
            <h1 className="text-7xl font-bold text-base-fg">Motion Control</h1>
            <span className="pt-2 text-xl text-base-fg opacity-80">
              Transfer movements from a reference video to any character
            </span>
          </div>

          {/* Prompt box area */}
          <div className="fixed left-1/2 top-1/2 z-20 w-[860px] -translate-x-1/2">
            {/* Upload row */}
            <div className="glass flex items-center gap-0 rounded-t-xl">
              <UploadSlot
                label="Add motion to copy"
                subtitle="Video duration: 3–30 seconds"
                icon={faFilm}
                accept="video/*"
                media={motionVideo}
                uploading={uploadingVideo}
                inputRef={videoInputRef}
                onFileChange={handleVideoUpload}
                onClear={() => setMotionVideo(undefined)}
                onPickFromLibrary={() => openPicker("video")}
              />

              <div className="flex items-center px-4 text-white/30">
                <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
              </div>

              <UploadSlot
                label="Add your character"
                subtitle="Image with visible face and body"
                icon={faImageRegular}
                accept="image/*"
                media={characterImage}
                uploading={uploadingImage}
                inputRef={imageInputRef}
                onFileChange={handleImageUpload}
                onClear={() => setCharacterImage(undefined)}
                onPickFromLibrary={() => openPicker("image")}
              />
            </div>

            {/* Bottom controls */}
            <div
              className={twMerge(
                "glass flex items-center justify-between border-t border-white/10 px-3 py-2",
                showSettings ? "rounded-none" : "rounded-b-xl",
              )}
            >
              <div className="flex items-center gap-2">
                <Tooltip
                  content="Resolution"
                  position="top"
                  className="z-50"
                  closeOnClick
                >
                  <PopoverMenu
                    items={resolutionOptions}
                    onSelect={handleResolutionSelect}
                    mode="toggle"
                    panelTitle="Resolution"
                  />
                </Tooltip>
                <Tooltip
                  content="Advanced settings"
                  position="top"
                  className="z-50"
                  delay={200}
                >
                  <ToggleButton
                    isActive={showSettings}
                    icon={faSliders}
                    activeIcon={faSliders}
                    onClick={() => setShowSettings((v) => !v)}
                  />
                </Tooltip>
              </div>

              <GenerateButton
                className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canGenerate}
                onClick={handleGenerate}
              >
                Generate
              </GenerateButton>
            </div>

            {/* Advanced settings panel (below controls) */}
            {showSettings && (
              <AdvancedSettings
                orientation={orientation}
                setOrientation={setOrientation}
                prompt={prompt}
                setPrompt={setPrompt}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>

          <BackgroundGallery />

          {/* Library picker modal */}
          <GalleryModal
            key={pickerTarget}
            mode="select"
            isOpen={pickerOpen}
            forceFilter={pickerTarget === "video" ? "video" : "image"}
            selectedItemIds={pickerSelectedIds}
            onSelectItem={handlePickerSelect}
            maxSelections={1}
            onUseSelected={handlePickerUse}
            onClose={() => setPickerOpen(false)}
          />

          {/* Bottom-left model selector */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-5">
            <ClassyModelSelector
              items={MOTION_CONTROL_PAGE_MODEL_LIST}
              page={PAGE_ID}
              panelTitle="Select Model"
              panelClassName="min-w-[300px]"
              buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
              showIconsInList
              triggerLabel="Model"
            />
          </div>

          {/* Bottom-right controls */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            <CostCalculatorButton modelPage={PAGE_ID} />
            <HelpMenuButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotionControl;

// ── Sub-components ───────────────────────────────────────────────────────

interface UploadSlotProps {
  label: string;
  subtitle: string;
  icon: any;
  accept: string;
  media?: UploadedMedia;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onPickFromLibrary?: () => void;
}

const UploadSlot = ({
  label,
  subtitle,
  icon,
  accept,
  media,
  uploading,
  inputRef,
  onFileChange,
  onClear,
  onPickFromLibrary,
}: UploadSlotProps) => (
  <div className="flex-1 p-3">
    <input
      type="file"
      ref={inputRef}
      className="hidden"
      accept={accept}
      onChange={onFileChange}
    />
    {media ? (
      <div className="group relative flex h-[130px] items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white/5">
        {accept.startsWith("video") ? (
          <video
            src={media.url}
            className="h-full w-full object-contain"
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={media.url}
            alt={label}
            className="h-full w-full object-contain"
          />
        )}
        <button
          onClick={onClear}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black group-hover:opacity-100"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
        </button>
      </div>
    ) : uploading ? (
      <div className="flex h-[130px] items-center justify-center rounded-lg border border-dashed border-white/25 bg-white/5">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          spin
          className="h-6 w-6 text-white/60"
        />
      </div>
    ) : (
      <Tooltip
        interactive
        position="top"
        delay={100}
        className="-mb-0.5 border border-ui-panel-border bg-ui-controls p-2 text-base-fg"
        closeOnClick
        content={
          <div className="flex flex-col gap-1.5">
            <Button
              variant="primary"
              onClick={() => inputRef.current?.click()}
              icon={faPlus}
              className="w-full"
            >
              Upload
            </Button>
            {onPickFromLibrary && (
              <Button
                variant="action"
                onClick={onPickFromLibrary}
                icon={faImages}
                className="w-full bg-white/15 hover:bg-white/20"
              >
                Pick from library
              </Button>
            )}
          </div>
        }
      >
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-[130px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10"
        >
          <FontAwesomeIcon icon={icon} className="h-5 w-5 text-white/60" />
          <span className="text-sm font-medium text-white/80">{label}</span>
          <span className="text-xs text-white/50">{subtitle}</span>
        </button>
      </Tooltip>
    )}
  </div>
);

interface AdvancedSettingsProps {
  orientation: CharacterOrientation;
  setOrientation: (v: CharacterOrientation) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  onClose: () => void;
}

const AdvancedSettings = ({
  orientation,
  setOrientation,
  prompt,
  setPrompt,
  onClose,
}: AdvancedSettingsProps) => (
  <div className="glass flex gap-4 rounded-xl rounded-t-none border border-white/10 p-4 pb-2.5">
    {/* Character orientation */}
    <div className="shrink-0">
      <span className="mb-2 block text-sm font-medium text-white/90">
        Character orientation
      </span>
      <TabSelector
        tabs={ORIENTATION_TABS}
        activeTab={orientation}
        onTabChange={(id) => setOrientation(id as CharacterOrientation)}
      />
    </div>

    {/* Prompt */}
    <div className="min-w-0 flex-1">
      <div className="mb-2 block text-sm font-medium text-white/90">
        Prompt <span className="text-xs text-white/50">(optional)</span>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={1}
        placeholder="Describe the motion..."
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/30 outline-none transition-colors focus:border-primary"
      />
    </div>
  </div>
);
