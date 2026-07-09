import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faApple,
  faWindows,
  faLinux,
} from "@fortawesome/free-brands-svg-icons";
import { HairlineFrame, LineMaskHeading, MonoLabel, PlusCorners } from "./ui";

// /01 — Hero. Dark chapter. Swiss grid with visible column rules, stacked
// oversized display type, mono metadata at the corners, and a hairline-framed
// canvas video in the right column.
export const SectionHero = ({
  onDownloadClick,
}: {
  onDownloadClick: () => void;
}) => (
  <section className="relative flex min-h-[100svh] flex-col overflow-hidden pt-14">
    {/* Vertical gridlines (desktop only) */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden lg:block"
    >
      {[25, 50, 75].map((left) => (
        <span
          key={left}
          className="absolute bottom-0 top-0 w-px"
          style={{ left: `${left}%`, backgroundColor: "var(--l4-line)" }}
        />
      ))}
    </div>

    <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 sm:px-8">
      {/* Top metadata row */}
      <div
        data-l4-reveal
        className="l4-line flex items-center justify-between border-b py-3"
      >
        <MonoLabel className="l4-muted">EST. 2024 — OPEN SOURCE</MonoLabel>
        <MonoLabel className="l4-muted hidden sm:inline">
          IMG / VID / 3D
        </MonoLabel>
        <MonoLabel className="l4-muted">N 37°46′ — W 122°25′</MonoLabel>
      </div>

      {/* Headline */}
      <div className="relative flex flex-1 flex-col justify-center py-14 lg:py-20">
        <LineMaskHeading
          as="h1"
          className="text-[clamp(3.2rem,12vw,13rem)]"
          lines={[
            <>CONTROLLABLE</>,
            <>
              <span className="text-flare">AI</span> FOR
            </>,
            <span className="l4-stroke">ARTISTS</span>,
          ]}
        />
        <p
          data-l4-reveal
          className="l4-muted mt-8 max-w-md font-brut-body text-base leading-relaxed"
        >
          ArtCraft is an open desktop app for AI image, video, and 3D. Every
          model, one canvas, zero prompt-wrestling.
        </p>

        {/* CTAs */}
        <div
          data-l4-reveal
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <button
            onClick={onDownloadClick}
            className="bg-flare text-ink hover:bg-paper inline-flex h-12 items-center justify-center gap-3 px-7 font-brut-mono text-[13px] font-bold uppercase tracking-[0.14em] transition-colors"
          >
            Download_App <span aria-hidden>→</span>
          </button>
          <Link
            to="/pricing"
            className="l4-line hover:text-flare inline-flex h-12 items-center justify-center border px-7 font-brut-mono text-[13px] uppercase tracking-[0.14em] transition-colors"
            style={{ color: "var(--l4-ink)" }}
          >
            Use on Web
          </Link>
          <MonoLabel className="l4-muted sm:ml-4">
            MAC OS — WINDOWS — LINUX
          </MonoLabel>
        </div>
      </div>

      {/* Bottom row: figure video right, mono coordinates left */}
      <div className="l4-line grid grid-cols-1 gap-8 border-t py-8 lg:grid-cols-12">
        <div
          data-l4-reveal
          className="l4-muted flex flex-col justify-end gap-2 lg:col-span-5"
        >
          <MonoLabel>ARTCRAFT — DESKTOP + WEB</MonoLabel>
          <MonoLabel>V2.X — PUBLIC BUILD</MonoLabel>
          <div className="mt-4 flex items-center gap-5 text-lg opacity-70">
            <FontAwesomeIcon icon={faApple} title="macOS" />
            <FontAwesomeIcon icon={faWindows} title="Windows" />
            <FontAwesomeIcon icon={faLinux} title="Linux" />
          </div>
        </div>
        <div className="relative lg:col-span-7" data-l4-wipe>
          <PlusCorners />
          <HairlineFrame caption="FIG. 01 — CANVAS OUTPUT">
            <video
              className="aspect-video w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              src="/videos/hero-video.mp4"
            />
          </HairlineFrame>
        </div>
      </div>
    </div>
  </section>
);
