import { PROVIDERS } from "../data";
import { LineMaskHeading, MonoLabel, SectionHeader } from "./ui";

// /04 — Model wall. Paper chapter. Collapsed-border grid of provider marks
// (the service SVGs are dark-on-transparent, so they read natively on paper).
// Counters tick up once via the [data-l4-counter] hooks in the animations
// module.
export const SectionModelWall = () => (
  <section className="mx-auto w-full max-w-[1600px] px-4 py-24 sm:px-8 lg:py-32">
    <SectionHeader
      number="04"
      label="MODELS"
      right={
        <>
          PROVIDERS — <span data-l4-counter="19">19</span> / MODELS —{" "}
          <span data-l4-counter="60">60</span>+
        </>
      }
    />
    <div className="py-10 lg:py-14">
      <LineMaskHeading
        className="text-[clamp(2.8rem,8vw,8.5rem)]"
        lines={[<>EVERY MODEL.</>, <span className="l4-stroke">ONE CANVAS.</span>]}
      />
      <p className="l4-muted mt-8 max-w-md font-brut-body text-base leading-relaxed">
        Text prompting is neat, but artists crave control. Use every frontier
        model from one desktop canvas — no tab-hopping, no per-site
        subscriptions.
      </p>
    </div>

    <div className="l4-line grid grid-cols-3 border-l border-t md:grid-cols-5 lg:grid-cols-7">
      {PROVIDERS.map((provider) => (
        <div
          key={provider.name}
          data-l4-cell
          className="l4-line flex aspect-square flex-col items-center justify-center gap-3 border-b border-r p-4"
        >
          <img
            src={provider.src}
            alt={provider.name}
            loading="lazy"
            className="h-8 w-8 object-contain opacity-60 sm:h-10 sm:w-10"
          />
          <MonoLabel className="l4-muted hidden text-center md:block">
            {provider.name}
          </MonoLabel>
        </div>
      ))}
      <div
        data-l4-cell
        className="border-ink/20 bg-flare text-ink flex aspect-square flex-col items-center justify-center gap-2 border-b border-r p-4 text-center"
      >
        <span className="font-brut-display text-3xl font-bold leading-none">
          +
        </span>
        <MonoLabel>MORE EVERY WEEK</MonoLabel>
      </div>
    </div>
  </section>
);
