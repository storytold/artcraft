import { faApple, faWindows } from "@fortawesome/free-brands-svg-icons";
import {
  faArrowDownToLine,
  faDesktop,
  faFiles,
  faMemory,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { DOWNLOAD_LINKS } from "../../config/github_download_links";
import { isMobile, isMacOs } from "react-device-detect";
import { useState, useEffect } from "react";
import Lenis from "lenis";
import { UsersApi } from "@storyteller/api";
import { DownloadModal } from "../../components/download-modal";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { PagePatternBackdrop } from "../../components/truchet-pattern";

const SYSTEMS = [
  {
    os: "Windows",
    icon: faWindows,
    link: DOWNLOAD_LINKS.WINDOWS,
    requirements: [
      { icon: faDesktop, text: "Windows 10 (64-bit) or newer" },
      { icon: faMemory, text: "8 GB RAM recommended" },
      { icon: faFiles, text: "2 GB available storage" },
    ],
  },
  {
    os: "macOS",
    icon: faApple,
    link: DOWNLOAD_LINKS.MACOS,
    requirements: [
      { icon: faDesktop, text: "macOS 12.0 or newer" },
      { icon: faMemory, text: "8 GB RAM recommended" },
      { icon: faFiles, text: "2 GB available storage" },
    ],
  },
] as const;

const Download = () => {
  const detectedLink = isMacOs ? DOWNLOAD_LINKS.MACOS : DOWNLOAD_LINKS.WINDOWS;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

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
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const onDownloadClick = (e: React.MouseEvent) => {
    if (isLoggedIn) return;
    setShowDownloadModal(true);
    localStorage.setItem("artcraft_download_initiated", "true");
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden">
      <Seo
        title="Download ArtCraft - Windows and macOS"
        description="Download ArtCraft for Windows and macOS. Start creating AI artwork today."
      />

      <PagePatternBackdrop variant="content" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-10 pt-36 sm:pt-40 pb-24">
        {/* Hero */}
        <div className="text-center mb-16 sm:mb-20">
          <h1 className="font-medium text-4xl sm:text-5xl lg:text-7xl mb-6 drop-shadow-[0_4px_32px_rgba(80,80,255,0.25)]">
            Download ArtCraft
          </h1>
          <p className="max-w-xl mx-auto text-lg lg:text-xl leading-relaxed text-white/70">
            AI-powered artwork creation with canvas editing and 3D scene
            composition - right on your desktop.
          </p>

          {/* Primary CTA — auto-detects OS */}
          <div className="mt-10 flex items-center justify-center">
            {isMobile ? (
              <Button
                className="rounded-full text-lg font-semibold rounded-xl shadow-lg"
                disabled
              >
                Download on a desktop
              </Button>
            ) : (
              <Button
                className="rounded-full glow-border-animated text-md px-8 py-4 text-lg font-semibold rounded-xl shadow-lg gap-3 transition-all duration-300 hover:scale-105 hover:shadow-primary/25 bg-white text-black hover:bg-white/90"
                as="link"
                href={detectedLink}
                onClick={onDownloadClick}
              >
                <FontAwesomeIcon icon={isMacOs ? faApple : faWindows} />
                Download for {isMacOs ? "Mac" : "Windows"}
              </Button>
            )}
          </div>
        </div>

        {/* App preview */}
        <div className="mb-20 sm:mb-24">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/5">
            <img
              src="/images/3d-interface-preview.jpg"
              alt="ArtCraft Interface Preview"
              className="w-full block"
              loading="eager"
            />
          </div>
        </div>

        {/* Platform cards */}
        <div className="mb-20 sm:mb-24">
          <h2 className="text-2xl sm:text-3xl font-medium text-center mb-10">
            Available Platforms
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SYSTEMS.map((system) => {
              const isDetected =
                (system.os === "macOS" && isMacOs) ||
                (system.os === "Windows" && !isMacOs);

              return (
                <div
                  key={system.os}
                  className={`relative rounded-2xl p-8 flex flex-col border transition-all duration-300 ${
                    isDetected && !isMobile
                      ? "bg-white/[0.08] border-primary/40 shadow-[0_0_30px_rgba(45,129,255,0.1)]"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  {isDetected && !isMobile && (
                    <span className="absolute -top-3 left-6 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                      Your system
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <FontAwesomeIcon
                      icon={system.icon}
                      className="text-2xl text-white/80"
                    />
                    <h3 className="text-xl font-medium">{system.os}</h3>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {system.requirements.map((req, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 text-white/60 text-sm"
                      >
                        <FontAwesomeIcon
                          icon={req.icon}
                          className="text-white/30 w-4 text-center"
                        />
                        {req.text}
                      </li>
                    ))}
                  </ul>

                  {isMobile ? (
                    <Button
                      className="rounded-full w-full justify-center font-semibold"
                      disabled
                    >
                      Desktop only
                    </Button>
                  ) : (
                    <Button
                      className="rounded-full w-full justify-center font-semibold gap-2"
                      as="link"
                      href={system.link}
                      icon={faArrowDownToLine}
                      onClick={onDownloadClick}
                    >
                      Download
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick-start steps */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-medium text-center mb-10">
            Get Started in Minutes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Download",
                desc: "Grab the installer for your platform",
              },
              {
                step: "2",
                title: "Install & Sign In",
                desc: "Create a free account or log in",
              },
              {
                step: "3",
                title: "Create",
                desc: "Start generating artwork immediately",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center bg-white/5 border border-white/10 rounded-2xl p-8"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-medium text-lg mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

export default Download;
