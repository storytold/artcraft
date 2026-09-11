# Artcraft Moodboard — Design & Flow

> How the moodboard looks, feels, and flows. Written through a high-end product-design lens
> (Linear/Apple-tier restraint: haptic depth, spring-physics motion, calm surfaces) and grounded
> in the shipped implementation (`@storyteller/ui-moodboard`). Companion to `DESIGN_SYSTEM.md`
> (tokens/components), `FEATURE_PLAN.md` (roadmap), and `FEATURE_BACKLOG.md` (what's next).

---

## 1. Design philosophy

Three convictions drive every decision:

1. **The board is an input to generation, not a graveyard.** Generic moodboards (Pinterest,
   Milanote) are dead ends — references go in, nothing comes out. Artcraft owns the engine, so the
   board is one gesture away from a generation and vice-versa. Every surface keeps that loop in
   reach without ever shouting about it.
2. **Native, then elevated.** The moodboard lives *inside* Artcraft, so it speaks the app's visual
   language (the `--st-*` theme tokens, Fira Sans, the `glass` material, the brand blue). Elevation
   comes from *composition* — nested "double-bezel" enclosures, floating glass islands, motion with
   mass — never from a louder palette. The board should feel like it was always part of the app.
3. **The imagery is the interface.** Chrome recedes; references dominate. No like-counts, no
   notification noise, no decorative gradients competing with the user's work. Calm by default
   (the Cosmos/Are.na lesson), dense where it counts.

The felt quality we're after: **a precise, quiet instrument** — fast, tactile, and a little bit
joyful, where heavy operations feel weightless and nothing ever teleports.

---

## 2. Visual language (the short version)

The full token/component spec is in `DESIGN_SYSTEM.md`; the design *intent* behind it:

- **Double-bezel enclosures.** Cards, the inspector, and toolbars are never flat on the canvas.
  A subtle outer shell (plane-1, hairline ring, `rounded-[18px]`, `p-1`) cradles an inner core
  (plane-2, concentric `rounded-[14px]`, an inset top-highlight). It reads like a glass plate
  seated in a machined tray — physical, considered, expensive.
- **Floating glass islands.** The toolbar and the view switch are detached pills, not edge-glued
  bars (`glass` + hairline + ambient shadow, `backdrop-blur` only on these fixed elements — never
  on the scrolling grid, where blur would torch scroll performance).
- **Spring-physics motion.** Custom cubic-beziers, never `linear`/`ease-in-out`. A hover lift, a
  card landing on drop with a touch of overshoot, a palette fading up. Animate only `transform`,
  `opacity`, `filter` — GPU-safe. `prefers-reduced-motion` collapses springs to fades.
- **Concentric squircle radii** and **ambient, layered shadows** (never a harsh `shadow-md`).
- **One display moment.** Body/UI is Fira Sans (the app font, for zero context-switch); the only
  "display" flourish is the editorial empty-state heading and presentation mode.

---

## 3. Information architecture

```
Board (durable model, localStorage today → backend later)
├── items: image · video · text · link · color   (each: tags, rating, deterministic aspect)
├── sections (model-ready; UI is a near-term add)
└── rendered three ways — ALL views are projections of the same board:
     ├── GRID         virtualized masonry — the default; scan / search / triage at volume
     ├── CANVAS       freeform Konva stage — arrange / compare / plan spatially
     └── PRESENT      full-bleed deck — review & share
```

**Why grid-first.** 90% of moodboard time is scanning, searching, and triaging — the grid wins
those high-frequency jobs and stays at 60fps (canvas-only tools like Milanote lag at a few hundred
items; we virtualize from item aspect ratios so only the viewport mounts). The freeform canvas is
the *delighter* for spatial thinking, not the foundation. **The board, not the view, is what plugs
into generation** — "use as reference" works regardless of how you're looking at it.

---

## 4. Core flows

Each flow below lists the **gesture**, then the **design rationale**.

### 4.1 Capture — get references in with zero friction
The fastest path wins, so we offer every path and make the empty state *say so*.

- **Drag images** from the desktop onto the board → a dashed primary-tinted drop overlay confirms
  the target; files land at the cursor.
- **Paste** — an image from the clipboard drops instantly; a **URL** becomes a link card
  (hostname title today; rich OG preview is a backlog item).
- **Upload** (toolbar `↑` / empty-state CTA) → the image appears immediately from a blob, then
  uploads in the background to capture a durable media token (so it becomes reference-capable).
- **From library** → the shared gallery picker (Artcraft's own `GalleryModal`), so muscle memory
  transfers from the rest of the app. Not signed in? The picker now shows a **Log in** button
  (not a dead "Retry"), routed per-platform via the adapter.
- **Note / Color** → a sticky note or an OS-picked swatch, one click each.

*Rationale:* friction is the enemy of collection. The empty state is an **editorial hero**
("Start collecting ideas") that doubles as the drop affordance — it teaches the gestures while
looking like a finished product, not a blank slate.

### 4.2 Organize — keep a growing board legible
- **Density** — a segmented control (Compact / Cozy / Comfortable) re-flows the masonry; the
  layout is target-width-driven, so it adapts to any container (Savee's adjustable-density bar).
- **Search + tag chips** — text query over captions/tags/links; click a chip to filter.
- **Multi-select** — click, shift/⌘-click, or marquee-drag on bare canvas; a floating glass
  **selection bar** rises from the bottom with the count + actions.

### 4.3 Triage — sift keepers from a batch, fast
Lightroom is the gold standard for high-volume culling, so we borrow its muscle memory:

- With items selected, **`1`–`5`** rate, **`0`** clears, **`P`** picks (5 stars). A rating badge
  persists on the tile.
- The toolbar **star filter** cycles "All → 1+ … → 5+ → All" to winnow to keepers.
- The selection bar surfaces the shortcuts inline (`1–5 rate · 0 clear`) so they're *discoverable*,
  not hidden lore.
- **Delete is deliberate** — `Delete`/`Backspace` only (we removed `x` as a delete alias: it sits
  in the number row and the board has no undo, so a stray press must not destroy work).

*Rationale:* triage is keyboard-first because it's repetitive and high-volume; every key saves a
trip to the mouse. Destructive actions get friction; constructive ones get none.

### 4.4 The board → generate loop — the differentiator
This is the move no generic moodboard can make.

- **"Use as reference"** — on a card's hover rail, in the selection bar, or in the inspector.
  Selected board images are pushed into the image-generation prompt as style references (via their
  media tokens) and the user lands on the Create-Image surface, refs pre-filled. Krea/Firefly
  proved board→generate; Artcraft closes it natively.
- The seam is the **adapter** (§6): desktop seeds `usePromptImageStore` + switches to the Image
  tab; web seeds `useCreateImageStore` + navigates to `/create-image`. Same gesture, same result,
  two platforms.

*Rationale:* the highest-leverage feature is the one that turns a passive collection into momentum.
It's always one click from any view, and it never blocks — it sends and gets out of the way.

### 4.5 Inspect — the lightbox as a workbench
Double-click or the rail's expand icon opens a full-screen **inspector**:

- Large media on a glass-blurred backdrop (blur is fine here — it's a fixed overlay), a
  double-bezel side panel, `←/→` to walk the board, `Esc` to close, background scroll locked,
  `role="dialog"`.
- The panel is a small workbench: **rating** stars, a **tag editor**, an **extracted palette**
  (client-side color quantization — click a swatch to copy, or "add swatches to board"), and
  **Use as reference**. The palette is keyed on the image src, so editing tags never re-decodes
  the image or flickers.

### 4.6 Canvas — think spatially
The freeform Konva stage for arranging, comparing, and planning:

- Pan/zoom, marquee + lasso select, 8-handle transform, grouping, undo/redo, a shortcut cheatsheet,
  and auto-layout helpers (pack / fit-to-grid / cluster-by-proximity) that already exist and want
  better surfacing. Alignment/snapping + a background grid are the next polish (backlog).
- Drop a generation onto the canvas, set images side by side, group a coherent set, then send that
  set to generation. It's the planning room; the grid is the library.

### 4.7 Present — review & share
A distraction-free, full-bleed deck: one item at a time, `←/→/space` to navigate, `Esc` to exit,
launched from the view switch as a transient overlay (never persisted, so a reload never reopens
into a slideshow). For client/team review and screen-sharing.

---

## 5. Micro-UX niceties (the details that read as "expensive")

- **Hover action rail** — a glass pill on each card fades *up* on hover (translate + opacity), with
  Open / Use-as-reference / Delete. Buttons stop propagation so they never double as a select.
- **Card states choreographed** — hover lifts the shell 2px and deepens the shadow; selected swaps
  to a 2px brand ring; drag scales to 1.03; drop lands with a snap-overshoot.
- **Selection check + rating** — solid scrims (not blur) inside the scrolling grid for legibility
  without GPU cost.
- **Focus-visible rings everywhere** — keyboard users see where they are, not just hover users.
- **The Login button** — the gallery picker now invites action ("Log in to browse your library" +
  a real primary button) instead of a confusing "Retry" link.
- **Stagger on entry** — grid items and presentation reveals come in with a short staggered
  fade-up, so the board feels assembled, not dumped.

---

## 6. Cross-platform via the adapter

One library, two hosts, identical experience. The lib owns everything platform-agnostic; each app
injects a `MoodboardAdapter` for its three seams:

```ts
interface MoodboardAdapter {
  uploadImage?:        (file) => Promise<mediaToken | null>;   // capture a durable token
  sendToGeneration:    (refs) => void;                         // board → prompt
  renderLibraryPicker?: (props) => ReactNode;                  // the gallery picker (render-prop)
}
```

- **Desktop (Tauri):** upload via `@storyteller/api`, picker via `GalleryModal`, send → prompt
  store + tab switch, login → the login modal.
- **Web (artcraft-webapp):** upload via the webapp uploader, picker via the same `GalleryModal`,
  send → create-image store + `/create-image`, login → navigate `/login`.

*Rationale:* the adapter is the seam where platform reality lives, so the *experience* stays a
single, consistent design across surfaces — and the same polish ships everywhere at once.

---

## 7. Motion & performance contract

- **Curves:** spring (`cubic-bezier(0.32,0.72,0,1)`) for settle/zoom; smooth
  (`cubic-bezier(0.4,0,0.2,1)`, ~200ms) for hover/selection; snap with slight overshoot on drop.
- **Only `transform`/`opacity`/`filter`** animate — never layout properties.
- **`backdrop-blur` only on fixed chrome** (toolbar, view switch, inspector/present backdrops);
  the virtualized scrolling grid uses solid scrims so scrolling stays at 60fps.
- **Virtualize aggressively** — deterministic masonry from item aspects means only viewport-visible
  cards mount; the grid holds thousands of items without lag (the competitor failure mode).
- **Respect `prefers-reduced-motion`** — springs become instant, fades remain.

---

## 8. Accessibility & polish checklist

- [x] Theme-correct: consumes `--st-*` only, so light/dark/gray/black/aurora themes work for free.
- [x] Focus-visible rings on interactive controls; inspector is a labelled `role="dialog"` with
      scroll-lock and keyboard nav.
- [x] Color is never the only signal (drop state pairs a tint with a dashed outline + icon).
- [x] Destructive delete is deliberate (no single-printable-key delete); no silent data loss.
- [ ] Cards are not yet keyboard-focusable/selectable (pointer-first) — a known a11y gap.
- [ ] Toolbar/inspector don't yet collapse gracefully below ~768px (desktop-first) — responsive
      pass pending.

---

## 9. Where the design goes next

The research-backed backlog (`FEATURE_BACKLOG.md`) extends this flow without changing its spine —
client-side ML (in-browser captioning, auto-tagging, find-similar, palette/color search) makes the
board *understand itself*; canvas snapping/alignment and a region→palette tool deepen planning; and
the generate-into-a-board / remix loop tightens the differentiator. Collaboration & sharing are
deferred behind a flag (they need the backend). The throughline stays constant: **collect with no
friction, organize effortlessly, and turn the board into the next generation — calmly.**
