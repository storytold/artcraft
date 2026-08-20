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

- **Live**: physics/lighting/material values are read every frame, so slider
  changes apply instantly. Formation values (anything that changes the ball
  arrangement itself) trigger a debounced rebuild (~250 ms after the last
  change).
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
  radius: { label: "Radius px", min: 0, max: 400, step: 5, default: 120 },
  strength: { label: "Strength", min: 0, max: 2, step: 0.05, default: 0.8 },
});
```

Then read values where they're used:

- **Per-frame consumers** (`useFrame`, rAF loops): call `glowTuner.read()`
  inside the loop — it's cheap and picks up changes instantly.
- **Build-time consumers** (values baked into geometry/sampling): read at
  build time and subscribe to `useTunerStore` to trigger a debounced rebuild
  when the group's values change (see the Formation wiring in
  `hero-wordmark.tsx`).

The panel picks up new groups automatically — no panel changes needed.
Registered groups: Formation, Physics, Cursor & Light, Material, Halo (all
for the hero wordmark; see `src/components/landing/hero-tunables.ts`).

## Shipping tuned values

The defaults in `defineTunables` are the shipped values. After a tuning
session: Copy → paste the JSON → update the `default:` fields → Reset.
