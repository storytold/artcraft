import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCircleExclamation,
  faFilm,
  faSpinnerThird,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { UsersApi, UserInfo } from "@storyteller/api";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Badge } from "@storyteller/ui-badge";
import {
  VIDEO_MODELS,
  VideoModel,
  type SizeOption,
  getCreatorIcon,
} from "@storyteller/model-list";
import { PromptBox, type RefImage } from "../../components/prompt-box";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { useCreateVideoStore } from "./create-video-store";
import {
  enqueueVideoGeneration,
  videoModelHasWebEndpoint,
  startVideoPolling,
} from "./generate-video-api";
import { AspectRatioIcon } from "../create-image/components/AspectRatioIcon";

// ── Models available via REST ─────────────────────────────────────────────

const WEB_VIDEO_MODELS = VIDEO_MODELS.filter(
  (m) => !m.requiresImage && videoModelHasWebEndpoint(m.tauriId),
).sort((a, b) => a.selectorName.localeCompare(b.selectorName));

const DEFAULT_MODEL =
  WEB_VIDEO_MODELS.find((m) => m.id === "kling_3p0_pro") ?? WEB_VIDEO_MODELS[0];

const MODEL_FALLBACK_ICON = (
  <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
);

// ── Build PopoverMenu items ───────────────────────────────────────────────

function buildModelPopoverItems(
  models: VideoModel[],
  selectedId: string,
): PopoverItem[] {
  return models.map((model) => ({
    label: model.selectorName,
    selected: model.id === selectedId,
    icon: getCreatorIcon(model.creator) ?? MODEL_FALLBACK_ICON,
    description: model.selectorDescription,
    badges: model.toLegacyBadges()?.map((b) => ({
      label: b.label,
      icon: <FontAwesomeIcon icon={faClock} />,
    })),
    model: model,
  }));
}

function buildSizePopoverItems(
  sizeOptions: SizeOption[],
  selectedValue: string,
): PopoverItem[] {
  return sizeOptions.map((opt) => ({
    label: opt.textLabel,
    selected: opt.tauriValue === selectedValue,
    icon: <AspectRatioIcon sizeIcon={opt.icon} />,
    sizeOption: opt,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CreateVideo() {
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);

  // Generation state
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<VideoModel>(DEFAULT_MODEL);
  const [selectedSize, setSelectedSize] = useState<string>(
    DEFAULT_MODEL.sizeOptions[0]?.tauriValue ?? "wide_sixteen_by_nine",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages] = useState<RefImage[]>([]);

  // Prompt height for dynamic padding
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState(138);

  // Store
  const batches = useCreateVideoStore((s) => s.batches);
  const startBatch = useCreateVideoStore((s) => s.startBatch);
  const setBatchJobToken = useCreateVideoStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateVideoStore((s) => s.completeBatch);
  const failBatch = useCreateVideoStore((s) => s.failBatch);
  const dismissBatch = useCreateVideoStore((s) => s.dismissBatch);
  const resetBatches = useCreateVideoStore((s) => s.reset);

  // Active polling cleanup refs
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  const hasAnyBatches = batches.length > 0;
  const inverseBatches = useMemo(() => [...batches].reverse(), [batches]);

  const hasSizeOptions = selectedModel.sizeOptions.length > 0;

  // Model popover items
  const modelItems = useMemo(
    () => buildModelPopoverItems(WEB_VIDEO_MODELS, selectedModel.id),
    [selectedModel.id],
  );

  // Size popover items
  const sizeItems = useMemo(
    () => buildSizePopoverItems(selectedModel.sizeOptions, selectedSize),
    [selectedModel.sizeOptions, selectedSize],
  );

  // ── Effects ──────────────────────────────────────────────────────────────

  // Check auth
  useEffect(() => {
    const checkSession = async () => {
      const api = new UsersApi();
      const response = await api.GetSession();
      if (response.success && response.data?.loggedIn && response.data.user) {
        setUser(response.data.user);
      }
      setAuthChecked(true);
    };
    checkSession();

    const handleAuthChange = () => checkSession();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    return () => {
      cleanups.forEach((stop) => stop());
      cleanups.clear();
    };
  }, []);

  // Measure prompt box height for batch area padding
  useEffect(() => {
    const el = promptBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleModelChange = useCallback((item: PopoverItem) => {
    const model = (item as any).model as VideoModel | undefined;
    if (!model) return;
    setSelectedModel(model);
    setSelectedSize(model.sizeOptions[0]?.tauriValue ?? "wide_sixteen_by_nine");
  }, []);

  const handleSizeChange = useCallback((item: PopoverItem) => {
    const opt = (item as any).sizeOption as SizeOption | undefined;
    if (opt) setSelectedSize(opt.tauriValue);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    const batchId = startBatch(prompt, selectedModel.fullName);

    try {
      const result = await enqueueVideoGeneration({
        prompt: prompt.trim(),
        modelTauriId: selectedModel.tauriId,
        aspectRatio: selectedSize,
        duration: selectedModel.defaultDuration,
      });

      if (!result.success || !result.jobToken) {
        failBatch(batchId, result.error ?? "Failed to start generation");
        setIsGenerating(false);
        return;
      }

      setBatchJobToken(batchId, result.jobToken);
      window.dispatchEvent(new Event("credits-change"));
      window.dispatchEvent(new Event("task-queue-update"));

      const stopPolling = startVideoPolling(
        result.jobToken,
        (video) => {
          completeBatch(batchId, video);
          pollingCleanupsRef.current.delete(batchId);
          window.dispatchEvent(new Event("task-queue-update"));
        },
        (reason) => {
          failBatch(batchId, reason);
          pollingCleanupsRef.current.delete(batchId);
          window.dispatchEvent(new Event("task-queue-update"));
        },
      );

      pollingCleanupsRef.current.set(batchId, stopPolling);
    } catch {
      failBatch(batchId, "Network error - please try again");
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt,
    isGenerating,
    selectedModel,
    selectedSize,
    startBatch,
    setBatchJobToken,
    completeBatch,
    failBatch,
  ]);

  // ── Render ────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101014]">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-2xl text-white/40"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#101014] text-white">
        <Seo
          title="Create Video - ArtCraft"
          description="Generate stunning AI videos with ArtCraft"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-teal-400/10 opacity-40 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20">
          <FontAwesomeIcon
            icon={faFilm}
            className="mb-6 text-5xl text-white/20"
          />
          <h1 className="mb-3 text-4xl font-bold">Create Video</h1>
          <p className="mb-8 max-w-md text-center text-lg text-white/60">
            Sign in to generate stunning AI videos with multiple models
          </p>
          <div className="flex gap-3">
            <Link to="/login">
              <Button
                variant="primary"
                className="bg-white px-6 py-2.5 font-semibold text-black shadow-md hover:bg-white/90"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="primary"
                className="px-6 py-2.5 font-semibold shadow-md"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const bottomOffsetPx = promptHeight + 48;

  return (
    <div className="flex h-screen w-full bg-[#101014] text-white">
      <Seo
        title="Create Video - ArtCraft"
        description="Generate stunning AI videos with ArtCraft"
      />

      {/* Background image + vignette */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat opacity-30 grayscale"
          style={{ backgroundImage: "url('/images/forest-trees.png')" }}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(50%_50%_at_50%_50%,_transparent_49%,_rgba(0,0,0,0.6)_100%)]" />

      <div className="relative z-[1] h-full w-full p-4 lg:p-16">
        <div className="flex h-full w-full flex-col items-center justify-center">
          {/* ── Empty state ─────────────────────────────────────────── */}
          {!hasAnyBatches && (
            <div className="relative z-20 mb-32 flex flex-col items-center justify-center text-center drop-shadow-xl">
              <h1 className="text-5xl font-bold text-white md:text-7xl">
                Generate Video
              </h1>
              <span className="pt-2 text-lg text-white/80 md:text-xl">
                Add a prompt, then generate
              </span>
            </div>
          )}

          {/* ── Batch results ───────────────────────────────────────── */}
          {hasAnyBatches && (
            <div
              className="h-full w-full overflow-y-auto pt-20"
              style={{ paddingBottom: bottomOffsetPx }}
            >
              <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-2">
                {inverseBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="relative flex items-stretch gap-4"
                  >
                    {/* Video area */}
                    <div className="flex-1">
                      {batch.status === "failed" ? (
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-red-500/10 text-red-400">
                          <FontAwesomeIcon
                            icon={faCircleExclamation}
                            size="2x"
                          />
                          <span className="px-4 text-center text-sm font-medium">
                            {batch.failureReason || "Generation failed"}
                          </span>
                          <button
                            onClick={() => dismissBatch(batch.id)}
                            className="mt-1 flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                            Dismiss
                          </button>
                        </div>
                      ) : batch.status === "pending" ? (
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-white/[0.03]">
                          <div className="flex h-full w-full items-center justify-center">
                            <FontAwesomeIcon
                              icon={faSpinnerThird}
                              className="animate-spin text-3xl text-white/20"
                            />
                          </div>
                        </div>
                      ) : batch.video ? (
                        <video
                          className="aspect-video w-full rounded-lg bg-black/10 object-contain"
                          src={batch.video.cdn_url}
                          controls
                          autoPlay
                          loop
                          muted
                        />
                      ) : null}
                    </div>

                    {/* Sidebar spacer (desktop) */}
                    <div
                      className="hidden w-[320px] shrink-0 lg:flex"
                      aria-hidden="true"
                    />

                    {/* Sidebar with prompt + badge (desktop) */}
                    <div className="absolute bottom-0 right-0 top-0 hidden w-[320px] flex-col lg:flex">
                      <div className="glass min-h-0 overflow-y-auto rounded-xl px-4 py-3 text-left text-sm text-white/90">
                        {batch.prompt}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Badge
                          label={batch.modelLabel}
                          className="px-2 py-1 text-xs opacity-70"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Prompt box (fixed bottom center) ───────────────────── */}
          <div className="fixed bottom-6 left-1/2 z-30 w-full max-w-[730px] -translate-x-1/2 px-4">
            <PromptBox
              ref={promptBoxRef}
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              isSubmitting={isGenerating}
              placeholder="Describe the video you want to generate..."
              supportsImagePrompts={false}
              referenceImages={referenceImages}
              onReferenceImagesChange={() => {}}
              showClearSession={hasAnyBatches}
              onClearSession={resetBatches}
              leftToolbar={
                hasSizeOptions ? (
                  <PopoverMenu
                    items={sizeItems}
                    onSelect={handleSizeChange}
                    mode="toggle"
                    panelTitle="Aspect Ratio"
                    showIconsInList
                    triggerIcon={
                      <AspectRatioIcon
                        sizeIcon={
                          selectedModel.sizeOptions.find(
                            (s) => s.tauriValue === selectedSize,
                          )?.icon
                        }
                      />
                    }
                  />
                ) : undefined
              }
            />
          </div>

          {/* ── Model selector (bottom left) ───────────────────────── */}
          <div className="fixed bottom-6 left-6 z-20 hidden items-center gap-5 lg:flex">
            <PopoverMenu
              items={modelItems}
              onSelect={handleModelChange}
              mode="hoverSelect"
              panelTitle="Select Model"
              panelClassName="min-w-[300px]"
              buttonClassName="bg-transparent border-0 shadow-none p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
              showIconsInList
              triggerLabel="Model"
              maxListHeight={400}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
