import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, GenerateIconButton } from "@storyteller/ui-button";
import { webappUrl } from "../config/links";

const STARTER_PROMPTS = [
  {
    label: "Cinematic adventure",
    prompt: "A knight in weathered armor rides through a foggy pine forest at dawn, slow tracking shot, volumetric light",
  },
  {
    label: "Neon city",
    prompt: "Cyberpunk street market in the rain, neon reflections, handheld camera pushing through the crowd",
  },
  {
    label: "Nature close-up",
    prompt: "Macro shot of a hummingbird hovering at a red flower, slow motion, shallow depth of field",
  },
];

export const LandingPromptDemo = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0].prompt);
  const canContinue = prompt.trim().length > 0;

  const continueToEditor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    window.location.href = `${webappUrl("/create-video")}?prompt=${encodeURIComponent(prompt.trim())}`;
  };

  return (
    <section id="try-it" aria-labelledby="try-it-title" className="relative px-4 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center sm:mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">Video generation</span>
          <h2 id="try-it-title" className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
            Start with <span className="font-serif-italic">a scene.</span>
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
            Describe the shot you want to make. Choose a video model, set up your shot, and generate in your browser.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <form onSubmit={continueToEditor} className="min-w-0 lg:col-span-5">
            <label htmlFor="landing-video-prompt" className="mb-3 block text-sm font-semibold text-white">Describe your shot</label>
            <div className="relative w-full rounded-2xl border border-white/10 bg-[#303032]/90 p-4 shadow-lg backdrop-blur-3xl ring-1 ring-transparent transition-colors duration-300 focus-within:border-primary focus-within:ring-primary">
              <div className="promptbox-resize-wrap relative min-w-0">
              <textarea
                ref={textareaRef}
                id="landing-video-prompt"
                aria-describedby="prompt-next-step"
                rows={4}
                maxLength={4000}
                placeholder="Describe your scene, the movement, and the mood…"
                className="promptbox-scrollbar relative mb-2 min-h-[5.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-8 pt-1 text-[15px] leading-relaxed text-base-fg placeholder-base-fg/60 focus:outline-none"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              </div>
              <div className="mt-2 flex items-center justify-end gap-3">
                <span className="text-sm font-medium text-base-fg">Continue in ArtCraft</span>
                <GenerateIconButton
                  type="submit"
                  disabled={!canContinue}
                  aria-label="Continue in ArtCraft"
                />
              </div>
            </div>
            <p id="prompt-next-step" className="mt-3 text-sm leading-relaxed text-white/50">
              Your prompt opens in the editor. Review settings and cost before generating.
            </p>
            <fieldset className="mt-6">
              <legend className="mb-3 text-xs font-medium text-white/50">Example prompts</legend>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((starter) => (
                  <Button
                    variant="secondary"
                    key={starter.label}
                    type="button"
                    aria-pressed={prompt === starter.prompt}
                    onClick={() => {
                      setPrompt(starter.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="h-9 rounded-lg px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-pressed:border-primary/50"
                  >
                    {starter.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          </form>

          <figure className="min-w-0 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-white">Made in ArtCraft</span>
              <span className="text-white/45">Seedance 2.5 output</span>
            </div>
            <div className="overflow-hidden rounded-xl bg-[#17181d]">
              <ShowcaseVideo />
            </div>
            <figcaption className="mt-3 text-xs leading-relaxed text-white/45">
              Example generation. Preview shown independently of your prompt.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

// Defer the showcase download until it is visible and pause it offscreen.
const ShowcaseVideo = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        if (!motion.matches) void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative aspect-video bg-[#17181d]">
      <video
        ref={ref}
        src={shouldLoad ? "https://frontend-cdn.fakeyou.com/videos/1.mp4" : undefined}
        aria-label="Example video made in ArtCraft"
        className="absolute inset-0 h-full w-full object-cover"
        controls
        loop
        muted
        playsInline
        preload="metadata"
        onLoadedData={(event) => {
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (bounds.bottom > 0 && bounds.top < window.innerHeight) void event.currentTarget.play().catch(() => {});
          }
        }}
        onError={() => setFailed(true)}
      />
      {failed && <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/60">The example video couldn’t load. You can still start with your own prompt.</p>}
    </div>
  );
};
