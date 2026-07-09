import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Seo from "../../components/seo";
import { DownloadModal } from "../../components/download-modal";
import { initLanding4Animations } from "./landing4-animations";
import { BrutNavbar } from "./components/brut-navbar";
import { BrutFooter } from "./components/brut-footer";
import { Ticker } from "./components/ui";
import { SectionHero } from "./components/section-hero";
import { SectionManifesto } from "./components/section-manifesto";
import { SectionFeatures } from "./components/section-features";
import { SectionModelWall } from "./components/section-model-wall";
import { SectionOwnership } from "./components/section-ownership";
import { SectionMadeWith } from "./components/section-made-with";
import { SectionCommunity } from "./components/section-community";
import { SectionFinalCta } from "./components/section-final-cta";
import "./landing4.css";

gsap.registerPlugin(ScrollTrigger);

// Landing4 — brutalist grid landing. Chapters: dark (hero, statement) →
// paper (toolkit, models, ownership, output) → dark (community, CTA, footer).
// Sections are static markup with data-l4-* hooks; all motion lives in
// landing4-animations.ts.
const Landing4 = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scrolling (same wiring as landing3). Skipped on mobile and
  // under prefers-reduced-motion.
  useEffect(() => {
    if (isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(
      () => initLanding4Animations(rootRef.current!),
      rootRef,
    );
    return () => ctx.revert();
  }, []);

  const openDownloadModal = () => setShowDownloadModal(true);

  return (
    <div ref={rootRef} className="l4-root font-brut-body">
      <Seo
        title="ArtCraft — Controllable AI for Artists"
        description="Own your tools. ArtCraft is an open desktop app for AI image, video, and 3D — every model, one canvas."
      />
      <BrutNavbar onDownloadClick={openDownloadModal} />

      <main>
        <SectionHero onDownloadClick={openDownloadModal} />
        <Ticker />
        <SectionManifesto />
        <SectionFeatures />
        <SectionModelWall />
        <SectionOwnership />
        <SectionMadeWith />
        <SectionCommunity />
        <SectionFinalCta onDownloadClick={openDownloadModal} />
      </main>

      <BrutFooter />
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

export default Landing4;
