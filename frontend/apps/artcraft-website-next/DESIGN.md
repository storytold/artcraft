# Design Ideology

The working philosophy behind the ArtCraft marketing site
(`artcraft-website-next`). This captures direction and standards, not a
finished visual spec — the aesthetic itself is still under experiment.

## What we are building

A product website with a sales/marketing angle. The bar: it should read as
a professionally developed, premium site with a design language that
belongs to ArtCraft — not a template, not AI-slop defaults, and not a
studio/agency showpiece. Creative technology (Three.js, GSAP, smooth
scroll) is welcome and encouraged, but subordinated to selling the
product: used where it deepens the product story, never as decoration for
its own sake, and never overdone.

## The premium principle

Premium is felt immediately, and it is built from accumulated small
details — not from one big idea. Small details make a big difference.

- **One or two elements are never enough.** A single hero gimmick floating
  in unoccupied space reads amateur and unfinished — the "blank/empty
  negative space" failure. Compositions need layered density: many quiet,
  coordinated details rather than one loud one.
- **Negative space must be structured, not merely empty.** Rails, rules,
  ticks, annotations, and measurements make emptiness intentional.
- **Everything is choreographed.** Nothing just appears; elements arrive
  with easing and stagger. Motion that maps to scroll is scrub-linked and
  reversible.
- **Finish every surface.** Raw flat color, unlit 3D, and default
  materials read as demos. Grain, lighting, shadow, vignette, and
  micro-contrast are the difference between blocked-out and finished.
- **One voice for micro-detail.** Annotations, counters, tick marks, and
  labels share a single vocabulary (mono uppercase HUD labels, hairline
  rules, crosshair ticks) so density never becomes noise.

## Current experimental language (subject to change)

Brutalist/instrument direction. Nothing here is final; treat every item as
a hypothesis under test, replaceable by a better experiment:

- Two themes, one structure: dark "viewport" (near-black terminal), light
  "blueprint" (warm paper). Light-dominant positioning, deliberately apart
  from dark competitors.
- Hard edges, zero border radius, hairline rules, ticked 1280px rails.
- Type: Archivo display (stretched), Instrument Serif italic for one
  contrast word per headline, Inter body, Geist Mono for HUD micro-labels.
- One blue accent, used sparingly. Color discipline over rainbow.

## Working practices

- **Experiments over debates.** Contested aesthetics get built behind the
  dev tuner and judged on the page, not argued in the abstract.
- **Every tweakable constant is registered with the tuner** (see
  TUNER.md). A missing slider costs a whole build round-trip.
- **Progressive enhancement is non-negotiable.** Reduced motion, coarse
  pointers, no-JS crawlers, and WebGL failure all receive a complete,
  legible page.
