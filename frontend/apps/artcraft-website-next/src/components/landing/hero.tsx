import { AppleIcon, MonitorIcon } from "lucide-react";
import { SOCIAL_LINKS, WEBAPP_URL } from "@/lib/links";
import { HERO_VIDEO_URL } from "@/lib/landing-data";
import { GitHubIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import HeroWordmark from "./hero-wordmark";
import HeroViewport from "./hero-viewport";

export default function Hero() {
  return (
    <section className="relative">
      {/* Full-bleed hero — crisp display-type wordmark over the render
          wall: rows of Seedance takes forming one perspective wall that
          drifts behind the word and answers the cursor. */}
      <HeroWordmark />

      <div className="relative mx-auto max-w-[1280px] border-x border-line">
        <div className="flex items-center justify-between gap-4 border-y border-line px-6 py-3 md:px-10">
          <p className="hud-label text-muted">Open-source AI studio</p>
          <p className="hud-label text-accent-ink">
            Now with Seedance 2.5, Nano Banana 2 &amp; more
          </p>
        </div>

        <div data-reveal-group className="px-6 pt-12 pb-10 md:px-10">
          <h1
            data-reveal
            className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-ink-strong sm:text-5xl md:text-6xl"
          >
            Controllable AI{" "}
            <span className="font-serif italic font-normal text-muted">
              for artists.
            </span>
          </h1>

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p
              data-reveal
              className="max-w-md text-lg leading-relaxed text-muted"
            >
              Artists need and deserve unparalleled control and precision.
              ArtCraft&rsquo;s got you covered — compose in real 3D, then
              render with AI.
            </p>
            <div data-reveal className="flex flex-wrap items-center gap-3">
              <Button href="/download" size="lg">
                <AppleIcon aria-hidden className="h-4 w-4" />
                <MonitorIcon aria-hidden className="h-4 w-4" />
                Download free
              </Button>
              <Button href={WEBAPP_URL} variant="secondary" size="lg">
                Use on web
              </Button>
            </div>
          </div>

          <div
            data-reveal
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            <a
              href={SOCIAL_LINKS.GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="hud-label flex items-center gap-1.5 text-faint hover:text-ink"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              Open source on GitHub
            </a>
            <p className="hud-label text-faint">macOS · Windows · Web</p>
            <p className="hud-label text-faint">No subscription required</p>
          </div>
        </div>

        {/* Viewport frame — the product-demo stage: blocking vs. AI render. */}
        <figure className="relative border-t border-line">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2 md:px-10">
            <figcaption className="hud-label text-faint">
              Viewport — scene 01
            </figcaption>
            <p aria-hidden className="hud-label text-faint">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 bg-accent align-middle" />
              Blocking ↔ render · move your cursor
            </p>
          </div>
          <div className="relative aspect-video w-full overflow-hidden bg-bg-sunken">
            <HeroViewport
              videoSrc={HERO_VIDEO_URL}
              videoLabel="ArtCraft product reel: composing 3D scenes and rendering them with AI"
            />
            <span aria-hidden className="tick top-2 left-2 opacity-60" />
            <span aria-hidden className="tick top-2 right-2 opacity-60" />
            <span aria-hidden className="tick bottom-2 left-2 opacity-60" />
            <span aria-hidden className="tick bottom-2 right-2 opacity-60" />
          </div>
        </figure>
      </div>
    </section>
  );
}
