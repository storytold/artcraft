# Investigation: Video page "Image Ref" attach silently fails

**Branch:** `fix/video-image-refs` (worktree off `origin/main`, created to avoid
interfering with agents on `qol/settings-keybinds`).
**Status:** Root cause not yet confirmed — diagnostics added, awaiting a runtime
reproduction. Read this top-to-bottom to resume.

---

## 1. Symptom (as reported)

On the **video page**, in the **"Image Ref"** section (reference mode), attaching a
reference image from the library fails:

- The gallery modal opens and **shows** images.
- An image can be **selected**, and confirming **closes the modal**.
- But the reference image **never appears** in the promptbox.
- **No error logs** are fired.

**Confirmed app:** the web app — **`artcraft-webapp`** (not the Tauri desktop app,
not `artcraft-website`). The three apps each have their *own* copy of the
prompt-box code, so only the webapp path matters here.

---

## 2. The webapp attach flow (all verified correct on `main`)

```
ImagePromptRow "Pick from library"
  → onPickFromLibrary → setIsImagePickerOpen(true)               [create-video.tsx]
  → <GalleryModal mode="select" .../>                            [create-video.tsx:1595]
      click an item → handleItemClick → onSelectItem(item.id)    [gallery-modal.tsx:1271]
        → handlePickerSelect → pickerSelectedIds += id           [create-video.tsx:804]
      "Use selected" → handleUseSelected                         [gallery-modal.tsx:1300]
        → Object.values(groupedItems).flat()
             .filter(i => selectedItemIds.includes(i.id))
        → onUseSelected(selectedItems)
  → handleLibraryImageSelect(items)                              [create-video.tsx:825]
        maxImages   = isReferenceMode ? (image_references_max ?? 3) : 1
        availableSlots = max(0, maxImages - referenceImages.length)
        newImages   = items.slice(0, availableSlots).map(... url: thumbnail||fullImage||"" ...)
        setReferenceImages([...referenceImages, ...newImages])   → store (setRefs)
  → ImagePromptRow re-renders referenceImages tiles             [prompt-box/ImagePromptRow.tsx]
```

### Key relevant files (webapp)
| Purpose | Path |
|---|---|
| Video page + attach handler | `frontend/apps/artcraft-webapp/src/pages/create-video/create-video.tsx` |
| Image-ref row UI (renders tiles) | `frontend/apps/artcraft-webapp/src/components/prompt-box/ImagePromptRow.tsx` |
| PromptBox wrapper | `frontend/apps/artcraft-webapp/src/components/prompt-box/PromptBox.tsx` |
| Refs store (`setRefs`) | `frontend/apps/artcraft-webapp/src/pages/create-video/create-video-store.ts` |
| Shared gallery modal | `frontend/libs/components/gallery-modal/src/lib/gallery-modal.tsx` |
| Drag lifecycle / stuck-signal | `frontend/libs/components/gallery-modal/src/lib/galleryDnd.ts` |
| Modal `contentInteractive`/`contentHidden` | `frontend/libs/components/modal/src/lib/modal.tsx` |

### What was checked and ruled OUT as a trivial logic bug
- **Happy-path logic is correct** end-to-end for a normal image. Selection ids
  match grouped-item ids; the handler maps and commits to the store; the store
  merge (`setRefs`) is correct; `ImagePromptRow` renders `referenceImages`.
- **`fullImage` is reliably populated:** it maps to `media_links.cdn_url`, which
  the Rust `MediaLinks` struct declares as a **required** `Url`
  (`crates/api_clients/artcraft/artcraft_api_defs/src/common/responses/media_links.rs:10`).
  So `url: thumbnail || fullImage || ""` won't produce an empty url for list items.
- **Branch vs main:** all the above webapp/lib files are **identical** between
  `origin/main` and `qol/settings-keybinds` — so the bug is on `main`, and this
  worktree reproduces the user's build.

Conclusion: this is a **runtime-specific failure that leaves no trace**, which is
why nothing logs.

---

## 3. Git archaeology — last code to touch the failure path

The attach logic and gallery selection/confirm core are **old & stable** (not the
regression):
- `handleLibraryImageSelect` — `11a2547beb` (#1503, 2026-05-12), one line `fa4776bb21` (#1532).
- `handleUseSelected` / `handleItemClick` — `f3b5a774` (2025-04), deps tweak `e8d88ca3` (2026-02).

**The only recent change to the actual click/visibility path:**

→ **`c5c68d301a` — "Webapp: Premium motion pass across app" (#1662), 2026-06-23.**

It wrapped the gallery `Modal` in new gating (`gallery-modal.tsx:2148`):
```jsx
contentInteractive={!galleryModalDraggingUnder.value}   // false ⇒ pointerEvents:"none"  (modal.tsx:915)
contentDimmed   ={galleryModalDraggingUnder.value &&  galleryReopenAfterDragSignal.value}  // ⇒ opacity 0.4
contentHidden   ={galleryModalDraggingUnder.value && !galleryReopenAfterDragSignal.value}  // ⇒ opacity 0   (modal.tsx:283)
```
(The newest commit on `gallery-modal.tsx` overall, `61a0880c80` #1661 Moodboard,
only changed the logged-out "Log in" button — not this path.)

### Concrete defect found inside #1662 (candidate root cause)

`galleryModalDraggingUnder` is a **global signal**. Its reset is conditional
(`galleryDnd.ts:273`):
```js
if (!closedHidden) {
  galleryModalDraggingUnder.value = false;   // SKIPPED when an image is dropped on
}                                            // canvas with "reopen after adding" OFF
```
When skipped the signal **stays `true`**, and — despite the code comment claiming
it is "reset on open" — **there is no reset-on-open anywhere**. Grep of every
usage: set `true` at `galleryDnd.ts:167`, set `false` only at `:274`, default
`false` (`galleryModalSignals.ts:11`). Nothing clears it when a modal opens.

A stuck-`true` value makes the **next** gallery to open (including the webapp's
image-ref picker, since the signal is global) render with `pointerEvents:none`
and/or `opacity:0`.

**Caveat (why this may not be the whole story):** triggering the stuck state
requires a *prior* drag-to-canvas with reopen-off. That doesn't cleanly match the
report that the gallery "shows and selects fine." So #1662 is unambiguously the
last code to touch this path and contains a real bug, but it is **not yet
confirmed** to be the exact cause of the reported symptom. Diagnostics (below)
will decide.

---

## 4. Diagnostics added in this commit (temporary — remove after)

Both marked `[IMGREF-DEBUG]`:

1. **`create-video.tsx` → `handleLibraryImageSelect`** — logs received item
   count + each item's `{id, fullImage, thumbnail, mediaClass}`, `isReferenceMode`,
   `maxImages`, `currentRefCount`, `availableSlots`, `newImageCount`, `nextRefCount`.
2. **`gallery-modal.tsx` → `handleUseSelected`** — logs `selectedItemIds`,
   `groupedFlatCount`, `matchedCount`, `hasOnUseSelected`.

A copy of the patch is also at (regenerate with `git diff` if lost):
`<scratchpad>/imgref-debug.patch`

### How to reproduce + capture
```
cd frontend
pnpm install
npx nx serve artcraft-webapp        # or the usual webapp dev command
```
DevTools console → filter `[IMGREF-DEBUG]` → video page → reference mode →
**Image Ref** → Pick from library → select 1 image → **Use selected**.

### Decision table (maps output → fault class)
| Console output | Root-cause class |
|---|---|
| **No `gallery.handleUseSelected` line at all** | Click never reaches handler — event/pointer interception. **Prime suspect: #1662 `contentInteractive`/`contentHidden` stuck via `galleryModalDraggingUnder`.** |
| `handleUseSelected` logs, `matchedCount: 0` | Selected ids don't match grouped items — selection-state bug. |
| `handleLibraryImageSelect` logs, `newImageCount: 0` | Slot math drops it — check `isReferenceMode`/`maxImages`/`image_references_max`. |
| Both log, `newImageCount ≥ 1`, `nextRefCount ≥ 1`, **but no tile** | Pure render/visibility bug — store updates but tile doesn't show. |

---

## 5. Candidate fix (if logs confirm the stuck-signal class)

Add a reset-on-open for the global signal so a stale `true` can't carry into the
next gallery open. Options:
- In `gallery-modal.tsx`, an effect: when the modal transitions to open
  (`isOpen` true / view-mode visible), set `galleryModalDraggingUnder.value = false`.
- Or unconditionally reset in `galleryDnd.ts` `onPointerUp` and instead drive the
  "stay faded through close" purely from the close animation (decouple the two
  concerns so cleanup is never skipped).

Verify after: drag an image to canvas with "reopen after adding" OFF, then open
the image-ref picker — it must be fully visible and interactive.

---

## 6. Resume checklist
- [ ] Run webapp from this worktree, capture `[IMGREF-DEBUG]` output.
- [ ] Match output to the §4 decision table → fault class.
- [ ] If stuck-signal: apply §5 fix. Else follow the matched class.
- [ ] Remove both `[IMGREF-DEBUG]` blocks before final PR.
- [ ] Manually verify the reference image appears in the promptbox after attach.
