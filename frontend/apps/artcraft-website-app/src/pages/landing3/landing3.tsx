import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { isMobile, isMacOs } from "react-device-detect";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ManifestoThreeBackground } from "../../components/manifesto-three-background";
import {
  KnightCinema,
  setupKnightCinemaTimeline,
  type KnightCinemaHandle,
} from "../../components/knight-cinema";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faWindows, faApple } from "@fortawesome/free-brands-svg-icons";
import {
  faPlay,
  faMapMarkerAlt,
  faCube,
  faLayerGroup,
  faUser,
  faTools,
  faShapes,
  faEraser,
  faCheck,
  faXmark,
  faFilm,
  faPaintBrush,
  faCamera,
  faRocket,
  faVolumeXmark,
} from "@fortawesome/pro-solid-svg-icons";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { DownloadModal } from "../../components/download-modal";
import ModelBadgeGrid from "../../components/model-badge-grid";
import { getSession } from "../../lib/session";
import { DOWNLOAD_LINKS } from "../../config/github_download_links";
import { SOCIAL_LINKS } from "../../config/links";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Link } from "react-router-dom";
import {
  TruchetPattern,
  type TruchetVariant,
} from "../../components/truchet-pattern";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: faMapMarkerAlt,
    label: "Worlds",
    title: "Image to Location",
    description:
      "Place virtual actors into physical environments. Establish single-location consistency and film multiple shots in a room without things disappearing.",
    src: "/videos/features/WorldLabs_Demo_2.webm",
  },
  {
    icon: faCube,
    label: "3D Compositing",
    title: "Build scenes with depth",
    description:
      "Use images, backdrops, foreground elements, and props in scenes with real depth. A couple of images blends naturally into a finished composition.",
    src: "/videos/features/Panel.webm",
  },
  {
    icon: faLayerGroup,
    label: "2D Compositing",
    title: "Precise layered control",
    description:
      "Combine images, background removal, layers, and simple drawing tools to compose a scene exactly the way you imagined it.",
    src: "/videos/features/Editor.webm",
  },
  {
    icon: faShapes,
    label: "3D Mesh",
    title: "Image to 3D Mesh",
    description:
      "Turning images into 3D helps position elements exactingly. Block complex scenes with intentional geometry instead of fighting prompts.",
    src: "/videos/features/Make_3D.webm",
  },
  {
    icon: faTools,
    label: "Mixed Assets",
    title: "Mix every kind of asset",
    description:
      "Combine image cutouts, worlds, and 3D meshes in one canvas to lay out scenes with precision and intention.",
    src: "/videos/features/Mixed.webm",
  },
  {
    icon: faUser,
    label: "Posing",
    title: "Character Posing",
    description:
      'Dynamically pose your characters to nail the precise character, scene, and camera blocking before calling "action".',
    src: "/videos/features/Pose_Second_Version.webm",
  },
  {
    icon: faEraser,
    label: "Cutouts",
    title: "Background Removal",
    description:
      "Instantly remove backgrounds from images to create assets for your scenes. Clean, precise, and ready for compositing.",
    src: "/videos/features/Background.webm",
  },
];

const MADE_WITH_VIDEOS = [
  "https://www.youtube.com/embed/HDdsKJl92H4?si=0Hm4AweSRHq3qRt6",
  "https://www.youtube.com/embed/oqoCWdOwr2U?si=ILMPk8hGHo9hP8RU",
  "https://www.youtube.com/embed/H4NFXGMuwpY?si=wPuQl5cJOu1v8MJu",
];

const MANIFESTO_WORDS: ReadonlyArray<string> = [
  "ArtCraft",
  "brings",
  "3D",
  "control",
  "to",
  "AI",
  "image",
  "and",
  "video",
  "generation,",
  "giving",
  "artists",
  "like",
  "you",
  "full",
  "power",
  "over",
  "every",
  "shot.",
];

// Lazy autoplay video — defers the network fetch + decoder spin-up until
// the element is approaching the viewport. Avoids ~7 simultaneous webm
// downloads stealing main-thread + bandwidth from the hero animation.
const LazyAutoplayVideo = ({
  src,
  className,
}: {
  src: string;
  className?: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ref.current || shouldLoad) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      loop
      muted
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      src={shouldLoad ? src : undefined}
    />
  );
};

interface TruchetBlobProps {
  className: string;
  variant?: TruchetVariant;
  intensity?: number;
  /** Parallax distance in yPercent across the blob's scroll range. Negative drifts upward. */
  speed?: number;
  rotate?: number;
}

const TruchetBlob = ({
  className,
  variant = "landing",
  intensity = 0.5,
  speed = -18,
  rotate = 0,
}: TruchetBlobProps) => (
  <div
    aria-hidden
    data-blob
    data-blob-speed={speed}
    className={`pointer-events-none absolute z-0 hidden lg:block ${className}`}
    style={{
      maskImage:
        "radial-gradient(circle at 50% 50%, black 25%, transparent 75%)",
      WebkitMaskImage:
        "radial-gradient(circle at 50% 50%, black 25%, transparent 75%)",
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <TruchetPattern
      variant={variant}
      intensity={intensity}
      className="absolute inset-0 w-full h-full"
    />
  </div>
);

const Landing3 = () => {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [heroVideoMuted, setHeroVideoMuted] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const manifestoProgressRef = useRef(0);
  // Separate progress for the character — extends past the text-reveal end so
  // the character keeps walking and exits frame as the user scrolls past.
  const characterProgressRef = useRef(0);
  // Knight cinema — letterbox scroll-scrubbed video. Component owns its DOM
  // structure; the imperative handle exposes the element refs so we can wire
  // them into the master GSAP timeline below.
  const knightRef = useRef<KnightCinemaHandle>(null);
  // Pause flag for the manifesto Three.js render loop. Flipped to `true` once
  // the character has walked off frame so the GPU isn't painting a hidden
  // canvas during the video phase — significant savings on high-DPI displays.
  const characterPausedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSession().then((response) => {
      if (!cancelled && response.success && response.data?.loggedIn) {
        setIsLoggedIn(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lenis smooth scrolling
  useEffect(() => {
    if (isMobile) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.1,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    lenis.on("scroll", ScrollTrigger.update);

    // Resize sync: when the viewport changes (window resize, moving between
    // monitors with different DPI/sizes), Lenis needs to re-measure the
    // document and ScrollTrigger needs to recalculate trigger positions.
    // Without this, sticky/pin positions and progress mappings drift.
    const handleResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Reveal animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (isMobile) return;
      const elements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(elements, { autoAlpha: 0, y: 24 });
      // One ScrollTrigger watching all data-reveal elements at once instead
      // of ~25 individual triggers. Above-the-fold elements (hero) batch-fire
      // on mount; below-the-fold ones fire as their groups enter the viewport.
      // Far less main-thread work in useLayoutEffect, so the hero fade-in
      // doesn't get crowded by trigger setup.
      ScrollTrigger.batch(elements, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            stagger: 0.06,
          }),
      });

      // Hero pattern parallax (slower than scroll, drifts upward)
      const heroPattern = document.querySelector<HTMLElement>(
        "[data-hero-pattern]",
      );
      if (heroPattern) {
        gsap.to(heroPattern, {
          yPercent: -25,
          ease: "none",
          scrollTrigger: {
            trigger: heroPattern,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // Decorative blob parallax — each drifts at its own speed for an
      // asymmetric, scattered feel as the user scrolls.
      const blobs = gsap.utils.toArray<HTMLElement>("[data-blob]");
      blobs.forEach((blob) => {
        const speed = parseFloat(blob.dataset.blobSpeed ?? "-18");
        gsap.to(blob, {
          yPercent: speed,
          ease: "none",
          scrollTrigger: {
            trigger: blob,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Manifesto: pin the section across a long scroll. Phase 1 reveals the
      // words; phase 2 holds the fully-revealed manifesto frozen in place;
      // phase 3 wipes a knight video over the scene with a circular clip-path;
      // phase 4 scroll-scrubs the video from start to end. Once the section
      // unsticks (after phase 4) the page resumes normal scroll.
      const manifestoSection = document.querySelector<HTMLElement>(
        "[data-manifesto-section]",
      );
      const manifestoWords = gsap.utils.toArray<HTMLElement>(
        "[data-manifesto-word]",
      );
      if (manifestoSection && manifestoWords.length > 0) {
        gsap.set(manifestoWords, { y: 6 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: manifestoSection,
            start: "top top",
            end: "bottom bottom",
            // Tight scrub so the video frame tracks scroll position
            // immediately — high values cause the video to keep advancing
            // for ~1s after Lenis stops, which reads as the frame "lagging."
            scrub: 0.01,
            // Recapture function-based tween targets (e.g. the phase 5 scale
            // computed from window.innerWidth) when the user resizes.
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              manifestoProgressRef.current = self.progress;
            },
          },
        });

        // Phase 1 — reveal the manifesto words sequentially.
        manifestoWords.forEach((word, i) => {
          tl.to(
            word,
            { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
            i * 0.5,
          );
        });

        // Phase 2 — hold the fully-revealed manifesto frozen so the user gets
        // a beat to read it before the transition triggers.
        tl.to({}, { duration: 4 });

        // Phase 2b — fade the manifesto text out so the stage is clear before
        // the knight video slides in.
        const manifestoH2 = manifestoSection.querySelector<HTMLElement>("h2");
        if (manifestoH2) {
          tl.to(
            manifestoH2,
            { opacity: 0, duration: 1.5, ease: "power2.in" },
            ">",
          );
        }

        // Brief empty beat between text exit and video entrance.
        tl.to({}, { duration: 0.3 });

        // Phases 3 (bars slide in + cinema fades in), 4 (video scrub with
        // live timecode/progress), and 5 (exit shrink to navbar-width card)
        // are all encapsulated in the KnightCinema component's helper.
        if (knightRef.current) {
          setupKnightCinemaTimeline(tl, knightRef.current);
        }

        // Character traversal — finishes within the first ~30% of section
        // scroll so the figure has walked off frame before the knight reveal
        // begins. Without this clamp, the longer section would slow the walk
        // to a crawl.
        ScrollTrigger.create({
          trigger: manifestoSection,
          start: "top top",
          end: "bottom top",
          scrub: 0.3,
          onUpdate: (self) => {
            // Divisor controls how much of the section scroll the walk
            // consumes. Higher = slower walk. 0.5 means the character
            // traverses the screen across the first 50% of the section.
            characterProgressRef.current = Math.min(self.progress / 0.5, 1);
          },
        });

        // Pause the Three.js render loop once the character has walked off
        // frame and is fully covered by the letterbox video. Saves the GPU
        // from painting a hidden canvas at 2× DPR for the rest of the section
        // — biggest perf win on 1440p+ / Retina displays. onEnter/onLeaveBack
        // fire only at the threshold (not on every scroll frame), so this
        // costs nothing in steady-state scrolling. Threshold is set just past
        // where the character finishes its walk (50% of section scroll).
        ScrollTrigger.create({
          trigger: manifestoSection,
          start: () => `top+=${window.innerHeight * 3.5} top`,
          onEnter: () => {
            characterPausedRef.current = true;
          },
          onLeaveBack: () => {
            characterPausedRef.current = false;
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const onDownloadClick = () => {
    if (isLoggedIn) return;
    setShowDownloadModal(true);
    localStorage.setItem("artcraft_download_initiated", "true");
  };

  const downloadUrl = isMacOs ? DOWNLOAD_LINKS.MACOS : DOWNLOAD_LINKS.WINDOWS;

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen bg-[#101014] text-white selection:bg-primary/30 selection:text-white overflow-x-clip"
    >
      <Seo
        title="ArtCraft - Controllable AI for Artists"
        description="ArtCraft is the opensource desktop app for generating AI video and images - built for artists who want real control."
      />
      {/* Top primary-blue accent, matches the pricing page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />
      {/* Mid-page primary-blue wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[1400px] h-[1100px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(45,129,255,0.08) 0%, transparent 70%)",
        }}
      />
      {/* Lower-page primary-blue accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[900px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(45,129,255,0.12) 0%, transparent 70%)",
        }}
      />
      {/* HERO */}
      <section className="relative pt-24 sm:pt-36 pb-20 sm:pb-24 px-4 sm:px-8 overflow-hidden">
        {/* Triangle pattern background with parallax */}
        <div
          aria-hidden
          data-hero-pattern
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 80%)",
          }}
        >
          <TruchetPattern
            variant="landing"
            intensity={0.8}
            className="absolute inset-0 -top-[10%] w-full h-[120%]"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Eyebrow chip */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs sm:text-[13px] font-medium text-white/70"
            data-reveal
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Now with Seedance 2.0, Nano Banana 2 & more
          </div>

          {/* Headline */}
          <h1
            className="text-[44px] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[88px] tracking-[-0.045em] font-medium mb-6 text-white"
            data-reveal
          >
            Controllable AI
            <br />
            <span className="font-serif-italic text-white/95">for artists</span>
            .
          </h1>

          {/* Subtitle */}
          <p
            className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-white/55 leading-relaxed mb-10"
            data-reveal
          >
            Artists need and deserve unparalleled control and precision.
            ArtCraft’s got you covered.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
            data-reveal
          >
            {isMobile ? (
              <Button
                disabled
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white/10 text-white/60 text-[14px] font-semibold"
              >
                Download on a desktop
              </Button>
            ) : (
              <>
                <Tooltip
                  content="Buy credits and support open source"
                  position="top"
                  delay={0}
                  className="rounded-full"
                >
                  <Link
                    to="/pricing"
                    className="group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary hover:bg-primary-600 text-white text-[14px] font-semibold transition-all shadow-[0_4px_24px_-4px_rgba(45,129,255,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(45,129,255,0.5)] hover:-translate-y-px"
                  >
                    <FontAwesomeIcon icon={faRocket} className="text-[13px]" />
                    Supercharge Credits
                  </Link>
                </Tooltip>
                <a
                  href={downloadUrl}
                  onClick={onDownloadClick}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white hover:bg-white/90 text-black text-[14px] font-semibold transition-all hover:-translate-y-px shadow-[0_4px_24px_-4px_rgba(255,255,255,0.2)]"
                >
                  <FontAwesomeIcon
                    icon={isMacOs ? faApple : faWindows}
                    className="text-[13px]"
                  />
                  Download for {isMacOs ? "Mac" : "Windows"}
                </a>
              </>
            )}
          </div>

          {/* Secondary: try in browser */}
          <div
            className="flex items-center justify-center gap-3 mb-12 sm:mb-16 text-[13px] text-white/45"
            data-reveal
          >
            <span>or generate in your browser:</span>
            <Link
              to="/create-image"
              className="group inline-flex items-center gap-1 text-white/65 hover:text-white underline-offset-4 hover:underline transition-colors"
            >
              Image
            </Link>
            <span className="text-white/25">·</span>
            <Link
              to="/create-video"
              className="group inline-flex items-center gap-1 text-white/65 hover:text-white underline-offset-4 hover:underline transition-colors"
            >
              Video
            </Link>
          </div>

          {/* Hero video */}
          <div
            className="relative rounded-2xl sm:rounded-[24px] overflow-hidden bg-[#080808] border border-white/[0.08]"
            data-reveal
          >
            <div
              className="relative w-full rounded-xl sm:rounded-[20px] overflow-hidden bg-black"
              style={{ paddingTop: "56.25%" }}
            >
              <video
                ref={heroVideoRef}
                src="https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/website-commercial-2026.05.mp4"
                className="absolute inset-0 w-full h-full"
                autoPlay
                loop
                muted
                playsInline
                controls
                preload="auto"
                onVolumeChange={(e) =>
                  setHeroVideoMuted(e.currentTarget.muted)
                }
              />
              {heroVideoMuted && (
                <button
                  type="button"
                  onClick={() => {
                    const v = heroVideoRef.current;
                    if (!v) return;
                    v.muted = false;
                    setHeroVideoMuted(false);
                    void v.play().catch(() => { });
                  }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-black/65 hover:bg-black/80 backdrop-blur-md text-white text-[12px] font-semibold border border-white/15 transition-colors"
                >
                  <FontAwesomeIcon icon={faVolumeXmark} className="text-[12px]" />
                  Tap to unmute
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* MANIFESTO */}
      {isMobile && (
        // Mobile: simple static version — no sticky, no 3D character, no
        // scroll reveal. Just the manifesto as a regular centered headline.
        <section className="relative px-4 py-20 bg-[#101014]">
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="text-2xl sm:text-3xl tracking-[-0.035em] font-medium text-white px-4 sm:px-0"
              style={{ lineHeight: 1.4 }}
            >
              {MANIFESTO_WORDS.join(" ")}
            </h2>
          </div>
        </section>
      )}
      {!isMobile && (
        // Desktop: sticky scroll-reveal + 3D character walking across, then a
        // circular wipe to the scroll-scrubbed knight video.
        <section
          data-manifesto-section
          className="relative"
          style={{ height: "750vh" }}
        >
          <div
            className="flex items-center justify-center overflow-hidden bg-[#101014]"
            style={{ position: "sticky", top: 0, height: "100vh" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                maskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 80%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, black 25%, transparent 80%)",
              }}
            >
              <TruchetPattern
                variant="landing"
                intensity={0.5}
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <ManifestoThreeBackground
              progressRef={characterProgressRef}
              pausedRef={characterPausedRef}
            />
            <h2
              className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 text-center text-2xl sm:text-4xl md:text-5xl lg:text-[60px] tracking-[-0.035em] font-medium text-white"
              style={{
                lineHeight: 1.2,
                textShadow:
                  "0 2px 32px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.8), 0 0 100px rgba(0,0,0,0.55), 0 0 160px rgba(0,0,0,0.35)",
              }}
            >
              {MANIFESTO_WORDS.map((w, i) => (
                <span
                  key={i}
                  data-manifesto-word
                  className="inline-block opacity-15 will-change-[opacity,transform]"
                >
                  {w}
                  {i < MANIFESTO_WORDS.length - 1 ? " " : ""}
                </span>
              ))}
            </h2>
            <KnightCinema
              ref={knightRef}
              src="https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/knight-walk-scrub.mp4"
            />
          </div>
        </section>
      )}

      <section id="features" className="relative px-4 sm:px-8 pt-12">
        <div className="max-w-[1100px] mx-auto text-center" data-reveal>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
            Crafting features
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
            We're pulling you{" "}
            <span className="font-serif-italic">out of prompting.</span>
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
            Text prompting is neat, but artists crave control. ArtCraft is the
            control that mere words cannot buy.
          </p>
        </div>
      </section>
      {/* FEATURES: alternating cards */}
      <section className="relative px-4 sm:px-8 py-16 sm:py-24">
        <TruchetBlob
          className="top-[6%] -left-40 w-[640px] h-[640px]"
          variant="content"
          intensity={0.75}
          speed={-26}
          rotate={14}
        />
        <TruchetBlob
          className="top-[40%] -right-36 w-[600px] h-[600px]"
          variant="landing"
          intensity={0.75}
          speed={-18}
          rotate={-12}
        />
        <TruchetBlob
          className="top-[72%] -left-32 w-[580px] h-[580px]"
          variant="auth"
          intensity={0.75}
          speed={-22}
          rotate={8}
        />
        <div className="max-w-6xl mx-auto flex flex-col gap-8 sm:gap-16">
          {FEATURES.map((feature, i) => (
            <article
              key={feature.title}
              data-reveal
              className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl sm:rounded-[28px] overflow-hidden bg-[#080808] transition-colors"
            >
              <div
                className={`lg:col-span-5 p-7 sm:p-10 lg:p-12 flex flex-col justify-center ${i % 2 === 1 ? "lg:order-2" : ""
                  }`}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="inline-flex h-7 px-2.5 items-center gap-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-semibold border border-primary/20">
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className="text-[10px]"
                    />
                    {feature.label}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-[32px] tracking-[-0.02em] font-medium leading-[1.15] mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-[15px] sm:text-base text-white/55 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div
                className={`lg:col-span-7 relative bg-[#080808] aspect-[12/10] lg:self-center ${i % 2 === 1 ? "lg:order-1" : ""
                  }`}
              >
                <LazyAutoplayVideo
                  src={feature.src}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
      {/* STOP RENTING SECTION */}
      <section className="relative px-4 sm:px-8 py-16 sm:py-24">
        <TruchetBlob
          className="top-[20%] -right-32 w-[540px] h-[540px]"
          variant="pricing"
          intensity={0.75}
          speed={-15}
          rotate={-20}
        />
        <div className="max-w-6xl mx-auto" data-reveal>
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Ownership
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
              Stop renting from{" "}
              <span className="font-serif-italic">websites</span>.
            </h2>
            <p className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
              ArtCraft is yours to own and keep,{" "}
              <span className="font-serif-italic text-white/75">forever</span>.
              No subscriptions, no aggregator middleman, no rent payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Websites column */}
            <div className="rounded-2xl sm:rounded-[28px] bg-[#080808] p-7 sm:p-8">
              <div className="flex items-center gap-2 mb-9">
                <span className="text-[12px] font-bold uppercase tracking-wider text-white/40">
                  Other tools
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-medium mb-5 tracking-[-0.01em] text-white/85">
                The Rental Trap
              </h3>
              <p className="text-[15px] text-white/55 leading-relaxed mb-6">
                With browser-based tools, you're paying for access, not a
                product. Your work, models, and history live on someone else's
                servers, and disappear with them.
              </p>
              <div className="flex flex-wrap gap-2">
                {["No ownership", "Monthly fees"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-red-300/80 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-2.5 py-1.5"
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="text-red-400 text-[10px]"
                    />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ArtCraft column */}
            <div className="rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-primary/15 via-white/[0.04] to-white/[0.02] border border-primary/25 p-7 sm:p-8 relative overflow-hidden">
              <div
                className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(45,129,255,0.25) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-8">
                  <img
                    src="/images/artcraft-logo.png"
                    alt="ArtCraft"
                    aria-hidden
                    className="h-5 w-auto"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-medium mb-5 tracking-[-0.01em] text-white">
                  Complete ownership
                </h3>
                <p className="text-[15px] text-white/80 leading-relaxed mb-6">
                  Download ArtCraft and it's yours. You own the application,
                  your files, and everything you create. Bring your own API
                  keys, or use ours.
                </p>
                <div className="flex flex-wrap gap-2 self-end">
                  {["Yours forever", "BYO keys"].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary-200 bg-primary/[0.12] border border-primary/25 rounded-lg px-2.5 py-1.5"
                    >
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-primary text-[10px]"
                      />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FIVE REASONS: original bento, dark theme */}
      <section
        id="reasons"
        className="relative px-4 sm:px-8 py-16 sm:py-24 overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
          }}
        >
          <TruchetPattern
            variant="landing"
            intensity={0.6}
            className="absolute inset-0 w-full h-full"
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto" data-reveal>
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Why ArtCraft
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02]">
              Five reasons it's the{" "}
              <span className="font-serif-italic">best tool</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-6">
            {/* Reason #1: Text Prompting Sucks */}
            <div className="xl:col-span-6 rounded-3xl bg-[#080808] p-6 lg:p-8 group">
              <div className="flex xl:flex-col gap-4 lg:gap-8 h-full flex-col-reverse">
                <div className="grow h-40">
                  <img
                    src="/images/2d-3d.png"
                    alt="2D and 3D"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-2xl border border-white/[0.05]"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium tracking-[-0.02em] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight text-white">
                      Text Prompting Sucks
                    </h3>
                    <p className="text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed">
                      <span className="text-primary-400/80 font-semibold">
                        Create images and videos with our easy-to-use AI tool.
                      </span>{" "}
                      Draw on a canvas or work in a 3D space as if you're
                      playing a video game.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason #2: Desktop App */}
            <div className="xl:col-span-6 rounded-3xl bg-[#080808] p-6 lg:p-8 pb-0 lg:pb-0 group overflow-hidden">
              <div className="relative flex flex-col h-full">
                <h3 className="font-medium tracking-[-0.02em] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight text-white">
                  Desktop App
                </h3>
                <p className="text-white/60 text-sm sm:text-base mb-4 sm:mb-6 lg:text-lg leading-relaxed">
                  <span className="text-primary-400/80 font-semibold">
                    No more hunting for the hundredth tab.
                  </span>{" "}
                  Works on Windows, Mac, and soon Linux and Tablets. First class
                  experience for real artists.
                </p>
                <div className="h-20 md:h-24 lg:h-36 xl:h-36 bg-white/[0.02] border-[5px] border-white/[0.02] rounded-t-2xl relative mt-12 lg:mt-16 xl:mt-24 select-none">
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-9 items-center justify-center drop-shadow-2xl z-20 scale-50 lg:scale-75 xl:scale-100">
                    <img
                      src="/images/windows-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="h-32 rotate-6"
                    />
                    <img
                      src="/images/apple-logo.png"
                      alt="Apple Logo"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="h-36 -rotate-6"
                    />
                    <img
                      src="/images/linux-logo.png"
                      alt="Linux Logo"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="h-36 rotate-6"
                    />
                  </div>
                </div>
                <div className="absolute left-0 bottom-0 w-full h-28 bg-gradient-to-t from-[#000000] via-[#121212]/50 to-transparent z-10 pointer-events-none" />
              </div>
            </div>

            {/* Reason #3: Open Source */}
            <div className="xl:col-span-4 rounded-3xl bg-[#080808] p-6 lg:p-8 group">
              <div className="flex flex-col h-full">
                <h3 className="font-medium tracking-[-0.02em] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight text-white">
                  It's Open Source
                </h3>
                <p className="text-white/60 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed flex-1">
                  Our desktop app's code and infrastructure are all{" "}
                  <a
                    href="https://github.com/storytold/artcraft"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400/80 font-semibold hover:text-primary-300 underline underline-offset-2 transition-colors"
                  >
                    open source on GitHub.
                  </a>{" "}
                  Join us and contribute!
                </p>
                <div className="flex justify-center items-center h-full p-4 lg:p-6 select-none">
                  <FontAwesomeIcon
                    icon={faGithub}
                    className="text-[80px] md:text-[110px] lg:text-[130px] text-white/85 group-hover:text-white group-hover:scale-105 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Reason #4: Use Every Model */}
            <div className="xl:col-span-8 rounded-3xl bg-[#080808] group overflow-hidden">
              <div className="lg:flex-1 flex flex-col justify-between">
                <div className="p-6 lg:p-8">
                  <h3 className="font-medium tracking-[-0.02em] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight text-white">
                    Use Every Model
                  </h3>
                  <p className="text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed">
                    You'll be able to use{" "}
                    <span className="text-primary-400/80 font-semibold">
                      EVERY image and video model
                    </span>{" "}
                    all in one place. Log in with your existing subscriptions.
                  </p>
                </div>
                <ModelBadgeGrid
                  highlight="nano-banana-2"
                  rowOffsets={[-70, -90, -160]}
                  className="mt-3"
                />
              </div>
            </div>

            {/* Reason #5: Created by Artists */}
            <div className="xl:col-span-12 md:col-span-2 rounded-3xl bg-[#080808] p-6 lg:p-8 group">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center">
                <div className="lg:flex-1">
                  <h3 className="font-medium tracking-[-0.02em] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight text-white">
                    Created by Artists and Filmmakers
                  </h3>
                  <p className="text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed">
                    <span className="text-primary-400/80 font-semibold">
                      The other leading platforms were created by the Google ad
                      team, crypto bros, and other non-artists.
                    </span>{" "}
                    <br />
                    Not us. We're one of you.
                  </p>
                </div>
                <div className="flex justify-center items-center h-24 lg:h-28">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-pink-900 rounded-full flex items-center justify-center border-2 border-pink-600 shadow-lg z-10">
                    <FontAwesomeIcon
                      icon={faFilm}
                      className="text-white text-xl lg:text-2xl"
                    />
                  </div>
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-400 shadow-lg -ml-2 z-30">
                    <FontAwesomeIcon
                      icon={faPaintBrush}
                      className="text-white text-2xl lg:text-3xl"
                    />
                  </div>
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-purple-900 rounded-full flex items-center justify-center border-2 border-purple-600 shadow-lg -ml-2 z-20">
                    <FontAwesomeIcon
                      icon={faCamera}
                      className="text-white text-xl lg:text-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* MADE WITH ARTCRAFT */}
      <section id="made-with" className="relative px-4 sm:px-8 py-16 sm:py-24">
        <TruchetBlob
          className="top-[15%] -left-36 w-[580px] h-[580px]"
          variant="content"
          intensity={0.75}
          speed={-20}
          rotate={18}
        />
        <div className="max-w-6xl mx-auto" data-reveal>
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Community
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
              Made using <span className="font-serif-italic">ArtCraft</span>.
            </h2>
            <p className="text-base sm:text-lg text-white/55">
              See content created with the app.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {MADE_WITH_VIDEOS.map((src, index) => {
              const videoId = src.split("/").pop()?.split("?")[0];
              return (
                <button
                  key={src}
                  onClick={() => setActiveVideo(index)}
                  className="group relative rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.08] hover:border-white/[0.2] p-1.5 transition-all hover:-translate-y-0.5"
                >
                  <div className="aspect-video rounded-xl overflow-hidden relative bg-black">
                    {activeVideo === index ? (
                      <iframe
                        src={src + "&autoplay=1"}
                        title="Made with ArtCraft"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                          alt="Video thumbnail"
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-14 w-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon
                              icon={faPlay}
                              className="text-black text-base translate-x-0.5"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {/* FINAL CTA */}
      <section className="relative px-4 sm:px-8 py-20 sm:py-32 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 80%)",
          }}
        >
          <TruchetPattern
            variant="landing"
            intensity={0.6}
            className="absolute inset-0 w-full h-full"
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto" data-reveal>
          <div className="relative rounded-2xl sm:rounded-[32px] bg-[#080808] border border-white/[0.1] p-10 sm:p-16 lg:p-20 text-center overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(45,129,255,0.3) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5 text-white">
                Ready to <span className="font-serif-italic">craft</span>?
              </h2>
              <p className="max-w-xl mx-auto text-base sm:text-lg text-white/60 leading-relaxed mb-10">
                Join thousands of artists and filmmakers using ArtCraft to bring
                their vision to life. Free to download.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 font-display">
                {isMobile ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white/10 text-white/60 text-[14px] font-semibold"
                  >
                    Download on a desktop
                  </button>
                ) : (
                  <>
                    <Tooltip
                      content="Buy credits and support open source"
                      position="top"
                      delay={0}
                      className="rounded-full"
                    >
                      <Link
                        to="/pricing"
                        className="group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary hover:bg-primary-600 text-white text-[14px] font-semibold transition-all shadow-[0_4px_24px_-4px_rgba(45,129,255,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(45,129,255,0.5)] hover:-translate-y-px"
                      >
                        <FontAwesomeIcon
                          icon={faRocket}
                          className="text-[13px]"
                        />
                        Supercharge Credits
                      </Link>
                    </Tooltip>
                    <a
                      href={downloadUrl}
                      onClick={onDownloadClick}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white hover:bg-white/90 text-black text-[14px] font-semibold transition-all hover:-translate-y-px shadow-[0_4px_24px_-4px_rgba(255,255,255,0.2)]"
                    >
                      <FontAwesomeIcon
                        icon={isMacOs ? faApple : faWindows}
                        className="text-[13px]"
                      />
                      Download for {isMacOs ? "Mac" : "Windows"}
                    </a>
                    <a
                      href={SOCIAL_LINKS.DISCORD}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-[14px] font-semibold border border-white/[0.1] transition-all hover:-translate-y-px"
                    >
                      <FontAwesomeIcon
                        icon={faDiscord}
                        className="text-[13px] text-[#5865F2]"
                      />
                      Join Discord
                    </a>
                    <a
                      href={SOCIAL_LINKS.GITHUB}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-[14px] font-semibold border border-white/[0.1] transition-all hover:-translate-y-px"
                    >
                      <FontAwesomeIcon
                        icon={faGithub}
                        className="text-[13px]"
                      />
                      Star on GitHub
                    </a>
                  </>
                )}
              </div>

              {!isMobile && (
                <div className="mt-6 flex items-center justify-center gap-3 text-[13px] text-white/45">
                  <span>or generate in your browser:</span>
                  <Link
                    to="/create-image"
                    className="group inline-flex items-center gap-1 text-white/65 hover:text-white underline-offset-4 hover:underline transition-colors"
                  >
                    Image
                  </Link>
                  <span className="text-white/25">·</span>
                  <Link
                    to="/create-video"
                    className="group inline-flex items-center gap-1 text-white/65 hover:text-white underline-offset-4 hover:underline transition-colors"
                  >
                    Video
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
      <Footer />
    </div>
  );
};

export default Landing3;
