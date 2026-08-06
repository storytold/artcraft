# PageScene Animations — Branch Handoff

Branch: `frontend/pagescene-animations` (forked from `main` @ `6329045350`, 2026-08-04).
Everything below is TypeScript-typechecked per-lib (`tsc -p <lib>/tsconfig.lib.json`); runtime
verification status is tracked in the checklist at the bottom. Drag-and-drop has had one manual
pass (confirmed working); most other surfaces have not been launched.

## What this branch does

Makes skeletal animations a first-class asset in the 3D editor (pagescene): browse them in the
asset drawer, drag them onto characters or the timeline with live rig-compatibility feedback,
play clips baked into uploaded models, preview animations everywhere models are previewed, and
upload Mixamo FBX files (with or without mesh) end to end.

## Commit map

| Commit       | What                                                                    |
|--------------|-------------------------------------------------------------------------|
| `7af3fb9856` | Animations tab in AssetModal; AnimationsDrawer retired                   |
| `1fcbc55780` | Pointer drag-and-drop with live rig-compatibility badge                  |
| `79d7ade8bc` | Baked-in clips on the timeline (+ clip-row eligibility widened)          |
| `142279414e` | Animation dropdown in Viewer3D + upload preview                          |
| `913905308e` | Clip fixes: vanishing character, 1 s strips, select-to-delete, undo      |
| `60251104e3` | FBX accepted at the picker, converted to GLB in-browser                  |
| `0942ec4804` | Nx tsconfig references for the new ui-select dependency                  |
| `d0c7b65a6e` | FBX conversion moved into a Web Worker (main-thread fallback)            |
| `8e51b6c524` | Explicit "Upload as Animation" toggle + required duration_millis         |
| `00ebeae10c` | User's uploaded animations merged into the Animations tab                |
| `e1c7a0c7b0` | Persistent skeleton-helper toggle in the outliner                        |
| `30f40c0ddb` | Previewer bone toggles + mesh-less framing/mixer-binding fixes           |
| `5f7ba7bbc5` | AnimationsModal (All/Presets/Uploaded) + timeline quality-of-life        |
| `d55735620a` | Timeline ruler tick marks + strip button spacing                         |
| `79875d8c76` | Upload animations from the AnimationsModal (initialCategory)             |
| *(this)*     | NodeHierarchyHelper: bone toggle works for converted mesh-less GLBs      |

## Features

### 1. Animations tab in the asset drawer (`AssetModal`)

- New left-rail section fed by `GET /v1/media_files/list_featured?filter_engine_categories=animation`
  (GLB/GLTF only — the clip loader is GLTF-based). Featured results REPLACE the 37 hardcoded
  `demoAnimationItems`; demos are only the empty-API fallback.
- The session user's own uploaded animations (`list/user`, same filter) render AHEAD of the
  featured set. Fetched on every modal open and after each upload; fails silently for anonymous
  users (`suppressErrorToast` on the user-media fetch path).
- Card click appends the clip to the selected character's row at the earliest free slot (toast
  when no character is selected or the row is full). The old right-docked `AnimationsDrawer` is
  deleted; the old HTML5-DnD path (`ANIMATION_CLIP_MIME`) is gone with it.

### 2. Drag-and-drop with rig-compatibility badge (`DndAsset`)

- Animation cards ride the same pointer-drag pipeline as every other asset. On drag start the
  clip's track node names are preloaded (`loadRawGlb`, cached per media id); hovering a
  character (or any skinned object) checks those names against its nodes — the exact direct-bind
  rule `CharacterAnimationManager` plays by. No retargeting (explicitly out of scope).
- The shared `DragGhost` shows the verdict: green check (binds) / red slash (no target or rig
  mismatch); nothing while the clip is still loading. Incompatible or slot-less drops are
  rejected with a toast.
- Drop targets: a character in the 3D scene (earliest free slot) or a timeline row
  (`data-clip-drop-uuid`; pointer-x → time via the `data-timeline-ruler` rect).

### 3. Timeline clips: behavior + UX

- **Strips default to 1 s** and the strip width is the authoritative play window
  (`LaneRuntime.stripDuration`): trimming genuinely cuts playback; loop repeats inside the
  strip; a non-loop strip wider than its clip freezes on the last frame. On load a strip only
  shrinks (clip shorter than default) — never grows.
- **Rest-pose in gaps**: `Skeleton.pose()` was replaced with a rest-pose snapshot captured at
  mixer creation (all nodes BELOW the object root; root excluded so gizmo/keyframes never snap
  back). `pose()` rebuilds bone locals from inverse bind matrices and mis-scales cm-rigs — that
  was the "character vanishes when moving a strip" bug.
- **Selection UX**: strips are click-to-select; × renders only on the selected strip;
  Del/Backspace deletes; removal is individually undoable (`RemoveClipLaneAction` — the one
  exception to clip edits riding the timeline Save/Cancel session).
- **Full rows reject adds**: `resolveFreeStart` returns null instead of accepting an
  overlapping clamp.

### 4. Baked-in clips

- `ClipStrip.bakedClipIndex` marks a strip sourced from the object's own `animations[]`
  (resolved synchronously — no media fetch). Objects with baked clips get a timeline clip row
  with a "+" picker listing them.
- Clip-row eligibility is wider than characters: any skinned object (creatures, rigged uploads)
  accepts animation drags (bind check gates); baked-only objects get a row for the picker.
- INVARIANT: baked clips are never removed from the THREE model. Removing a baked strip only
  unschedules it; the clip stays on `object.animations` and in the picker. Library strips stay
  fully removable.
- Outliner metadata (`hasSkeleton`, `bakedClips`) is computed in `convert_object` and refreshed
  after every GLB load (`SceneDeps.onGlbLoaded` → `refreshOutliner`).

### 5. Previewers (Viewer3D + upload preview)

- Both play baked clips: autoplay the first, dropdown with every clip + "T-pose (none)", hidden
  entirely for animation-less models.
- Both have a bone icon toggling a skeleton overlay — default ON when the model has no mesh
  (Mixamo "without skin" exports), so animation-only files are visible. The upload thumbnail
  snapshot then captures the skeleton render.
- The overlay adapts to the rig kind: real `THREE.Bone` joints get `THREE.SkeletonHelper`;
  mesh-less models whose joints re-imported as plain nodes get `NodeHierarchyHelper`
  (exported from `viewer-3d`) — GLTF only round-trips bone-ness through a *skin*, and a
  mesh-less export has no skin, so converted FBX animations lose `Bone`-ness entirely. The
  toggle shows for `hasBones || !hasMesh`.
- Latent bugs fixed: upload preview discarded `gltf.animations`; its child re-parenting loop
  skipped every other child (`scene.add` mutates the array mid-forEach); its mixer bound before
  the model entered the scene (silently played nothing); camera framing NaN'd on empty
  bounding boxes (now falls back to bone world positions); camera now fits once, not per-child.

### 6. FBX upload support

- The 3D uploader accepts `.fbx` and normalizes it at the door: `FBXLoader` → `GLTFExporter`
  → binary GLB with clips preserved. Runs in a dedicated Web Worker (transferred buffers, jobs
  naturally serialized); a broken worker environment falls back to the main thread. The raw FBX
  can never reach the backend — retry of a failed conversion re-converts.
- Caveats: embedded textures may not survive; units are exported as parsed (cm-scaled Mixamo
  rigs are not rescaled).

### 7. Upload as Animation

- Mutually exclusive checkbox next to "Upload as Character" → `engine_category=animation`.
  Mesh-less files preselect it (preview loader reports `hasMesh:false`); a user click always
  wins. Rig-type dropdown defaults to Mixamo (characters keep Mixamo ArKit first).
- The backend-required `maybe_duration_millis` is read from the longest clip at submit time;
  clip-less files are flagged and excluded client-side.

### 8. Outliner skeleton toggle (`SkeletonHelperController`)

- Bone icon on skinned rows toggles a persistent `SkeletonHelper` on LAYER 1 (editor-only —
  the render camera renders layer 0, so skeletons never appear in captures/recordings).
- Persists as `userData.skeletonVisible` through scene save/load (explicit restore in the proxy
  load path). Reconciliation rides `OutlinerRefreshedEvent` — add/delete/load/new-scene and the
  post-GLB-load refresh all funnel there.
- FK/pose-mode compatible: `PoseModeChangedEvent("pose")` suppresses the persistent helper for
  the posed character (FKHelper draws its own rig); exit restores it. The toggle state itself
  is never touched.

## Manual test checklist (outstanding)

- [ ] Prod data: does `list_featured?filter_engine_categories=animation` return rows? If yes
      they replace the demo clips in the tab; if empty, the 37 demos show.
- [ ] Clip→rig bind smoke test on shipped characters (runtime-unverified `mixamorig:*`
      assumption; a "bound 0 tracks" console warning means retargeting becomes the real task).
- [ ] Creature experiment: drag a clip onto a creature — badge should reflect bind result.
- [ ] Baked clips: "+" picker on an animated object's row; add/remove/re-add; save/reload
      persistence (the `object.animations` stash on load is gated on `auto_add` — statically
      unconfirmed for every load path).
- [ ] Clip UX round: strips at 1 s; trim semantics; select → ×/Del; undo/redo of removal;
      character stays visible when a strip moves off the playhead.
- [ ] FBX round trip: pick `.fbx` → converts (worker; check console for worker load failures —
      falls back to main thread) → skeleton visible + clip dropdown → Upload as Animation
      preselected → appears at front of Animations tab → drag onto character → plays.
- [ ] Converted-FBX scale: if placed objects come in ~100× too big, the converter needs a
      normalize-scale step.
- [ ] Outliner bone toggle: on/off, FK-mode enter/exit restore, save/reload persistence, and
      absence from Capture/Record output.
- [ ] Previewer dropdown + bone toggle across lightbox, media page, lightbox-modal,
      ImageTo3DExperience, upload modal.

## Landed since the original handoff

- **AnimationsModal** (was deferred — now built, `5f7ba7bbc5`/`79875d8c76`): standalone modal
  with All / Presets / Uploaded tabs, opened from an "Add Animation" button next to Enter Pose
  Mode and from the "+" add-asset menu. Adding a clip expands the timeline and scrolls to the
  character (`timelineRevealObjectUuid`); the modal closes after an add unless "Reopen after
  adding" is on. Its "Upload animation" button opens `UploadModal3D` with
  `initialCategory="animation"` (anonymous users get the signup prompt), landing on the
  Uploaded tab afterwards. `AssetModal`'s animations tab was folded into this.
- **Timeline QoL**: ruler tick marks (major/second/sub-tick), selected-object-only track
  filter, directional expand/collapse chevrons, thumbnail-less animation cards get an icon
  placeholder.

## Deferred (explicitly out of scope for this branch)

- **Split-screen preview window** (based on the `?output=` `DemoOutputOverlay`) — parked until
  explicit approval.
- **Retargeting** (`SkeletonUtils.retargetClip`) — too complex for now; mismatched rigs are
  simply rejected by the bind check.
- **Clip blending/layering** — one non-overlapping row per object, by design.

## Key files

| Area                | Files                                                                                     |
|---------------------|-------------------------------------------------------------------------------------------|
| Drawer tab          | `pagescene/src/lib/comps/AssetMenu/AssetModal.tsx`, `shared/ItemElement.tsx`               |
| Drag-and-drop       | `pagescene/src/lib/DragAndDrop/DndAsset.ts`, `gallery-modal/src/lib/DragGhost.tsx`         |
| Timeline data/engine| `pagescene/src/lib/engine/timeline/types.ts`, `engine/editor/TimelineController.ts`,       |
|                     | `engine/animation/CharacterAnimationManager.ts`, `engine/editor/actions/RemoveClipLaneAction.ts` |
| Timeline UI         | `pagescene/src/lib/comps/Timeline/TimelineEditor.tsx`, `TimelineClipRow.tsx`               |
| Skeleton toggle     | `pagescene/src/lib/engine/editor/SkeletonHelperController.ts`, `comps/Outliner/Outliner.tsx` |
| Previewers          | `viewer-3d/src/lib/viewer-3d.tsx`, `upload-modal/.../utilities/loadPreviewOnCanvas.ts`     |
| FBX + upload        | `upload-modal/.../utilities/convertFbxToGlb.ts` (+ `.worker.ts`), `UploadModal3D.tsx`,     |
|                     | `UploadFiles3D.tsx`, `utilities/readGlbAnimationDuration.ts`                               |

The pagescene `CLAUDE.md` "Mixamo animation clips" section has been kept current with these
changes and carries the same invariants in engine-doc form.
