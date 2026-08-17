import { MADE_WITH_YOUTUBE_IDS } from "@/lib/landing-data";
import LiteYouTube from "@/components/lite-youtube";
import { SectionShell, SectionEyebrow } from "./section-shell";

export default function MadeWith() {
  return (
    <SectionShell id="made-with">
      <SectionEyebrow index="03" label="Proof" annotation="From the community" />

      <div className="px-6 py-14 md:px-10 md:py-20">
        <h2
          data-reveal
          className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-ink-strong sm:text-5xl md:text-6xl"
        >
          Made <span className="font-serif italic font-normal">with</span>{" "}
          ArtCraft.
        </h2>
      </div>

      <div
        data-reveal-group
        className="grid gap-px border-t border-line bg-line md:grid-cols-3"
      >
        {MADE_WITH_YOUTUBE_IDS.map((id, i) => (
          <figure key={id} data-reveal className="bg-bg">
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2.5">
              <figcaption className="hud-label text-muted">
                Community film
              </figcaption>
              <p className="hud-label text-faint">
                {String(i + 1).padStart(2, "0")}
              </p>
            </div>
            <div className="relative aspect-video w-full overflow-hidden bg-bg-sunken">
              <LiteYouTube videoId={id} title={`Made with ArtCraft #${i + 1}`} />
            </div>
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}
