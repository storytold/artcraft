import { useEffect, useRef, useState } from "react";
import { FEATURES } from "../data";
import {
  HairlineFrame,
  LazyAutoplayVideo,
  LineMaskHeading,
  MonoLabel,
  SectionHeader,
} from "./ui";

// /03 — Features. Paper chapter. Desktop: an index list on the left with a
// sticky hairline-framed preview on the right; an IntersectionObserver with a
// center-band root margin marks the row crossing mid-viewport as active,
// which drives the preview video swap. Mobile: each row embeds its own video
// and the observer never activates (rows are hidden from it via lg gating in
// markup, and the sticky preview is display:none).
export const SectionFeatures = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const active = FEATURES[activeIndex];

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>("[data-l4-feature-row]"),
    );
    // Center band: a row becomes active while it overlaps the middle 20% of
    // the viewport. Cheap, and unlike per-row ScrollTriggers it needs no
    // cleanup coordination with the GSAP context.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(
              (entry.target as HTMLElement).dataset.l4FeatureRow,
            );
            if (!Number.isNaN(index)) setActiveIndex(index);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      data-l4-features
      className="mx-auto w-full max-w-[1600px] px-4 py-24 sm:px-8 lg:py-32"
    >
      <SectionHeader number="03" label="FEATURES" right="07 TOOLS" />
      <div className="py-10 lg:py-14">
        <LineMaskHeading
          className="text-[clamp(2.8rem,8vw,8.5rem)]"
          lines={[<>THE TOOLKIT</>]}
        />
      </div>

      <div className="l4-line grid grid-cols-1 border-t lg:grid-cols-12">
        {/* Index list */}
        <ol ref={listRef} className="l4-line lg:col-span-7 lg:border-r">
          {FEATURES.map((feature, i) => (
            <li
              key={feature.title}
              data-l4-feature-row={i}
              data-l4-reveal
              className={`l4-line border-b lg:pr-8 ${
                i === activeIndex ? "l4-row-active" : ""
              }`}
            >
              <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-6 sm:gap-8 lg:py-8">
                <MonoLabel className="l4-muted w-8">
                  {String(i + 1).padStart(2, "0")}
                </MonoLabel>
                <div>
                  <MonoLabel className="text-ember">{feature.label}</MonoLabel>
                  <h3 className="mt-2 font-brut-display text-[clamp(1.5rem,3vw,2.8rem)] font-semibold uppercase leading-none tracking-[-0.01em]">
                    {feature.title}
                  </h3>
                  <p className="l4-muted mt-3 max-w-lg font-brut-body text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="l4-index-marker font-brut-mono text-xl leading-none"
                >
                  +
                </span>
              </div>
              {/* Mobile-only inline video */}
              <div className="pb-6 lg:hidden">
                <HairlineFrame
                  caption={`FIG. ${String(i + 1).padStart(2, "0")} — ${feature.label.toUpperCase()}`}
                >
                  <LazyAutoplayVideo
                    src={feature.src}
                    className="aspect-[12/10] w-full object-cover"
                  />
                </HairlineFrame>
              </div>
            </li>
          ))}
        </ol>

        {/* Sticky preview (desktop) */}
        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24 p-8">
            <HairlineFrame
              caption={`FIG. ${String(activeIndex + 1).padStart(2, "0")} — ${active.label.toUpperCase()}`}
            >
              <div className="aspect-[12/10]">
                <LazyAutoplayVideo
                  key={active.src}
                  src={active.src}
                  className="h-full w-full object-cover"
                />
              </div>
            </HairlineFrame>
          </div>
        </div>
      </div>
    </section>
  );
};
