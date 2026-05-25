import { useEffect, useRef, useState } from "react";
import { cn } from "../ui/utils";

interface ShowcaseSlide {
  videoSrc: string;
  label: string;
  title: string;
  subtitle: string;
}

const SLIDES: ShowcaseSlide[] = [
  {
    videoSrc: "/videos/hero-video.mp4",
    label: "AI Studio",
    title: "Bring ideas to life",
    subtitle: "Generate stunning images and video in a single canvas.",
  },
  {
    videoSrc: "/videos/artcraft-canvas-demo.mp4",
    label: "Infinite Canvas",
    title: "Compose without limits",
    subtitle: "Arrange, edit, and remix on a limitless 2D canvas.",
  },
  {
    videoSrc: "/videos/artcraft-3d-demo.mp4",
    label: "3D Scenes",
    title: "Direct in 3D",
    subtitle: "Block out scenes and render them with AI.",
  },
  {
    videoSrc: "/videos/inpainting_demo.mp4",
    label: "Inpainting",
    title: "Paint in changes",
    subtitle: "Add, remove, or transform anything with a brush.",
  },
];

export const AuthShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const active = SLIDES[activeIndex];

  // Fill bars for completed slides and reset the rest whenever the slide
  // changes. The active bar then fills live via onTimeUpdate (ref writes only,
  // so playback never triggers a React re-render).
  useEffect(() => {
    barRefs.current.forEach((bar, i) => {
      if (bar) bar.style.width = i < activeIndex ? "100%" : "0%";
    });
  }, [activeIndex]);

  const goToNext = () => setActiveIndex((i) => (i + 1) % SLIDES.length);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    const bar = barRefs.current[activeIndex];
    if (!video || !bar || !video.duration) return;
    bar.style.width = `${Math.min(100, (video.currentTime / video.duration) * 100)}%`;
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        key={activeIndex}
        ref={videoRef}
        src={active.videoSrc}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={goToNext}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Legibility gradient behind the caption */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/25"
      />

      {/* Caption + segmented progress */}
      <div className="absolute inset-x-0 bottom-0 p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-300">
          {active.label}
        </p>
        <h2 className="text-2xl font-bold leading-tight">{active.title}</h2>
        <p className="mt-1 max-w-sm text-sm text-white/70">{active.subtitle}</p>

        <div className="mt-6 flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="group flex-1 text-left"
              aria-label={`Show ${slide.label}`}
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className={cn(
                    "h-full w-0 rounded-full bg-white",
                    i !== activeIndex && "transition-[width] duration-300 ease-linear",
                  )}
                />
              </div>
              <span
                className={cn(
                  "mt-2 block truncate text-xs transition-colors",
                  i === activeIndex
                    ? "text-white"
                    : "text-white/40 group-hover:text-white/70",
                )}
              >
                {slide.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
