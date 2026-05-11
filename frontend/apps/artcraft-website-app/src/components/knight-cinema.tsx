import { forwardRef, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

export interface KnightCinemaHandle {
  cinemaEl: HTMLDivElement | null;
  videoEl: HTMLVideoElement | null;
  topBarEl: HTMLDivElement | null;
  bottomBarEl: HTMLDivElement | null;
  progressBarEl: HTMLDivElement | null;
  timecodeEl: HTMLSpanElement | null;
}

interface KnightCinemaProps {
  src: string;
  topLabel?: string;
  bottomLabel?: string;
}

/**
 * Letterbox cinema for the manifesto section: full-bleed scroll-scrubbed
 * video framed by black bars carrying meta (brand label, scene label, live
 * timecode + progress line). The element refs are exposed via an imperative
 * handle so the parent can drive entrance/exit/scrub animations on its own
 * GSAP timeline (see `setupKnightCinemaTimeline` below).
 */
export const KnightCinema = forwardRef<KnightCinemaHandle, KnightCinemaProps>(
  ({ src, topLabel = "SEEDANCE 2.0", bottomLabel = "Knight Sneaking IN THE CASTLE" }, ref) => {
    const cinemaRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const topBarRef = useRef<HTMLDivElement>(null);
    const bottomBarRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const timecodeRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      get cinemaEl() {
        return cinemaRef.current;
      },
      get videoEl() {
        return videoRef.current;
      },
      get topBarEl() {
        return topBarRef.current;
      },
      get bottomBarEl() {
        return bottomBarRef.current;
      },
      get progressBarEl() {
        return progressBarRef.current;
      },
      get timecodeEl() {
        return timecodeRef.current;
      },
    }));

    return (
      <div aria-hidden className="absolute inset-0 z-20 pointer-events-none">
        {/* Full-bleed video, wrapped so we can scale + round-corner it during
            the phase 5 exit. overflow-hidden + GPU-promoted transform layer
            = smooth resize. */}
        <div
          ref={cinemaRef}
          className="absolute inset-0 overflow-hidden bg-black"
          style={{
            transformOrigin: "center center",
            willChange: "transform, border-radius",
          }}
        >
          <video
            ref={videoRef}
            src={src}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Top letterbox bar */}
        <div
          ref={topBarRef}
          className="absolute top-0 inset-x-0 h-[12vh] bg-black flex items-end px-6 sm:px-10 pb-3 sm:pb-4 will-change-transform"
        >
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.32em] font-semibold text-white/55">
            <span className="inline-block h-1 w-1 rounded-full bg-primary" />
            {topLabel}
          </span>
        </div>

        {/* Bottom letterbox bar */}
        <div
          ref={bottomBarRef}
          className="absolute bottom-0 inset-x-0 h-[12vh] bg-black flex items-start justify-between gap-4 px-6 sm:px-10 pt-3 sm:pt-4 will-change-transform"
        >
          <span className="hidden sm:inline-flex items-center text-[10px] sm:text-[11px] uppercase tracking-[0.32em] font-semibold text-white/55">
            {bottomLabel}
          </span>
          <div className="ml-auto flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="relative w-28 sm:w-48 h-px bg-white/15">
              <div
                ref={progressBarRef}
                className="absolute inset-y-0 left-0 bg-white/70"
                style={{ width: "0%" }}
              />
            </div>
            <span
              ref={timecodeRef}
              className="text-[10px] sm:text-[11px] tabular-nums text-white/65 min-w-[68px] sm:min-w-[80px] text-right"
            >
              00:00 / 00:00
            </span>
          </div>
        </div>
      </div>
    );
  },
);
KnightCinema.displayName = "KnightCinema";

/**
 * Appends the cinema's three animation phases to a GSAP timeline:
 *   3. Letterbox bars slide in + cinema fades in
 *   4. Scroll-scrubbed video (with live timecode + progress line)
 *   5. Bars retract + cinema scales down to navbar width with rounded corners
 *
 * Call this AFTER you've added the manifesto words / hold / text-fade phases
 * to your timeline. The phases are appended at the end (`>`).
 *
 * Note: the parent timeline's ScrollTrigger should set `invalidateOnRefresh: true`
 * so the function-based scale in phase 5 re-evaluates on viewport resize.
 */
export const setupKnightCinemaTimeline = (
  tl: gsap.core.Timeline,
  knight: KnightCinemaHandle,
) => {
  const {
    cinemaEl,
    videoEl,
    topBarEl,
    bottomBarEl,
    progressBarEl,
    timecodeEl,
  } = knight;

  // Initial state — bars off-screen, cinema invisible. Set on the *element*
  // (not in CSS) so a hot-reload during dev doesn't leave residual transforms.
  if (topBarEl) gsap.set(topBarEl, { yPercent: -100 });
  if (bottomBarEl) gsap.set(bottomBarEl, { yPercent: 100 });
  if (cinemaEl)
    gsap.set(cinemaEl, { opacity: 0, scale: 1, borderRadius: 0 });

  // Phase 3 — bars slide in from off-screen edges, framing the cinema.
  // Cinema fades in slightly after the bars start moving so the bars
  // register as the framing element first.
  if (topBarEl && bottomBarEl) {
    tl.to(
      [topBarEl, bottomBarEl],
      { yPercent: 0, duration: 4, ease: "power3.out" },
      ">",
    );
  }
  if (cinemaEl) {
    tl.to(
      cinemaEl,
      { opacity: 1, duration: 3, ease: "power2.out" },
      "<+=0.5",
    );
  }

  // Phase 4 — scroll-scrub the video. GSAP can't tween a video element
  // directly, so we tween a proxy `t` from 0→1 and write currentTime each
  // frame. Same onUpdate keeps the bottom-bar timecode + progress line in
  // sync. Seek calls are throttled to ~30Hz to avoid saturating the decoder
  // on larger paint surfaces (1440p+).
  if (videoEl) {
    const videoProxy = { t: 0 };
    const formatTC = (s: number) => {
      const safe = Number.isFinite(s) ? Math.max(0, s) : 0;
      const m = Math.floor(safe / 60);
      const sec = Math.floor(safe % 60);
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };
    const SEEK_INTERVAL_MS = 15;
    let lastSeekAt = 0;
    tl.to(
      videoProxy,
      {
        t: 0.999,
        duration: 22,
        ease: "none",
        onUpdate: () => {
          const now = performance.now();
          if (now - lastSeekAt < SEEK_INTERVAL_MS) return;
          lastSeekAt = now;
          if (!videoEl.duration) return;
          const time = videoProxy.t * videoEl.duration;
          videoEl.currentTime = time;
          if (timecodeEl) {
            timecodeEl.textContent = `${formatTC(time)} / ${formatTC(videoEl.duration)}`;
          }
          if (progressBarEl) {
            progressBarEl.style.width = `${videoProxy.t * 100}%`;
          }
        },
      },
      ">",
    );
  }

  // Phase 5 — exit. Bars retract off-screen, cinema scales down to navbar
  // width (Tailwind max-w-6xl = 1152px) and rounds its corners. The scale
  // is computed from window.innerWidth so the final card is the same
  // absolute pixel width on every screen — paired with the parent
  // ScrollTrigger's `invalidateOnRefresh: true` it stays exact on resize.
  if (topBarEl && bottomBarEl) {
    tl.to(
      topBarEl,
      { yPercent: -100, opacity: 0, duration: 2, ease: "power2.in" },
      ">",
    );
    tl.to(
      bottomBarEl,
      { yPercent: 100, opacity: 0, duration: 2, ease: "power2.in" },
      "<",
    );
  }
  if (cinemaEl) {
    const NAVBAR_WIDTH_PX = 1152;
    tl.to(
      cinemaEl,
      {
        scale: () => Math.min(1, NAVBAR_WIDTH_PX / window.innerWidth),
        // Border radius is overspecified relative to the post-scale visual
        // size (40 × scale ≈ pillowy 20-25px corners on typical desktops).
        borderRadius: 40,
        duration: 6,
        ease: "power2.inOut",
      },
      "<+=0.3",
    );
  }
};
