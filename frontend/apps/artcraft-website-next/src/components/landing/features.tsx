import { FEATURES } from "@/lib/landing-data";
import LazyVideo from "@/components/lazy-video";
import { SectionShell, SectionEyebrow } from "./section-shell";

// Feature grid: hairline-separated cells (gap-px over the line color), the
// first feature spanning the full row. Every cell is index + label + real
// product footage + copy — no illustration, only the actual tool.
export default function Features() {
  const [lead, ...rest] = FEATURES;

  return (
    <SectionShell id="features">
      <SectionEyebrow
        index="01"
        label="Crafting features"
        annotation="Real footage — captured in ArtCraft"
      />

      <div className="px-6 py-14 md:px-10 md:py-20">
        <h2
          data-reveal
          className="max-w-3xl font-display text-4xl font-medium leading-[1.02] tracking-[-0.035em] text-ink-strong sm:text-5xl md:text-6xl"
        >
          The control that mere{" "}
          <span className="font-serif italic font-normal">words</span> cannot
          buy.
        </h2>
        <p data-reveal className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Text prompting is neat, but artists crave control. Compose the shot
          yourself — then let the model render it.
        </p>
      </div>

      <div className="grid gap-px border-t border-line bg-line md:grid-cols-2">
        <FeatureCell feature={lead} lead />
        {rest.map((feature) => (
          <FeatureCell key={feature.index} feature={feature} />
        ))}
        {/* Filler cell keeps the hairline grid rectangular with 7 items. */}
        <div
          aria-hidden
          className="hidden items-end justify-between bg-bg p-6 md:flex md:p-8"
        >
          <p className="hud-label text-faint">More in the app</p>
          <p className="hud-label text-faint">07 / 07</p>
        </div>
      </div>
    </SectionShell>
  );
}

function FeatureCell({
  feature,
  lead = false,
}: {
  feature: (typeof FEATURES)[number];
  lead?: boolean;
}) {
  return (
    <article className={`bg-bg ${lead ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2.5 md:px-8">
        <p className="hud-label text-muted">{feature.label}</p>
        <p className="hud-label text-faint">{feature.index}</p>
      </div>
      <div
        className={`relative w-full overflow-hidden bg-bg-sunken ${
          lead ? "aspect-[21/9]" : "aspect-video"
        }`}
      >
        <LazyVideo
          src={feature.video}
          label={`${feature.title} demo`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="px-6 py-6 md:px-8">
        <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink-strong">
          {feature.title}
        </h3>
        <p className="mt-2 max-w-xl leading-relaxed text-muted">
          {feature.description}
        </p>
      </div>
    </article>
  );
}
