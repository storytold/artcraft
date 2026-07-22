import { useEffect, useRef, useState, useLayoutEffect } from "react";
import type { ReactNode } from "react";
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
  faArrowRight,
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
  faGlobe,
  faVolumeXmark,
} from "@fortawesome/pro-solid-svg-icons";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { DownloadModal } from "../../components/download-modal";
import ModelBadgeGrid from "../../components/model-badge-grid";
import { getSession } from "../../lib/session";
import { BillingApi } from "@storyteller/api";
import { DOWNLOAD_LINKS } from "../../config/github_download_links";
import { webappUrl, SOCIAL_LINKS } from "../../config/links";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Link } from "react-router-dom";

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
    src: "/videos/features/Character-Pose.webm",
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

const MARQUEE_ITEMS = [
  "Ready to craft?",
  "Open source",
  "Controllable AI",
  "Yours forever",
];

// Hand-drawn marker stroke (tapered ends, slight middle bulge, gentle tilt)
// that sits behind an emphasized word like a highlighter pass. The wrapping
// span carries `data-manifesto-underline` so the GSAP timeline can sweep it
// in left-to-right; pass `animate={false}` for the static (mobile) version.
const MarkerHighlight = ({
  children,
  animate = true,
}: {
  children: ReactNode;
  animate?: boolean;
}) => (
  <span className="relative inline-block">
    <span
      data-manifesto-underline={animate ? "" : undefined}
      aria-hidden
      className="absolute inset-x-[-0.2em] top-[-0.08em] bottom-[-0.18em]"
      // Hidden initially via a right-side clip; GSAP wipes the clip open
      // left-to-right so the full-size stroke is revealed (not stretched).
      style={animate ? { clipPath: "inset(0 100% 0 0)" } : undefined}
    >
      <svg
        viewBox="0 0 120 26"
        preserveAspectRatio="none"
        fill="none"
        className="absolute inset-0 h-full w-full"
        style={{ transform: "rotate(-3.5deg)" }}
      >
        <path
          d="M3,13 C3,8.5 5,5.5 10,4.6 C13,4.1 16,5 18,4.4 C46,3.6 78,3.7 104,4.5 C110,4.7 114,4 116,6 C118,8 117.5,11 117,13 C117,15.5 118,18 116,20 C114,22 110,21.4 104,21.6 C78,22.4 46,22.5 18,21.7 C16,21.6 13,22 10,21.5 C5,20.6 3,17.5 3,13 Z"
          fill="#2d81ff"
          fillOpacity="0.9"
        />
      </svg>
    </span>
    <span className="relative">{children}</span>
  </span>
);

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

// Blueprint grid — the structural backdrop replacing decorative patterns.
// Always wrapped in a masked container so it fades at the edges.
const GridPattern = ({ className = "" }: { className?: string }) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-0 ${className}`}
    style={{
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
    }}
  />
);

// Brutalist corner registration marks for framed blocks.
const CornerTicks = () => (
  <>
    {[
      "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
      "top-0 right-0 translate-x-1/2 -translate-y-1/2",
      "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
      "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
    ].map((pos) => (
      <span
        key={pos}
        aria-hidden
        className={`font-mono-ui absolute z-10 select-none text-[13px] leading-none text-white/35 ${pos}`}
      >
        +
      </span>
    ))}
  </>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="font-mono-ui block text-[11px] font-medium text-primary-400">
    {"// "}
    {children}
  </span>
);

interface SectionHeaderProps {
  eyebrow: string;
  number: string;
  title: ReactNode;
  children?: ReactNode;
}

// Left-aligned section intro sitting on an animated hairline rule, with an
// oversized outlined numeral anchored to the right edge.
const SectionHeader = ({
  eyebrow,
  number,
  title,
  children,
}: SectionHeaderProps) => (
  <div className="relative mb-12 sm:mb-16" data-reveal>
    <div data-rule className="h-px w-full origin-left bg-white/[0.1]" />
    <div className="relative pt-6 sm:pt-8">
      <span
        aria-hidden
        className="font-condensed pointer-events-none absolute right-0 top-4 select-none font-semibold leading-none text-transparent"
        style={{
          WebkitTextStroke: "1px rgba(255,255,255,0.08)",
          fontSize: "clamp(80px, 14vw, 180px)",
        }}
      >
        {number}
      </span>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-condensed mt-4 max-w-3xl text-[40px] font-semibold text-white sm:text-[52px] lg:text-[64px]">
        {title}
      </h2>
      {children && (
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/55 sm:text-lg">
          {children}
        </p>
      )}
    </div>
  </div>
);

// Serif-italic accent inside the uppercase condensed headlines.
const Serif = ({ children }: { children: ReactNode }) => (
  <span className="font-serif-italic normal-case tracking-normal text-white/95">
    {children}
  </span>
);

// Full-bleed type marquee — two identical copies so the -50% translate of
// the global `marquee-track` keyframe loops seamlessly.
const MarqueeStrip = () => (
  <div
    aria-hidden
    className="relative select-none overflow-hidden border-y border-white/[0.08] py-5 sm:py-7"
  >
    <div className="flex w-max whitespace-nowrap [animation:marquee-track_36s_linear_infinite] motion-reduce:[animation:none]">
      {[0, 1].map((copy) => (
        <div key={copy} className="flex items-center">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="font-condensed flex items-center text-[40px] font-semibold leading-none sm:text-[60px]"
            >
              <span
                className={i % 2 === 0 ? "text-white/90" : "text-transparent"}
                style={
                  i % 2 === 1
                    ? { WebkitTextStroke: "1px rgba(255,255,255,0.35)" }
                    : undefined
                }
              >
                {item}
              </span>
              <span className="mx-6 text-[18px] text-primary sm:mx-10 sm:text-[24px]">
                ✦
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Primary CTA: routes subscribers straight to the webapp homepage and everyone
// else (logged out, or logged in without an active subscription) to /pricing.
const UseOnWebButton = ({
  isLoggedIn,
  hasSubscription,
}: {
  isLoggedIn: boolean;
  hasSubscription: boolean;
}) => {
  const className =
    "group inline-flex items-center gap-2 h-11 px-6 bg-primary hover:bg-primary-600 text-white text-[14px] font-semibold transition-all shadow-[0_4px_24px_-4px_rgba(45,129,255,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(45,129,255,0.5)] hover:-translate-y-px";
  const inner = (
    <>
      <FontAwesomeIcon icon={faGlobe} className="text-[13px]" />
      Use on Web
    </>
  );
  return (
    <Tooltip
      content="Use ArtCraft in your browser"
      position="top"
      delay={0}
      className="rounded-none"
    >
      {isLoggedIn && hasSubscription ? (
        <a href={webappUrl("/")} className={className}>
          {inner}
        </a>
      ) : (
        <Link to="/pricing" className={className}>
          {inner}
        </Link>
      )}
    </Tooltip>
  );
};

const Landing4 = () => {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [heroVideoMuted, setHeroVideoMuted] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
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
    getSession().then(async (response) => {
      if (cancelled || !response.success || !response.data?.loggedIn) return;
      setIsLoggedIn(true);
      try {
        const subResponse = await new BillingApi().ListActiveSubscriptions();
        if (
          !cancelled &&
          subResponse.success &&
          subResponse.data &&
          subResponse.data.active_subscriptions.length > 0
        ) {
          setHasSubscription(true);
        }
      } catch (e) {}
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
    lenisRef.current = lenis;

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
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  // Reveal animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (isMobile) return;

      // Hero headline — masked line reveal on load. Each [data-hero-line]
      // sits inside an overflow-hidden wrapper and rises into view.
      const heroLines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
      if (heroLines.length) {
        gsap.fromTo(
          heroLines,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.1,
            delay: 0.15,
          },
        );
      }

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

      // Section hairline rules draw in left-to-right as they enter view.
      const rules = gsap.utils.toArray<HTMLElement>("[data-rule]");
      rules.forEach((rule) => {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: rule,
              start: "top 90%",
              once: true,
            },
          },
        );
      });

      // Feature index rail: highlight the row whose panel currently crosses
      // the middle of the viewport. Class toggling (no React state) so scroll
      // stays cheap.
      const featurePanels = gsap.utils.toArray<HTMLElement>(
        "[data-feature-panel]",
      );
      const featureIndexItems = gsap.utils.toArray<HTMLElement>(
        "[data-feature-index]",
      );
      if (featurePanels.length && featureIndexItems.length) {
        featurePanels.forEach((panel, i) => {
          ScrollTrigger.create({
            trigger: panel,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: (self) => {
              featureIndexItems[i]?.classList.toggle(
                "is-active",
                self.isActive,
              );
            },
          });
        });
      }

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

        // Phase 1b — once the sentence is fully revealed, sweep a blue
        // highlighter block across "control" to land the emphasis.
        const manifestoUnderline = manifestoSection.querySelector<HTMLElement>(
          "[data-manifesto-underline]",
        );
        if (manifestoUnderline) {
          gsap.set(manifestoUnderline, {
            clipPath: "inset(0 100% 0 0)",
          });
          tl.to(
            manifestoUnderline,
            { clipPath: "inset(0 0% 0 0)", duration: 4, ease: "power2.out" },
            ">",
          );
        }

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

  const scrollToFeature = (index: number) => {
    const panel = document.querySelector<HTMLElement>(
      `[data-feature-panel="${index}"]`,
    );
    if (!panel) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(panel, { offset: -120 });
    } else {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const downloadUrl = isMacOs ? DOWNLOAD_LINKS.MACOS : DOWNLOAD_LINKS.WINDOWS;

  const downloadButtonClassName =
    "inline-flex items-center gap-2 h-11 px-6 bg-white hover:bg-white/90 text-black text-[14px] font-semibold transition-all hover:-translate-y-px shadow-[0_4px_24px_-4px_rgba(255,255,255,0.2)]";

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-clip bg-[#050507] text-white selection:bg-primary/30 selection:text-white"
    >
      <Seo
        title="ArtCraft - Controllable AI for Artists"
        description="ArtCraft is the opensource desktop app for generating AI video and images - built for artists who want real control."
      />
      {/* Structural page rails at content width — the grid skeleton */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 mx-auto hidden max-w-6xl border-x border-white/[0.05] lg:block"
      />
      {/* Top primary-blue accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.14) 0%, transparent 70%)",
        }}
      />
      {/* Lower-page primary-blue accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[900px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(45,129,255,0.1) 0%, transparent 70%)",
        }}
      />
      {/* HERO — left-aligned editorial layout */}
      <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-8 sm:pt-32 sm:pb-24">
        {/* Blueprint grid background with parallax */}
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
          <GridPattern className="-top-[10%] h-[120%]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Mono meta rule row */}
          <div
            className="font-mono-ui mb-10 flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4 text-[10px] text-white/40 sm:mb-14"
            data-reveal
          >
            <span>{"// ArtCraft"}</span>
            <span className="hidden sm:block">
              Controllable AI for artists
            </span>
            <span>Open source — Win / macOS</span>
          </div>

          {/* Eyebrow chip */}
          <div
            className="font-mono-ui mb-7 inline-flex items-center gap-2.5 border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-[10px] font-medium text-white/70 backdrop-blur-md"
            data-reveal
          >
            <span className="flex h-1.5 w-1.5 bg-primary" />
            Now with Seedance 2.0, Nano Banana 2 &amp; more
          </div>

          {/* Headline — masked line reveal, left-aligned and huge */}
          <h1
            className="font-condensed font-semibold text-white"
            style={{ fontSize: "clamp(52px, 11vw, 144px)" }}
          >
            <span className="block overflow-hidden">
              <span data-hero-line className="block">
                Controllable AI
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-hero-line className="block">
                <Serif>for artists.</Serif>
              </span>
            </span>
          </h1>

          {/* Baseline row: subtitle left, CTAs right */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
            <p
              className="max-w-md text-base leading-relaxed text-white/55 sm:text-lg lg:col-span-6"
              data-reveal
            >
              Artists need and deserve unparalleled control and precision.
              ArtCraft’s got you covered.
            </p>
            <div
              className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end"
              data-reveal
            >
              {isMobile ? (
                <Button
                  disabled
                  className="inline-flex h-11 items-center gap-2 rounded-none bg-white/10 px-6 text-[14px] font-semibold text-white/60"
                >
                  Download on a desktop
                </Button>
              ) : (
                <>
                  <UseOnWebButton
                    isLoggedIn={isLoggedIn}
                    hasSubscription={hasSubscription}
                  />
                  <a
                    href={downloadUrl}
                    onClick={onDownloadClick}
                    className={downloadButtonClassName}
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
          </div>

          {/* Hero video — framed like a monitor with registration marks */}
          <div className="relative mt-14 sm:mt-20" data-reveal>
            <CornerTicks />
            <div className="overflow-hidden border border-white/[0.1] bg-[#0A0A10]">
              <div className="font-mono-ui flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5 text-[10px] text-white/40">
                <span>{"// Showreel"}</span>
                <span>ArtCraft — 2026</span>
              </div>
              <div
                className="relative w-full overflow-hidden bg-black"
                style={{ paddingTop: "56.25%" }}
              >
                <video
                  ref={heroVideoRef}
                  src="https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/website-commercial-2026.05.mp4"
                  className="absolute inset-0 h-full w-full"
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
                      void v.play().catch(() => {});
                    }}
                    className="absolute left-1/2 top-4 inline-flex h-9 -translate-x-1/2 items-center gap-2 border border-white/15 bg-black/65 px-4 text-[12px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/80"
                  >
                    <FontAwesomeIcon
                      icon={faVolumeXmark}
                      className="text-[12px]"
                    />
                    Tap to unmute
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* MANIFESTO */}
      {isMobile && (
        // Mobile: simple static version — no sticky, no 3D character, no
        // scroll reveal. Just the manifesto as a regular centered headline.
        <section className="relative bg-[#050507] px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-2xl font-medium tracking-[-0.035em] text-white sm:text-3xl"
              style={{ lineHeight: 1.4 }}
            >
              {MANIFESTO_WORDS.map((w, i) => (
                <span key={i}>
                  {w === "control" ? (
                    <MarkerHighlight animate={false}>{w}</MarkerHighlight>
                  ) : (
                    w
                  )}
                  {i < MANIFESTO_WORDS.length - 1 ? " " : ""}
                </span>
              ))}
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
            className="flex items-center justify-center overflow-hidden bg-[#050507]"
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
              <GridPattern />
            </div>
            <ManifestoThreeBackground
              progressRef={characterProgressRef}
              pausedRef={characterPausedRef}
            />
            <h2
              className="relative z-10 mx-auto max-w-4xl px-4 text-center text-2xl font-medium tracking-[-0.035em] text-white sm:px-8 sm:text-4xl md:text-5xl lg:text-[60px]"
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
                  className="mr-[0.25em] inline-block opacity-15 will-change-[opacity,transform]"
                >
                  {w === "control" ? <MarkerHighlight>{w}</MarkerHighlight> : w}
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

      {/* FEATURES — sticky index rail + scrolling framed panels */}
      <section id="features" className="relative px-4 pt-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Crafting features"
            number="01"
            title={
              <>
                We're pulling you <Serif>out of prompting.</Serif>
              </>
            }
          >
            Text prompting is neat, but artists crave control. ArtCraft is the
            control that mere words cannot buy.
          </SectionHeader>

          <div className="grid gap-0 lg:grid-cols-12 lg:gap-12">
            {/* Sticky index rail (desktop) */}
            <div className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-28 border-t border-white/[0.1]">
                {FEATURES.map((feature, i) => (
                  <button
                    key={feature.title}
                    type="button"
                    data-feature-index
                    onClick={() => scrollToFeature(i)}
                    className="landing-index-item flex w-full items-center gap-4 border-b border-white/[0.06] py-4 text-left text-white/35 hover:text-white/70"
                  >
                    <span className="font-mono-ui w-6 shrink-0 text-[10px]">
                      {`0${i + 1}`}
                    </span>
                    <span className="landing-index-marker h-px w-6 shrink-0 bg-primary" />
                    <span className="text-sm font-medium">
                      {feature.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature panels */}
            <div className="flex flex-col gap-16 lg:col-span-8 lg:gap-24">
              {FEATURES.map((feature, i) => (
                <article
                  key={feature.title}
                  data-feature-panel={i}
                  className="scroll-mt-28"
                  data-reveal
                >
                  <div className="overflow-hidden border border-white/[0.1] bg-[#0A0A10]">
                    <div className="font-mono-ui flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5 text-[10px] text-white/40">
                      <span>{`// 0${i + 1} — ${feature.label}`}</span>
                      <FontAwesomeIcon
                        icon={feature.icon}
                        className="text-[11px]"
                      />
                    </div>
                    <div className="relative aspect-[16/10] bg-black">
                      <LazyAutoplayVideo
                        src={feature.src}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-12 sm:gap-6">
                    <h3 className="text-2xl font-medium leading-[1.15] tracking-[-0.02em] text-white sm:col-span-5 sm:text-[26px]">
                      {feature.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-white/55 sm:col-span-7">
                      {feature.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* STOP RENTING — split "versus" panel */}
      <section className="relative px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Ownership"
            number="02"
            title={
              <>
                Stop <Serif>renting</Serif> from websites.
              </>
            }
          >
            ArtCraft is yours to own and keep, forever. No subscriptions
            needed, no aggregator middleman, no rent payments.
          </SectionHeader>

          <div
            className="relative grid grid-cols-1 border border-white/[0.1] md:grid-cols-2"
            data-reveal
          >
            {/* Divider badge */}
            <span className="font-mono-ui absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 border border-white/[0.15] bg-[#050507] px-2.5 py-1.5 text-[10px] text-white/60 md:block">
              VS
            </span>

            {/* Websites column — deliberately styled to feel like a downgrade */}
            <div className="relative overflow-hidden border-b border-white/[0.1] bg-gradient-to-br from-red-500/[0.08] via-[#0a0607] to-[#070709] p-7 sm:p-10 md:border-b-0 md:border-r">
              <div
                className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="mb-8 flex items-center gap-2">
                  <span className="font-mono-ui inline-flex items-center gap-1.5 text-[11px] font-bold text-red-300/70">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="text-[11px] text-red-400"
                    />
                    Other tools
                  </span>
                </div>
                <h3 className="mb-5 text-xl font-medium tracking-[-0.01em] text-white/70 sm:text-2xl">
                  The Rental Trap
                </h3>
                <p className="mb-8 text-[15px] leading-relaxed text-white/45">
                  With browser-based tools, you're paying for access, not a
                  product. Your work, models, and history live on someone else's
                  servers, and disappear with them.
                </p>
                <ul className="border-t border-red-500/20">
                  {["No ownership", "Monthly fees", "Locked in"].map((tag) => (
                    <li
                      key={tag}
                      className="font-mono-ui flex items-center gap-2.5 border-b border-red-500/20 py-3 text-[10px] font-semibold text-red-300/80"
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="text-[10px] text-red-400"
                      />
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ArtCraft column */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-white/[0.04] to-white/[0.02] p-7 sm:p-10">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(45,129,255,0.25) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="mb-8 flex items-center gap-1.5">
                  <img
                    src="/images/artcraft-logo.png"
                    alt="ArtCraft"
                    aria-hidden
                    className="h-5 w-auto"
                  />
                </div>
                <h3 className="mb-5 text-xl font-medium tracking-[-0.01em] text-white sm:text-2xl">
                  Complete ownership
                </h3>
                <p className="mb-8 text-[15px] leading-relaxed text-white/80">
                  Download ArtCraft and it's yours. You own the application,
                  your files, and everything you create. Bring your own API
                  keys, or use ours.
                </p>
                <ul className="border-t border-primary/25">
                  {["Yours forever", "BYO keys", "No subscriptions needed"].map(
                    (tag) => (
                      <li
                        key={tag}
                        className="font-mono-ui flex items-center gap-2.5 border-b border-primary/25 py-3 text-[10px] font-semibold text-primary-200"
                      >
                        <FontAwesomeIcon
                          icon={faCheck}
                          className="text-[10px] text-primary"
                        />
                        {tag}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FIVE REASONS — numbered editorial ledger rows */}
      <section
        id="reasons"
        className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24"
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
          <GridPattern />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Why ArtCraft"
            number="03"
            title={
              <>
                Five reasons it's the <Serif>best tool.</Serif>
              </>
            }
          />

          <div className="border-t border-white/[0.1]" data-reveal>
            {/* Reason #1: Control Beyond Text Prompting */}
            <div className="group relative grid grid-cols-12 gap-x-6 gap-y-6 border-b border-white/[0.1] py-10 transition-colors hover:bg-white/[0.02] lg:py-14">
              <span
                aria-hidden
                className="font-condensed col-span-12 select-none text-[48px] font-semibold leading-none text-transparent lg:col-span-2"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}
              >
                01
              </span>
              <h3 className="col-span-12 text-xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-2xl lg:col-span-3 lg:text-3xl">
                Control Beyond Text Prompting
              </h3>
              <p className="col-span-12 text-sm leading-relaxed text-white/60 sm:text-base lg:col-span-5">
                <span className="font-semibold text-primary-400/80">
                  Create images and videos with our easy-to-use AI tool.
                </span>{" "}
                Draw on a canvas or work in a 3D space as if you're playing a
                video game.
              </p>
              <div className="col-span-12 lg:col-span-2">
                <img
                  src="/images/2d-3d.png"
                  alt="2D and 3D"
                  loading="lazy"
                  decoding="async"
                  className="h-28 w-full border border-white/[0.08] object-cover transition-transform duration-500 group-hover:scale-[1.02] lg:h-24"
                />
              </div>
            </div>

            {/* Reason #2: Desktop App */}
            <div className="group relative grid grid-cols-12 gap-x-6 gap-y-6 border-b border-white/[0.1] py-10 transition-colors hover:bg-white/[0.02] lg:py-14">
              <span
                aria-hidden
                className="font-condensed col-span-12 select-none text-[48px] font-semibold leading-none text-transparent lg:col-span-2"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}
              >
                02
              </span>
              <h3 className="col-span-12 text-xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-2xl lg:col-span-3 lg:text-3xl">
                Desktop App
              </h3>
              <p className="col-span-12 text-sm leading-relaxed text-white/60 sm:text-base lg:col-span-5">
                <span className="font-semibold text-primary-400/80">
                  No more hunting for the hundredth tab.
                </span>{" "}
                Works on Windows, Mac, and soon Linux and Tablets. First class
                experience for real artists.
              </p>
              <div className="col-span-12 flex items-center gap-4 select-none lg:col-span-2 lg:justify-end">
                <img
                  src="/images/windows-logo.png"
                  alt="Windows Logo"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  className="h-10 rotate-6 drop-shadow-xl"
                />
                <img
                  src="/images/apple-logo.png"
                  alt="Apple Logo"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  className="h-12 -rotate-6 drop-shadow-xl"
                />
                <img
                  src="/images/linux-logo.png"
                  alt="Linux Logo"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  className="h-12 rotate-6 drop-shadow-xl"
                />
              </div>
            </div>

            {/* Reason #3: Open Source */}
            <div className="group relative grid grid-cols-12 gap-x-6 gap-y-6 border-b border-white/[0.1] py-10 transition-colors hover:bg-white/[0.02] lg:py-14">
              <span
                aria-hidden
                className="font-condensed col-span-12 select-none text-[48px] font-semibold leading-none text-transparent lg:col-span-2"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}
              >
                03
              </span>
              <h3 className="col-span-12 text-xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-2xl lg:col-span-3 lg:text-3xl">
                It's Open Source
              </h3>
              <p className="col-span-12 text-sm leading-relaxed text-white/60 sm:text-base lg:col-span-5">
                Our desktop app's code and infrastructure are all{" "}
                <a
                  href="https://github.com/storytold/artcraft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary-400/80 underline underline-offset-2 transition-colors hover:text-primary-300"
                >
                  open source on GitHub.
                </a>{" "}
                Join us and contribute!
              </p>
              <div className="col-span-12 flex select-none items-center lg:col-span-2 lg:justify-end">
                <FontAwesomeIcon
                  icon={faGithub}
                  className="text-[56px] text-white/85 transition-all group-hover:scale-105 group-hover:text-white"
                />
              </div>
            </div>

            {/* Reason #4: Use Every Model */}
            <div className="group relative grid grid-cols-12 gap-x-6 gap-y-6 border-b border-white/[0.1] py-10 transition-colors hover:bg-white/[0.02] lg:py-14">
              <span
                aria-hidden
                className="font-condensed col-span-12 select-none text-[48px] font-semibold leading-none text-transparent lg:col-span-2"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}
              >
                04
              </span>
              <h3 className="col-span-12 text-xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-2xl lg:col-span-3 lg:text-3xl">
                Use Every Model
              </h3>
              <p className="col-span-12 text-sm leading-relaxed text-white/60 sm:text-base lg:col-span-7">
                You'll be able to use{" "}
                <span className="font-semibold text-primary-400/80">
                  EVERY image and video model
                </span>{" "}
                all in one place. Log in with your existing subscriptions.
              </p>
              <div className="col-span-12">
                <ModelBadgeGrid className="mt-2" />
              </div>
            </div>

            {/* Reason #5: Created by Artists */}
            <div className="group relative grid grid-cols-12 gap-x-6 gap-y-6 border-b border-white/[0.1] py-10 transition-colors hover:bg-white/[0.02] lg:py-14">
              <span
                aria-hidden
                className="font-condensed col-span-12 select-none text-[48px] font-semibold leading-none text-transparent lg:col-span-2"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}
              >
                05
              </span>
              <h3 className="col-span-12 text-xl font-medium leading-tight tracking-[-0.02em] text-white sm:text-2xl lg:col-span-3 lg:text-3xl">
                Created by Artists and Filmmakers
              </h3>
              <p className="col-span-12 text-sm leading-relaxed text-white/60 sm:text-base lg:col-span-5">
                <span className="font-semibold text-primary-400/80">
                  The other leading platforms were created by the Google ad
                  team, crypto bros, and other non-artists.
                </span>{" "}
                Not us. We're one of you.
              </p>
              <div className="col-span-12 flex items-center lg:col-span-2 lg:justify-end">
                <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-pink-600 bg-pink-900 shadow-lg">
                  <FontAwesomeIcon icon={faFilm} className="text-white" />
                </div>
                <div className="z-30 -ml-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-600 shadow-lg">
                  <FontAwesomeIcon
                    icon={faPaintBrush}
                    className="text-lg text-white"
                  />
                </div>
                <div className="z-20 -ml-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-purple-600 bg-purple-900 shadow-lg">
                  <FontAwesomeIcon icon={faCamera} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* MADE WITH ARTCRAFT — asymmetric mosaic */}
      <section id="made-with" className="relative px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Community"
            number="04"
            title={
              <>
                Made using <Serif>ArtCraft.</Serif>
              </>
            }
          >
            See content created with the app.
          </SectionHeader>

          <div
            className="grid grid-cols-1 gap-px border border-white/[0.1] bg-white/[0.1] sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2"
            data-reveal
          >
            {MADE_WITH_VIDEOS.map((src, index) => {
              const videoId = src.split("/").pop()?.split("?")[0];
              const isLead = index === 0;
              return (
                <button
                  key={src}
                  onClick={() => setActiveVideo(index)}
                  className={`group relative overflow-hidden bg-[#070709] text-left ${
                    isLead ? "sm:col-span-2 lg:row-span-2" : "sm:col-span-1"
                  }`}
                >
                  <div
                    className={`relative aspect-video bg-black ${
                      isLead ? "lg:absolute lg:inset-0 lg:aspect-auto" : ""
                    }`}
                  >
                    {activeVideo === index ? (
                      <iframe
                        src={src + "&autoplay=1"}
                        title="Made with ArtCraft"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    ) : (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                          alt="Video thumbnail"
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/15" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-md transition-transform group-hover:scale-110">
                            <FontAwesomeIcon
                              icon={faPlay}
                              className="translate-x-0.5 text-base text-black"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className={`font-mono-ui flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5 text-[10px] text-white/40 transition-colors group-hover:text-white/70 ${
                      isLead
                        ? "lg:absolute lg:inset-x-0 lg:bottom-0 lg:z-10 lg:bg-black/60 lg:backdrop-blur-sm"
                        : ""
                    }`}
                  >
                    <span>{`// Community film 0${index + 1}`}</span>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-[10px] transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {/* COMMUNITY CTA — text cell + full-height action cells */}
      <section className="relative overflow-hidden px-4 pt-8 sm:px-8 sm:pt-12">
        <div className="relative z-10 mx-auto max-w-6xl" data-reveal>
          <div className="grid overflow-hidden border border-white/[0.1] bg-[#0A0A10] lg:grid-cols-12">
            <div className="p-8 sm:p-10 lg:col-span-6">
              <h2 className="font-condensed text-[28px] font-semibold leading-none text-white sm:text-[36px]">
                Join our <Serif>community</Serif>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
                ArtCraft is open source and community-driven. Come build with
                us.
              </p>
            </div>
            <a
              href={SOCIAL_LINKS.DISCORD}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono-ui group flex flex-col justify-between gap-8 border-t border-white/[0.1] p-6 text-[11px] font-medium text-white/70 transition-colors hover:bg-primary hover:text-white sm:p-8 lg:col-span-3 lg:border-l lg:border-t-0"
            >
              <FontAwesomeIcon icon={faDiscord} className="text-2xl" />
              <span className="flex items-center justify-between gap-3">
                Join Discord
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </a>
            <a
              href={SOCIAL_LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono-ui group flex flex-col justify-between gap-8 border-t border-white/[0.1] p-6 text-[11px] font-medium text-white/70 transition-colors hover:bg-white hover:text-black sm:p-8 lg:col-span-3 lg:border-l lg:border-t-0"
            >
              <FontAwesomeIcon icon={faGithub} className="text-2xl" />
              <span className="flex items-center justify-between gap-3">
                Star on GitHub
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </a>
          </div>
        </div>
      </section>
      {/* TYPE MARQUEE */}
      <div className="mt-20 sm:mt-28">
        <MarqueeStrip />
      </div>
      {/* FINAL CTA — left-aligned split panel */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-8 sm:py-28">
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
          <GridPattern />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl" data-reveal>
          <div className="relative">
            <CornerTicks />
            <div className="relative overflow-hidden border border-white/[0.1] bg-[#0A0A10]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 20% 0%, rgba(45,129,255,0.28) 0%, transparent 55%)",
                }}
              />
              <div className="relative grid gap-10 p-10 sm:p-14 lg:grid-cols-12 lg:items-end lg:p-16">
                <div className="lg:col-span-7">
                  <span className="font-mono-ui mb-6 block text-[11px] font-medium text-primary-400">
                    {"// Get started"}
                  </span>
                  <h2 className="font-condensed mb-6 text-[44px] font-semibold text-white sm:text-[56px] md:text-[72px]">
                    Ready to <Serif>craft?</Serif>
                  </h2>
                  <p className="max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                    Join thousands of artists and filmmakers using ArtCraft to
                    bring their vision to life. Free to download.
                  </p>
                </div>
                <div className="flex flex-col flex-wrap items-start gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
                  {isMobile ? (
                    <button
                      disabled
                      className="inline-flex h-11 items-center gap-2 bg-white/10 px-6 text-[14px] font-semibold text-white/60"
                    >
                      Download on a desktop
                    </button>
                  ) : (
                    <>
                      <UseOnWebButton
                        isLoggedIn={isLoggedIn}
                        hasSubscription={hasSubscription}
                      />
                      <a
                        href={downloadUrl}
                        onClick={onDownloadClick}
                        className={downloadButtonClassName}
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
              </div>
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

export default Landing4;
