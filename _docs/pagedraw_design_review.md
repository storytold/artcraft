# PageDraw — Visual Design & Architecture Review

**Surface:** `@storyteller/ui-pagedraw` image editor + its `artcraft-webapp` integration (`/edit-image`).
**Lens:** Awwwards / Linear-tier "premium app chrome" rubric, adapted for an in-product creative tool.
**Date:** 2026-06-15 · **Branch:** `worktree-pagedraw-webapp`

---

## 0. How to read this

PageDraw is a **professional canvas tool**, not a marketing page. So the elite-design rubric is
applied in its *app-chrome* register — the north star is **Figma / Linear / Photoshop-web**, not an
Awwwards landing page. That means:

- **Applies:** token discipline, concentric radii, hairline + inset-highlight surfaces ("double-bezel"),
  island/pill controls, custom-eased micro-motion, z-index hygiene, premium type ramp.
- **Does _not_ apply:** `py-40` macro-whitespace, hero typography, editorial-split layouts, scroll-reveal
  entrances. A tool surface is dense and persistent by design; forcing landing-page whitespace would hurt it.

Citations are `file:line` against the current tree.

---

## 1. Verdict

| Axis | Score | One-liner |
|---|---|---|
| Color system | ⚠️ 5/10 | Good token foundation, but hardcoded greys (`#1b1b1b`, `#303030`, `#404040`) leak through a *themeable lib*. |
| Typography | ❌ 3/10 | No type ramp, no font-family ownership; rides whatever the host sets. Banned-by-rubric default stack risk. |
| Radii | ⚠️ 4/10 | Five radius scales in play (`sm`→`2xl`→`full`) with no concentric nesting. |
| Surfaces (border/shadow) | ⚠️ 5/10 | Flat `shadow-lg` everywhere; no inset highlights; no double-bezel. Reads "functional", not "machined". |
| Motion | ❌ 3/10 | Only `transition-colors`/`ease-in-out`, durations 75–200ms; **zero custom easing**, no spring, no entrance choreography. |
| Layout / z-index | ⚠️ 6/10 | Clean fixed-panel composition, but a `z-[9999999]` escape hatch and a 6-tier ad-hoc z-stack. |
| Icons | ✅ 7/10 | FontAwesome Pro (solid + regular) — acceptable, but solid weight is heavier than the rubric's "ultra-light line" ideal. |
| Architecture | ⚠️ 5/10 | Clean adapter boundary; but `PaintSurface.tsx` (2005 LOC), `SceneState.ts` (1539), `PageDraw.tsx` (1292) are oversized, and the lib hardcodes host-theme colors. |

**Bottom line:** the editor is *structurally competent and functional* but visually reads as
"capable internal tool," not "$150k product surface." The single highest-leverage fix is a **shared
design-token layer** (color + radius + motion + type), because today the lib both (a) reaches for
host tokens (`bg-ui-panel`, `text-base-fg`) *and* (b) hardcodes its own greys — so it can never be
fully reskinned by the webapp vs. the desktop app.

---

## 2. What's already good (keep)

- **Token-aware base.** Most surfaces use semantic tokens (`bg-ui-panel`, `bg-ui-controls`,
  `text-base-fg`, `border-ui-panel-border`) — the right instinct (SideToolbar, PromptEditor, HistoryStack).
- **Clean platform boundary.** The lib has zero REST/Tauri imports; everything I/O flows through
  `PageDrawAdapter` (`adapter.ts`). The webapp adapter (`web-adapter.tsx`) and desktop adapter stay
  swappable. This is genuinely good architecture and should be protected.
- **Performance-minded canvas.** Composite pre-baking on idle (`PageDraw.tsx` ~661–710) and worker
  encoding (`generatePipeline.worker.ts`) keep the generate click off the main thread. Don't regress this.
- **CORS already handled** for browser canvas export (`crossOrigin="anonymous"` in `Node.ts:134`,
  `SceneState.ts:1473`, `imageHelpers.ts:16`) — the web port works because of this.

---

## 3. Findings & recommendations

### 3.1 Color — stop hardcoding greys in a themeable lib  ⚠️ P0
**Current:** semantic tokens *and* raw hex coexist:
- `#1b1b1b` pegboard (`pagedraw.css:6`), `#1A1A1A`/`#333333` context menu (`ContextMenu.tsx:44`),
  `#303030`/`#404040` dividers + popovers (`SideToolbar.tsx:381,550`), `bg-zinc-700/600` swatch
  (`SideToolbar.tsx:173`), plus ad-hoc `bg-blue-600/500` accents (`PageDraw.tsx:157`, base selector).
- Accent color is inconsistent: the lib's primary action uses raw **blue-600**, while the webapp's
  design system uses `--primary` / `brand-primary`. So the editor's blue doesn't match the product.

**Why it fails the bar:** a premium component library exposes *one* surface ramp and *one* accent, both
driven by tokens, so it reskins per host. Hardcoded greys mean the desktop and web themes can drift, and
the raw `blue-600` clashes with `brand-primary` used elsewhere in the webapp.

**Do:**
- Replace every raw grey with the existing ramp: `#1b1b1b`→`bg-ui-background`, `#1A1A1A`→`bg-ui-panel`,
  `#303030`/`#404040`→`border-ui-panel-border` / `bg-ui-controls`. For the pegboard, add a token
  `--st-canvas` so hosts can theme the canvas backdrop.
- Replace `blue-600/500` accents with `bg-primary` / `text-primary` (the token the rest of the webapp uses),
  so the Generate/Edit-3D buttons match `brand-primary`.
- Move the react-colorful overrides off pure `rgb(255,255,255)` borders (`pagedraw.css:15,19`) onto
  `white/15` hairlines for consistency with the rest of the chrome.

### 3.2 Typography — own a type ramp  ❌ P0
**Current:** no `font-family` anywhere in the lib (grep: 0 hits); only `text-xs/sm/base/lg/xl` +
`font-medium/semibold/bold`. The editor inherits whatever the host's body font is.

**Why it fails the bar:** the rubric explicitly bans the default web stack (Inter/Roboto/Arial/Helvetica).
Inheriting an unspecified stack means the tool can render in a banned font with no recourse, and there's
no deliberate hierarchy (numerics in sliders, labels, modal titles all share one undifferentiated ramp).

**Do:**
- Adopt the product's display/grotesk token (e.g. a `font-sans` mapped to Geist / Plus Jakarta Sans at
  the app level) and reference it in the lib's root container, not per-component.
- Define a small semantic ramp: `text-[11px] tracking-[0.16em] uppercase` for toolbar/section labels,
  `text-sm` for controls, `text-base font-semibold` for modal titles. Apply `tabular-nums` to slider
  read-outs (`SliderWithIndicator.tsx`) and dimension fields (`BlankCanvasModal`) so numbers don't jitter.

### 3.3 Radii — collapse to a concentric scale  ⚠️ P1
**Current:** `rounded-sm / md / lg / xl / 2xl / full` all appear, with no parent→child relationship
(e.g. `rounded-2xl` card at `PageDraw.tsx:1123`, `rounded-xl` panels in SideToolbar, `rounded-lg`
buttons in InpaintToolBar).

**Do:** pick a 3-step system — **`rounded-2xl` shells, `rounded-xl` inner cards, `rounded-lg` controls,
`rounded-full` pills** — and apply concentrically (the "double-bezel" curve math: inner radius =
outer − padding). Drop `rounded-sm`/`rounded-md` from the editor entirely.

### 3.4 Surfaces — add the "machined" double-bezel  ⚠️ P1
**Current:** panels are a single `bg-ui-panel` + `border` + `shadow-lg`. No nested enclosure, no inset
top-highlight. Reads flat.

**Do (for the four floating panels — SideToolbar, HistoryStack, PromptEditor, InpaintToolBar):**
- Outer shell: `bg-ui-panel/80 ring-1 ring-white/10 backdrop-blur-xl p-1.5 rounded-2xl`.
- Inner core: own bg + `shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-xl`.
- This is the single change that most moves the surface from "tool" to "premium hardware." The panels are
  already `fixed` (`PageDraw.tsx:1144,1175,1195`), so `backdrop-blur` here is GPU-safe per the perf rules.

### 3.5 Motion — replace linear/ease with spring-eased micro-motion  ❌ P0 (cheap, high impact)
**Current:** `transition-colors`/`transition-all` with `ease-in-out` and `duration-75/150/200`
(`SideToolbar.tsx:381,550`, `SliderWithIndicator.tsx:65`, `ContextMenu.tsx:53`). No custom easing,
no entrance/exit on popovers, color pickers, or the context menu (they pop instantly).

**Why it fails the bar:** instant state changes and `ease-in-out` are explicitly banned. A pro tool still
deserves *interpolated* motion — it's what separates Figma from a jQuery plugin.

**Do:**
- Standardize on one curve: `transition-[transform,opacity,background-color] duration-300
  ease-[cubic-bezier(0.32,0.72,0,1)]`.
- Tool buttons: `active:scale-[0.97]` press physics; selected tool gets a spring-eased indicator slide
  rather than a hard background swap.
- Popovers / color picker / context menu: animate in with `opacity-0 translate-y-1 scale-[0.98]` →
  resolved, ~180ms. Transform+opacity only (perf rule).
- History tiles: stagger their `opacity` reveal when a generation lands (they already use
  `transition-opacity`, just add per-index delay).

### 3.6 Layout & z-index — tame the stack  ⚠️ P1
**Current:** clean fixed-panel composition, but z-index is ad-hoc across 6 tiers and includes a
`z-[9999999]` on the context menu (`ContextMenu.tsx:44`) and a one-off `z-[60]` (`PageDraw.tsx:237`).

**Do:** define a named scale in one place — `canvas:0, chrome:10, floating-controls:20, overlay-button:40,
menu:50` — and replace the magic numbers. The portal menu only needs to clear the chrome, not `9999999`.

### 3.7 Responsive — declare intent  ⚠️ P2
**Current:** essentially desktop-only; fixed sidebars assume a wide viewport; only LightboxDetails has
`sm:` variants. The webapp wrapper scopes the lib correctly (`pagedraw.tsx` `translateZ(0)` containing
block) but there's no mobile story.

**Do:** mirror the Edit-3D page's explicit **mobile gate** (`pagescene.tsx` `MobileGate`) on `/edit-image`
rather than letting fixed toolbars overlap on touch. A precision canvas tool is legitimately desktop-first;
just say so deliberately instead of degrading silently.

---

## 4. Architecture notes

- **Oversized modules.** `PaintSurface.tsx` (2005 LOC), `SceneState.ts` (1539), `PageDraw.tsx` (1292).
  These are review/maintenance hotspots. Suggest extracting from `SceneState.ts`: history/undo slice,
  base-image-load slice, and generation/pending slice into composable Zustand slices. `PageDraw.tsx`'s
  generate-flow (cases 1–3, ~780–868) could move to a `useGenerate()` hook.
- **Theme ownership.** Per §3.1, the lib should *only* consume tokens. Today it mixes tokens + hex, which
  defeats the adapter pattern's promise (one component, many themed hosts).
- **Adapter surface is healthy.** `PageDrawAdapter` is small and intentional; the web vs. Tauri split is
  clean. The webapp's `enqueueInpaint` stub and 402→credits-modal handling are explicit and documented.
- **Icon weight.** FontAwesome **solid** is the heaviest option; if a line/light set is available
  (Phosphor/Remix or FA light), the toolbar would read more refined. Low priority.

---

## 5. Prioritized roadmap

| P | Item | Effort | Payoff |
|---|---|---|---|
| **P0** | Token sweep: kill hardcoded greys; unify accent on `--primary` (§3.1) | M | Highest — enables true theming + product-consistent accent |
| **P0** | Own a font-family + semantic type ramp at the lib root (§3.2) | S | High — removes banned-font risk, adds hierarchy |
| **P0** | One custom easing curve + press/popover micro-motion (§3.5) | S | High — cheapest "feels expensive" win |
| **P1** | Double-bezel + inset highlights on the 4 floating panels (§3.4) | M | High — "machined" surface upgrade |
| **P1** | Concentric 3-step radius system (§3.3) | S | Medium — visual coherence |
| **P1** | Named z-index scale; remove `z-[9999999]` (§3.6) | S | Medium — maintainability |
| **P2** | Explicit mobile gate on `/edit-image` (§3.7) | S | Medium — correctness on touch |
| **P2** | Split `SceneState.ts` / `PaintSurface.tsx` into slices (§4) | L | Medium — maintainability |

---

## 6. Appendix — proposed token additions

```css
/* canvas + chrome surface ramp (lib should consume only these) */
--st-canvas:        <theme>;   /* replaces #1b1b1b pegboard */
--st-accent:        var(--primary);        /* replaces blue-600/500 */
--st-hairline:      rgb(255 255 255 / 0.10);
--st-inset-hi:      inset 0 1px 0 rgb(255 255 255 / 0.08);

/* motion */
--st-ease:          cubic-bezier(0.32, 0.72, 0, 1);
--st-dur-fast:      180ms;
--st-dur:           300ms;

/* radius scale (concentric) */
--st-r-shell:       1.25rem;  /* rounded-2xl */
--st-r-card:        0.875rem; /* rounded-xl  */
--st-r-control:     0.5rem;   /* rounded-lg  */
```

> Scope note: every recommendation here is **styling/architecture only** — none change the generate,
> polling, upload, bg-removal, or adapter contracts validated during the functional debug pass.
