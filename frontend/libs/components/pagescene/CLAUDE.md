# CLAUDE.md — pagescene (3D Scene Editor)

Guidance for working in the `pagescene` library — the 3D editor (a.k.a. "pagescene" / "Stage3D").

## ⚠️ Engine-canvas mounting invariant (footgun)

`EngineProvider`'s editor-construction effect depends on three DOM nodes: `sceneContainer`,
`editorCanvas`, and **`camViewCanvas`** (owned by `PreviewEngineCamera` → `CameraViewCanvas`).
If ANY of these unmounts, the effect tears down + recreates the whole `Editor` (serializing to
cache, then reloading) — which wipes a fresh/unsaved scene. **Never conditionally unmount the
components that host these canvases** (`SceneContainer`, `EditorCanvas`, `PreviewEngineCamera`)
for mode/chrome gating — hide them with CSS (`hidden`) instead. (Regression fixed: record mode
had gated `PreviewEngineCamera` behind `!isRecord`, wiping the scene on record→build toggle.)

## Behavior notes (fixes)

- **Record mode is fully immutable.** The viewport lock (`CameraController.locked`, set by the
  record effect) gates every camera-move path: FreeCam drag/wheel/keyboard (`useFreeCam`),
  FreeCam integration (`tickPerFrame`), AND `MouseControls` mouse-look + `focus()` (gated via
  `MouseControlsDeps.isViewportLocked`). If you add a new camera-move path, gate it on `locked`.
- **Default camera framing** (`DEFAULT_CAMERAS.main`): a Blender-style pulled-back/elevated 3/4
  view (`pos (-4.5,4,6)`, `lookAt (0,0.5,0.6)`) so the whole render-camera (`cam2`) frustum is
  visible on a blank scene.
- **Auto-keyframe**: mutating an **already-keyframed** object (gizmo drag-end or inspector commit)
  calls `TimelineController.autoKeyIfTracked(uuid)` → `addKeyframe` at the playhead, which
  replace-or-creates a keyframe at the current scrub point. No-op for never-keyframed objects
  (first keyframe is always explicit).

## Architecture (existing, do not rebuild)

Strict one-way data flow. Do not violate it.

```
Three.js engine  →  typed event bus  →  EngineStoreBridge  →  Zustand store  →  React  →  actions  →  engine methods
```

- **`Stage3D.tsx`** — public entry component; takes an `adapter` + optional slots/callbacks.
- **`Stage3DBody.tsx`** — layout composition (canvas, panels, toolbars, modals). Mounts the external `PromptBox3D`.
- **`PageSceneStore.ts`** — the single Zustand store (~60 fields). All UI state. The engine never imports this store.
- **`adapter.ts`** — platform-abstraction interface. All host-specific logic (HTTP, upload, auth, navigation, modals) flows through `PageSceneAdapter`. Hosts (Tauri app, web app) inject it at mount.
- **`comps/Controls3D/Controls3D.tsx`** — top-center toolbar: `+` add, Move/Rotate/Scale (`transformMode`), World/Local (`transformSpace`).
- **`comps/Outliner/Outliner.tsx`** — left "Scene" panel (code name: Outliner). Driven by `outlinerItems`; each `OutlinerRow` has lock + visibility toggles.
- **`engine/editor.ts`** — main `Editor` class; owns subsystems (GizmoController, CameraController, HistoryManager, SelectionBridge) and the prompt text (`editor.positive_prompt`).
- **Undo/redo** — `HistoryManager` + command-pattern `UndoableAction` classes. Every mutation that should be undoable records an action.

Key boundary: the **bottom prompt bar is NOT in this library**. It is `PromptBox3D` from the external `@storyteller/ui-promptbox` package, mounted by `Stage3DBody`. Anything that changes the prompt bar crosses the pagescene ↔ ui-promptbox boundary.

---

## Feature: Scene Builder (IN PROGRESS — branch `feature/scene-builder`)

Status: **spec / in development.** This section describes intended behavior; not all of it is built yet. Images referenced are from Figma design frames.

### Top-level mode pill (net-new)

A segmented toggle at top-center (above the `Controls3D` toolbar) with two modes:

- **Build** — default. Scene composition/layout. Used unless the user switches.
- **Record** — read-only playback/output mode (see below).

Rule: a scene with **no animations/keyframes (static)** defaults to **Build**.

This mode does not exist in code today. It needs a new store field (e.g. `sceneMode: "build" | "record"`) and a new component rendered in `Stage3DBody`. Distinct from the existing `editorState` enum (`EDIT` | `CAMERA_VIEW`), which is a different axis — don't overload it.

### Launch re-scope — drop promptbox, lightbox handoff, editable duration

- **Promptbox removed**: `SceneBuilderPromptBox` deleted (MCP not ready). The **animation
  timeline** is the sole build-mode bottom UI: collapsed `TimelineBar` by default, expanded
  `TimelineEditor` via chevron. An empty timeline is auto-created on editor init
  (`editor.timelineController.create()`), so the bar is always functional (no "Add timeline"
  button). Auto-expands once on load when `timelineTracks.length > 0` or
  `editor.sceneHasAnimation()` (imported THREE clips).
- **Editable max duration**: `TimelineController.setDuration(s)` (clamped `[1,60]`, covers 5–30s) +
  `comps/Timeline/DurationLabel.tsx` (click the total-time → number input). Persists via `getTimeline`.
- **Capture/Record → review modal (appears first) → app Lightbox**:
  - `CompletionModal` opens **immediately** for both kinds (`producedArtifact`) with a **local
    preview** (object URL, works offline) + upload status. Images **auto-upload** on open; videos
    show a manual **Upload** button (large). On success → `adapter.openMediaLightbox(token, kind)`
    (destinations) + close; on failure → **Retry** (so the modal is always visible even when the
    upload API is unreachable in dev). The modal — not `RenderOverlay` — owns the upload.
  - `RecordControls`: Capture → produce image `producedArtifact`; Record → encode (overlay) →
    produce video `producedArtifact`.
  - Adapter: `openMediaLightbox(token, kind)` (host resolves cdnUrl via `MediaFilesApi` and renders
    the app `<Lightbox>`); `uploadMedia` kept; `openImageInEditor`/`openVideoInEditor` **removed**
    (the Lightbox owns destination routing — Edit-on-Canvas/Make-Video/Recreate/Share/Download).
  - Uploading first means the Lightbox gets a real token + cdnUrl → its actions route correctly
    (retires the earlier blob/data-URL handoff fragility).

### Spec revision — 3D delegates generation to 2D/Video (branch `feature/scene-builder`)

The 3D editor no longer generates. It composes; 2D (pagedraw) and the video experiences generate.

- **Build promptbox is now the scene-builder/MCP tool only** — `comps/SceneBuilderPromptBox/`
  replaced `PromptBox3D` in `Stage3DBody` (the Manual/Prompted toggle + `buildMode` store field are
  gone; `PromptBox3D` is no longer mounted by 3D). Update is still an MCP stub (records prompt +
  history on the engine). Hosts the collapsed `TimelineBar` + Add-animation-timeline affordance.
- **Record mode = Capture (still) / Record (timeline → video)**:
  - `engine/recording/TimelineRecorder.ts` — deterministic `seekTo`→`renderScene`→`CanvasSource.add`
    encode via **mediabunny** (already a dep). Capture reuses `snapShotOfCurrentFrame(false)`.
  - `comps/RenderOverlay/` (opaque `LoadingDots` + progress) covers the viewport while encoding.
  - Output cached locally as `producedArtifact` in the store (`{kind, blob, objectUrl, ...}`) — no
    upload from 3D.
- **`comps/CompletionModal/`** — preview hub: image full-preview / video playback + **Delete**
  (revokes URL), **Upload** (`adapter.uploadMedia` → library token), **Edit** → 2D for images,
  Create-Video / Video-editor for videos.
- **Adapter handoff (new)** in `adapter.ts`: `openImageInEditor`, `openVideoInEditor(target)`,
  `uploadMedia` + `PageSceneArtifact`. Host-wired in `apps/artcraft-webapp/.../pagescene` :
  image → eager-upload + `applyEditOnCanvasFromImage` (`/edit-image`); video "generate" →
  `useCreateVideoStore.setPendingRecreate` reference-video (lazy upload at generate, `/create-video`);
  video "edit" → upload + `/video-editor` (TODO: auto-drop on timeline).
- **Camera-view regression fixes** (Phase 0): Esc + viewport double-click exit; double-click the
  frustum to enter; robust enter/exit pose handling (removed the dead `hot_items` toggle);
  frustum **pick-proxy mesh** (line raycasting disabled) so selection matches the wireframe;
  `CameraStatusPill` (top-left) shows Viewport vs render-camera and toggles.

Deferred: real MCP backend; pagedraw file-only (lazy) base image; video-editor timeline
auto-import; audio in recordings; `snapShotOfCurrentFrame` render-camera reconciliation.

### Persistence + undo (timeline & split camera)

- **Timeline persists in scene JSON**: `save_manager.getSceneJson` now writes `timeline:
  getTimeline() ?? null` (was a `""` stub); `loadFromJson` restores via `loadTimeline` (guards
  legacy `""`/null). Flows through both backend save and the unmount→cache→remount roundtrip.
  Loaded objects keep their saved `object_uuid` (proxy load, `obj.uuid = json_object.object_uuid`),
  so timeline tracks (keyed by uuid) resolve.
- **Render camera persists**: at save, the render-camera entry in `cameras[]` is overridden with the
  **live `::CAM::` transform** (`getRenderCameraTransform` dep) so it reflects gizmo moves (the store
  config otherwise goes stale). The load path strips `::CAM::` and never recreated it — fixed:
  `loadFromJson` calls `recreateCameraObject()` (→ `Scene._create_camera_obj()`, now idempotent)
  AFTER `CamerasReplacedEvent`, so the frustum lands at the restored transform. This also fixes the
  standalone "load loses the render camera" bug.
- **Undo/redo**: timeline is **transactional** — `Save` is one undo step (`SaveTimelineAction`;
  `loadTimeline` re-seeks + emits on undo/redo); `Cancel` reverts to last saved (not history).
  Render-camera gizmo moves were already undoable (`TransformAction` on `::CAM::`, no special-casing);
  because save reads the live `cam_obj`, a save after an undo persists the undone position.
  Per-edit timeline undo remains deferred.

### Implementation status (branch `feature/scene-builder`)

- **DONE — Build/Record pill**: `comps/SceneModePill/` (reuses `@storyteller/ui-tab-selector`), mounted above `Controls3D` in `Stage3DBody`. Store: `sceneMode` (default `build`) + `setSceneMode`.
- **DONE — Manual/Prompted toggle + prompted layout**: store `buildMode: "manual" | "prompted"` (default `manual`) + `setBuildMode`. The toggle + prompted layout live in `PromptBox3D` (`@storyteller/ui-promptbox`), gated by a new optional `buildMode` / `onBuildModeChange` / `onAddTimeline` prop trio passed from `Stage3DBody`. Toggle = a `ButtonIconSelect` (Manual = pointer icon, Prompted = wand-sparkles) in a floating glass pill above the prompt card. Prompted layout hides the manual toolbar and shows: textarea + "Add animation timeline" (`onAddTimeline`, stubbed) + prompt-history popover (`usePrompt3DStore.promptHistory`) + **Update**. `handlePromptedUpdate` is a **stub**: records the prompt on the engine + pushes to history + toasts; it does NOT call the MCP backend yet.
- **DONE — Animation timeline (in-memory)**: keyframe system + playback + full UI.
  - Data model: `engine/timeline/types.ts` (`Keyframe`/`TimelineTrack`/`TimelineData`, `EasingSpec` = cubic-bezier ctrl pts, presets) + `interpolation.ts` (`cubicBezierYForX`, `sampleTrackAt`). Reuses `TransformSnap`/`snapshotTransform`/`writeTransform`.
  - `engine/editor/TimelineController.ts` owns the timeline; ticked in `editor.ts` `renderSingleFrame()` after `entranceAnimator`. **Writes transforms only while playing or on seek** (idle never touches objects, so manual editing is safe).
  - Events `TimelineChangedEvent`/`TimelinePlayheadEvent` → `EngineStoreBridge` → store fields (`timelineExists/Expanded/Playhead/IsPlaying/Duration/Tracks/SelectedKeyframeId`). Dispatchers in `actions/timeline.ts`.
  - Undo: `engine/editor/actions/SaveTimelineAction.ts`; `Save` records it, `Cancel` reverts to last saved.
  - UI in `comps/Timeline/`: `TimelineBar` (collapsed, via promptbox `aboveStackSlot`), `TimelineEditor` (expanded, replaces the prompt box; `Stage3DBody` hides `PromptBox3D` when `timelineExpanded`), `TimelineTrackRow` (diamonds, drag, add), `MotionPopover` (presets + draggable cubic-bezier). `onAddTimeline` → `createTimeline` + expand; `showAddTimelineButton={!timelineExists}` hides the promptbox button once a timeline exists.
  - **In-memory only** — not persisted to scene JSON yet (reload clears). Rotation is euler-lerped (quaternion slerp is a possible refinement). Camera track is absent until the camera-split slice creates `::CAM::`.
- **DONE — Camera split (single camera) + camera view**: the render camera is now a selectable
  wireframe-frustum placeholder in the scene.
  - `scene.ts` `_create_camera_obj()` rewritten to build a `THREE.Group` named `"::CAM::"` (line
    frustum, layer 1 = editor-only/excluded from render), positioned at the first non-`main`
    store camera; called in `initialize()`/`clear()`; `refreshCamObj` resolves it. No
    `userData.media_id` → the save path (`saveToScene`, which only serializes `media_id` children)
    skips it, so scenes aren't corrupted.
  - Enter/exit camera view reuses the existing `CameraController.switchCameraView()` +
    `tickPerFrame` sync (canvas renders through the viewport camera, which is moved to the render
    camera — no render-path change). Trigger: new `CameraViewToggleRequestedEvent` → `editor.ts`
    subscription → `switchCameraView()`. Emitted by (a) `scene_manager_api.ts` `double_click()`
    when the selected object is `::CAM::` (covers viewport + outliner-row double-click), and
    (b) `actions/cameraView.ts` `toggleCameraView` (outliner icon + exit button).
  - Outliner: `OutlinerItem.isCamera` (set in `convert_object`) → `Outliner.tsx` renders a
    view-from-camera button (`faArrowRightToBracket`) left of the lock icon.
  - `comps/ExitCameraView/` shows the "EXIT CAMERA VIEW" pill while `editorState === CAMERA_VIEW`.
- **DONE — Record mode**: `sceneMode === "record"` is read-only playback through the render camera.
  - `Stage3DBody` effect on `isRecord`: `cameraController.enterCameraView()` + `setLocked(true)` on
    entry; `setLocked(false)` + `exitCameraView()` on exit. `switchCameraView()` was refactored into
    idempotent `enterCameraView()`/`exitCameraView()`; new `CameraController.locked` gates the
    FreeCam integration in `tickPerFrame` (viewport can't be flown in record).
  - Build chrome hidden in record (ControlsTopButtons, Controls3D, top-right cluster, Outliner,
    PreviewEngineCamera, ControlPanelSceneObject, PromptBox3D, TimelineEditor). The **mode pill
    stays**. `ExitCameraView` is suppressed in record (the pill leaves record).
  - `comps/RecordControls/`: bottom-center read-only `TimelineBar` (`readOnly` hides the expand
    chevron — playback only, no editing) + **Capture** (`editor.snapShotOfCurrentFrame(true)` — still
    image download) and **Record** (red; **stub** — no video pipeline in pagescene yet).
- **NOT STARTED**: timeline persistence to scene JSON; natural-language motion clips; multi-camera;
  render-camera transform round-trip to store `cameras[]`; **video render behind the Record button**;
  the record-mode "expand timeline into a grayed-out read-only editor" (currently the expand chevron
  is simply hidden in record).

### Feature: Mixamo animation clips on the timeline (IN PROGRESS)

Characters can carry skeletal (Mixamo) animation clips on the timeline, alongside the transform-
keyframe tracks. Answers locked with the user: retarget onto the character's skeleton; clips +
keyframes coexist; default clip source = the 37 curated demo clips. **Playback is sequential, one
clip at a time** — a character's clips live on a **single row** and cannot overlap (see the overlap
guard below). The earlier "stacked lanes" idea was dropped: stacking only pays off for *additive
layering* (e.g. a base walk + an upper-body wave playing together), which needs per-lane weights +
bone masking and is out of scope. If layering is ever wanted, that's the feature to build; until
then one row per character is the right model.

- **Data model (phase A, done)**: `engine/timeline/types.ts` — `ClipStrip` (`sourceMediaId`,
  `startTime`, `duration`, `loop`) + `ClipLane` (`objectUuid`, `strip`); `TimelineData.clipLanes[]`.
  Only the reference + placement is serialized; the `AnimationClip` is resolved at runtime.
  `TimelineController` has `addClipLane` / `moveClipLane` / `removeClipLane` / `clipLanesFor`;
  `TimelineChangedEvent` carries `clipLanes` → store `timelineClipLanes`. Persists via the existing
  `getTimeline`/`loadTimeline` (rides `TimelineData`).
- **Playback engine (phase B, done — UNVERIFIED at runtime)**: `engine/animation/CharacterAnimationManager.ts`.
  One `THREE.AnimationMixer` per character; each lane → an `AnimationAction`. Playhead-driven +
  **deterministic**: on every `TimelineController.evaluate()` it sets each action's absolute `time`
  from the playhead (paused actions) then `mixer.update(0)` — scrub, play, and frame-accurate record
  all pose identically. `syncClipLanes()` reconciles the runtime on every clip-lane change; a
  monotonic load token guards against superseded async clip loads. Clips are loaded via
  `Scene.loadRawGlb(media_id)` (raw GLTF, not added to the scene) and bound **by node name** —
  relies on the shared `mixorig:*` naming so a clip's tracks resolve against the character's bones
  directly (direct-bind first; `SkeletonUtils.retargetClip` is the documented fallback if a rig uses
  different bone names — **not yet wired**, pending the runtime spike).
- **Trigger UI (done)**: `comps/AnimationsDrawer/` — right-docked, only when a character is
  selected (build mode; hidden via CSS in record). Clips are **click-to-add** (drops at the playhead)
  **and draggable** onto the timeline (`ANIMATION_CLIP_MIME` payload `{media_id, name}`).
- **Timeline clip UI (phase C, done)**: `comps/Timeline/TimelineClipRow.tsx` renders **one row per
  character** (rendered even when empty, as a drop hint) holding all that character's strips
  end-to-end under its keyframe row in `TimelineEditor`. Strip body drags to **move**
  (`moveClipLane`), the right edge drags to **trim** length (`resizeClipLane`), a loop chip toggles
  repeat (`setClipLoop`), the × removes it (`removeClipLane`). Each character row is a **drop target**
  for clip drags (`dropClipOnCharacter` → `addClipToCharacter(…, atTime)`, time from the ruler rect).
  Non-character rows ignore clip drags. No per-op undo by design — clip edits ride the timeline
  **Save/Cancel** session exactly like keyframes (`cancel()` restores + re-syncs).
- **Overlap guard (single row)**: `TimelineController.resolveFreeStart` snaps add/move to the nearest
  gap so a character's strips never overlap; `nextStartAfter` bounds trim (`resizeClipLane`) and
  auto-length (`resolveClipDuration`) against the following clip. `evaluateAt` then has at most one
  active clip at any playhead, so playback is an unambiguous sequence (a gap between strips falls
  back to the bind/T-pose — position strips edge-to-edge to avoid it).
- **Real clip length (fix, done)**: a fresh drop seeds `strip.duration` with a placeholder and flags
  `autoDuration`; when the GLB loads, `CharacterAnimationManager` calls
  `TimelineController.resolveClipDuration(laneId, clip.duration)` to adopt the clip's true length
  (and re-clamp start). A user trim clears `autoDuration` so the natural length never clobbers a
  hand-set duration on reload.
- **Rig-mismatch diagnostic**: `CharacterAnimationManager.clipBindsToCharacter` warns (console) when
  a clip's tracks resolve to **0** nodes on the character — the signal that `SkeletonUtils.retargetClip`
  is needed. Retarget itself is still **not wired** (direct-bind first).
- **⚠️ Runtime unknown to verify**: whether the demo clips and character rigs share `mixamorig:*`
  bone names (→ direct bind works) or need retargeting. Drop/scrub a clip and watch for motion (and
  the console warn) to decide whether to wire the retarget fallback.

### ⚠️ Unverified — compiles but NOT runtime-tested

Everything in slices 1–3 has been validated **only** by `tsc -b` (both `pagescene` and
`promptbox` exit 0). The app has **not** been launched; no visual, behavioral, lint, or test
verification has been done. Outstanding items to verify live:

- **Slice 1 (pill)**: placement/spacing above `Controls3D` (possible double `pt-3`); white-active
  styling vs Figma; that clicking actually flips `sceneMode`.
- **Slice 2 (prompted)**: Manual/Prompted toggle renders/positions correctly above the card;
  prompted layout hides the toolbar and shows textbox + add-timeline + history + Update; Update
  stub toasts + records history; history popover lists/restores prompts; toggle only appears when
  the host wires `onBuildModeChange`.
- **Slice 3 (timeline)**: nothing behaviorally verified — playback actually interpolates objects;
  scrub/seek updates transforms; add/move/delete keyframes; Save+undo / Cancel; collapsed bar
  positioning via `aboveStackSlot`; expanded editor replacing the prompt box; **playhead-line
  alignment** (the `LANE_LEFT=8.75rem`/`LANE_RIGHT=2.5rem` offsets are hand-computed guesses);
  `MotionPopover` bezier drag coordinate math + popover anchoring; range-scrubber styling; euler
  rotation lerp quality; the assumption that the render loop stays alive during playback
  (`shouldRender`); "selected object gets an empty track row" behavior.

- **Slice 4 (camera split)**: nothing runtime-verified — that the frustum appears at the render
  camera and is excluded from the render; that selecting/moving it moves the render framing;
  double-click (viewport + outliner row) and the outliner icon enter camera view; the aspect
  frame + focal label show in camera view; EXIT returns to the prior free-cam position; the
  frustum is/ isn't viewport-click-selectable (**may need `raycaster.layers.enable(1)`** in
  MouseControls — outliner selection works regardless); `::CAM::` really is skipped by save.

- **Slice 5 (record mode)**: nothing runtime-verified — that switching the pill to Record enters a
  locked render-camera view (viewport truly can't be flown), hides all build chrome but keeps the
  pill, and shows the read-only playback bar + Capture/Record; that Capture downloads the composed
  frame; that switching back to Build restores the prior free-cam view and chrome; interaction
  between record and a manually-entered camera view; whether `switchCameraView` refactor (idempotent
  enter/exit) preserved the original toggle behavior. Record button is a **no-op stub**.

Treat all of the above as needing a live pass before shipping.

### Build mode has two usability sub-modes

- **Manual** — identical to current behavior. User manually moves/places/transforms objects with the gizmo and toolbar. This is what exists today.
- **Prompted (Builder)** — the prompt bar changes to show only:
  - a text box,
  - an **"Add animation timeline"** button,
  - a **history** button (previous prompts),
  - an **"Update"** primary button.

  Prompted mode drives a **JSON-style, MCP-esque backend integration** (in development). The flow: an LLM (e.g. Claude) reads the scene's **scene-descriptor data** + the user's prompt, makes edits, **outputs a new scene descriptor**, which is then applied to the 3D scene.

  The **"Add animation timeline"** button only appears when the scene is **static** (no keyframes/animations on any object). Clicking it reveals the animation timeline bar (see below).

### Animation timeline

**Collapsed state** (a slim bar that sits above the prompt box, replacing the "Add animation timeline" button once a timeline exists):
- ▶ play/pause · current-time readout (`0:00`) · scrubber (blue fill to playhead) · total duration (`0:10`) · **chevron ▾**.
- The **chevron ▾ expands the timeline downward, collapsing the prompt box** (they trade vertical space).

**Expanded state** (full multi-track keyframe editor):
- **Transport (top-left):** skip-to-start ⏮ · play ▶ · skip-to-end ⏭.
- **Time ruler** with a draggable **playhead** (`0:00 … 0:04 … 0:10`).
- **One track per object.** A track can hold either:
  - **Diamond keyframes** — each diamond stores the object's **full transform (position, rotation, scale)** at that moment. Tapping a diamond jumps the playhead to it. Each row has an "add keyframe" diamond button at its right edge.
  - **Natural-language motion clip** — a text clip spanning a time range (e.g. *"walks to car - opens door - gets in"*) that drives generated motion.
  - **Any object can have either type.** For simplicity, an early version may show only raw keyframes and drop the natural-language grouping.
- **Motion popover** — appears when a keyframe is selected; edits the **easing/interpolation curve into the next keyframe**. Contains ~4 **easing presets** at top plus a large **editable bezier curve** with draggable **handles**; a **dotted line** shows the linear reference.
- **Cancel / Save** (bottom-right):
  - **Cancel** — drops all changes back to the last saved timeline state.
  - **Save** — commits the changes. **This is an undoable action** (record it via `HistoryManager` / an `UndoableAction`).

### Camera model change (Blender-style)

Introduce a distinction between:

- **Viewport (scene) camera** — what the user flies around with; the editing view.
- **Render camera(s)** — the camera(s) that define the final render output.

Render cameras become **objects within the 3D scene**: visible/selectable in the editor (with a camera gizmo/frustum, as in the Figma), but **excluded from the final render**. This mirrors professional 3D software (Blender).

Render cameras appear in the **Outliner** (left "Scene" panel). A camera row shows a **"view from camera"** icon positioned **right of the camera item's name and left of the lock icon** (visible in the reference frames). Clicking it **switches the viewport camera to the selected render camera** and lets the user control it with the usual navigation keybinds.

**This is the big architectural change** — but the engine is **already partially scaffolded** for it. Verify these anchors before building on them:

- **Two cameras already exist** in `engine/editor/CameraController.ts`: `camera` (viewport/free-fly, sees layer 1 incl. gizmos) and `render_camera` (layer 0 only, clean output, its own aspect ratio). Created in `editor.ts` `initialize()` from the store's camera configs.
- **`Camera` type** lives in `frontend/libs/common/src/lib/interfaces/Camera.ts`: `{ id, label, focalLength, position, rotation, lookAt }`. Store seeds two: `"main"` (Main View, viewport) and `"cam2"` (Camera 2, render). So the store models multiple camera *configs*, but only **one** `render_camera` THREE object is currently instantiated (first non-main).
- **Placeholder object `"::CAM::"`** is referenced throughout (`scene.getObjectByName("::CAM::")`, `CameraController.refreshCamObj`, layer 1 so it's editor-only/excluded from render) — **but `_create_camera_obj()` is commented out** in `scene.ts`, so no camera mesh is actually in the scene graph today. The Outliner already knows to render a `::CAM::` object as a "Camera" row (`scene_manager_api.ts` `convert_object`) — it just never appears because the object isn't created.
- **`CAMERA_VIEW` state** (`enums/EditorState.ts`) + `CameraController.switchCameraView()` already implement enter/exit: on enter it copies `cam_obj` transform → viewport camera, hides `cam_obj`/objects/gizmo; on exit it restores. **Caveat:** today it *repositions the single viewport camera* rather than truly swapping to render through a separate scene camera. `PreviewEngineCamera.tsx` + an unused `camViewCanvasEl` exist as a secondary preview surface.
- **Letterbox/aspect overlay** already built: `comps/SceneContainer/Letterbox.tsx` reads `cameraAspectRatio`, draws mattes, toggled via `editorLetterBox`. `CameraAspectRatio` enum + `getRenderDimensions()` map to pixel sizes.
- **Focal length** is per-camera (`Camera.focalLength`), converted via `CameraController.focalLengthToFov()`, applied per-frame in `tickPerFrame()`; `focalLengthDragging` tracks the slider. The `35mm` overlay label maps to this.
- **Render path**: `editor.ts` `renderScene()` renders `activeScene.scene` through `render_camera`; but `snapShotOfCurrentFrame()` currently snapshots through the **viewport** `camera`, not `render_camera` — reconcile so exports use the render camera.

**Gaps to close for the true split:** (1) actually create camera placeholder meshes as scene objects (uncomment/rework `_create_camera_obj`); (2) map `cameras: Camera[]` 1:1 to scene objects; (3) make `CAMERA_VIEW` swap which camera the viewport renders through (not just reposition one); (4) support N render cameras, not just the first non-main; (5) make cameras keyframeable timeline targets. Reconcile all of this with the existing `cameras[]` + `selectedCameraId` store state.

### Camera view

Entered by **double-clicking the camera placeholder in the viewport** or the **view-from-camera button in the outliner**. In this state the **viewport camera becomes the selected render camera** — the user flies it with the usual navigation keybinds, and that motion is what gets keyframed.

- **Framing overlay**: the render **aspect frame** with **rule-of-thirds** guides; everything **outside the frame is dimmed** (won't be captured).
- **Focal-length label** (e.g. `35mm`) shown top-left inside the frame. Editable; may become a keyframable value in the future.
- The camera's frustum is not drawn while looking through it.
- **Timeline filters to just the selected camera's track** while in camera view.
- **Selected keyframe** renders as a **blue diamond** (at the playhead); other keyframes are white.
- **Exit** via the **EXIT CAMERA VIEW** button (bottom-right), or **Esc** / **double-click out**. (The text button is a dev placeholder; a proper icon comes later.)

Camera keyframes store the camera's transform just like object keyframes (and later, potentially focal length).

### Record mode

Record mode is the **read-only output/preview** mode — practically **immutable**. It plays back the render timeline **as seen from the main render camera** only.

- **All build chrome is hidden**: no outliner, no transform toolbar, no prompt box, no gizmos.
- The **viewport is locked to the render camera** (no free-fly, no object/camera editing). Framing overlay (aspect frame, dimmed exterior) is shown.
- **The only interactive controls are play/pause and scrubber position.** Nothing in the scene can be mutated.
- The **chevron can still expand the timeline**, but it renders **grayed out / read-only** — no keyframe editing.
- Two actions:
  - **Capture** — export the **current frame as a still image**.
  - **Record** — render the **full animation to video**.

### Build ↔ Record relationship (summary of axes)

- **Top pill**: `sceneMode` = `build | record` (net-new).
- **Within Build**: a usability sub-mode = `manual | prompted`.
- **Camera view** is an orthogonal viewport state (looking through a render camera) available while editing — not a top-level mode.
- Keep these distinct from the pre-existing `editorState` (`EDIT | CAMERA_VIEW`) and `poseMode` (`select | pose`) fields; do not overload them.

### Notes / deferred

- **JSON scene descriptor / MCP backend contract** is out of scope for the UI work — the UI and other features can be built independently. The one thing that won't function until the backend lands is the **Update button in Prompted mode** (acceptable for dev).
- The **view-from-camera icon** is already shown in the reference frames (outliner, right of the camera name, left of the lock icon) — no separate spec needed.
- **EXIT CAMERA VIEW** text button is a dev placeholder; a proper icon comes later.
