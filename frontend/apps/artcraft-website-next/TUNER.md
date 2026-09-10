# Dev Tuner

A floating, draggable panel for live-tuning the site's visual/physics
constants without an edit-build-reload loop. Drag it by its header; collapse
the whole box with `–`, or expand/collapse individual sections.

## When it shows

- Always in `next dev`.
- In any build when the URL has `?tuner=1` (handy for tuning a deployed
  preview).
- Never otherwise — production visitors don't see it.

## Behavior

- **Live**: motion/look values are read every frame, so slider changes
  apply instantly. Layout values (anything that changes an element's
  structure or arrangement itself) trigger a debounced rebuild (~250 ms
  after the last change).
- **Persistent**: tuned values are stored in `localStorage`
  (`artcraft-tuner`), so a refresh keeps your tuning. Panel position and
  section collapse state persist too (`artcraft-tuner-ui`).
- **Modified values** show their label in the accent color.
- **Copy** puts a JSON snapshot of all current values on the clipboard —
  paste it into a message or use it to update defaults in code.
- **Reset** clears every override back to the in-code defaults.

## Adding tunables (POLICY: always do this)

Whenever you introduce a new tweakable constant — a force, an intensity, a
size, a duration — register it with the tuner instead of hardcoding a bare
literal. Adding a slider is free; a missing one costs a whole
iteration/build round-trip.

```ts
// some-feature-tunables.ts
import { defineTunables } from "@/lib/tuner";

export const glowTuner = defineTunables("glow", "Glow", {
  radius: {
    label: "Radius px", min: 0, max: 400, step: 5, default: 120,
    info: "Blur radius of the glow behind the hero card.",
  },
  strength: {
    label: "Strength", min: 0, max: 2, step: 0.05, default: 0.8,
    info: "Peak intensity of the glow (0 = off).",
  },
});
```

**Every tunable must carry an `info` one-liner.** It renders as the row's
`i`-mark hover in the panel — a slider nobody can decipher ("Ghost alpha"?)
costs more than the sentence explaining it. Write what the knob visibly
does, not what the variable is named.

Then read values where they're used:

- **Per-frame consumers** (`useFrame`, rAF loops): call `glowTuner.read()`
  inside the loop — it's cheap and picks up changes instantly.
- **Build-time consumers** (values baked into geometry/sampling): read at
  build time and subscribe to `useTunerStore` to trigger a debounced rebuild
  when the group's values change (see the Galaxy layout wiring in
  `hero-galaxy.tsx`).

The panel picks up new groups automatically — no panel changes needed.
Registered groups: Galaxy layout, Galaxy motion, Galaxy pointer, Galaxy look
(hero galaxy; `src/components/landing/hero-galaxy-tunables.ts`) and Ruler
layout, Ruler motion, Ruler look (scroll ruler;
`src/components/ruler/ruler-tunables.ts`).

## Shipping tuned values

The defaults in `defineTunables` are the shipped values. After a tuning
session: Copy → paste the JSON → update the `default:` fields → Reset.
