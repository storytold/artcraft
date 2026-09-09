import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ClockIcon, RectangleHorizontalIcon, SparklesIcon } from "lucide-react";
import { GenerateIconButton } from "@storyteller/ui-button";
import { webappUrl } from "../config/links";

// "Try it" section under the landing hero: a working replica of the webapp's
// video prompt box next to a showcase reel. Unattended, the box types and
// deletes a rotation of demo prompts so the input reads as alive. The moment
// a visitor focuses the box the demo stops and it behaves like the real
// thing: type, press Enter or the generate button, and land in the webapp's
// video page with the prompt already filled in (via `?prompt=`).

// Prompts the box types through while idle. Copy only: nothing is generated
// here, so keep them cinematic and short enough to read in one pass.
const DEMO_PROMPTS: string[] = [
  "A knight in weathered armor rides through a foggy pine forest at dawn, slow tracking shot, volumetric light",
  "Cyberpunk street market in the rain, neon reflections, handheld camera pushing through the crowd",
  "Macro shot of a hummingbird hovering at a red flower, slow motion, shallow depth of field",
  "A paper boat drifting down a rain-filled gutter in a quiet Tokyo alley, golden hour, 35mm",
  "Astronaut opens a hatch onto a glowing alien jungle, wide cinematic shot, anamorphic lens flare",
];

// The showcase reel beside the prompt box: one cut of the best generations,
// independent of whatever the box is typing. PLACEHOLDER: this is the old
// site commercial until a dedicated reel exists (16:9, 1080p H.264, muted,
// 20 to 40 seconds, +faststart, hosted on R2).
const SHOWCASE_VIDEO_URL =
  "https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/website-commercial-2026.05.mp4";

// Shown in the model chip and the reel label. Copy only: the webapp picks the
// real default model.
const DEMO_MODEL_NAME = "Seedance 2.5";
const DEMO_MODEL_ICON = "/model-logos/bytedance.svg";
const DEMO_ASPECT = "16:9";
const DEMO_DURATION = "5s";

const WEBAPP_VIDEO_PATH = "/create-video";
const USER_PLACEHOLDER = "Describe the video you want to make...";

// Typewriter pacing (ms).
const TYPE_MS = 34;
const TYPE_JITTER_MS = 40;
const HOLD_MS = 2800;
const DELETE_MS = 12;
const BETWEEN_MS = 500;

export const LandingPromptDemo = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  // Demo runs until the visitor focuses or types in the box.
  const [userActive, setUserActive] = useState(false);
  const [inView, setInView] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoText, setDemoText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Only animate (and play the reel) while the section is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Typewriter: type a prompt, hold, delete, advance. One timeout chain, torn
  // down whenever the inputs change so it never double-runs.
  useEffect(() => {
    if (userActive) return;
    if (reduceMotion) {
      setDemoText(DEMO_PROMPTS[demoIndex]);
      return;
    }
    if (!inView) return;

    const full = DEMO_PROMPTS[demoIndex];
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const typeTo = (n: number) => {
      if (cancelled) return;
      setDemoText(full.slice(0, n));
      if (n < full.length) {
        timer = setTimeout(
          () => typeTo(n + 1),
          TYPE_MS + Math.random() * TYPE_JITTER_MS,
        );
      } else {
        timer = setTimeout(() => deleteTo(full.length), HOLD_MS);
      }
    };
    const deleteTo = (n: number) => {
      if (cancelled) return;
      setDemoText(full.slice(0, n));
      if (n > 0) {
        timer = setTimeout(() => deleteTo(n - 1), DELETE_MS);
      } else {
        timer = setTimeout(
          () => setDemoIndex((i) => (i + 1) % DEMO_PROMPTS.length),
          BETWEEN_MS,
        );
      }
    };
    typeTo(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [demoIndex, inView, userActive, reduceMotion]);

  const takeOver = () => {
    if (userActive) return;
    setUserActive(true);
    setDemoText("");
  };

  const generate = () => {
    // Empty box while the demo is running: send the prompt on screen, so the
    // button always does something.
    const text = (prompt.trim() || DEMO_PROMPTS[demoIndex]).trim();
    if (!text) return;
    window.location.href = `${webappUrl(WEBAPP_VIDEO_PATH)}?prompt=${encodeURIComponent(text)}`;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  };

  const showDemo = !userActive;

  return (
    <section
      ref={sectionRef}
      id="try-it"
      className="relative px-4 sm:px-8 py-16 sm:py-24"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14" data-reveal>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            Video generation
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
            Your first shot is{" "}
            <span className="font-serif-italic">one prompt away.</span>
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
            Describe the scene. ArtCraft renders it with {DEMO_MODEL_NAME},
            Kling, Veo and more, straight from your browser. Try it below.
          </p>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch"
          data-reveal
        >
          {/* Prompt box (replica of the webapp video prompt box) */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-4">
            <div
              className={`glass rounded-2xl p-3 sm:p-4 !transition-all duration-200 ${
                isFocused ? "ring-1 ring-primary" : ""
              }`}
            >
              <div className="promptbox-resize-wrap relative">
                {showDemo && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words pr-8 text-[15px] text-base-fg"
                  >
                    {demoText}
                    <span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[0.2em] bg-primary animate-pulse" />
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  rows={3}
                  aria-label="Video prompt"
                  placeholder={showDemo ? "" : USER_PLACEHOLDER}
                  className="promptbox-scrollbar min-h-[5.5em] max-h-[9em] w-full resize-y overflow-y-auto bg-transparent pr-8 text-[15px] text-base-fg placeholder-base-fg/60 focus:outline-none"
                  value={prompt}
                  onChange={(e) => {
                    takeOver();
                    setPrompt(e.target.value);
                  }}
                  onKeyDown={onKeyDown}
                  onFocus={() => {
                    takeOver();
                    setIsFocused(true);
                  }}
                  onBlur={() => setIsFocused(false)}
                />
              </div>

              {/* Toolbar */}
              <div className="mt-3.5 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-ui-controls-button px-2.5 text-[13px] font-medium text-base-fg">
                    <img
                      src={DEMO_MODEL_ICON}
                      alt=""
                      className="h-4 w-4 icon-auto-contrast"
                    />
                    {DEMO_MODEL_NAME}
                  </span>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ui-controls-button px-2.5 text-[13px] font-medium text-base-fg/80">
                    <RectangleHorizontalIcon className="h-3.5 w-3.5" />
                    {DEMO_ASPECT}
                  </span>
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ui-controls-button px-2.5 text-[13px] font-medium text-base-fg/80">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {DEMO_DURATION}
                  </span>
                </div>
                <GenerateIconButton onClick={generate} />
              </div>
            </div>

            <p className="text-xs text-white/40 text-center lg:text-left">
              Press Enter to generate. Opens the ArtCraft web app with your
              prompt ready to go.
            </p>

            {/* Starter prompts: one click fills the box */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {DEMO_PROMPTS.slice(0, 3).map((demo) => (
                <button
                  key={demo}
                  type="button"
                  onClick={() => {
                    setUserActive(true);
                    setDemoText("");
                    setPrompt(demo);
                    textareaRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <SparklesIcon className="h-3 w-3 text-primary" />
                  {shortLabel(demo)}
                </button>
              ))}
            </div>
          </div>

          {/* Showcase reel */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl sm:rounded-[24px] overflow-hidden bg-[#080808] border border-white/[0.08] p-1.5">
              <div className="relative aspect-video rounded-xl sm:rounded-[20px] overflow-hidden bg-black">
                <ShowcaseVideo src={SHOWCASE_VIDEO_URL} playing={inView} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-[12px] sm:text-[13px] font-medium text-white/85">
                    Made in ArtCraft
                  </p>
                  <span className="shrink-0 rounded-full bg-black/60 border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md">
                    {DEMO_MODEL_NAME} · Kling · Veo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Muted looping reel that only decodes while the section is on screen, and
// only fetches once the section is near the viewport (not on page load).
const ShowcaseVideo = ({ src, playing }: { src: string; playing: boolean }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (playing) setShouldLoad(true);
  }, [playing]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !shouldLoad) return;
    if (playing) void video.play().catch(() => {});
    else video.pause();
  }, [playing, shouldLoad]);

  return (
    <video
      ref={ref}
      src={shouldLoad ? src : undefined}
      className="absolute inset-0 h-full w-full object-cover"
      loop
      muted
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      disablePictureInPicture
    />
  );
};

// First clause of a prompt, for the starter chips.
function shortLabel(prompt: string): string {
  const clause = prompt.split(",")[0];
  return clause.length > 44 ? `${clause.slice(0, 42).trimEnd()}...` : clause;
}
