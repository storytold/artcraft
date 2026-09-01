import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { isMobile, isMacOs } from "react-device-detect";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FilmIcon,
  InstagramIcon,
  LayersIcon,
  PlayIcon,
  ScrollTextIcon,
  SparklesIcon,
} from "lucide-react";
import { DynamicIcon, AppleIcon, WindowsIcon } from "@storyteller/icons";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { DownloadModal } from "../../components/download-modal";
import { getSession } from "../../lib/session";
import { BillingApi } from "@storyteller/api";
import {
  DOWNLOAD_LINKS,
  DOWNLOADS_ENABLED,
} from "../../config/github_download_links";
import { webappUrl } from "../../config/links";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const INSTAGRAM_URL = "https://www.instagram.com/jboogxcreative/";

// Each card shows a locally hosted thumbnail (public/images/creators/jboogx/,
// named by shortcode) and links out to the reel on Instagram — no embeds, so
// the page stays fast and fully on-theme. `path` is the Instagram URL segment:
// "reel/{shortcode}" or "p/{shortcode}".
interface InstagramPost {
  path: string;
  title: string;
  image: string;
}

const igPost = (path: string, title: string): InstagramPost => ({
  path,
  title,
  image: `/images/creators/jboogx/${path.split("/")[1]}.jpg`,
});

// Hand-picked reels for the hero stage, in left / center / right order.
const FEATURED_REELS: ReadonlyArray<InstagramPost> = [
  igPost("reel/DZAO9_LBFw3", "Reel by @jboogxcreative, May 31, 2026"),
  igPost("reel/DXMXQZmBAqW", "Reel by @jboogxcreative, Apr 16, 2026"),
  igPost("reel/Dcvs75lhrn8", "Reel by @jboogxcreative, Sep 1, 2026"),
];

const FEED_POSTS: ReadonlyArray<InstagramPost> = [
  igPost("reel/Dcn-hmHh3p-", "Reel by @jboogxcreative, Aug 29, 2026"),
  igPost(
    "reel/DcdrZI1hauI",
    "Reel by @jboogxcreative with @askvenice, Aug 25, 2026",
  ),
  igPost("reel/DclZyHHBZYW", "Reel by @jboogxcreative, Aug 25, 2026"),
  igPost(
    "reel/DcbGmARh2nL",
    "Reel by @jboogxcreative with @askvenice, Aug 24, 2026",
  ),
];

// Names straight from his Instagram bio — presented as his credits, not ours.
const CREDITS: ReadonlyArray<string> = [
  "Will Smith",
  "Coachella",
  "Wu-Tang Clan",
  "Anyma",
  "Grimes",
];

const CRAFT_CARDS: ReadonlyArray<{
  icon: typeof FilmIcon;
  title: string;
  body: string;
}> = [
  {
    icon: ScrollTextIcon,
    title: "Long prompts, on purpose",
    body: "These aren't one-liners. A finished prompt reads like a shot list: subject, wardrobe, lighting, lens, camera move. Every beat is written out so the model has nothing left to guess.",
  },
  {
    icon: FilmIcon,
    title: "Seedance 2.5 takes direction",
    body: "All that writing pays off: @ tags for style, precise camera moves, multi-shot sequences that keep characters consistent, and dialogue, music, and effects rendered in sync with the picture.",
  },
  {
    icon: LayersIcon,
    title: "Rewrite, re-roll, refine",
    body: "Generations land in a working library. Tweak a line, re-run the shot, keep what works. Taste is a loop, not a lottery.",
  },
];

// Person schema so search engines connect this page to his own profiles.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    name: "Tyler M. Bernabe",
    alternateName: "jboogxcreative",
    description:
      "Digital taste maker working across AI, VFX, and mixed media.",
    sameAs: [INSTAGRAM_URL, "https://www.jboogxcreative.com/"],
  },
};

// Reel card — locally hosted thumbnail that links out to the post on
// Instagram. `eager` is for the above-the-fold hero cards; everything else
// lazy-loads natively.
const ReelCard = ({
  post,
  eager = false,
}: {
  post: InstagramPost;
  eager?: boolean;
}) => (
  <a
    href={`https://www.instagram.com/${post.path}/`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${post.title}. Watch on Instagram.`}
    className="group absolute inset-0 block bg-black"
  >
    <img
      src={post.image}
      alt={post.title}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-md transition-transform group-hover:scale-110">
        <PlayIcon className="h-4 w-4 translate-x-px text-black" />
      </div>
    </div>
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3.5 pt-10">
      <span className="flex items-center gap-1.5 text-xs font-medium text-white/80 opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0">
        <InstagramIcon className="h-3.5 w-3.5" />
        Watch on Instagram
      </span>
    </div>
  </a>
);

// Primary CTA: routes subscribers straight to the webapp homepage and everyone
// else (logged out, or logged in without an active subscription) to /pricing.
const CreateNowButton = ({
  isLoggedIn,
  hasSubscription,
}: {
  isLoggedIn: boolean;
  hasSubscription: boolean;
}) => {
  const className =
    "group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary hover:bg-primary-600 text-white text-[14px] font-semibold transition-all shadow-[0_4px_24px_-4px_rgba(45,129,255,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(45,129,255,0.5)] hover:-translate-y-px";
  const inner = (
    <>
      <SparklesIcon className="h-4 w-4" />
      Create Now
    </>
  );
  return (
    <Tooltip
      content="Use ArtCraft in your browser"
      position="top"
      delay={0}
      className="rounded-full"
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

const CreatorJboogx = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  // Lenis smooth scrolling, matching the other landing pages.
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

  // Scroll reveals — one batched trigger for every [data-reveal] element.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (isMobile) return;
      const elements = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(elements, { autoAlpha: 0, y: 24 });
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
        title="Jboogx Creative × ArtCraft. Seedance AI Video Creator Spotlight."
        ogTitle="Jboogx Creative × ArtCraft"
        description="Tyler Bernabe (@jboogxcreative) makes AI, VFX, and mixed-media work for nearly a million followers, and he directs his Seedance videos in ArtCraft, home of Seedance 2.5. Watch the work, then make your own with the same tools."
        jsonLd={JSON_LD}
      />
      {/* Top primary-blue accent, matching the other landing pages */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[900px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.16) 0%, transparent 70%)",
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

      {/* HERO */}
      <section className="relative pt-24 sm:pt-36 pb-14 sm:pb-16 px-4 sm:px-8 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Eyebrow chip */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-7 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs sm:text-[13px] font-medium text-white/70"
            data-reveal
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Creator Spotlight
          </div>

          {/* Headline */}
          <h1
            className="text-[44px] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[84px] tracking-[-0.045em] font-medium mb-6 text-white"
            data-reveal
          >
            jboogxcreative,
            <br />
            digital <span className="font-serif-italic text-white/95">
              taste maker
            </span>.
          </h1>

          {/* Subtitle */}
          <p
            className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-white/55 leading-relaxed mb-10"
            data-reveal
          >
            Nearly a million people follow Tyler Bernabe for AI, VFX, and
            mixed-media work that treats the feed like a screening room. His
            Seedance pieces are made in ArtCraft, the same app you can open
            right now.
          </p>

          {/* CTAs — creator first, on purpose */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            data-reveal
          >
            <CreateNowButton
              isLoggedIn={isLoggedIn}
              hasSubscription={hasSubscription}
            />
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-[14px] font-semibold border border-white/[0.1] transition-all hover:-translate-y-px"
            >
              <InstagramIcon className="h-4 w-4" />
              Follow @jboogxcreative
            </a>
          </div>

          {/* Reel triptych — his three newest reels, live from Instagram,
              fanned like a hand of cards. The center card is the newest. */}
          <div className="relative mt-14 sm:mt-20" data-reveal>
            {/* Stage glow — ellipse centered inside its own box so it reaches
                full transparency before every edge (an edge-anchored gradient
                gets clipped at full strength and leaves a visible line). */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-80"
              style={{
                background:
                  "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(45,129,255,0.14) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex items-center justify-center">
              {/* Left flanker */}
              <div className="hidden md:block w-[230px] lg:w-[255px] shrink-0 -mr-8 translate-y-8 -rotate-[6deg] opacity-80">
                <div className="rounded-[26px] overflow-hidden bg-[#080808] border border-white/[0.08] p-1.5">
                  <div className="relative aspect-[9/16] rounded-[20px] overflow-hidden">
                    <ReelCard post={FEATURED_REELS[0]} eager />
                  </div>
                </div>
              </div>
              {/* Center — newest reel */}
              <div className="relative z-10 w-[270px] sm:w-[320px] shrink-0">
                <div className="rounded-[28px] overflow-hidden bg-[#080808] border border-white/[0.12] p-1.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                  <div className="relative aspect-[9/16] rounded-[22px] overflow-hidden">
                    <ReelCard post={FEATURED_REELS[1]} eager />
                  </div>
                </div>
              </div>
              {/* Right flanker */}
              <div className="hidden md:block w-[230px] lg:w-[255px] shrink-0 -ml-8 translate-y-8 rotate-[6deg] opacity-80">
                <div className="rounded-[26px] overflow-hidden bg-[#080808] border border-white/[0.08] p-1.5">
                  <div className="relative aspect-[9/16] rounded-[20px] overflow-hidden">
                    <ReelCard post={FEATURED_REELS[2]} eager />
                  </div>
                </div>
              </div>
            </div>
            <p className="relative mt-8 text-sm text-white/35">
              Fresh from the feed. Tap a frame to watch on Instagram.
            </p>
          </div>
        </div>
      </section>

      {/* SELECTED CREDITS — marquee of names from his Instagram bio */}
      <section className="relative py-10 sm:py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/30 mb-7">
          Selected credits
        </p>
        <div className="relative overflow-hidden border-y border-white/[0.06] py-6 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 z-10 bg-gradient-to-r from-[#101014] to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 z-10 bg-gradient-to-l from-[#101014] to-transparent"
          />
          {/* Two identical copies + translateX(-50%) = seamless loop
              (see the marquee-track keyframes in styles.css). */}
          <div className="flex w-max [animation:marquee-track_36s_linear_infinite] motion-reduce:[animation:none]">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="flex shrink-0 items-center"
              >
                {[...CREDITS, ...CREDITS].map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="flex items-center whitespace-nowrap"
                  >
                    <span
                      className={
                        i % 2 === 0
                          ? "text-2xl sm:text-4xl font-medium tracking-[-0.02em] text-white/30"
                          : "font-serif-italic text-2xl sm:text-4xl text-white/40"
                      }
                    >
                      {name}
                    </span>
                    <span className="mx-6 sm:mx-10 h-1.5 w-1.5 rounded-full bg-primary/50" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE WORK — reel grid, embedded live from Instagram */}
      <section className="relative px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto" data-reveal>
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              The Work
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
              Straight from the <span className="font-serif-italic">feed</span>.
            </h2>
            <p className="text-base sm:text-lg text-white/55">
              Recent drops from @jboogxcreative, all made with ArtCraft. Each
              one opens on Instagram.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEED_POSTS.map((post) => (
              <div
                key={post.path}
                className="rounded-2xl overflow-hidden bg-[#080808] border border-white/[0.08] hover:border-white/[0.2] p-1.5 transition-all hover:-translate-y-0.5"
              >
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden">
                  <ReelCard post={post} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-[14px] font-semibold border border-white/[0.1] transition-all hover:-translate-y-px"
            >
              <InstagramIcon className="h-4 w-4" />
              See more on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* THE CRAFT — how the work connects to ArtCraft, stated plainly */}
      <section id="craft" className="relative px-4 sm:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto" data-reveal>
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              The Craft
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
              The prompt is the{" "}
              <span className="font-serif-italic">craft</span>.
            </h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
              Tyler's videos are generated with Seedance 2.5 in ArtCraft, and
              the magic is in the writing. His prompts run long and read like
              shot lists, because the model gives back exactly as much
              direction as you put in. Learn the writing and the same studio
              answers to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {CRAFT_CARDS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 sm:p-7 text-left"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium tracking-[-0.02em] text-white mb-2.5">
                  {title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-center text-sm text-white/45 leading-relaxed">
            Everything above runs in the same ArtCraft anyone can open: same{" "}
            <Link
              to="/seedance2-5"
              className="underline underline-offset-4 decoration-white/30 hover:text-white/70 transition-colors"
            >
              Seedance 2.5
            </Link>
            , same tools, no private build. The writing is a skill, and you
            can start learning it today.
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 sm:px-8 py-20 sm:py-28 overflow-hidden">
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
                Make something worth a{" "}
                <span className="font-serif-italic">follow</span>.
              </h2>
              <p className="max-w-xl mx-auto text-base sm:text-lg text-white/60 leading-relaxed mb-10">
                Everything in Tyler's toolkit ships in ArtCraft: Seedance 2.5,
                the canvas, the whole studio. Free to start, on the web or
                your desktop.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
                {isMobile ? (
                  <Button
                    disabled
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white/10 text-white/60 text-[14px] font-semibold"
                  >
                    Download on a desktop
                  </Button>
                ) : (
                  <>
                    <CreateNowButton
                      isLoggedIn={isLoggedIn}
                      hasSubscription={hasSubscription}
                    />
                    {DOWNLOADS_ENABLED && (
                      <a
                        href={downloadUrl}
                        onClick={onDownloadClick}
                        className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white hover:bg-white/90 text-black text-[14px] font-semibold transition-all hover:-translate-y-px shadow-[0_4px_24px_-4px_rgba(255,255,255,0.2)]"
                      >
                        <DynamicIcon
                          icon={isMacOs ? AppleIcon : WindowsIcon}
                          className="text-[13px]"
                        />
                        Download for {isMacOs ? "Mac" : "Windows"}
                      </a>
                    )}
                  </>
                )}
              </div>

              <p className="mt-7 text-sm text-white/35">
                Your first drop is one prompt away.
              </p>
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

export default CreatorJboogx;
