import { GitHubIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { SOCIAL_LINKS } from "@/lib/links";
import { SectionShell, SectionEyebrow } from "./section-shell";

const PILLARS = [
  {
    index: "A",
    title: "Open source",
    body: "The whole studio is on GitHub. Read it, fork it, make it yours.",
    href: SOCIAL_LINKS.GITHUB,
  },
  {
    index: "B",
    title: "Yours forever",
    body: "ArtCraft is yours to own and keep, forever. No rent payments.",
  },
  {
    index: "C",
    title: "No middleman",
    body: "No aggregator between you and the models. Your work stays yours.",
  },
];

export default function Ownership() {
  return (
    <SectionShell id="ownership">
      <SectionEyebrow index="02" label="Ownership" annotation="Free & open source" />

      <div className="px-6 py-14 md:px-10 md:py-20">
        <h2
          data-reveal
          className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-ink-strong sm:text-5xl md:text-6xl"
        >
          Stop <span className="font-serif italic font-normal">renting</span>{" "}
          from websites.
        </h2>
        <p data-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          ArtCraft is yours to own and keep, forever. No subscriptions needed,
          no aggregator middleman, no rent payments.
        </p>
      </div>

      <div data-reveal-group className="grid gap-px border-t border-line bg-line md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <article key={pillar.index} data-reveal className="bg-bg p-6 md:p-8">
            <p className="hud-label text-faint">{pillar.index}</p>
            <h3 className="mt-6 font-display text-2xl font-medium tracking-[-0.02em] text-ink-strong">
              {pillar.title}
            </h3>
            <p className="mt-2 leading-relaxed text-muted">{pillar.body}</p>
            {pillar.href && (
              <Button
                href={pillar.href}
                variant="secondary"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 gap-1.5 font-medium"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                View source
              </Button>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
