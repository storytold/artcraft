import { WEBAPP_URL } from "@/lib/links";
import { SectionShell } from "./section-shell";
import CtaLink from "./cta-link";

export default function FinalCta() {
  return (
    <SectionShell>
      <div className="flex flex-col items-center px-6 py-20 text-center md:py-28">
        <p className="hud-label text-faint">Free to start · No subscription</p>
        <h2
          data-reveal
          className="mt-6 max-w-4xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-ink-strong sm:text-6xl md:text-7xl"
        >
          Start{" "}
          <span className="font-serif italic font-normal">crafting</span>.
        </h2>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
          Download the studio, or run it in your browser. Your first renders
          are minutes away.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <CtaLink href="/download">Download for desktop</CtaLink>
          <CtaLink href={WEBAPP_URL} variant="outline">
            Launch in browser
          </CtaLink>
        </div>
      </div>
    </SectionShell>
  );
}
