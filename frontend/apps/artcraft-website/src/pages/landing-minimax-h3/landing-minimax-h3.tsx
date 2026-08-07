import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCamera,
  faClock,
  faFilm,
  faLayerGroup,
  faPaintBrush,
  faPlay,
  faSpinnerThird,
  faWaveformLines,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import type { OmniGenVideoModelInfo } from "@storyteller/api";
import { useOmniGenVideoModels } from "@storyteller/omni-gen";
import {
  effectivePromptMaxLength,
  getCreatorIconPathForModelId,
} from "@storyteller/model-list";
import { ToggleButton } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { Tooltip } from "@storyteller/ui-tooltip";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { TruchetPattern } from "../../components/truchet-pattern";
import { PromptBox, type RefImage } from "../../components/prompt-box";
import { AuthGateModal } from "../../components/auth";
import { toast } from "../../components/toast/toast";
import { useSession } from "../../lib/session";
import { getPageMeta } from "../../config/page-meta";
import { webappUrl } from "../../config/links";
import {
  AspectRatioIcon,
  AutoIcon,
} from "../create-image/components/AspectRatioIcon";
import {
  enqueueVideoGeneration,
  startVideoPolling,
} from "../create-video/generate-video-api";
import {
  AUTO_RATIOS,
  LABEL_TO_RES,
  buildResolutionPopoverItems,
  buildSizePopoverItems,
  getDurationRange,
} from "../create-video/video-model-options";

gsap.registerPlugin(ScrollTrigger);

// ── Constants ────────────────────────────────────────────────────────────

const MODEL_ID = "minimax_h3";
const MODEL_NAME = "MiniMax H3";
const PAGE_PATH = "/minimax-h3";
const SIGNUP_SOURCE = "minimax_h3_landing";

const PAGE_META = getPageMeta(PAGE_PATH);

// Stand-in capabilities (from MiniMax's published H3 specs) used when the
// model listing hasn't loaded or doesn't include H3 yet, so the settings
// toolbar always renders. Server-reported values take precedence the moment
// the listing resolves.
const H3_FALLBACK_MODEL_INFO: OmniGenVideoModelInfo = {
  model: MODEL_ID,
  model_creator: "hailuo",
  is_disabled: false,
  full_name: MODEL_NAME,
  aspect_ratio_options: [
    "wide_sixteen_by_nine",
    "tall_nine_by_sixteen",
    "square",
  ],
  aspect_ratio_default: "wide_sixteen_by_nine",
  resolution_options: ["seven_twenty_p", "two_k"],
  resolution_default: "two_k",
  batch_size_options: null,
  batch_size_default: 1,
  batch_size_min: 1,
  batch_size_max: 1,
  quality_options: null,
  default_quality: null,
  bitrate_options: null,
  bitrate_default: null,
  duration_seconds_options: null,
  duration_seconds_default: 10,
  duration_seconds_min: 5,
  duration_seconds_max: 15,
  duration_seconds_max_with_image_references: null,
  starting_keyframe_supported: true,
  starting_keyframe_required: false,
  ending_keyframe_supported: false,
  show_generate_with_sound_toggle: true,
  image_references_supported: null,
  image_references_max: null,
  video_references_supported: null,
  video_references_max: null,
  video_references_max_total_duration_seconds: null,
  audio_references_supported: null,
  audio_references_max: null,
  audio_references_max_total_duration_seconds: null,
  character_references_supported: null,
  character_references_max: null,
  text_prompt_supported: true,
  text_to_video_supported: true,
  text_prompt_max_length: null,
  negative_text_prompt_supported: null,
  negative_text_prompt_max_length: null,
};

// Clicking a chip drops the prompt straight into the promptbox. Each one is
// written to show off something H3 is specifically good at (sound, camera
// language, text rendering).
const SAMPLE_PROMPTS: ReadonlyArray<string> = [
  "Slow dolly-in on a barista pouring latte art, morning light, soft cafe ambience and the hiss of the steam wand",
  "A humpback whale breaches at golden hour, seabirds calling, waves crashing in stereo, drone shot pulling back",
  'Neon-lit storefront at night, rain on the glass, a flickering sign that reads "OPEN ALL NIGHT", distant traffic hum',
];

const HIGHLIGHTS: ReadonlyArray<{
  icon: typeof faCamera;
  title: string;
  body: string;
}> = [
  {
    icon: faCamera,
    title: "Native 2K",
    body: "Sharp 2K output by default, with a faster 768p mode when you want quick drafts.",
  },
  {
    icon: faClock,
    title: "Up to 15 seconds",
    body: "Enough room for an actual beat: setup, action, payoff, instead of a four-second loop.",
  },
  {
    icon: faWaveformLines,
    title: "Stereo sound built in",
    body: "Audio is generated together with the picture, so ambience and effects land in sync.",
  },
  {
    icon: faLayerGroup,
    title: "Truly multimodal",
    body: "One model that understands text, images, video, and audio as unified input.",
  },
  {
    icon: faPaintBrush,
    title: "Text that reads",
    body: "Unusually accurate text and logo rendering for signs, packaging, and title cards.",
  },
  {
    icon: faFilm,
    title: "Multi-shot scenes",
    body: "Holds characters and style across cuts for short sequences, not just single shots.",
  },
];

// Factual overview based on MiniMax's H3 announcement. Kept honest and
// spec-driven rather than hype-driven; the free offer is the pitch.
const OVERVIEW_PARAGRAPHS: ReadonlyArray<string> = [
  "MiniMax H3 is the newest generation model from MiniMax, the lab behind the Hailuo video family. Rather than a video-only specialist, H3 is a general-purpose multimodal model: it understands text, images, video, and audio as one unified input, and generates video with native stereo sound in a single pass.",
  "In practice, that shows up as a model that follows instructions unusually well. It renders on-screen text and brand marks accurately, transfers motion from reference footage, keeps characters and style consistent across multi-shot sequences, and produces clips up to 15 seconds at 2K by default, with a faster 768p mode for drafts.",
  "MiniMax is positioning H3 for commercial work (advertising, e-commerce, product design, game content) where control and accuracy matter more than lucky rolls. It is also priced aggressively: MiniMax says 2K output costs less than a third of comparable mainstream models.",
  "On ArtCraft you don't have to take anyone's word for it. H3 generations are free right now: type a prompt at the top of this page and judge the model on your own footage.",
];

const MINIMAX_BLOG_URL = "https://www.minimax.io/blog/minimax-h3";

// Sample generations from MiniMax's H3 announcement post, re-hosted under
// public/videos/minimax-h3/ and credited in the Examples section. The
// stereo-sound demo ships at an ultra-wide 92:39, hence the `wide` flag.
// `spanClass` tiles 1 wide + 5 standard cards with no empty slots at any
// breakpoint: featured full-width, a row of three, then a row of two on lg;
// full-width / 2x2 / full-width on sm.
interface ExampleVideo {
  label: string;
  src: string;
  poster: string;
  wide?: boolean;
  spanClass?: string;
}

const EXAMPLE_VIDEOS: ReadonlyArray<ExampleVideo> = [
  {
    label: "Native stereo sound, generated with the picture",
    src: "/videos/minimax-h3/stereo-sound.mp4",
    poster: "/videos/minimax-h3/posters/stereo-sound.jpg",
    wide: true,
    spanClass: "sm:col-span-2 lg:col-span-6",
  },
  {
    label: "2K performance",
    src: "/videos/minimax-h3/2k-performance.mp4",
    poster: "/videos/minimax-h3/posters/2k-performance.jpg",
    spanClass: "lg:col-span-2",
  },
  {
    label: "Film opening titles",
    src: "/videos/minimax-h3/film-opening-titles.mp4",
    poster: "/videos/minimax-h3/posters/film-opening-titles.jpg",
    spanClass: "lg:col-span-2",
  },
  {
    label: "Product website",
    src: "/videos/minimax-h3/product-website.mp4",
    poster: "/videos/minimax-h3/posters/product-website.jpg",
    spanClass: "lg:col-span-2",
  },
  {
    label: "Animated poster",
    src: "/videos/minimax-h3/animated-poster.mp4",
    poster: "/videos/minimax-h3/posters/animated-poster.jpg",
    spanClass: "lg:col-span-3",
  },
  {
    label: "Advertising and e-commerce",
    src: "/videos/minimax-h3/advertising-ecommerce.mp4",
    poster: "/videos/minimax-h3/posters/advertising-ecommerce.jpg",
    spanClass: "sm:col-span-2 lg:col-span-3",
  },
];

const PROMPT_TIPS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Write the soundtrack too",
    body: "H3 generates audio with the picture, so tell it what you want to hear: room tone, footsteps, a distant siren, a music cue. Prompts that describe sound get noticeably better mixes.",
  },
  {
    title: "Call the shots like a director",
    body: 'Name the shot type, the camera move, and the action as separate short beats. "Slow dolly-in on..." beats one long run-on wish the model has to untangle.',
  },
  {
    title: "Use real text deliberately",
    body: "H3 is unusually good at rendering words. If you want a sign, a label, or a title card in the shot, put the exact text in quotes in your prompt.",
  },
  {
    title: "One scene, one idea",
    body: "Fifteen seconds is a moment, not a movie. Give the clip a single clear action with a beginning and an end, then iterate on the takes you like.",
  },
];

const FAQ_ITEMS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: "Is MiniMax H3 really free on ArtCraft?",
    answer:
      "Yes. MiniMax H3 generations are currently free for everyone with an ArtCraft account, and creating an account is free too. You can generate right here on this page. If that ever changes, the cost will be shown on the Generate button before you run anything.",
  },
  {
    question: "What is MiniMax H3?",
    answer:
      "H3 is MiniMax's general-purpose multimodal generation model, from the lab behind the Hailuo video family. It takes text, images, video, and audio as unified input and generates video with native stereo sound, with strong instruction following and accurate on-screen text rendering.",
  },
  {
    question: "How long and what resolution are the videos?",
    answer:
      "H3 generates clips up to 15 seconds and is built for 2K output, with a faster 768p mode also available. This page uses the model's default settings to keep things simple; the full ArtCraft app gives you control over resolution, duration, and aspect ratio.",
  },
  {
    question: "Does it generate sound?",
    answer:
      "Yes. H3 generates stereo audio jointly with the video, so ambience, effects, and music land in sync instead of being bolted on afterward. Describe the sound you want in your prompt and it becomes part of the shot.",
  },
  {
    question: "Where do my videos go?",
    answer:
      "Every generation is saved to your ArtCraft library. You can watch and download it right here on this page, or open the ArtCraft app to organize your takes and use them in bigger projects.",
  },
  {
    question: "Can I use my own images or footage?",
    answer:
      "Yes. Once you're signed in, you can add a start frame (and an end frame, where supported) right in the promptbox above, alongside aspect ratio, resolution, duration, and sound settings. The full ArtCraft app unlocks the rest of H3: reference images, video, and audio, plus every other leading model in one place.",
  },
];

const GATE_PERKS: ReadonlyArray<string> = [
  "MiniMax H3 generations are free right now",
  "Every video is saved to your personal library",
  "One account for the web app and the desktop app",
];

// ── Hero generation state ────────────────────────────────────────────────

interface HeroGeneration {
  id: string;
  prompt: string;
  status: "pending" | "complete" | "failed";
  videoUrl?: string;
  error?: string;
}

// ── Component ────────────────────────────────────────────────────────────

const LandingMinimaxH3 = () => {
  const { loggedIn } = useSession();
  const { models } = useOmniGenVideoModels();
  const modelInfo =
    models.find((m) => m.model === MODEL_ID) ?? H3_FALLBACK_MODEL_INFO;

  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generations, setGenerations] = useState<HeroGeneration[]>([]);
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Generation settings. Null means "use the model's default", so the UI is
  // correct even before the model listing has loaded.
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [generateWithSound, setGenerateWithSound] = useState(true);
  const [referenceImages, setReferenceImages] = useState<RefImage[]>([]);
  const [endFrameImage, setEndFrameImage] = useState<RefImage | undefined>(
    undefined,
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());
  const prevGenerationCountRef = useRef(0);

  // Scroll to the newly enqueued generation. Runs as an effect (not inline in
  // the submit handler) so the new card exists in the DOM before we scroll to
  // it; new cards are prepended, so the first card is the one just enqueued.
  // Centering the card keeps the promptbox partially in view above it.
  useEffect(() => {
    if (generations.length > prevGenerationCountRef.current) {
      const newestCard = resultsRef.current?.querySelector("[data-generation]");
      (newestCard ?? resultsRef.current)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    prevGenerationCountRef.current = generations.length;
  }, [generations.length]);

  const maxPromptLength = modelInfo
    ? effectivePromptMaxLength(
        modelInfo.model,
        modelInfo.text_prompt_max_length ?? undefined,
        prompt,
      )
    : undefined;

  // Derived model capabilities, same rules as the create-video page but with
  // the model fixed. Keyframe uploads hit the media API, which needs a
  // session, so those controls only appear once the visitor is signed in.
  const hasSizeOptions = (modelInfo?.aspect_ratio_options?.length ?? 0) > 0;
  const hasResolutionOptions = (modelInfo?.resolution_options?.length ?? 0) > 0;
  const hasSound = !!modelInfo?.show_generate_with_sound_toggle;
  const supportsStartFrame =
    loggedIn &&
    !!(
      modelInfo?.starting_keyframe_supported ||
      modelInfo?.starting_keyframe_required
    );
  const supportsEndFrame = loggedIn && !!modelInfo?.ending_keyframe_supported;

  const effectiveSize =
    selectedSize ?? modelInfo?.aspect_ratio_default ?? "wide_sixteen_by_nine";
  const effectiveResolution =
    resolution ?? modelInfo?.resolution_default ?? null;
  const durationRange = useMemo(
    () => (modelInfo ? getDurationRange(modelInfo) : null),
    [modelInfo],
  );
  const effectiveDuration =
    duration ?? modelInfo?.duration_seconds_default ?? 5;

  const sizeItems = useMemo(
    () =>
      buildSizePopoverItems(
        modelInfo?.aspect_ratio_options ?? [],
        effectiveSize,
      ),
    [modelInfo?.aspect_ratio_options, effectiveSize],
  );
  const resolutionItems = useMemo(
    (): PopoverItem[] | null =>
      modelInfo?.resolution_options
        ? buildResolutionPopoverItems(
            modelInfo.resolution_options,
            effectiveResolution,
          )
        : null,
    [modelInfo?.resolution_options, effectiveResolution],
  );

  // Stop any in-flight polls when the visitor leaves the page. Completed
  // videos stay in their library either way.
  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    return () => {
      cleanups.forEach((stop) => stop());
      cleanups.clear();
    };
  }, []);

  // Scroll-in reveals, same data-reveal convention as the other landing pages
  // but without the full GSAP/Lenis stack: this page's hero is interactive,
  // so we keep the motion layer minimal.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const updateGeneration = useCallback(
    (id: string, patch: Partial<HeroGeneration>) => {
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      );
    },
    [],
  );

  const runGeneration = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const id = crypto.randomUUID();
    setGenerations((prev) => [
      { id, prompt: trimmed, status: "pending" },
      ...prev,
    ]);

    // Settings the model doesn't support are omitted so the server applies
    // its own defaults; capability metadata that hasn't loaded degrades the
    // same way.
    const startFrameToken = referenceImages[0]?.mediaToken;
    const result = await enqueueVideoGeneration({
      prompt: trimmed,
      model: MODEL_ID,
      numVideos: 1,
      aspectRatio: hasSizeOptions ? effectiveSize : undefined,
      duration: duration ?? modelInfo?.duration_seconds_default ?? undefined,
      resolution: hasResolutionOptions
        ? (effectiveResolution ?? undefined)
        : undefined,
      generateAudio: hasSound ? generateWithSound : undefined,
      startFrameImageMediaToken: startFrameToken?.length
        ? startFrameToken
        : undefined,
      endFrameImageMediaToken: endFrameImage?.mediaToken?.length
        ? endFrameImage.mediaToken
        : undefined,
    });
    setIsSubmitting(false);

    if (!result.success || !result.jobToken) {
      const message = result.error ?? "Failed to start generation";
      toast.error(message);
      updateGeneration(id, { status: "failed", error: message });
      return;
    }

    const stop = startVideoPolling(
      result.jobToken,
      (video) => {
        updateGeneration(id, { status: "complete", videoUrl: video.cdn_url });
        pollingCleanupsRef.current.delete(id);
      },
      (reason) => {
        updateGeneration(id, { status: "failed", error: reason });
        pollingCleanupsRef.current.delete(id);
      },
    );
    pollingCleanupsRef.current.set(id, stop);
  }, [
    prompt,
    modelInfo,
    hasSizeOptions,
    effectiveSize,
    duration,
    hasResolutionOptions,
    effectiveResolution,
    hasSound,
    generateWithSound,
    referenceImages,
    endFrameImage,
    updateGeneration,
  ]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || isSubmitting) return;
    if (maxPromptLength !== undefined && prompt.length > maxPromptLength) {
      toast.error(
        `Prompt exceeds the ${maxPromptLength} character limit for this model`,
      );
      return;
    }
    if (!loggedIn) {
      setIsGateOpen(true);
      return;
    }
    void runGeneration();
  }, [prompt, isSubmitting, maxPromptLength, loggedIn, runGeneration]);

  // Signup/login succeeded inside the gate: the session cookie is set, so we
  // immediately run the prompt the visitor already typed.
  const handleAuthed = useCallback(() => {
    setIsGateOpen(false);
    void runGeneration();
  }, [runGeneration]);

  const dismissGeneration = useCallback((id: string) => {
    pollingCleanupsRef.current.get(id)?.();
    pollingCleanupsRef.current.delete(id);
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const modelBadge = (
    <div className="flex h-[34px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3">
      <img
        src={getCreatorIconPathForModelId(MODEL_ID)}
        alt="MiniMax logo"
        className="h-4 w-4 icon-auto-contrast"
      />
      <span className="text-sm font-medium text-white/90">{MODEL_NAME}</span>
      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
        Free
      </span>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-clip bg-[#101014] text-white selection:bg-primary/30 selection:text-white"
    >
      <Seo
        title={PAGE_META.title}
        ogTitle={PAGE_META.ogTitle}
        description={PAGE_META.description}
      />

      {/* Top primary-blue accent, matches the other landing pages */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[900px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[900px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(45,129,255,0.10) 0%, transparent 70%)",
        }}
      />

      {/* HERO: the promptbox is the hero. */}
      <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 30%, black 35%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 30%, black 35%, transparent 80%)",
          }}
        >
          <TruchetPattern
            variant="landing"
            intensity={0.8}
            className="absolute inset-0 -top-[10%] h-[120%] w-full"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          {/* Eyebrow chip */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md sm:text-[13px]"
            data-reveal
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {MODEL_NAME} generations are free on ArtCraft right now
          </div>

          {/* Headline */}
          <h1
            className="mb-6 text-[44px] font-medium leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl"
            data-reveal
          >
            Try {MODEL_NAME},
            <br />
            <span className="font-serif-italic text-white/95">free</span> in
            ArtCraft.
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg md:text-xl"
            data-reveal
          >
            MiniMax's new multimodal model generates up to 15 seconds of 2K
            video with native stereo sound. Type a prompt and see for yourself:
            no credits, no charge.
          </p>

          {/* Promptbox */}
          <div className="mx-auto max-w-3xl text-left" data-reveal>
            <PromptBox
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              placeholder="Describe the video you want to generate..."
              maxPromptLength={maxPromptLength}
              supportsImagePrompts={supportsStartFrame}
              maxImagePromptCount={1}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              isVideo={supportsStartFrame}
              endFrameImage={endFrameImage}
              onEndFrameImageChange={setEndFrameImage}
              showEndFrameSection={supportsEndFrame}
              onClearAllRefs={() => {
                setReferenceImages([]);
                setEndFrameImage(undefined);
              }}
              modelSelector={modelBadge}
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
                        onSelect={(item) => {
                          if (item.action) setSelectedSize(item.action);
                        }}
                        mode="toggle"
                        panelTitle="Aspect Ratio"
                        showIconsInList
                        triggerIcon={
                          AUTO_RATIOS.has(effectiveSize) ? (
                            <AutoIcon />
                          ) : (
                            <AspectRatioIcon
                              commonAspectRatio={effectiveSize}
                            />
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
                        onSelect={(item) =>
                          setResolution(LABEL_TO_RES[item.label] ?? item.label)
                        }
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
                                value={effectiveDuration}
                                onChange={setDuration}
                                step={1}
                                suffix="s"
                                variant="filled"
                              />
                            </div>
                            <span className="min-w-6 shrink-0 text-sm font-medium tabular-nums text-base-fg">
                              {effectiveDuration}s
                            </span>
                          </div>
                          <div className="mt-1.5 flex justify-between px-0.5 text-[11px] tabular-nums text-base-fg/40">
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
                        onClick={() => setGenerateWithSound((v) => !v)}
                        className={
                          generateWithSound
                            ? "bg-primary/40 hover:bg-primary/50 border-primary/30"
                            : undefined
                        }
                      />
                    </Tooltip>
                  )}
                </>
              }
            />

            {/* Sample prompts */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-white/35">Try:</span>
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white sm:max-w-[16rem]"
                  title={sample}
                >
                  {sample}
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-white/35">
              Free {MODEL_NAME} generations require a free ArtCraft account. New
              here? You can sign up when you hit Generate.
            </p>
          </div>

          {/* Session results */}
          <div ref={resultsRef} className="mx-auto mt-10 max-w-3xl text-left">
            {generations.length > 0 && (
              <div className="space-y-4">
                {generations.map((gen) => (
                  <div key={gen.id} data-generation>
                    <HeroGenerationCard
                      generation={gen}
                      onDismiss={dismissGeneration}
                    />
                  </div>
                ))}
                <p className="text-center text-xs text-white/35">
                  Your videos are also saved to{" "}
                  <a
                    href={webappUrl("/library")}
                    className="text-white/60 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
                  >
                    your ArtCraft library
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="relative px-4 pb-12 pt-4 sm:px-8 sm:pb-20 sm:pt-8">
        <div className="mx-auto max-w-4xl" data-reveal>
          <div className="mb-8 text-center sm:mb-10">
            <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Overview
            </span>
            <h2 className="text-3xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-4xl md:text-5xl">
              What is <span className="font-serif-italic">{MODEL_NAME}</span>?
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-white/60 sm:text-lg">
            {OVERVIEW_PARAGRAPHS.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="relative px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl" data-reveal>
          <div className="mb-10 text-center sm:mb-12">
            <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Highlights
            </span>
            <h2 className="text-3xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-4xl md:text-5xl">
              Built as <span className="font-serif-italic">one</span> model.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.08] bg-[#080808] p-6 sm:rounded-[24px]"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/15 text-primary">
                  <FontAwesomeIcon icon={item.icon} className="text-[15px]" />
                </span>
                <h3 className="mb-2 text-lg font-medium tracking-[-0.01em] text-white">
                  {item.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-white/55">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="relative px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl" data-reveal>
          <div className="mb-10 text-center sm:mb-12">
            <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Examples
            </span>
            <h2 className="mb-5 text-3xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-4xl md:text-5xl">
              See it <span className="font-serif-italic">(and hear it)</span>{" "}
              yourself.
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              Sample generations from MiniMax's official H3 announcement. Turn
              the sound on: the audio is generated with the picture.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6">
            {EXAMPLE_VIDEOS.map((example) => (
              <ExampleVideoCard key={example.src} example={example} />
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-white/35">
            Videos courtesy of{" "}
            <a
              href={MINIMAX_BLOG_URL}
              target="_blank"
              rel="noreferrer"
              className="text-white/60 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
            >
              MiniMax's H3 announcement
            </a>
            .
          </p>
        </div>
      </section>

      {/* PROMPT TIPS */}
      <section className="relative px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl" data-reveal>
          <div className="mb-10 text-center sm:mb-12">
            <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Prompt tips
            </span>
            <h2 className="mb-5 text-3xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-4xl md:text-5xl">
              Get more out of{" "}
              <span className="font-serif-italic">{MODEL_NAME}</span>.
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              A few habits that pay off with a model that listens this closely.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {PROMPT_TIPS.map((tip, i) => (
              <div
                key={tip.title}
                className="rounded-2xl border border-white/[0.08] bg-[#080808] p-6 sm:rounded-[24px] sm:p-7"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-[13px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-medium tracking-[-0.01em] text-white sm:text-xl">
                    {tip.title}
                  </h3>
                </div>
                <p className="text-[15px] leading-relaxed text-white/55">
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl" data-reveal>
          <div className="mb-10 text-center sm:mb-12">
            <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              FAQ
            </span>
            <h2 className="text-3xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-4xl md:text-5xl">
              Frequently asked{" "}
              <span className="font-serif-italic">questions</span>.
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/[0.08] bg-[#080808] transition-colors open:border-white/[0.16]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-base font-medium text-white sm:text-lg [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <FontAwesomeIcon
                    icon={faPlay}
                    className="shrink-0 rotate-90 text-[12px] text-white/40 transition-transform duration-300 group-open:rotate-[270deg]"
                  />
                </summary>
                <div className="-mt-1 px-6 pb-5 text-[15px] leading-relaxed text-white/55 sm:text-base">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <h2 className="mb-5 text-3xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-4xl md:text-5xl">
            One model down. <span className="font-serif-italic">Plenty</span> to
            go.
          </h2>
          <p className="mx-auto mb-9 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            What you just used is the real thing: the full {MODEL_NAME}{" "}
            promptbox, frames, settings and all. The ArtCraft app takes it from
            there. Run the same shot through Seedance, Veo, Sora, Kling, and
            every other leading model, keep every take in one library, and pick
            the winner.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={webappUrl("/create-video")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-[14px] font-semibold text-white shadow-[0_4px_24px_-4px_rgba(45,129,255,0.4)] transition-all hover:-translate-y-px hover:bg-primary-600 hover:shadow-[0_8px_32px_-4px_rgba(45,129,255,0.5)]"
            >
              Try more models
              <FontAwesomeIcon icon={faArrowRight} className="text-[12px]" />
            </a>
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-6 text-[14px] font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              Learn more about ArtCraft
            </Link>
          </div>
        </div>
      </section>

      <AuthGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onAuthed={handleAuthed}
        signupSource={SIGNUP_SOURCE}
        headline="Create a free account to generate."
        subtitle={`Your prompt is ready to go. ${MODEL_NAME} generations are free, and signing up takes less than a minute.`}
        perks={[...GATE_PERKS]}
      />

      <Footer />
    </div>
  );
};

// ── Result card ──────────────────────────────────────────────────────────

const HeroGenerationCard = ({
  generation,
  onDismiss,
}: {
  generation: HeroGeneration;
  onDismiss: (id: string) => void;
}) => {
  if (generation.status === "complete" && generation.videoUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]">
        <video
          src={generation.videoUrl}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        />
        <p
          className="truncate px-5 py-3 text-sm text-white/50"
          title={generation.prompt}
        >
          {generation.prompt}
        </p>
      </div>
    );
  }

  if (generation.status === "failed") {
    return (
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-red-300">
            Generation failed
          </p>
          <p className="text-sm text-white/50">
            {generation.error ?? "Something went wrong. Please try again."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(generation.id)}
          className="shrink-0 text-white/40 transition-colors hover:text-white"
          aria-label="Dismiss"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-[#080808] px-6 text-center">
      <FontAwesomeIcon
        icon={faSpinnerThird}
        className="animate-spin text-xl text-primary"
      />
      <p
        className="max-w-md truncate text-sm text-white/60"
        title={generation.prompt}
      >
        {generation.prompt}
      </p>
      <p className="max-w-lg text-xs leading-relaxed text-white/35">
        Generating your video. Free {MODEL_NAME} generations share a queue, so
        this can take a few minutes (longer at peak). Keep this tab open until
        it finishes; the video also lands in your library.
      </p>
      {/* Waiting on the free queue is the moment visitors are most open to
          trying the full app. Opens in a new tab: this tab has to stay open
          for the free generation to finish. */}
      <a
        href={webappUrl("/create-video")}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
      >
        Keep creating in the app while you wait
        <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
      </a>
      <p className="text-[11px] text-white/25">
        Opens in a new tab, so your generation keeps going here.
      </p>
    </div>
  );
};

// Click-to-play facade: the mp4 (several MB each) is only requested once the
// visitor actually presses play.
const ExampleVideoCard = ({ example }: { example: ExampleVideo }) => {
  const [isActivated, setIsActivated] = useState(false);

  return (
    <div
      className={twMerge(
        "overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]",
        example.spanClass,
      )}
    >
      <div
        className="relative w-full bg-black"
        style={{ aspectRatio: example.wide ? "92 / 39" : "16 / 9" }}
      >
        {isActivated ? (
          <video
            src={example.src}
            poster={example.poster}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsActivated(true)}
            aria-label={`Play example: ${example.label}`}
            className="group absolute inset-0 flex w-full items-center justify-center"
          >
            <img
              src={example.poster}
              alt={example.label}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15"
            />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-sm transition-all group-hover:scale-105 group-hover:bg-black/55">
              <FontAwesomeIcon
                icon={faPlay}
                className="ml-0.5 text-base text-white"
              />
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <p
          className="min-w-0 truncate text-sm text-white/50"
          title={example.label}
        >
          {example.label}
        </p>
        <a
          href={MINIMAX_BLOG_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs text-white/35 transition-colors hover:text-white/70"
        >
          Video: MiniMax
        </a>
      </div>
    </div>
  );
};

export default LandingMinimaxH3;
