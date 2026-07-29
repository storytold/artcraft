# Moodboard — UX Change Plan

> Derived from the recommendations in `DESIGN_AND_FLOW.md` (the high-end design/UX doc), checked
> against the **actual implementation**. This is a *design-and-UX polish* plan — closing the gap
> between the experience the doc describes and what's shipped. (AI/ML features live separately in
> `FEATURE_BACKLOG.md`; backend-dependent work like sharing stays deferred.)

## Audit — doc says vs. reality

| Recommendation (DESIGN_AND_FLOW.md) | Status today | Gap |
|---|---|---|
| §5 "Stagger on entry — items fade-up assembled" | **Not built** — grid renders the virtualized slice with no entry motion | Yes |
| §8 "Focus-visible rings on interactive controls" | **Partial** — only card action-rail + toolbar add-buttons | Yes |
| §8 "Cards not yet keyboard-focusable/selectable" | **Not built** — pointer-only | Yes (acknowledged) |
| §8 "Toolbar/inspector don't collapse < ~768px" | **Not built** — fixed horizontal island; inspector is a fixed 2-pane | Yes (acknowledged) |
| §4.2 "Sections" | Model-ready, **no UI** | Yes |
| §4.1 "Paste URL → link card" | Hostname-only, **no OG preview** | Yes (needs proxy) |
| §4.6 "Auto-layout helpers want better surfacing" | Helpers exist (`pack`/`fitToGrid`/`cluster`), **under-exposed** | Yes |
| §5 double-bezel, glass islands, spring motion, hover rail, card states, scrims, login button, triage hint, inspector dialog | **Built** ✓ | — |

Everything in the bottom row is genuinely shipped; the rows above are the work.

---

## The plan (prioritized by impact ÷ effort)

Each item: **what + UX**, **why** (design rationale), **effort (S/M/L)**, **acceptance**.

### P1 — Motion & accessibility foundation (do first)

**1.1 Entry motion — staggered fade-up on the grid.** *(the doc claims it; it isn't there)*
- **What:** as cards mount into the viewport, fade-up from `translate-y-2 opacity-0 blur-[2px]` → rest over ~320ms on `--mb-ease-smooth`, with an index-based delay capped at ~12 items so a full screen feels *assembled*, not dumped. Must be virtualization-safe: animate only on first mount, key the animation so re-renders/scroll don't re-trigger; respect `prefers-reduced-motion`.
- **Why:** the single biggest "expensive feel" lever the doc names; the board currently pops in flatly.
- **Effort:** **S–M.** **Acceptance:** opening a board / switching density plays one clean stagger; scrolling does **not** re-animate; reduced-motion shows instant.

**1.2 Keyboard-navigable cards.**
- **What:** card root becomes focusable (`tabIndex=0`, `role="button"`, `aria-label`); `Enter`/`Space` opens the inspector, `X`/`Delete` deletes the focused card (with the same deliberate-delete rule), and arrow keys move focus across the masonry (geometry-aware: left/right within a row, up/down to the nearest card). Selection follows focus with `Space`; `Shift`+arrows extends.
- **Why:** the doc's headline a11y gap; also a power-user speed win (no mouse round-trips during triage).
- **Effort:** **M.** **Acceptance:** a keyboard-only user can tab into the grid, move with arrows, open/rate/delete, and select — with a visible focus ring on each card.

**1.3 Complete focus-visible coverage.**
- **What:** add focus-visible rings to every remaining interactive control — `SelectionBar` buttons, `SmartSearchBar` input + clear + tag chips, density segmented control, rating-filter toggle, the view switch, and all `ItemInspector` controls (rating stars, tag input, palette swatches, actions).
- **Why:** §8 says "everywhere"; today it's two components.
- **Effort:** **S.** **Acceptance:** tabbing through the whole moodboard always shows where focus is.

### P2 — Responsive & micro-UX completeness

**2.1 Responsive toolbar.**
- **What:** below `md`, the floating island stops being one wide row — it becomes a compact glass bar: board name + a `+`-menu (collapsing the 4 add-buttons), density, rating, and a search **icon** that expands into a sheet; the whole thing `overflow-x-auto` as a last resort so it never breaks the layout.
- **Why:** §8 gap; the webapp can be viewed narrow, and today the island overflows.
- **Effort:** **M.** **Acceptance:** at 375px wide the toolbar is usable and doesn't clip; at ≥`md` it's unchanged.

**2.2 Responsive inspector.**
- **What:** below `md`, the inspector stacks (media on top, the panel as a bottom sheet) instead of the fixed media-left / 320px-panel split; `h-[100dvh]`; nav arrows move to the corners.
- **Why:** §8 gap; the current side-by-side is unusable on phones.
- **Effort:** **S–M.** **Acceptance:** inspector is fully usable at 375px.

**2.3 Sections UI.**
- **What:** group items into named, collapsible sections in the grid (the model already supports `sections` + `sectionId`). A section header row with a name (inline-rename), count, collapse toggle, and "new section"; drag a selection into a section; an "Ungrouped" default lane.
- **Why:** §4.2 calls it a near-term add; big boards spiral without it (Pinterest Sections / MJ folder-groups).
- **Effort:** **M.** **Acceptance:** create/rename/collapse sections; assign items; persists.

**2.4 Surface canvas auto-layout helpers.**
- **What:** a one-click **Tidy / Arrange** menu on the canvas toolbar exposing the already-built `pack` (justified rows), `fitToGrid`, and `cluster-by-proximity`, plus "align selection."
- **Why:** §4.6 — the logic exists but is hidden; cheap, high-delight.
- **Effort:** **S.** **Acceptance:** the three layouts run from a visible menu; undoable.

**2.5 "Button-in-button" primary CTAs.**
- **What:** apply the doc's nested trailing-icon pattern (already in the empty-state CTA) to the primary actions — "Use as reference" and the inspector's primary button — with the magnetic hover physics (icon translates diagonally + scales on hover, button `active:scale-[0.98]`).
- **Why:** §5 haptic consistency; makes the differentiator action feel premium.
- **Effort:** **S.** **Acceptance:** primary CTAs share one polished button anatomy.

### P3 — Larger canvas & capture polish

**2.6 Canvas alignment + snapping + background grid.**
- **What:** snap a dragged node to other nodes' edges/centers with guide lines (DIY on Konva `dragmove`), plus a toggleable background grid + snap-to-grid.
- **Why:** §4.6/§9 — makes the freeform canvas feel professional (PureRef 2.1).
- **Effort:** **M.** (also tracked in `FEATURE_BACKLOG.md` 3.1/3.2.) **Acceptance:** dragging shows guides + snaps; grid toggles.

**2.7 Rich URL preview (link cards).**
- **What:** paste a URL → fetch OG title + image for a real preview card (vs hostname today).
- **Why:** §4.1 — link cards look unfinished without a thumbnail.
- **Effort:** **S (client) / M (proxy).** **Dependency:** OG fetch needs a CORS unfurl proxy → **flag as backend-dependent / defer the image; ship title now.**

**2.8 Drag-from-library onto the board.**
- **What:** let a gallery item be dragged directly onto the grid/canvas (not only picked via the modal), reusing Artcraft's existing gallery-drag event.
- **Why:** §4.1 — the lowest-friction capture path for already-owned media.
- **Effort:** **M.** **Acceptance:** drag a library thumbnail onto the board → it lands as a tokened item.

---

## Sequencing

- **Sprint 1 (feel + a11y):** 1.1 entry motion, 1.2 keyboard cards, 1.3 focus coverage. *One cohesive "the board feels finished and is fully keyboard-able" release.*
- **Sprint 2 (responsive + organize):** 2.1 toolbar, 2.2 inspector, 2.3 sections, 2.5 CTAs.
- **Sprint 3 (canvas + capture):** 2.4 surface auto-layout, 2.6 snapping/grid, 2.8 drag-from-library, 2.7 link previews (title now, image when a proxy exists).

## Recommended first move
**Sprint 1** — it's the highest "expensive feel ÷ effort" and closes the doc's two explicit a11y
gaps + the one motion claim that isn't yet true. All client-side, no backend, fits the shared lib
cleanly, and verifiable headlessly (focus order, reduced-motion, DOM-on-mount).
