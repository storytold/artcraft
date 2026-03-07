import { DiscordButton } from "../../components/discord-button";
import { Button } from "@storyteller/ui-button";
import { isMobile } from "react-device-detect";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faFilm,
  faPaintBrush,
  faCamera,
  faMapMarkerAlt,
  faCube,
  faLayerGroup,
  faUser,
  faTools,
  faShapes,
  faEraser,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Footer from "../../components/footer";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ModelBadgeGrid from "../../components/model-badge-grid";
import Seo from "../../components/seo";

import { OwnershipComparison } from "../../components/ownership-comparison/ownership-comparison";
import { DownloadModal } from "../../components/download-modal";

import { UsersApi } from "@storyteller/api";
import { LandingActionButtons } from "../../components/landing-action-buttons";

gsap.registerPlugin(ScrollTrigger);

const HERO_VIMEO_URL =
  "https://player.vimeo.com/video/1169289718?autoplay=1&muted=1&loop=1&background=0&byline=0&portrait=0&title=0";

const LandingSD2 = () => {
  const videos = [
    {
      src: "https://www.youtube.com/embed/oqoCWdOwr2U?si=ILMPk8hGHo9hP8RU",
    },
    {
      src: "https://www.youtube.com/embed/H4NFXGMuwpY?si=wPuQl5cJOu1v8MJu",
    },
    {
      src: "https://www.youtube.com/embed/7x7IZkHiGD8?si=tL8nK4CULigpfHQR",
    },
  ];

  const [activeFeature, setActiveFeature] = useState(0);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const api = new UsersApi();
      const response = await api.GetSession();
      if (response.success && response.data?.loggedIn) {
        setIsLoggedIn(true);
      }
    };
    checkSession();
  }, []);

  const onDownloadClick = (e: React.MouseEvent) => {
    if (isLoggedIn) {
      return;
    }

    setShowDownloadModal(true);

    localStorage.setItem("artcraft_download_initiated", "true");
  };

  const features = [
    {
      icon: faMapMarkerAlt,
      title: "Image to Location",
      description:
        "Placing virtual actors into physical environments establishes single-location consistency. You can film multiple shots within a room without having things disappear.",
      src: "/videos/features/WorldLabs_Demo_2.webm",
    },
    {
      icon: faCube,
      title: "3D Image Compositing",
      description:
        "Use images (backdrops, foreground elements, props, etc.) in scenes with depth and blend them naturally together. Just a couple of images usually leads to great compositions.",
      src: "/videos/features/Panel.webm",
    },
    {
      icon: faLayerGroup,
      title: "2D Image Compositing",
      description:
        "Use images, background removal, layers, and simple drawing tools to precisely compose a scene.",
      src: "/videos/features/Editor.webm",
    },
    {
      icon: faShapes,
      title: "Image to 3D Mesh",
      description:
        "It's almost impossible to lay out complicated objects or block complicated scenes; turning images into 3D helps position elements exactingly and intentionally.",
      src: "/videos/features/Make_3D.webm",
    },
    {
      icon: faTools,
      title: "Mixed Asset Crafting",
      description:
        "You can use image cutouts, worlds, and simple 3D meshes all together to precisely and intentionally lay out your scenes.",
      src: "/videos/features/Mixed.webm",
    },
    {
      icon: faUser,
      title: "Character Posing",
      description:
        'You can dynamically pose your characters to achieve the precise character, scene, and camera blocking before calling "action".',
      src: "/videos/features/Pose_Second_Version.webm",
    },
    {
      icon: faEraser,
      title: "Background Removal",
      description:
        "Instantly remove backgrounds from images to create assets for your scenes. Clean, precise, and ready for compositing.",
      src: "/videos/features/Background.webm",
    },
  ];

  // Refs for GSAP animations
  const mainRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileMediaRef = useRef<HTMLDivElement>(null);
  const mobileDescRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger setup for page animations
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      // Animate elements with data-animate attribute on scroll
      // ONLY on non-mobile devices to ensure performance and prevent content loading issues
      if (!isMobile) {
        const elements = gsap.utils.toArray<HTMLElement>("[data-animate]");

        gsap.set(elements, { autoAlpha: 0, y: 20 });

        elements.forEach((el) => {
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power1.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          });
        });
      }

      // Feature section pinning and active state - Desktop Only (lg breakpoint)
      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: ".right-column",
          start: "top top",
          endTrigger: ".left-column",
          end: "bottom bottom",
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        featureRefs.current.forEach((el, index) => {
          if (!el) return;
          ScrollTrigger.create({
            trigger: el,
            start: "top 40%",
            end: "bottom 40%",
            onEnter: () => setActiveFeature(index),
            onEnterBack: () => setActiveFeature(index),
          });
        });
      });
    }, mainRef);

    return () => {
      ctx.revert();
      mm.revert();
    };
  }, []);

  // GSAP animation for card stack (desktop feature images)
  useEffect(() => {
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const isFuture = index > activeFeature;
      const isPast = index < activeFeature;

      gsap.to(card, {
        y: isFuture ? "110%" : "0%",
        scale: isPast ? 0.9 : 1,
        opacity: isPast ? 0.4 : 1,
        duration: 0.5,
        ease: "power3.out",
      });
    });
  }, [activeFeature]);

  // GSAP animation for mobile media and description
  useEffect(() => {
    if (mobileMediaRef.current) {
      gsap.fromTo(
        mobileMediaRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    }
    if (mobileDescRef.current) {
      gsap.fromTo(
        mobileDescRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      );
    }
  }, [activeFeature]);

  return (
    <div
      ref={mainRef}
      className="relative min-h-screen bg-[#101014] text-white overflow-x-hidden bg-dots"
    >
      <Seo
        title="Seedance 2.0 in ArtCraft. AI Video Generation. Fast and Open Desktop App."
        description="Seedance 2.0 is available now in ArtCraft. Generate jaw-dropping AI videos with the fastest open desktop app for artists."
      />
      {/* Hero Section */}
      <main className="relative mb-8 md:mb-16 pt-24 sm:pt-24 min-h-[400px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center px-2 sm:px-4 md:px-0">
        {/* Glowing Gradient Orb Background */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          data-animate
        >
          <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-40 blur-[80px] md:blur-[120px] transform-gpu"></div>
        </div>

        <div className="relative z-10 px-2 sm:px-4 md:px-6 py-8 w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1200px] mx-auto text-center flex flex-col items-center">
            {/* Main Heading */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-4 sm:mb-6 drop-shadow-[0_4px_32px_rgba(80,80,255,0.25)]"
              data-animate
            >
              <span className="text-white">
                Seedance 2.0
                <br />
                now in{" "}
                <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[6px] md:after:h-[11px] after:bg-primary/80 after:mb-0 after:xl:mb-2">
                  ArtCraft
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base mt-4 sm:text-xl md:text-2xl lg:text-2xl text-white/70 mb-8 sm:mb-14 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_12px_rgba(80,80,255,0.10)]"
              data-animate
            >
              Generate jaw-dropping AI videos with Seedance 2.0 before
              it&rsquo;s available anywhere else.
            </p>

            {/* CTA Buttons */}
            <div
              className="relative flex flex-col sm:flex-row items-center justify-center mb-10 sm:mb-16 w-full"
              data-animate
            >
              <LandingActionButtons
                onDownloadClick={onDownloadClick}
                className="w-fit max-w-xs sm:max-w-none mx-auto z-10"
                creditsButtonText="Get Now"
              />
              <img
                src="/images/buy-credits.png"
                alt="Buy Credits"
                draggable={false}
                className="absolute left-[10%] -top-2 h-40 pointer-events-none select-none hidden md:block"
              />
              <img
                src="/images/try-download.png"
                alt="Try Download"
                draggable={false}
                className="absolute right-[9.5%] -bottom-2 h-40 pointer-events-none select-none hidden md:block"
              />
            </div>

            {/* Vimeo Video Embed */}
            <div
              className="relative mx-auto mt-4 w-full max-w-[1200px]"
              data-animate
            >
              <div
                className="relative rounded-[20px] sm:rounded-[32px] overflow-hidden bg-white/10 backdrop-blur-md md:backdrop-blur-xl shadow-2xl p-2 sm:p-4 w-full mx-auto transition-transform duration-300 transform-gpu"
              >
                <div style={{ paddingTop: "56.25%" }} className="relative">
                  <iframe
                    src={HERO_VIMEO_URL}
                    className="absolute inset-0 w-full h-full rounded-2xl"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title="Seedance in ArtCraft"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-10 py-12 md:py-24 px-4 sm:px-8 lg:px-12 max-w-[1400px] mx-auto overflow-visible">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-200px] top-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-15 blur-[80px] md:blur-[120px] z-0 pointer-events-none transform-gpu" />

        {/* Title Area */}
        <div className="relative z-10 mb-6 md:-mb-12 min-[1980px]:-mb-48 pointer-events-none">
          <div className="max-w-3xl mx-auto text-center" data-animate>
            <h2 className="text-primary font-bold text-sm md:text-base mb-6 tracking-widest uppercase">
              Advanced Crafting Features
            </h2>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
              We're Pulling You <br />{" "}
              <span className="text-white">Out of Prompting</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
              Text prompting is neat, but artists <em>crave control</em>.
            </p>

            <br />

            <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
              Before you type "rotate arm thirty degrees", try ArtCraft and let
              our advanced toolset help you achieve consistency and
              repeatability.
            </p>

            <br />

            <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
              ArtCraft is the control that mere words cannot buy.
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Mobile Layout */}
          <div className="lg:hidden flex flex-col gap-6">
            {/* Mobile Navigation (Tabs) */}
            <div className="w-full overflow-x-auto pb-4 no-scrollbar flex gap-3 snap-x px-1">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`snap-center shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-300 whitespace-nowrap ${
                    activeFeature === index
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {feature.title}
                </button>
              ))}
            </div>

            {/* Mobile Media Preview */}
            <div className="relative aspect-[4/3] w-full bg-[#050505] rounded-xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
              <div
                key={activeFeature}
                ref={mobileMediaRef}
                className="absolute inset-0"
              >
                <video
                  src={features[activeFeature].src}
                  className="w-full h-full object-cover select-none"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>

            {/* Mobile Description */}
            <div
              key={activeFeature}
              ref={mobileDescRef}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-lg font-bold text-white mb-2">
                {features[activeFeature].title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {features[activeFeature].description}
              </p>
            </div>
          </div>

          {/* Desktop Sticky Scroll Layout */}
          {!isMobile && (
            <div
              className="hidden lg:flex flex-row relative items-start"
              ref={containerRef}
            >
              {/* Left Column: Scrolling Text */}
              <div className="w-[40%] flex flex-col relative z-20 left-column py-[10vh]">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      featureRefs.current[index] = el;
                    }}
                    className="min-h-[80vh] flex flex-col justify-center pr-8 xl:pr-16"
                  >
                    <div className="max-w-lg">
                      <div
                        className={`w-12 h-12 mb-6 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${
                          activeFeature === index
                            ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        <FontAwesomeIcon icon={feature.icon} />
                      </div>
                      <h3
                        className={`text-3xl xl:text-4xl font-bold mb-6 transition-all duration-500 ${
                          activeFeature === index
                            ? "text-white"
                            : "text-white/40"
                        }`}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`text-xl leading-relaxed transition-all duration-500 ${
                          activeFeature === index
                            ? "text-white/80"
                            : "text-white/30"
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Sticky Image */}
              <div className="w-[60%] h-screen flex items-center justify-center pl-4 py-8 z-10 right-column">
                <div className="relative w-full aspect-[4/3] max-h-[80vh] rounded-[32px] overflow-hidden shadow-2xl border-[4px] border-white/5 bg-[#050505]">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                      className="absolute inset-0 w-full h-full bg-[#050505] shadow-2xl origin-bottom"
                      style={{
                        zIndex: index,
                        transform:
                          index === 0 ? "translateY(0%)" : "translateY(110%)",
                      }}
                    >
                      <video
                        src={feature.src}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </div>
                  ))}

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-20">
                    <span className="text-white/80 text-sm font-medium tracking-wide">
                      {activeFeature + 1} / {features.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <OwnershipComparison />

      <div className="relative flex overflow-visible xl:items-center xl:pt-0 mb-4 md:mb-12 px-2 sm:px-4 md:px-0">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-200px] top-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-15 blur-[80px] md:blur-[120px] z-0 pointer-events-none transform-gpu" />
        <div
          className="w-full flex flex-col items-center justify-center text-center pt-16 sm:pt-24 md:pt-32 px-2 sm:px-6 md:px-10"
          data-animate
        >
          <div className="relative">
            <h1 className="relative mb-4 sm:mb-6 md:mb-10 font-bold text-3xl sm:text-4xl md:text-[3rem] lg:text-[4rem] xl:text-[4.5rem] !leading-tight text-shadow-lg">
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                Five Reasons{" "}
              </span>
              Why
              <br />
              ArtCraft is the
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                {" "}
                Best Tool
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Bento Box Grid Section */}
      <div className="overflow-visible pb-10 sm:pb-20 md:pb-28 lg:pb-32 relative px-4">
        {/* Gradient Orbs for Section */}
        <div className="absolute right-[-150px] top-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-10 blur-[80px] md:blur-[110px] z-0 pointer-events-none transform-gpu" />

        <div className="mx-auto max-w-[88rem] md:px-6 lg:px-8" data-animate>
          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 sm:gap-8">
            {/* Reason #1 - Large Box */}
            <div className="xl:col-span-6 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300 group">
              <div className="flex xl:flex-col gap-4 lg:gap-8 h-full flex-col-reverse">
                <div className="grow h-40">
                  <img
                    src="/images/2d-3d.png"
                    alt="2D and 3D"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                      Text Prompting Sucks
                    </h3>
                    <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                      <span className="text-primary-400 font-semibold">
                        Create images and videos with our easy-to-use AI tool.
                      </span>{" "}
                      Draw on a canvas or work in a 3D space as if you're
                      playing a video game.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason #2 - Medium Box */}
            <div className="xl:col-span-6 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 pb-0 lg:pb-0 shadow-2xl transition-all duration-300 group">
              <div className="relative flex flex-col h-full">
                <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight ">
                  Desktop App
                </h3>
                <p className="text-white/80 text-sm sm:text-base mb-4 sm:mb-6 lg:text-lg leading-relaxed">
                  <span className="text-primary-400 font-semibold">
                    No more hunting for the hundredth tab.
                  </span>{" "}
                  Works on Windows, Mac, and soon Linux and Tablets. First class
                  experience for real artists.
                </p>
                <div className="h-20 md:h-24 lg:h-36 xl:h-36 bg-white/[3%] border-[5px] border-white/[2%] rounded-t-2xl relative mt-12 lg:mt-16 xl:mt-24 select-none">
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-9 items-center justify-center drop-shadow-2xl z-20 scale-50 lg:scale-75 xl:scale-100">
                    <img
                      src="/images/windows-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      className="h-32 rotate-6"
                    />
                    <img
                      src="/images/apple-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      className="h-36 -rotate-6"
                    />
                    <img
                      src="/images/linux-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      className="h-36 rotate-6"
                    />
                  </div>
                </div>
                <div className="absolute left-0 bottom-0 w-full h-28 bg-gradient-to-t from-[#28282C] to-transparent z-10 pointer-events-none" />
              </div>
            </div>

            {/* Reason #3 - Medium Box */}
            <div className="xl:col-span-4 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300 group">
              <div className="flex flex-col h-full">
                <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                  It's Open Source
                </h3>
                <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed flex-1">
                  Our desktop app's code and infrastructure are all{" "}
                  <a
                    href="https://github.com/storytold/artcraft"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 font-semibold hover:text-primary-300 underline underline-offset-2 transition-colors"
                  >
                    open source on GitHub.
                  </a>{" "}
                  Join us and contribute!
                </p>
                <div className="flex justify-center items-center h-full p-4 lg:p-6 select-none">
                  <img
                    src="/images/github-logo.png"
                    alt="GitHub Logo"
                    className="h-20 md:h-32 lg:h-36"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Reason #4 - Large Box */}
            <div className="xl:col-span-8 bg-[#28282C] rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300 group overflow-hidden">
              <div className="lg:flex-1 flex flex-col justify-between">
                <div className="p-6 lg:p-8">
                  <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                    Use Every Model
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                    You'll be able to use{" "}
                    <span className="text-primary-400 font-semibold">
                      EVERY image and video model
                    </span>{" "}
                    all in one place. Log in with your existing subscriptions.
                  </p>
                </div>
                <ModelBadgeGrid
                  highlight="gpt-image-1"
                  rowOffsets={[-70, -90, -160]}
                  className="mt-3"
                />
              </div>
            </div>

            {/* Reason #5 - Full Width Box */}
            <div className="xl:col-span-12 md:col-span-2 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300 group">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center">
                <div className="lg:flex-1">
                  <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                    Created by Artists and Filmmakers
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                    <span className="text-primary-400 font-semibold">
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
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen py-10 sm:py-20 md:py-32 sm:px-8 lg:px-32 overflow-visible px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-250px] top-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-[0.07] blur-[100px] md:blur-[150px] z-0 pointer-events-none transform-gpu" />
        {/* Videos Section */}
        <div className="space-y-12" data-animate>
          <div className="text-center">
            <h1 className="md:mb-8 text-3xl sm:text-4xl md:text-6xl font-bold mb-4">
              Made using{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[5px] md:after:h-[12px] after:bg-primary/60 after:mb-1">
                ArtCraft
              </span>
            </h1>
            <p className="md:text-xl text-lg text-white/80 max-w-2xl mx-auto">
              Check out the videos below!
            </p>
          </div>
          <div className="grid gap-6 sm:gap-8 xl:grid-cols-3">
            {videos.map((video, index) => (
              <div
                key={index}
                className="group relative rounded-2xl bg-white/10 backdrop-blur-md p-2 sm:p-4 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
              >
                <div
                  className="aspect-video overflow-hidden rounded-xl shadow-lg w-full relative group-hover:cursor-pointer"
                  onClick={() => setActiveVideo(index)}
                >
                  {activeVideo === index ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={video.src + "&autoplay=1"}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full min-h-[180px]"
                      style={{ minHeight: "180px" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-black/50 flex items-center justify-center relative">
                      {/* Placeholder Thumbnail - In a real app we'd fetch the YT thumb */}
                      <div className="absolute inset-0 bg-[#28282C]">
                        <img
                          src={`https://img.youtube.com/vi/${video.src.split("/").pop()?.split("?")[0]}/maxresdefault.jpg`}
                          alt="Video Thumbnail"
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                        />
                      </div>
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-300 z-10">
                        <FontAwesomeIcon
                          icon={faFilm}
                          className="text-white text-2xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] pt-10 sm:pt-20 md:pt-32 pb-12 sm:pb-24 md:pb-40 lg:pb-56 sm:px-8 overflow-visible px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute right-[-300px] bottom-[-100px] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-700 via-[#00AABA] to-pink-500 opacity-10 blur-[160px] z-0 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Discord CTA Section */}
          <div
            className="flex flex-col items-center justify-center text-center p-8 sm:p-12 lg:p-16 rounded-[24px] sm:rounded-[40px] bg-[#1a1b36] backdrop-blur-lg border-[3px] sm:border-[6px] border-[#3f415c] shadow-2xl"
            data-animate
          >
            <h2 className="relative mb-4 sm:mb-6 font-bold text-2xl sm:text-3xl lg:text-4xl max-w-lg !leading-tight text-white">
              Join the Discord
            </h2>
            <p className="text-base sm:text-lg text-[#aab3c9] mb-6 sm:mb-8 max-w-md leading-relaxed">
              Connect with other creators, share your work, get feedback, and
              stay updated.
            </p>
            <DiscordButton />
          </div>

          {/* GitHub CTA Section */}
          <div
            className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[24px] sm:rounded-[40px] bg-[#161b22] backdrop-blur-lg border-[3px] sm:border-[6px] border-[#30363d] shadow-2xl"
            data-animate
          >
            <h2 className="relative mb-4 sm:mb-6 font-bold text-2xl sm:text-3xl lg:text-4xl max-w-lg !leading-tight text-white">
              We're Open Source
            </h2>
            <p className="text-base sm:text-lg text-[#8b949e] mb-6 sm:mb-8 max-w-md leading-relaxed">
              Help us build the future of creative tools. Contribute code,
              report bugs, or just star the repo.
            </p>
            <Button
              className="text-md px-6 py-3 font-semibold rounded-xl shadow-lg gap-3 bg-white text-black hover:bg-gray-200"
              as="link"
              href="https://github.com/storytold/artcraft"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faGithub} className="text-xl" />
              Star on GitHub
            </Button>
          </div>

          {/* Download CTA Section - New */}
          <div
            className="flex flex-col items-center justify-center text-center p-8 sm:p-12 lg:col-span-2 rounded-[24px] sm:rounded-[40px] bg-gradient-to-br from-primary/30 to-primary/50 backdrop-blur-lg border-[3px] sm:border-[6px] border-primary/70 shadow-2xl shadow-primary/30 overflow-hidden relative"
            data-animate
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 opacity-30 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <h2 className="relative mb-4 sm:mb-6 font-bold text-3xl sm:text-4xl lg:text-5xl max-w-2xl !leading-tight text-white z-10">
              Ready to Create?
            </h2>
            <p className="text-base sm:text-l md:text-xl text-white/90 mb-8 sm:mb-10 max-w-xl leading-relaxed z-10">
              Join thousands of artists and filmmakers using ArtCraft to bring
              their vision to life.
            </p>

            <div className="relative z-10 w-full flex flex-col items-center">
              <LandingActionButtons onDownloadClick={onDownloadClick} creditsButtonText="Get Now" />
              <div className="mt-8 text-sm text-white/80 font-medium">
                Free to use.
              </div>
            </div>
          </div>
        </div>
      </div>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
      <Footer />
    </div>
  );
};

export default LandingSD2;
