# Continuity Report — QoL feature work

> Handoff doc to resume after a reboot. Two independent QoL feature branches were
> built this session, each off `main`, each pushed to origin. This file lives on
> `qol/settings-keybinds`. Delete before merge if undesired.

Last updated: 2026-06-24.

## How to resume

```bash
cd D:/Projects/Work/storyteller-rust/frontend
git checkout qol/settings-keybinds   # or qol/dnd-improvements
npm install                          # ensure new workspace libs are symlinked
npx nx sync                          # reconcile TS project references if prompted
```

Build/verify a lib or app: `npx nx build <project>` (e.g. `@storyteller/keybinds`,
`@storyteller/ui-pagescene`, `@frontend/artcraft-webapp`, `artcraft`).
Unit tests: `npx nx test @storyteller/keybinds`.

Repo facts that bit us before:
- Libs resolve via each lib's `package.json` `exports` + `tsconfig.base.json`
  `customConditions:["development"]` → `src`. New libs need `npx nx sync` to wire
  TS `references`; forgetting it breaks app typecheck.
- `zustand`, `three`, `konva`, `react*`, `@storyteller/*` are externalized in lib
  builds (`libs/shared-vite-config.ts`) — stores stay singletons.
- The repo-wide `typecheck` target is pre-existingly red (every lib's
  `tsconfig.spec.json` includes `vite.config.ts` → `shared-vite-config.ts`
  rootDir error). The authoritative check is `nx build` (vite + dts). Don't chase
  those.
- Generated `frontend/apps/artcraft-website/public/news.json` and the pre-existing
  untracked `frontend/apps/artcraft-webapp/pnpm-lock.yaml` are NOT ours — never
  stage them.
- Verification so far is build + unit tests only. **Neither feature has been
  click-tested in the running app.** Manual QA is the main outstanding risk.

---

## Branch 1 — `qol/dnd-improvements` (COMPLETE, pushed, uncommitted-merge)

Unified drag-and-drop: one drop-target registry that both the internal gallery
drag and external OS-file drops route through, with media-type-safe reference
fields and a non-hijacking overlay. One commit:
`qol(dnd): unified drop-target registry with media-type-safe field drops`.

New lib: `frontend/libs/components/dnd` (`@storyteller/ui-dnd`) — `MediaKind`,
`DragPayload`, `dndCoordinator` (geometric hit-test), `useDropTarget`,
`useExternalFileDrop`, `DND_Z`. Wired into `gallery-modal/galleryDnd.ts`, the
prompt-box reference rows (webapp + shared promptbox), and both apps'
`GlobalFileDropHandler`.

Outstanding for this branch (from its own report):
- Manual QA: Tauri DPR hit-test at 100%/150% Windows scaling; gallery-item →
  reference-field drop; mismatch reject toast.
- Not started: video/audio gallery-drop duration is best-effort; multi-file OS
  drop onto a field takes only the first file.

---

## Branch 2 — `qol/settings-keybinds` (COMPLETE, pushed) — primary focus

Customizable keybinds with presets. 8 commits (oldest → newest):

1. `scaffold @storyteller/keybinds foundation`
2. `drive 3D PageScene shortcuts from the keybinds store`
3. `add Keybinds settings section with preset selector`
4. `add duplicate, deselect-all, grid + snapping toggles (3D)`
5. `registry-fed shortcut cheatsheet on the 3D viewport`
6. `make 2D PageDraw remappable + add its cheatsheet`
7. `migrate moodboard onto the unified keybinds system`
8. `Blender-style modal grab with X/Y/Z axis lock (3D)`

### Architecture

New lib **`frontend/libs/components/keybinds`** (`@storyteller/keybinds`):
- `types.ts` — `Binding {code,ctrl?,shift?,alt?}` (physical `event.code`),
  `ActionDef`, `Surface`, `KeyGroup`, `Preset`.
- `registry.ts` — `ACTIONS` / `ACTIONS_BY_SURFACE`: all remappable actions for
  surfaces `pagescene` / `pagedraw` / `moodboard` (video-editor excluded).
- `presets.ts` — `BASE_BINDINGS` (== the old hardcoded "Gamer" scheme) + `PRESETS`
  (`gamer` / `blender`; blender lists only 3D deltas).
- `keybinds-store.ts` — zustand+persist (`artcraft-keybinds`). Resolution:
  override → preset → base. `setPreset/setBinding/resetAction/resetAll/
  resetToPresetDefault/resolveBindings/findConflicts`.
- `matcher.ts` (ctrl/meta interchangeable, capture, shared editable guard),
  `format.ts`, `useResolvedKeybinds` (`forAction/matchAction/slotBindings`),
  `useKeybindCapture`, `components/{Kbd,KeybindCaptureInput}`, `settings/
  KeybindsSettings`, `cheatsheet/{Cheatsheet,useCheatsheetVisibility}`.
- 13 unit tests in `keybinds-store.spec.ts`.

### Wiring (key files changed)

- **3D store-driven**: `pagescene/src/lib/engine/keymap.ts`
  (`buildKeymap(forAction)` + `HANDLERS` action→handler map),
  `engine/cameraMath.ts` (`CAMERA_*_ACTION_SLOTS` + map-based slot lookups),
  `hooks/useFreeCam.ts` + `hooks/useViewportKeyboard.ts` (resolve via store;
  ctrl/meta + modal guards). **Gamer preset reproduces the old bindings exactly.**
- **Settings**: `settings-modal/src/lib/settings-modal.tsx` (desktop) +
  `apps/artcraft-webapp/src/components/settings-modal/SettingsModal.tsx` (web)
  both render `<KeybindsSettings />`.
- **New 3D binds**: `editor.ts` (`duplicateSelected/toggleGrid/toggleSnapping`),
  `editor/GizmoController.ts` (`setSnapping`), keymap handlers.
- **Cheatsheet**: mounted in `Stage3DBody.tsx`, `pagedraw/PageDraw.tsx`,
  `moodboard/Moodboard.tsx` (hold Ctrl/Cmd 3s).
- **2D**: `pagedraw/hooks/usePagedrawKeybinds.ts` replaces the 3 ad-hoc hooks.
- **Moodboard**: `moodboard/canvas/interactions/useMoodboardKeybinds.ts`
  consolidates 3 old hooks; 4 superseded files deleted (`shortcuts.ts` kept — the
  toolbar uses its `fmtShortcut`).
- **Modal axis-lock**: `pagescene/engine/editor/ModalTransformController.ts`
  (G grab → mouse drag on camera-facing plane → X/Y/Z constrain, Shift excludes;
  click/Enter confirm + undoable `TransformAction`; Esc/right-click cancel).
  `PageSceneStore.modalTransformActive` makes free-cam/keymap stand down.

### Presets (3D)

Gamer = current scheme (WASD/QE camera, T/R/G gizmo modes, etc.). Blender =
G/grab-modal, S scale-mode, R rotate-mode, `\` toggle-space (X freed for axis
lock), Shift+D duplicate, Alt+A deselect. 2D/moodboard are preset-independent.

### Outstanding / deferred (next steps)

1. **Manual QA (highest priority — nothing click-tested):**
   - Switch preset in Settings → confirm 3D rebinds apply live; reload → persists.
   - Conflict "rebind anyway" + per-row/global reset in Settings.
   - Hold-Ctrl cheatsheet on 3D / 2D / moodboard.
   - **Modal grab**: Blender preset, select object, G, move, X/Y/Z + Shift, click
     vs Esc; verify undo. The cursor→world projection feel is the unverified bit.
2. **Modal rotate/scale** — v1 is translate only. R/S in Blender currently set
   gizmo mode; extend `ModalTransformController` for rotate/scale to fully match
   Blender (`_mode` param already threaded).
3. **Select-all / frame-all** — intentionally NOT registered (need a scene-wide
   selectable filter + bbox camera-fit in `SelectionBridge`/`CameraController`).
4. **Video editor** — left on its own keybind dialog by design; Settings shows a
   note. Full consolidation onto the shared store is a possible follow-up.
5. **Moodboard cheatsheet** now lists keyboard actions only (pan/zoom mouse
   gestures dropped vs the old static sheet) — add gesture rows if desired.

### Resume sanity checklist
`npm install` → `npx nx sync` → `npx nx test @storyteller/keybinds` (13 pass) →
`npx nx run-many -t build -p @frontend/artcraft-webapp artcraft` (both green).
