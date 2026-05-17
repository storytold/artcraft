import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { CharactersApi, FilterMediaClasses } from "@storyteller/api";
import type { OmniGenVideoModelInfo } from "@storyteller/api";
import { ToggleButton } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";
import {
  PromptBox,
  MediaReferenceRow,
  CharactersModal,
  useCharactersStore,
  type RefImage,
  type RefVideo,
  type RefAudio,
  type MentionItem,
} from "../../components/prompt-box";
import {
  GenerationGalleryGrid,
  useGalleryData,
  useGenerationJobs,
  useAuthCheck,
  usePromptHeight,
  useLightboxNav,
  CreateMediaPageShell,
} from "../../components/generation-gallery";
import { Lightbox } from "../../components/lightbox/lightbox";
import { useCreateVideoStore } from "./create-video-store";
import {
  enqueueVideoGeneration,
  startVideoPolling,
} from "./generate-video-api";
import {
  AspectRatioIcon,
  AutoIcon,
} from "../create-image/components/AspectRatioIcon";
import { GenerationCountPicker } from "../create-image/components/GenerationCountPicker";
import { useVideoCostEstimate } from "../../lib/cost-estimate-api";
import {
  useOmniGenVideoModels,
  getModelCreatorIconPath,
} from "../../lib/omni-gen-hooks";
import { useSignupCta } from "../../components/signup-cta-modal";

// ── Constants ────────────────────────────────────────────────────────────

const DEFAULT_MODEL_ID = "seedance_2p0";

const VIDEO_FILTER = [FilterMediaClasses.VIDEO];

const AUTO_RATIOS = new Set(["auto", "auto_2k", "auto_3k", "auto_4k"]);

// ── Aspect ratio labels (shared with image page) ─────────────────────────

const AR_LABELS: Record<string, string> = {
  auto: "Auto",
  square: "Square",
  wide_five_by_four: "5:4 (Wide)",
  wide_four_by_three: "4:3 (Wide)",
  wide_three_by_two: "3:2 (Wide)",
  wide_sixteen_by_nine: "16:9 (Wide)",
  wide_twenty_one_by_nine: "21:9 (Wide)",
  tall_four_by_five: "4:5 (Tall)",
  tall_three_by_four: "3:4 (Tall)",
  tall_two_by_three: "2:3 (Tall)",
  tall_nine_by_sixteen: "9:16 (Tall)",
  tall_nine_by_twenty_one: "9:21 (Tall)",
  auto_2k: "Auto (2K)",
  auto_3k: "Auto (3K)",
  auto_4k: "Auto (4K)",
  square_hd: "Square (HD)",
  wide: "Wide",
  tall: "Tall",
};

const RES_LABELS: Record<string, string> = {
  half_k: "0.5K",
  four_eighty_p: "480p",
  seven_twenty_p: "720p",
  one_k: "1K",
  ten_eighty_p: "1080p",
  two_k: "2K",
  three_k: "3K",
  four_k: "4K",
};

const LABEL_TO_RES: Record<string, string> = Object.fromEntries(
  Object.entries(RES_LABELS).map(([k, v]) => [v, k]),
);

// ── Model lookup ─────────────────────────────────────────────────────────

let _modelLookup = new Map<string, OmniGenVideoModelInfo>();

function buildModelPopoverItems(
  models: OmniGenVideoModelInfo[],
  selectedId: string,
): PopoverItem[] {
  _modelLookup = new Map(models.map((m) => [m.model, m]));
  return models.map((model) => ({
    label: model.full_name || model.model,
    selected: model.model === selectedId,
    icon: (
      <img
        src={getModelCreatorIconPath(model.model)}
        alt={`${model.model} logo`}
        className="h-4 w-4 icon-auto-contrast"
      />
    ),
    action: model.model,
  }));
}

function buildSizePopoverItems(
  aspectRatioOptions: string[],
  selectedValue: string,
): PopoverItem[] {
  return aspectRatioOptions.map((ar) => ({
    label: AR_LABELS[ar] ?? ar,
    selected: ar === selectedValue,
    icon: AUTO_RATIOS.has(ar) ? (
      <AutoIcon />
    ) : (
      <AspectRatioIcon commonAspectRatio={ar} />
    ),
    action: ar,
  }));
}

function resolveDurationForModel(
  model: OmniGenVideoModelInfo,
  current: number | null,
): number | null {
  if (current == null) return model.duration_seconds_default ?? null;
  if (
    model.duration_seconds_min != null &&
    model.duration_seconds_max != null
  ) {
    if (
      current >= model.duration_seconds_min &&
      current <= model.duration_seconds_max
    ) {
      return current;
    }
    return model.duration_seconds_default ?? model.duration_seconds_min;
  }
  if (model.duration_seconds_options?.length) {
    if (model.duration_seconds_options.includes(current)) return current;
    return model.duration_seconds_default ?? model.duration_seconds_options[0]!;
  }
  return model.duration_seconds_default ?? null;
}

// ── Component ────────────────────────────────────────────────────────────

export default function CreateVideo() {
  const { user, authChecked } = useAuthCheck();
  const { loggedIn, openSignupCta } = useSignupCta();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  // Fetch models from API
  const { models: apiModels } = useOmniGenVideoModels();

  // UI state
  const ui = useCreateVideoStore((s) => s.ui);
  const setUi = useCreateVideoStore((s) => s.setUi);

  const selectedModel = useMemo((): OmniGenVideoModelInfo | undefined => {
    if (!apiModels.length) return undefined;
    if (ui.selectedModelId) {
      return (
        apiModels.find((m) => m.model === ui.selectedModelId) ??
        apiModels.find((m) => m.model === DEFAULT_MODEL_ID) ??
        apiModels[0]
      );
    }
    return apiModels.find((m) => m.model === DEFAULT_MODEL_ID) ?? apiModels[0];
  }, [apiModels, ui.selectedModelId]);

  const prompt = ui.prompt;
  const setPrompt = useCallback((v: string) => setUi({ prompt: v }), [setUi]);
  const selectedSize = ui.selectedSize;
  const setSelectedSize = useCallback(
    (v: string) => setUi({ selectedSize: v }),
    [setUi],
  );
  const duration = ui.duration;
  const setDuration = useCallback(
    (v: number | null) => setUi({ duration: v }),
    [setUi],
  );
  const resolution = ui.resolution ?? selectedModel?.resolution_default ?? null;
  const setResolution = useCallback(
    (v: string | null) => setUi({ resolution: v }),
    [setUi],
  );
  const generateWithSound = ui.generateWithSound;
  const numVideos = ui.numVideos;
  const setNumVideos = useCallback(
    (v: number) => setUi({ numVideos: v }),
    [setUi],
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);

  // Reference media (persisted in store so refs survive navigation)
  const refs = useCreateVideoStore((s) => s.refs);
  const setRefs = useCreateVideoStore((s) => s.setRefs);
  const { referenceImages, endFrameImage, referenceVideos, referenceAudios } =
    refs;
  const setReferenceImages = useCallback(
    (v: RefImage[]) => setRefs({ referenceImages: v }),
    [setRefs],
  );
  const setEndFrameImage = useCallback(
    (v?: RefImage) => setRefs({ endFrameImage: v }),
    [setRefs],
  );
  const setReferenceVideos = useCallback(
    (v: RefVideo[]) => setRefs({ referenceVideos: v }),
    [setRefs],
  );
  const setReferenceAudios = useCallback(
    (v: RefAudio[]) => setRefs({ referenceAudios: v }),
    [setRefs],
  );
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isEndFramePickerOpen, setIsEndFramePickerOpen] = useState(false);
  const [isCharactersModalOpen, setIsCharactersModalOpen] = useState(false);
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);
  const [endFramePickerSelectedIds, setEndFramePickerSelectedIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (isImagePickerOpen) setPickerSelectedIds([]);
  }, [isImagePickerOpen]);

  useEffect(() => {
    if (isEndFramePickerOpen) setEndFramePickerSelectedIds([]);
  }, [isEndFramePickerOpen]);

  // Characters store for @-mentions
  const storedCharacters = useCharactersStore((s) => s.characters);
  const charactersLoaded = useCharactersStore((s) => s.loaded);
  const storeSetCharacters = useCharactersStore((s) => s.setCharacters);
  const storeSetLoaded = useCharactersStore((s) => s.setLoaded);

  // Load characters on mount if not already loaded
  useEffect(() => {
    if (charactersLoaded) return;
    const api = new CharactersApi();
    api
      .ListAllCharacters()
      .then((res) => {
        if (res.success && res.data) {
          storeSetCharacters(
            res.data.map((c) => ({
              character_token: c.token,
              name: c.name,
              avatar_image_url: c.maybe_avatar?.cdn_url,
            })),
          );
        }
        storeSetLoaded(true);
      })
      .catch(() => storeSetLoaded(true));
  }, [charactersLoaded, storeSetCharacters, storeSetLoaded]);

  // Batch store (enqueue flow only)
  const batches = useCreateVideoStore((s) => s.batches);
  const startBatch = useCreateVideoStore((s) => s.startBatch);
  const setBatchJobToken = useCreateVideoStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateVideoStore((s) => s.completeBatch);
  const failBatch = useCreateVideoStore((s) => s.failBatch);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  // Derived model capabilities
  const hasSizeOptions = (selectedModel?.aspect_ratio_options?.length ?? 0) > 0;
  const hasResolutionOptions =
    (selectedModel?.resolution_options?.length ?? 0) > 0;
  const hasSound = !!selectedModel?.show_generate_with_sound_toggle;
  const supportsImagePrompts =
    !!selectedModel?.starting_keyframe_supported ||
    !!selectedModel?.starting_keyframe_required ||
    !!selectedModel?.image_references_supported;
  const supportsRefMode =
    !!selectedModel?.image_references_supported ||
    !!selectedModel?.video_references_supported ||
    !!selectedModel?.audio_references_supported;
  const inputMode = ui.inputMode;
  const isReferenceMode = supportsRefMode && inputMode === "reference";
  const hasEndFrame = !!(
    selectedModel?.ending_keyframe_supported && !isReferenceMode
  );
  const needsImage =
    !!selectedModel?.starting_keyframe_required && referenceImages.length === 0;

  // Jobs + gallery
  const jobs = useGenerationJobs({ mediaType: "video", enabled: !!user });
  const gallery = useGalleryData({
    username: user?.username ?? null,
    filterMediaClasses: VIDEO_FILTER,
    excludeUploads: true,
  });

  // Map job token → batch count so PendingCard can show "N videos generating"
  const jobTokenToBatchCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const batch of batches) {
      if (batch.jobToken && batch.batchCount && batch.batchCount > 1) {
        map.set(batch.jobToken, batch.batchCount);
      }
    }
    return map;
  }, [batches]);

  const enrichedInProgress = useMemo(
    () =>
      jobs.inProgress.map((job) => {
        const batchCount = jobTokenToBatchCount.get(job.id);
        return batchCount ? { ...job, batchCount } : job;
      }),
    [jobs.inProgress, jobTokenToBatchCount],
  );

  const newlyCompletedTokens = useMemo(
    () => new Set(jobs.newlyCompleted.map((i) => i.id)),
    [jobs.newlyCompleted],
  );

  // Lightbox
  const flatItems = useMemo(() => {
    const filtered = gallery.items.filter(
      (i) => !newlyCompletedTokens.has(i.id),
    );
    return [...jobs.newlyCompleted, ...filtered];
  }, [jobs.newlyCompleted, gallery.items, newlyCompletedTokens]);

  const lightbox = useLightboxNav(flatItems);

  // Cost estimate
  const estimatedCredits = useVideoCostEstimate({
    model: selectedModel?.model ?? "",
    aspectRatio: selectedSize,
    resolution,
    duration: duration ?? selectedModel?.duration_seconds_default ?? null,
    numVideos,
    hasStartFrame: !isReferenceMode && referenceImages.length > 0,
    hasEndFrame: !isReferenceMode && hasEndFrame && !!endFrameImage,
    isReferenceMode,
    referenceImageCount: isReferenceMode ? referenceImages.length : 0,
    generateAudio: hasSound ? generateWithSound : undefined,
  });

  // Characters are supported for Seedance 2.0 and Seedance 2.0 Fast, in
  // both keyframe and reference input modes.
  const supportsCharacters =
    selectedModel?.model === "seedance_2p0" ||
    selectedModel?.model === "seedance_2p0_fast";
  const activeCharacters = supportsCharacters ? storedCharacters : [];

  // Popover items
  const mentionItems = useMemo((): MentionItem[] => {
    const refItems: MentionItem[] = isReferenceMode
      ? [
          ...referenceImages.map((img, i) => ({
            label: `@Image${i + 1}`,
            type: "image" as const,
            preview: img.url,
          })),
          ...referenceVideos.map((vid, i) => ({
            label: `@Video${i + 1}`,
            type: "video" as const,
            preview: vid.url,
          })),
          ...referenceAudios.map((_aud, i) => ({
            label: `@Audio${i + 1}`,
            type: "audio" as const,
            preview: undefined,
          })),
        ]
      : [];
    const charItems: MentionItem[] = activeCharacters.map((char) => ({
      label: `@${char.name}`,
      type: "character" as const,
      preview: char.avatar_image_url,
    }));
    return [...refItems, ...charItems];
  }, [
    isReferenceMode,
    referenceImages,
    referenceVideos,
    referenceAudios,
    activeCharacters,
  ]);

  const modelItems = useMemo(
    () => buildModelPopoverItems(apiModels, selectedModel?.model ?? ""),
    [apiModels, selectedModel?.model],
  );
  const sizeItems = useMemo(
    () =>
      buildSizePopoverItems(
        selectedModel?.aspect_ratio_options ?? [],
        selectedSize,
      ),
    [selectedModel?.aspect_ratio_options, selectedSize],
  );
  const durationRange = useMemo((): { min: number; max: number } | null => {
    if (!selectedModel) return null;
    if (
      selectedModel.duration_seconds_min != null &&
      selectedModel.duration_seconds_max != null &&
      selectedModel.duration_seconds_max > selectedModel.duration_seconds_min
    ) {
      return {
        min: selectedModel.duration_seconds_min,
        max: selectedModel.duration_seconds_max,
      };
    }
    if (
      selectedModel.duration_seconds_options &&
      selectedModel.duration_seconds_options.length > 1
    ) {
      const opts = [...selectedModel.duration_seconds_options].sort(
        (a, b) => a - b,
      );
      return { min: opts[0]!, max: opts[opts.length - 1]! };
    }
    return null;
  }, [selectedModel]);
  const effectiveDuration =
    duration ?? selectedModel?.duration_seconds_default ?? 5;
  const [localDuration, setLocalDuration] = useState(effectiveDuration);
  const durationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(durationTimerRef.current);
    setLocalDuration(effectiveDuration);
    return () => clearTimeout(durationTimerRef.current);
  }, [effectiveDuration]);
  const handleDurationSlide = useCallback(
    (v: number) => {
      setLocalDuration(v);
      clearTimeout(durationTimerRef.current);
      durationTimerRef.current = setTimeout(() => setDuration(v), 300);
    },
    [setDuration],
  );
  const resolutionItems = useMemo(
    (): PopoverItem[] | null =>
      selectedModel?.resolution_options
        ? selectedModel.resolution_options.map((r) => ({
            label: RES_LABELS[r] ?? r,
            selected: r === (resolution ?? selectedModel.resolution_default),
          }))
        : null,
    [selectedModel, resolution],
  );
  const inputModeItems = useMemo(
    (): PopoverItem[] | null =>
      supportsRefMode
        ? [
            {
              label: "Keyframe",
              description: "First/Last frame",
              selected: inputMode === "keyframe",
            },
            {
              label: "Reference",
              description: "Multi-media ref",
              selected: inputMode === "reference",
            },
          ]
        : null,
    [supportsRefMode, inputMode],
  );

  const hasContent =
    jobs.inProgress.length > 0 ||
    jobs.failed.length > 0 ||
    jobs.newlyCompleted.length > 0 ||
    gallery.items.length > 0 ||
    gallery.isInitialLoading;

  // ── Effects ──────────────────────────────────────────────────────────────

  // Consume a pending recreate payload (set by the lightbox Recreate button)
  // and populate the promptbox fields. Does NOT trigger generation. Subscribes
  // to the store so it fires even when the user is already on this route.
  //
  // References must commit BEFORE the prompt so the mention highlighter (which
  // builds its label regex from `referenceImages`/`referenceVideos`/etc.) knows
  // about every `@ImageN` before the contentEditable does its DOM sync. Without
  // this ordering, only the last reference's mention would end up colored.
  const pendingRecreate = useCreateVideoStore((s) => s.pendingRecreate);
  useEffect(() => {
    if (!pendingRecreate) return;
    const payload = useCreateVideoStore.getState().consumePendingRecreate();
    if (!payload) return;

    flushSync(() => {
      setRefs({
        referenceImages: payload.referenceImages,
        endFrameImage: payload.endFrameImage,
        referenceVideos: payload.referenceVideos ?? [],
        referenceAudios: payload.referenceAudios ?? [],
      });
      setUi({
        ...(payload.modelId ? { selectedModelId: payload.modelId } : {}),
        ...(payload.inputMode ? { inputMode: payload.inputMode } : {}),
      });
    });

    setUi({
      prompt: payload.prompt,
      ...(payload.aspectRatio ? { selectedSize: payload.aspectRatio } : {}),
      ...(payload.resolution ? { resolution: payload.resolution } : {}),
      ...(payload.durationSeconds != null
        ? { duration: payload.durationSeconds }
        : {}),
      ...(payload.generateWithSound != null
        ? { generateWithSound: payload.generateWithSound }
        : {}),
    });
  }, [pendingRecreate, setUi]);

  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    const pendingBatches = useCreateVideoStore
      .getState()
      .batches.filter((b) => b.status === "pending" && b.jobToken);

    for (const batch of pendingBatches) {
      if (cleanups.has(batch.id)) continue;
      const stop = startVideoPolling(
        batch.jobToken!,
        (video) => {
          completeBatch(batch.id, video);
          cleanups.delete(batch.id);
          window.dispatchEvent(new Event("task-queue-update"));
        },
        (reason) => {
          failBatch(batch.id, reason);
          cleanups.delete(batch.id);
          window.dispatchEvent(new Event("task-queue-update"));
        },
      );
      cleanups.set(batch.id, stop);
    }

    return () => {
      cleanups.forEach((stop) => stop());
      cleanups.clear();
    };
  }, [completeBatch, failBatch]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleModelChange = useCallback(
    (item: PopoverItem) => {
      const model = item.action ? _modelLookup.get(item.action) : undefined;
      if (!model) return;
      const currentState = useCreateVideoStore.getState().ui;
      const nextDuration = resolveDurationForModel(
        model,
        currentState.duration,
      );

      const newSupportsKeyframe =
        !!model.starting_keyframe_supported ||
        !!model.starting_keyframe_required;
      const newSupportsRefs =
        !!model.image_references_supported ||
        !!model.video_references_supported ||
        !!model.audio_references_supported;

      const nextInputMode =
        currentState.inputMode === "reference" && newSupportsRefs
          ? "reference"
          : "keyframe";

      setUi({
        selectedModelId: model.model,
        selectedSize: model.aspect_ratio_default ?? "wide_sixteen_by_nine",
        duration: nextDuration,
        resolution: model.resolution_default ?? null,
        generateWithSound: false,
        inputMode: nextInputMode,
        numVideos: Math.min(
          model.batch_size_max ?? 4,
          model.batch_size_default ?? 1,
        ),
      });

      // Only clear media that the new model can't use in any mode.
      if (!newSupportsKeyframe && !model.image_references_supported) {
        setReferenceImages([]);
      }
      if (!model.ending_keyframe_supported) {
        setEndFrameImage(undefined);
      }
      if (!model.video_references_supported) {
        setReferenceVideos([]);
      }
      if (!model.audio_references_supported) {
        setReferenceAudios([]);
      }
    },
    [setUi],
  );

  const handleSizeChange = useCallback(
    (item: PopoverItem) => {
      if (item.action) setSelectedSize(item.action);
    },
    [setSelectedSize],
  );

  const handleResolutionChange = useCallback(
    (item: PopoverItem) =>
      setResolution(LABEL_TO_RES[item.label] ?? item.label),
    [setResolution],
  );

  const handleInputModeChange = useCallback(
    (item: PopoverItem) => {
      const mode = item.label === "Reference" ? "reference" : "keyframe";
      if (mode === inputMode) return;
      setUi({ inputMode: mode });
      if (mode === "reference") {
        setEndFrameImage(undefined);
      } else {
        setReferenceVideos([]);
        setReferenceAudios([]);
      }
    },
    [inputMode, setUi],
  );

  const imagePickerMax = Math.max(
    1,
    (isReferenceMode ? (selectedModel?.image_references_max ?? 3) : 1) -
      referenceImages.length,
  );

  const handlePickerSelect = useCallback(
    (id: string) => {
      setPickerSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= imagePickerMax) {
          return imagePickerMax === 1 ? [id] : prev;
        }
        return [...prev, id];
      });
    },
    [imagePickerMax],
  );

  const handleEndFramePickerSelect = useCallback((id: string) => {
    setEndFramePickerSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Single-select: auto-swap
      return [id];
    });
  }, []);

  const handleLibraryImageSelect = useCallback(
    (items: GalleryItem[]) => {
      const maxImages = isReferenceMode
        ? (selectedModel?.image_references_max ?? 3)
        : 1;
      const availableSlots = Math.max(0, maxImages - referenceImages.length);
      const newImages: RefImage[] = items
        .slice(0, availableSlots)
        .map((item) => ({
          id: Math.random().toString(36).substring(7),
          url: item.thumbnail || item.fullImage || "",
          fullUrl: item.fullImage || undefined,
          file: new File([], "library-image"),
          mediaToken: item.id,
        }));
      setReferenceImages([...referenceImages, ...newImages]);
      setIsImagePickerOpen(false);
    },
    [referenceImages, isReferenceMode, selectedModel],
  );

  const handleEndFrameLibrarySelect = useCallback((items: GalleryItem[]) => {
    const item = items[0];
    if (!item) return;
    setEndFrameImage({
      id: Math.random().toString(36).substring(7),
      url: item.thumbnail || item.fullImage || "",
      fullUrl: item.fullImage || undefined,
      file: new File([], "library-image"),
      mediaToken: item.id,
    });
    setIsEndFramePickerOpen(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!loggedIn) {
      openSignupCta();
      return;
    }
    if (
      !prompt.trim() ||
      isGeneratingRef.current ||
      needsImage ||
      !selectedModel
    ) {
      console.log("[generate-video] blocked", {
        hasPrompt: !!prompt.trim(),
        isGenerating: isGeneratingRef.current,
        needsImage,
        hasModel: !!selectedModel,
      });
      return;
    }
    console.log("[generate-video] starting", {
      model: selectedModel.model,
      numVideos,
      inputMode,
      isReferenceMode,
    });
    isGeneratingRef.current = true;
    setIsGenerating(true);

    const startFrameToken =
      !isReferenceMode && supportsImagePrompts && referenceImages.length > 0
        ? referenceImages[0].mediaToken
        : undefined;
    const endFrameToken =
      !isReferenceMode && hasEndFrame && endFrameImage?.mediaToken
        ? endFrameImage.mediaToken
        : undefined;
    const referenceImageTokens =
      isReferenceMode && referenceImages.length > 0
        ? referenceImages
            .map((img) => img.mediaToken)
            .filter((t): t is string => typeof t === "string" && t.length > 0)
        : undefined;
    const referenceVideoTokens =
      isReferenceMode && referenceVideos.length > 0
        ? referenceVideos.map((v) => v.mediaToken).filter((t): t is string => typeof t === "string" && t.length > 0)
        : undefined;
    const referenceAudioTokens =
      isReferenceMode && referenceAudios.length > 0
        ? referenceAudios.map((a) => a.mediaToken).filter((t): t is string => typeof t === "string" && t.length > 0)
        : undefined;

    // Extract character tokens from @-mentions in the prompt. Match longest
    // names first and require a non-word boundary after so `@Bob` doesn't
    // false-match inside `@Bobby`, and only pick up characters that still
    // exist in the current store (stale names are ignored).
    const mentionedCharacters = (() => {
      if (activeCharacters.length === 0) return [];
      const sorted = [...activeCharacters].sort(
        (a, b) => b.name.length - a.name.length,
      );
      const matched = new Set<string>();
      for (const c of sorted) {
        const escaped = c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`@${escaped}(?![\\w])`);
        if (regex.test(prompt)) matched.add(c.character_token);
      }
      return activeCharacters.filter((c) => matched.has(c.character_token));
    })();
    const referenceCharacterTokens =
      mentionedCharacters.length > 0
        ? mentionedCharacters.map((c) => c.character_token)
        : undefined;

    const baseParams = {
      prompt: prompt.trim(),
      model: selectedModel.model,
      numVideos,
      aspectRatio: selectedSize,
      duration: duration ?? selectedModel.duration_seconds_default ?? undefined,
      resolution: hasResolutionOptions
        ? (resolution ?? selectedModel.resolution_default ?? undefined)
        : undefined,
      generateAudio: hasSound ? generateWithSound : undefined,
      startFrameImageMediaToken: startFrameToken?.length
        ? startFrameToken
        : undefined,
      endFrameImageMediaToken: endFrameToken?.length
        ? endFrameToken
        : undefined,
      referenceImageMediaTokens: referenceImageTokens?.length
        ? referenceImageTokens
        : undefined,
      referenceVideoMediaTokens: referenceVideoTokens?.length
        ? referenceVideoTokens
        : undefined,
      referenceAudioMediaTokens: referenceAudioTokens?.length
        ? referenceAudioTokens
        : undefined,
      referenceCharacterTokens,
    };
    console.log("[generate-video] params", baseParams);

    const modelLabel = selectedModel.full_name ?? selectedModel.model;
    const batchId = startBatch(prompt, modelLabel, numVideos > 1 ? numVideos : undefined);

    try {
      console.log("[generate-video] enqueueing job...");
      const result = await enqueueVideoGeneration(baseParams);
      console.log("[generate-video] enqueue result", result);

      if (!result.success || !result.jobToken) {
        console.warn("[generate-video] enqueue failed", result.error);
        failBatch(batchId, result.error ?? "Failed to start generation");
      } else {
        setBatchJobToken(batchId, result.jobToken);
        console.log("[generate-video] polling started", {
          jobToken: result.jobToken,
        });

        const stopPolling = startVideoPolling(
          result.jobToken,
          (video) => {
            console.log("[generate-video] complete", {
              batchId,
              media_token: video.media_token,
            });
            completeBatch(batchId, video);
            pollingCleanupsRef.current.delete(batchId);
            window.dispatchEvent(new Event("task-queue-update"));
          },
          (reason) => {
            console.warn("[generate-video] poll failed", { batchId, reason });
            failBatch(batchId, reason);
            pollingCleanupsRef.current.delete(batchId);
            window.dispatchEvent(new Event("task-queue-update"));
          },
        );
        pollingCleanupsRef.current.set(batchId, stopPolling);
      }
    } catch (err) {
      console.error("[generate-video] unexpected error", err);
      failBatch(batchId, "Network error - please try again");
    }

    window.dispatchEvent(new Event("credits-change"));
    window.dispatchEvent(new Event("task-queue-update"));
    console.log("[generate-video] done enqueuing");
    setIsGenerating(false);
    isGeneratingRef.current = false;
  }, [
    loggedIn,
    openSignupCta,
    prompt,
    needsImage,
    isReferenceMode,
    selectedModel,
    selectedSize,
    numVideos,
    duration,
    resolution,
    generateWithSound,
    hasResolutionOptions,
    hasSound,
    supportsImagePrompts,
    hasEndFrame,
    referenceImages,
    endFrameImage,
    referenceVideos,
    referenceAudios,
    activeCharacters,
    startBatch,
    setBatchJobToken,
    completeBatch,
    failBatch,
  ]);

  // ── Render ────────────────────────────────────────────────────────────

  const videoGlowOrbs = (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-10%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-[0.12] blur-[120px] transform-gpu" />
      <div className="absolute bottom-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-purple-600 opacity-[0.08] blur-[120px] transform-gpu" />
      <div className="absolute bottom-[10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-600 to-pink-500 opacity-[0.06] blur-[140px] transform-gpu" />
    </div>
  );

  return (
    <CreateMediaPageShell
      title="Create Video - ArtCraft"
      description="Generate stunning AI videos with ArtCraft"
      authChecked={authChecked}
      hasContent={hasContent}
      emptyStateTitle="Generate Video"
      emptyStateSubtitle="Add a prompt, then generate"
      bottomOffset={promptHeight + 24}
      modelItems={modelItems}
      onModelChange={handleModelChange}
      glowOrbs={videoGlowOrbs}
      gridContent={
        <GenerationGalleryGrid
          inProgressJobs={enrichedInProgress}
          failedJobs={jobs.failed}
          onDismissFailed={jobs.dismissFailed}
          newlyCompletedItems={jobs.newlyCompleted}
          galleryItems={gallery.items}
          newlyCompletedTokens={newlyCompletedTokens}
          hasMore={gallery.hasMore}
          isLoading={gallery.isLoading}
          isInitialLoading={gallery.isInitialLoading}
          onLoadMore={gallery.loadMore}
          onGalleryItemClick={lightbox.handleGalleryItemClick}
        />
      }
      promptBox={
        <div
          ref={promptBoxRef}
          className="animate-fade-in-up fixed bottom-2 sm:bottom-3 right-0 z-30 mx-auto w-full max-w-[900px] px-2 sm:px-4 transition-[left] duration-200 ease-linear"
          style={{
            animationDelay: "150ms",
            left: "var(--ac-sidebar-offset, 0px)",
          }}
        >
          {/* {selectedModel?.model === "seedance_2p0" && (
            <div className="mb-2 flex items-start gap-2.5 rounded-lg border border-yellow-500/40 px-3.5 py-2.5 text-xs text-yellow-200 shadow-lg backdrop-blur-xl bg-yellow-800/60">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
              <span>
                Seedance 2.0 is in Early Alpha. Generations may be slow and may experience outages.
                Seedance may reject safe inputs unexpectedly. Try several short generations before longer ones.
              </span>
            </div>
          )} */}
          <PromptBox
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleGenerate}
            isSubmitting={isGenerating || needsImage}
            credits={estimatedCredits}
            placeholder="Describe the video you want to generate..."
            supportsImagePrompts={supportsImagePrompts}
            maxImagePromptCount={
              isReferenceMode ? (selectedModel?.image_references_max ?? 3) : 1
            }
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            isVideo
            isReferenceMode={isReferenceMode}
            endFrameImage={endFrameImage}
            onEndFrameImageChange={setEndFrameImage}
            showEndFrameSection={hasEndFrame}
            onPickFromLibrary={
              supportsImagePrompts
                ? () => setIsImagePickerOpen(true)
                : undefined
            }
            onPickEndFrameFromLibrary={
              hasEndFrame ? () => setIsEndFramePickerOpen(true) : undefined
            }
            modelSelector={
              <Tooltip
                content="Model"
                position="top"
                className="z-50"
                closeOnClick
              >
                <PopoverMenu
                  items={modelItems}
                  onSelect={handleModelChange}
                  mode="toggle"
                  panelTitle="Select Model"
                  showIconsInList
                  triggerIcon={
                    <img
                      src={getModelCreatorIconPath(selectedModel?.model ?? "")}
                      alt=""
                      className="h-4 w-4 icon-auto-contrast"
                    />
                  }
                />
              </Tooltip>
            }
            onClearAllRefs={() =>
              setRefs({
                referenceImages: [],
                endFrameImage: undefined,
                referenceVideos: [],
                referenceAudios: [],
              })
            }
            mentionItems={mentionItems.length > 0 ? mentionItems : undefined}
            mediaReferenceRow={
              isReferenceMode ? (
                <MediaReferenceRow
                  referenceVideos={referenceVideos}
                  onReferenceVideosChange={setReferenceVideos}
                  maxVideoCount={selectedModel?.video_references_max ?? 3}
                  maxVideoRefDuration={
                    selectedModel?.video_references_max_total_duration_seconds ??
                    30
                  }
                  referenceAudios={referenceAudios}
                  onReferenceAudiosChange={setReferenceAudios}
                  maxAudioCount={selectedModel?.audio_references_max ?? 2}
                  maxAudioRefDuration={
                    selectedModel?.audio_references_max_total_duration_seconds ??
                    30
                  }
                />
              ) : undefined
            }
            rightToolbar={
              <GenerationCountPicker
                batchSizeMax={selectedModel?.batch_size_max ?? 4}
                batchSizeOptions={selectedModel?.batch_size_options}
                currentCount={numVideos}
                handleCountChange={setNumVideos}
                panelTitle="No. of videos"
              />
            }
            leftToolbar={
              <>
                {hasSizeOptions && (
                  <Tooltip
                    content="Aspect Ratio"
                    position="top"
                    className="z-50"
                    closeOnClick
                  >
                    <PopoverMenu
                      items={sizeItems}
                      onSelect={handleSizeChange}
                      mode="toggle"
                      panelTitle="Aspect Ratio"
                      showIconsInList
                      triggerIcon={
                        AUTO_RATIOS.has(selectedSize) ? (
                          <AutoIcon />
                        ) : (
                          <AspectRatioIcon commonAspectRatio={selectedSize} />
                        )
                      }
                    />
                  </Tooltip>
                )}
                {resolutionItems && (
                  <Tooltip
                    content="Resolution"
                    position="top"
                    className="z-50"
                    closeOnClick
                  >
                    <PopoverMenu
                      items={resolutionItems}
                      onSelect={handleResolutionChange}
                      mode="toggle"
                      panelTitle="Resolution"
                    />
                  </Tooltip>
                )}
                {durationRange && (
                  <Tooltip content="Duration" position="top" className="z-50">
                    <PopoverMenu
                      mode="default"
                      panelTitle="Duration"
                      triggerIcon={
                        <FontAwesomeIcon
                          icon={faClock}
                          className="h-3.5 w-3.5"
                        />
                      }
                      triggerLabel={`${effectiveDuration}s`}
                    >
                      <div className="w-[min(16rem,calc(100vw-2rem))] pb-0.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1">
                            <SliderV2
                              min={durationRange.min}
                              max={durationRange.max}
                              value={localDuration}
                              onChange={handleDurationSlide}
                              step={1}
                              suffix="s"
                              variant="filled"
                            />
                          </div>
                          <span className="text-base-fg min-w-6 shrink-0 text-sm font-medium tabular-nums">
                            {localDuration}s
                          </span>
                        </div>
                        <div className="text-base-fg/40 mt-1.5 flex justify-between px-0.5 text-[11px] tabular-nums">
                          <span>{durationRange.min}s</span>
                          <span>{durationRange.max}s</span>
                        </div>
                      </div>
                    </PopoverMenu>
                  </Tooltip>
                )}
                {hasSound && (
                  <Tooltip
                    content={generateWithSound ? "Sound: ON" : "Sound: OFF"}
                    position="top"
                    className="z-50"
                    delay={200}
                  >
                    <ToggleButton
                      isActive={generateWithSound}
                      icon={faWaveformLines}
                      activeIcon={faWaveformLines}
                      onClick={() =>
                        setUi({ generateWithSound: !generateWithSound })
                      }
                      className={
                        generateWithSound
                          ? "bg-primary/40 hover:bg-primary/50 border-primary/30"
                          : undefined
                      }
                    />
                  </Tooltip>
                )}
                {inputModeItems && (
                  <Tooltip
                    content="Input Mode"
                    position="top"
                    className="z-50"
                    closeOnClick
                  >
                    <PopoverMenu
                      items={inputModeItems}
                      onSelect={handleInputModeChange}
                      mode="toggle"
                      panelTitle="Input Mode"
                    />
                  </Tooltip>
                )}
                {supportsCharacters && (
                  <button
                    type="button"
                    onClick={() => setIsCharactersModalOpen(true)}
                    className="flex h-9 items-center justify-center gap-1 rounded-lg border border-ui-controls-border bg-ui-controls px-3 text-sm font-medium text-base-fg shadow-sm transition-all duration-150 hover:bg-ui-controls/80 active:scale-95"
                  >
                    @Characters
                  </button>
                )}
              </>
            }
          />
        </div>
      }
      modals={
        <>
          <GalleryModal
            mode="select"
            isOpen={isImagePickerOpen}
            onClose={() => setIsImagePickerOpen(false)}
            selectedItemIds={pickerSelectedIds}
            onSelectItem={handlePickerSelect}
            maxSelections={imagePickerMax}
            onUseSelected={handleLibraryImageSelect}
            forceFilter="image"
            hideFilter
          />
          <GalleryModal
            mode="select"
            isOpen={isEndFramePickerOpen}
            onClose={() => setIsEndFramePickerOpen(false)}
            selectedItemIds={endFramePickerSelectedIds}
            onSelectItem={handleEndFramePickerSelect}
            maxSelections={1}
            onUseSelected={handleEndFrameLibrarySelect}
            forceFilter="image"
            hideFilter
          />
          <CharactersModal
            isOpen={isCharactersModalOpen}
            onClose={() => setIsCharactersModalOpen(false)}
            onSelectCharacter={(character) => {
              const mention = `@${character.name}`;
              const spaceBefore =
                prompt.length > 0 && !prompt.endsWith(" ") ? " " : "";
              setPrompt(prompt + spaceBefore + mention + " ");
              setIsCharactersModalOpen(false);
            }}
          />
          <Lightbox
            isOpen={lightbox.lightboxOpen}
            onClose={lightbox.closeLightbox}
            mediaToken={lightbox.lightboxItem?.id}
            cdnUrl={lightbox.lightboxItem?.fullImage}
            mediaClass={lightbox.lightboxItem?.mediaClass}
            batchImageToken={lightbox.lightboxItem?.batchImageToken}
            showBatchCarousel={false}
            onNavigatePrev={lightbox.navigatePrev}
            onNavigateNext={lightbox.navigateNext}
            onDeleted={gallery.removeItem}
          />
        </>
      }
    />
  );
}
