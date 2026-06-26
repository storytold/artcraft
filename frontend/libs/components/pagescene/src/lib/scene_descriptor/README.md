# Scene Descriptor (experimental "scene enhancement")

A compact, LLM-friendly projection of the live PageScene that can be
exported, edited, and applied back — the foundation for using an LLM to
iterate the contents of a 3D scene.

This is **menu-gated** behind the experimental flag
`artcraft_experimental_scene_enhancement` (Settings → Experimental →
"Scene enhancement"). When on, an **Enhance** panel appears in the 3D
editor. In **dev builds it's shown by default** (the production 7-click
unlock isn't reachable in every host, e.g. the webapp).

## Round-trip

```
buildSceneDescriptor(editor)  →  SceneDescriptor (JSON)
        ↓  edit by hand, or paste through any external LLM
applySceneDescriptor(editor, descriptor)  →  scene rebuilt
```

Milestone 1 is a **manual** round-trip — no in-app LLM call yet. Export the
descriptor, edit/enhance it however you like, paste it back, Apply.

The **✦ Enhance** panel lets you copy/download the scene as the JSON
descriptor *or* as glTF, paste a descriptor back to Apply, and Undo/Redo.
An Apply is recorded as a **single** history entry, so one undo (button or
Ctrl+Z) reverts the entire config application at once.

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
material, full mixamo rig tree) that lets a round-trip reconstruct an
object exactly.

### Characters & mixamo pose

Characters expose an editable `pose`: a flat map of bone name → local
Euler rotation (degrees), anchored on the mixamo root (`mixamorigHips`).
Only "posable" bones are surfaced (the same filter the FK tool uses —
fingers/face stay in the rig fallback). Edit a bone's `rotationDeg` and it
re-poses on Apply; bones you don't mention keep the rig's pose. The
character mesh itself is **not** embedded — it's identified by its id
(`media_id`) and updated in place, never reloaded.

### Applying (in-place reconciliation)

Apply reconciles the descriptor against the live scene **by id** rather
than rebuilding:

- id matches an existing object → updated in place (transform, color,
  visibility, pose) — no mesh reload.
- primitive with no match → instantiated locally (no network).
- model/character with no match → skipped (creating new rigged assets from
  text is out of scope for the test phase).
- existing object absent from the descriptor → removed.

### Gray-box

Textures are intentionally not represented. Entities carry a flat `color`
only; anything without one renders flat-gray (`GRAY_BOX_COLOR`). An LLM can
add and recolor primitives without ever touching texture data.

### Vertex data / `mesh` entities (v2)

The format can carry raw per-object geometry — the "potentially large"
payload. An entity's `geometry` is a non-indexed triangle soup of
positions (`[x,y,z, …]`, in the object's local space; normals are
recomputed on import, textures/UVs omitted):

- **Export** attaches geometry to every mesh-bearing entity only when you
  ask for it (the panel's *Include geometry* toggle / `includeGeometry`
  option) — it's off by default because it's big (capped at ~200k verts).
- A `mesh` entity is **defined** by its `geometry`: on Apply we rebuild a
  gray-box `THREE.Mesh` from the positions (`Scene.instantiateMeshFromPositions`),
  no asset reload. These round-trip through the app's own save/load too —
  geometry rides in `ObjectJSON.geometry` under a `Mesh::` token, so undo
  (snapshot reload) reconstructs them.

This is how external tools / an LLM can hand us novel geometry: emit a
`mesh` entity with a `geometry.positions` array and Apply builds it.

## Universal export (fallback)

`exportSceneToGltf` / `exportSceneToUsdz` export the scene to glTF/GLB and
USDZ — the portable interchange formats, alongside the JSON descriptor.

## Roadmap / not done yet

- **In-app LLM call** — placement (backend `storyteller_web` endpoint vs.
  frontend/Tauri) is deliberately deferred; milestone 1 is manual.
- **New rigged assets from text** — Apply skips new models/characters (no
  `source`); only existing assets are updated and primitives created.
- **Undo cost** — the forward Apply is in-place (no reload), but undo/redo
  restore via a full snapshot reload. Fully invertible in-place ops are a
  possible follow-up.
- **glTF import** — glTF/USDZ are export-only; Apply consumes the JSON
  descriptor. Importing arbitrary glTF back into the scene is out of scope.
