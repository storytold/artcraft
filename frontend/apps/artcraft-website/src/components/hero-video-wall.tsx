import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

// The hero render wall: two flat film-strip rows of clips drifting sideways
// behind the headline. The near row is large and full strength; the back
// row is smaller, dimmed and slides the other way, so the pair reads as
// depth without any 3D. Each row loops seamlessly (panels wrap around
// offscreen) and the wall fades out toward the screen edges.
//
// Built to cost the main thread nothing per frame. No three.js, no rAF loop:
//   - Panels slide with a CSS keyframe animation (compositor thread), each
//     one looping the full row length with a negative delay for its start.
//   - The edge vignette is a static mask on the container.
//   - Video decode is the only real cost, so an IntersectionObserver (rooted
//     at the wall) plays only panels actually on screen. The whole wall
//     pauses while scrolled away. On first load the wall starts decoders
//     one at a time immediately, then quickly fades the panels in.
// Keyframes and the paused state live in styles.css (`hero-wall-*`).

export interface WallClip {
  src: string;
  // Width / height of the panel. The clip is cover-fitted, so any source
  // aspect works.
  aspect: number;
}

interface HeroVideoWallProps {
  clips: WallClip[];
  className?: string;
  // Overlay content (headline, subtext). Rendered above the wall; only
  // elements that opt back in receive pointer events.
  children?: ReactNode;
}

// Wall structure (near-row pixels).
const ROW_COUNT = 2;
const ROW_HEIGHT_VH = 0.31;
const ROW_SCALE = 0.78;
const GAP_PX = 22;
// CSS y (down is positive): near row sits below center, back row above.
const ROW_Y_VH = [0.17, -0.17];

// Motion: the back row is slower, like parallax.
const DRIFT_PX_PER_S = 42;
const SPEED_STEP = 0.62;

// Look.
const ROW_DIM = [0.86, 0.7];
const EDGE_MASK =
  "linear-gradient(to right, transparent 0%, #000 13%, #000 87%, transparent 100%)";

// How long the hero can be out of view before its decoders are stopped. A
// quick scroll past the boundary never pays for pausing and resuming them.
const PAUSE_DELAY_MS = 900;
// Start decoding immediately, staggered slightly to avoid a CPU spike.
// Reveal together as soon as visible clips are ready, with a short cap so
// one slow download cannot hold back the whole wall.
const INITIAL_DELAY_MS = 0;
const PLAY_STAGGER_MS = 30;
const REVEAL_MAX_WAIT_MS = 400;

type WallPanel = {
  clip: number;
  w: number;
  h: number;
  x0: number; // resting position of the panel center along its row
  row: number;
  length: number; // total loop length of the row this panel rides
};

export const HeroVideoWall = ({
  clips,
  className,
  children,
}: HeroVideoWallProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(true);
  // One-shot gate for the first appearance: panels asked to play during
  // start-up register here and the wall shows all of them at once when the
  // set drains (or the wait cap hits). After that, panels show as they load.
  const [revealed, setRevealed] = useState(false);
  const pendingRef = useRef(new Set<HTMLVideoElement>());
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // The gate can't open while the start-up pump is still handing out
  // play() calls, or the first clip to load would reveal alone.
  const startupDrainedRef = useRef(false);
  const settle = (video: HTMLVideoElement) => {
    const pending = pendingRef.current;
    if (!pending.delete(video)) return;
    if (pending.size === 0 && startupDrainedRef.current) setRevealed(true);
  };
  useEffect(() => () => clearTimeout(revealTimerRef.current), []);

  // Measure the container; the layout is in CSS pixels.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () =>
      setSize({ width: container.clientWidth, height: container.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Pause everything while the hero is scrolled out of view, with hysteresis:
  // coming back is immediate, going away waits PAUSE_DELAY_MS so the boundary
  // doesn't flip decoders on and off while the visitor is mid-scroll.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(pauseTimer);
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          pauseTimer = setTimeout(() => setVisible(false), PAUSE_DELAY_MS);
        }
      },
      { rootMargin: "10% 0px" },
    );
    observer.observe(container);
    return () => {
      clearTimeout(pauseTimer);
      observer.disconnect();
    };
  }, []);

  // New panels must join the existing animation clock after a resize.
  // Otherwise their zero-time start overlaps older panels and leaves gaps.
  // Synchronize before paint, without restarting videos or a per-frame loop.
  useLayoutEffect(() => {
    const animations = Array.from(
      containerRef.current?.querySelectorAll(".hero-wall-panel") ?? [],
    ).flatMap((panel) =>
      panel.getAnimations().filter(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === "hero-wall-slide",
      ),
    );
    const currentTime = animations[0]?.currentTime;
    if (currentTime == null) return;
    for (const animation of animations) animation.currentTime = currentTime;
  }, [size.width, size.height, clips]);

  const panels = buildLayout(clips, size.width, size.height);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  // Decode culling: play a panel only while it is inside the wall's box.
  // The near row plays as soon as any part shows; the dimmed deep row waits
  // for half a panel. Resumes are staggered so a scroll back into view never
  // spins up every decoder in one frame.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const videos = Array.from(
      container.querySelectorAll<HTMLVideoElement>("video[data-wall-row]"),
    );
    if (!visible) {
      videos.forEach((video) => video.pause());
      return;
    }

    const queue: HTMLVideoElement[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = revealedRef.current;
    const pump = () => {
      const video = queue.shift();
      if (!video) {
        timer = undefined;
        if (!revealedRef.current) {
          startupDrainedRef.current = true;
          if (pendingRef.current.size === 0) setRevealed(true);
        }
        return;
      }
      if (!revealedRef.current) pendingRef.current.add(video);
      void video.play().catch(() => {});
      timer = setTimeout(pump, PLAY_STAGGER_MS);
    };
    const kick = () => {
      if (timer !== undefined) return;
      timer = setTimeout(pump, started ? 0 : INITIAL_DELAY_MS);
      if (
        !started &&
        !revealedRef.current &&
        revealTimerRef.current === undefined
      ) {
        revealTimerRef.current = setTimeout(
          () => setRevealed(true),
          INITIAL_DELAY_MS + REVEAL_MAX_WAIT_MS,
        );
      }
      started = true;
    };
    const priority = (video: HTMLVideoElement) =>
      Number(video.dataset.wallPriority ?? 0);
    const onEntries = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          if (!queue.includes(video)) {
            queue.push(video);
            queue.sort((a, b) => priority(a) - priority(b));
          }
          kick();
        } else {
          const queued = queue.indexOf(video);
          if (queued >= 0) queue.splice(queued, 1);
          video.pause();
        }
      }
    };
    const observers = [0, 0.5].map(
      (threshold) =>
        new IntersectionObserver(onEntries, { root: container, threshold }),
    );
    videos.forEach((video) => {
      const row = Number(video.dataset.wallRow);
      observers[row === 0 ? 0 : 1].observe(video);
    });
    return () => {
      clearTimeout(timer);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [visible, size.width, size.height, clips]);

  const rows = Array.from({ length: ROW_COUNT }, (_, row) =>
    panels.filter((panel) => panel.row === row),
  );

  // Center within the rows' combined outer bounds for balanced space above
  // the headline and below the buttons, including unequal row heights.
  const nearBottom = size.height * ROW_Y_VH[0] + (rows[0][0]?.h ?? 0) / 2;
  const backTop = size.height * ROW_Y_VH[1] - (rows[1][0]?.h ?? 0) / 2;
  const contentOffset = (nearBottom + backTop) / 2;

  return (
    <div
      ref={containerRef}
      className={`hero-wall relative overflow-hidden select-none ${
        className ?? ""
      }`}
      data-paused={visible ? undefined : "true"}
    >
      {/* Rows render back to front. The whole layer (frames included) stays
          invisible until the first-appearance gate opens, then fades in
          quickly alongside the headline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          maskImage: EDGE_MASK,
          WebkitMaskImage: EDGE_MASK,
          opacity: revealed ? 1 : 0,
          transition: "opacity 300ms ease-out",
        }}
      >
        {[...rows.keys()].reverse().map((row) => {
          const rowPanels = rows[row];
          if (rowPanels.length === 0) return null;
          const length = rowPanels[0].length;
          const speed = DRIFT_PX_PER_S * Math.pow(SPEED_STEP, row);
          const duration = length / speed;
          // Odd rows slide the other way, so the strips move against each
          // other.
          const reverse = row % 2 === 1;
          return (
            <div
              key={row}
              className="absolute inset-0"
              style={{
                opacity: ROW_DIM[row],
                transform: `translate3d(0, ${size.height * ROW_Y_VH[row]}px, 0)`,
              }}
            >
              {rowPanels.map((panel, i) => {
                // Slide from +L/2 to -L/2 (or back), starting at the panel's
                // resting spot via a negative delay.
                const delay = reverse
                  ? -(panel.x0 / speed)
                  : -((length - panel.x0) / speed);
                const clip = clips[panel.clip];
                // Resting position relative to the wall center. Panels that
                // start on screen fetch their headers during the headline
                // animation (cheap, no decoder) so play() only needs frames;
                // everything else waits until the culling asks it to play.
                const rest = panel.x0 - length / 2;
                const onScreenAtRest =
                  Math.abs(rest) - panel.w / 2 < size.width / 2;
                return (
                  <div
                    key={`${row}-${i}-${clip.src}`}
                    className="hero-wall-panel absolute left-1/2 top-1/2 bg-black border border-white/20"
                    style={
                      {
                        width: panel.w,
                        height: panel.h,
                        marginLeft: -panel.w / 2,
                        marginTop: -panel.h / 2,
                        "--wall-from": `${length / 2}px`,
                        "--wall-to": `${-length / 2}px`,
                        "--wall-rest": `${rest}px`,
                        "--wall-duration": `${duration}s`,
                        "--wall-delay": `${delay}s`,
                        "--wall-direction": reverse ? "reverse" : "normal",
                      } as CSSProperties
                    }
                  >
                    <WallVideo
                      src={clip.src}
                      row={row}
                      onSettled={settle}
                      priority={row * 100000 + Math.abs(rest)}
                      eager={onScreenAtRest}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legibility vignette: darkens the wall behind the headline so the
          type reads over busy footage. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 64% at 50% 50%, rgba(16,16,20,0.74) 0%, rgba(16,16,20,0.32) 45%, rgba(16,16,20,0) 75%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ transform: `translateY(${contentOffset}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

// Until a clip has decodable frames its panel stays as an empty hairline
// skeleton, then the footage fades in: no black rectangles and no pop-in on
// slow connections. Playback is driven by the wall's culling (no autoplay).
// Nothing decodes before the wall starts: `eager` panels (on screen at
// rest) only fetch headers on page load, the rest sit at preload="none", and
// every one fetches for real when play() is first called on it. `priority` orders the start-up queue (lower first). On first
// load the wall's rows layer stays hidden until its gate opens, so panels
// all appear together. object-fit handles the crop, so the panel needs no
// overflow clipping of its own (clipping a transformed video costs an extra
// mask pass).
const WallVideo = ({
  src,
  row,
  priority,
  eager,
  onSettled,
}: {
  src: string;
  row: number;
  priority: number;
  eager: boolean;
  // Called once this panel has either a first frame or a load error, so the
  // gate stops waiting on it.
  onSettled: (video: HTMLVideoElement) => void;
}) => {
  const [ready, setReady] = useState(false);
  return (
    <video
      src={src}
      onError={(e) => {
        // Missing upload or undecodable codec: blank the whole panel (frame
        // included) rather than leave an empty box in the strip.
        const panel = e.currentTarget.parentElement;
        if (panel) panel.style.visibility = "hidden";
        onSettled(e.currentTarget);
      }}
      data-wall-row={row}
      data-wall-priority={Math.round(priority)}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
      style={{ opacity: ready ? 1 : 0 }}
      loop
      muted
      playsInline
      preload={eager ? "metadata" : "none"}
      disablePictureInPicture
      disableRemotePlayback
      onLoadedData={(e) => {
        const panel = e.currentTarget.parentElement;
        if (panel) panel.style.visibility = "";
        setReady(true);
        onSettled(e.currentTarget);
      }}
    />
  );
};

// Each source gets one panel across the entire wall. Extend the track with
// spacing on wide screens instead of cloning clips to fill the viewport.
// The track must exceed the viewport by a full panel so wrapping is hidden.
function buildLayout(
  clips: WallClip[],
  width: number,
  height: number,
): WallPanel[] {
  if (width <= 0 || height <= 0 || clips.length === 0) return [];
  const nearH = Math.min(320, Math.max(110, height * ROW_HEIGHT_VH));
  const uniqueClips = clips
    .map((clip, index) => ({ ...clip, index }))
    .filter((clip, index, all) =>
      all.findIndex((candidate) => candidate.src === clip.src) === index,
    );
  const perRow = Math.floor(uniqueClips.length / ROW_COUNT);
  const extra = uniqueClips.length % ROW_COUNT;
  const panels: WallPanel[] = [];
  for (let row = 0; row < ROW_COUNT; row++) {
    // The smaller back row gets the remainder because it fits more panels.
    const rowStart = row * perRow + Math.max(0, row - (ROW_COUNT - extra));
    const count = perRow + (row >= ROW_COUNT - extra ? 1 : 0);
    if (count === 0) continue;
    const rowClips = uniqueClips.slice(rowStart, rowStart + count);
    const h = nearH * Math.pow(ROW_SCALE, row);
    const widths = rowClips.map((clip) => h * clip.aspect);
    const totalWidth = widths.reduce((total, w) => total + w, 0);
    const length = Math.max(
      totalWidth + count * GAP_PX,
      width + Math.max(...widths) + 2 * GAP_PX,
    );
    const gap = (length - totalWidth) / count;
    let x = 0;
    rowClips.forEach((clip, index) => {
      const w = widths[index];
      panels.push({ clip: clip.index, w, h, x0: x + w / 2, row, length });
      x += w + gap;
    });
  }
  return panels;
}
