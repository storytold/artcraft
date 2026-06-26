# Scene Descriptor (experimental "scene enhancement")

A compact, LLM-friendly projection of the live PageScene that can be
exported, edited, and applied back — the foundation for using an LLM to
iterate the contents of a 3D scene.

This is **menu-gated** behind the experimental flag
`artcraft_experimental_scene_enhancement` (Settings → Experimental →
"Scene enhancement"). When on, an **✦ Enhance** panel appears in the 3D
editor.

## Round-trip

```
buildSceneDescriptor(editor)  →  SceneDescriptor (JSON)
        ↓  edit by hand, or paste through any external LLM
applySceneDescriptor(editor, descriptor)  →  scene rebuilt
```

Milestone 1 is a **manual** round-trip — no in-app LLM call yet. Export the
descriptor, edit/enhance it however you like, paste it back, Apply.

## Format

`SceneDescriptor` (see `scene_descriptor.ts`) is a lossy, editable *view*
of the scene:

- `entities[]` — one per scene object with `id`, `name`, `kind`
  (`primitive | model | character | light | image | point`), optional
  `shape`/`color`/`visible`, and a `transform` (`position`, `rotationDeg`
  in **degrees**, `scale`).
- `environment.skybox`, plus a read-only `camera` for spatial context.

Each entity also carries `source`: the full internal `ObjectJSON`. This is
**not** for hand-editing — it's the lossless passthrough (asset token,
material, mixamo rig pose) that lets a round-trip reconstruct an object
exactly. An entity with no `source` is treated as new; only **primitives**
can be synthesized from scratch (models/characters need their asset token).

### Gray-box

Textures are intentionally not represented. Entities carry a flat `color`
only; anything without one renders flat-gray (`GRAY_BOX_COLOR`). An LLM can
add and recolor primitives without ever touching texture data.

## Universal export (fallback)

`exportSceneToGltf` / `exportSceneToUsdz` export the scene to glTF/GLB and
USDZ — the portable interchange formats, alongside the JSON descriptor.

## Roadmap / not done yet

- **Editable mixamo pose** — bone poses currently round-trip losslessly via
  `source.rigData` but are not yet decoded into a per-bone editable surface
  (`hasPose` advertises their presence). Decode/encode is the next step so
  an LLM can re-pose characters.
- **In-app LLM call** — placement (backend `storyteller_web` endpoint vs.
  frontend/Tauri) is deliberately deferred; milestone 1 is manual.
- **Non-destructive apply** — Apply currently rebuilds the scene and clears
  the undo stack (same path as "Reset to original"). A diff-based apply
  (move/add/remove in place, undoable) is a follow-up.
