# Scene Descriptor — LLM Authoring Guide

Paste this whole document to an LLM as context, then give it the current scene
descriptor (JSON) plus an instruction ("add a forest", "make the grass sway",
"raise the left arm"). The model returns **only** the updated descriptor JSON.

You are editing a 3D scene as a single JSON document.
- Coordinates: **meters**, **Y-up**, right-handed.
- Rotations: **degrees** (Euler XYZ).
- **Gray-box** world: flat colors only, no textures.
- The scene is rebuilt from what you return: keep what should stay, change what
  should change, drop what should go.

---

## Quick reference

```
descriptor          { descriptorVersion:2, units, coordinateSystem, environment{skybox?}, camera?(read-only), entities[] }
entity              { id, name, kind, color?, visible?, transform, + kind fields, + material?, + animation? }
transform           { position:{x,y,z}, rotationDeg:{x,y,z}, scale:{x,y,z} }

kind "primitive"    + shape: "Box"|"Sphere"|"Cone"|"Cylinder"|"Donut"|"Water"|"PointLight"
kind "mesh"         + geometry:{ positions:[x,y,z,...] }          // non-indexed triangle soup, local space
kind "instances"    + instancing:{ base, scatter? | instances?, wind? }
kind "character"    + pose:{ rootBone, rootPosition?, bones:{ [name]:{rotationDeg} } }   // EDIT ONLY
kind "model"|"image"|"light"|"point"                                                     // EDIT ONLY

instancing.base     { shape } | { positions:[...] } | { plane:{width,height} }
instancing.scatter  { count, area:{x,z}, seed?, yJitterDeg?, scaleRange?[min,max], tiltDeg?, colorJitter? }
instancing.instances[ { position, rotationDeg, scale, color? } ]                          // explicit (instead of scatter)
instancing.wind     { strength?, speed?, turbulence? }                                    // GPU sway for ALL instances

material (shader)   { type:"shader", fragmentShader, vertexShader?, uniforms?, animated?, transparent?, doubleSide? }
animation           { poses?:[ {timeSec, rootPosition?, bones:{[name]:{rotationDeg}}} ], tracks?:[...], loop?, timeScale?, autoplay?, durationSec?, clip? }
  poses[]           ← USE THIS for characters (dance/walk): a timeline of whole-body poses, same `bones` shape as `pose`
```

## Apply semantics (how your JSON becomes the scene)

- **Edit** an existing object: keep its `id` **and its `source` field verbatim**
  (lossless passthrough — never modify it). Change `transform`/`color`/`visible`/
  `pose`/`material`/`animation`.
- **Create**: use `primitive`, `mesh`, or `instances`; omit `id` and `source`.
- **Delete**: omit the entity from `entities` (reconciled by id; missing ⇒ removed).
- New `character`/`model` are **skipped** — you can't summon a rigged/asset object
  from text. Edit existing ones only.
- Applying is **one undoable step**; the whole change reverts together.

---

## primitive

```jsonc
{ "kind": "primitive", "shape": "Box", "color": "#6b6b6b", "transform": {...} }
```
`shape` ∈ `Box`, `Sphere`, `Cone`, `Cylinder`, `Donut`, `Water`, `PointLight`.
Each is ≈1m (radius 0.5); use `scale` to resize.

## mesh (raw vertex data)

```jsonc
{ "kind": "mesh", "color": "#aa8844", "transform": {...},
  "geometry": { "positions": [x,y,z, x,y,z, ...] } }
```
`positions` is a **non-indexed triangle soup** in local space: every **9 numbers**
(3 vertices) = one triangle. Normals auto-computed. Keep counts modest.

## instances (forests, grass — one draw call)

One `instances` entity becomes **one draw call** for the whole field, however many
copies. Always use this for many copies — never emit hundreds of entities.

```jsonc
{ "kind": "instances", "color": "#2f7d32", "transform": { /* field origin */ },
  "instancing": {
    "base": { "shape": "Cone" },          // OR { "positions":[...blade verts...] } OR { "plane":{ "width":1,"height":1 } }
    "scatter": {                          // procedural placement (preferred) — OR explicit "instances":[...]
      "count": 350,
      "area": { "x": 60, "z": 60 },       // spread centered on the field origin
      "seed": 11,                         // deterministic — same seed = same layout
      "yJitterDeg": 360,                  // random yaw
      "scaleRange": [1.2, 3.4],           // random uniform scale
      "tiltDeg": 8,                       // random lean — organic
      "colorJitter": 0.18                 // 0..1 per-instance shade off `color`
    }
  } }
```
For **no two alike**, set `tiltDeg`, `colorJitter`, a wide `scaleRange`, and
`yJitterDeg:360`. Grass = a few-vertex blade in `base.positions` with a high
`count`; trees = `base.shape:"Cone"` with a smaller `count`.

**Wind — animate the WHOLE field on the GPU.** Add `instancing.wind` to make every
instance sway: a vertex shader on a shared `time` uniform with a per-instance phase
— one draw call, no per-frame CPU, scales to tens of thousands. Height-weighted,
so each instance pivots at its base.
```jsonc
"wind": { "strength": 0.25, "speed": 1.5, "turbulence": 0.4 }
```
> ⚠️ To animate instances, use `instancing.wind` — **do NOT** put a per-object
> `animation` on an instanced field. A per-object `animation` moves the entire
> field as one rigid block, not the individual blades.

## material (custom shader — any kind)

Give an entity's mesh(es) a custom GLSL material. Works on any kind, including
`instances` (the engine supplies instancing-aware vertex placement automatically).

```jsonc
"material": {
  "type": "shader",
  "animated": true,                 // ticks the injected `time` uniform
  "doubleSide": true,
  "uniforms": { "tint": [0.2, 0.8, 0.4] },   // number→float, [a,b]→vec2, [a,b,c]→vec3, [a,b,c,d]→vec4
  "fragmentShader": "void main(){ float g = 0.5 + 0.5*sin(time*2.0 + vUv.x*12.0); gl_FragColor = vec4(vUv.x, g, 1.0 - vUv.y, 1.0); }"
}
```
**Shader contract — already declared for you, just use them:**
- Uniforms: `float time`, `vec2 resolution`, plus anything in your `uniforms`.
- Varyings: `vec2 vUv`, `vec3 vNormal` (view space), `vec3 vPosition` (local).
- Write only `fragmentShader` (a full `void main(){ ... gl_FragColor = ...; }`).
  A `vertexShader` is optional and rarely needed.

## animation (keyframes — per object or bones)

Make an entity move over time (Three.js AnimationMixer). Times are **seconds**;
each track's `values` are one per keyframe, matching `times`.

```jsonc
"animation": {
  "loop": "repeat",          // "repeat" | "once" | "pingpong"   (default repeat)
  "timeScale": 1,            // playback speed                    (default 1)
  "autoplay": true,          //                                   (default true)
  "durationSec": 2,          // optional; inferred from times if omitted
  "tracks": [
    { "property": "position",   "times": [0,1,2], "values": [ {"x":0,"y":1,"z":0}, {"x":0,"y":3,"z":0}, {"x":0,"y":1,"z":0} ] },
    { "property": "rotationDeg", "times": [0,2],   "values": [ {"x":0,"y":0,"z":0}, {"x":0,"y":360,"z":0} ] }
    // property ∈ "position" | "rotationDeg" (degrees) | "scale"
    // optional "interpolation": "linear" (default) | "smooth" | "discrete"
  ]
}
```
- A track overrides that channel of `transform` while playing; omitted channels stay static.
- Play a **baked clip** the asset ships with: `"animation": { "clip": "Walk", "loop": "repeat" }` (falls back to `tracks`/`poses` if absent).
- For many copies, this is per-OBJECT — for swaying grass use `instancing.wind` instead.

### Character motion — pose-keyframes (USE THIS for characters)

Don't hand-author per-bone tracks for a character. Author a **timeline of
whole-body poses** — the same sparse `bones: { name: { rotationDeg } }` shape as
the static `pose`, plus a `timeSec`. The engine interpolates between them. Block a
few key poses; a bone you omit at a keyframe just interpolates between the
keyframes that *do* set it, so each limb can move on its own cadence.

```jsonc
"animation": {
  "loop": "repeat",
  "poses": [
    { "timeSec": 0.0, "bones": { "mixamorigLeftArm": {"rotationDeg":{"x":0,"y":0,"z":-70}}, "mixamorigRightArm": {"rotationDeg":{"x":0,"y":0,"z":70}} } },
    { "timeSec": 0.5, "bones": { "mixamorigLeftArm": {"rotationDeg":{"x":0,"y":0,"z":-30}}, "mixamorigRightArm": {"rotationDeg":{"x":0,"y":0,"z":30}} } },
    { "timeSec": 1.0, "bones": { "mixamorigLeftArm": {"rotationDeg":{"x":0,"y":0,"z":-70}}, "mixamorigRightArm": {"rotationDeg":{"x":0,"y":0,"z":70}} } }
  ]
}
```

- **Dance / wave / idle:** a short loop of 2–4 key poses with `loop:"repeat"`.
- **Walk / run in place:** alternate two contact poses (legs + counter-swinging arms), `loop:"repeat"`.
- **Walk along a path (road / through the forest):** add `rootPosition` to keyframes
  to move the hips, AND repeat the leg/arm contact poses along the journey, in ONE
  clip. Use `loop:"once"` for a one-way trip (e.g. waypoints weaving between trees),
  or `"repeat"` to loop the route. Example skeleton:
  ```jsonc
  "animation": { "loop": "once", "durationSec": 8, "poses": [
    { "timeSec": 0, "rootPosition": {"x":-20,"y":0,"z":0}, "bones": { /* contact pose A */ } },
    { "timeSec": 0.5, "bones": { /* contact pose B */ } },
    { "timeSec": 1.0, "rootPosition": {"x":-17,"y":0,"z":3}, "bones": { /* pose A */ } },
    /* …repeat the A/B leg cycle every ~0.5s while stepping rootPosition along the path… */
    { "timeSec": 8, "rootPosition": {"x":20,"y":0,"z":-5}, "bones": { /* pose A */ } }
  ] }
  ```
  (Add `mixamorigHips` rotation in the poses to make the character face its travel direction.)

## character pose (mixamo) — edit only

```jsonc
{ "kind": "character", "id": "keep-this", "source": {/* keep verbatim */}, "transform": {...},
  "pose": {
    "rootBone": "mixamorigHips",
    "rootPosition": { "x": 0, "y": 1.0, "z": 0 },   // optional hip translation
    "bones": {
      "mixamorigLeftArm":  { "rotationDeg": { "x": 0, "y": 0, "z": -60 } },
      "mixamorigRightArm": { "rotationDeg": { "x": 0, "y": 0, "z":  60 } },
      "mixamorigSpine":    { "rotationDeg": { "x": 8, "y": 0, "z":   0 } }
    }
  } }
```
`bones` is sparse — list only what you change (local rotation, degrees). Omitted
bones keep their current pose. The **same `bones` shape is used for static `pose`
and for `animation.poses`** — pose it once, or key it over time.

**The character must already be in the scene.** You'll see it as `kind:"character"`
with its current rotations in `pose.bones` — that exported pose (≈ a T-pose at rest)
is your **starting point**; adjust from there.

**Mixamo posable bones (and what moves them from the T-pose rest):**
- **Spine/head:** `mixamorigSpine`, `mixamorigSpine1`, `mixamorigSpine2` (bend/twist torso), `mixamorigNeck`, `mixamorigHead`.
- **Arms** (rest = arms out along ±X): `mixamorigLeftShoulder`, `mixamorigLeftArm` (**z** raises/lowers the arm), `mixamorigLeftForeArm` (bends the elbow), `mixamorigLeftHand`; mirror with `Right`.
- **Legs:** `mixamorigLeftUpLeg` (**x** swings the thigh fwd/back), `mixamorigLeftLeg` (**x** bends the knee), `mixamorigLeftFoot`; mirror with `Right`.
- **Root:** `mixamorigHips` (whole-body lean/turn) + `rootPosition` for translation.

Axis signs differ per rig, and **left/right are mirrored** (flip the sign on the
swinging axis). Start from the exported current rotation, nudge, and verify.

---

## Full example (forest + windy grass + animated shader)

```json
{
  "descriptorVersion": 2, "units": "meters", "coordinateSystem": "y-up-right-handed", "environment": {},
  "entities": [
    { "id": "ground", "name": "Ground", "kind": "primitive", "shape": "Box", "color": "#5b6b4a",
      "transform": { "position": {"x":0,"y":-0.5,"z":0}, "rotationDeg": {"x":0,"y":0,"z":0}, "scale": {"x":80,"y":0.2,"z":80} } },

    { "id": "forest", "name": "Forest", "kind": "instances", "color": "#2f7d32",
      "transform": { "position": {"x":0,"y":1,"z":0}, "rotationDeg": {"x":0,"y":0,"z":0}, "scale": {"x":1,"y":1,"z":1} },
      "instancing": { "base": { "shape": "Cone" },
        "scatter": { "count": 350, "area": {"x":60,"z":60}, "seed": 11, "yJitterDeg": 360, "scaleRange": [1.2,3.4], "tiltDeg": 8, "colorJitter": 0.18 } } },

    { "id": "grass", "name": "Grass", "kind": "instances", "color": "#5a8f3a",
      "transform": { "position": {"x":0,"y":0,"z":0}, "rotationDeg": {"x":0,"y":0,"z":0}, "scale": {"x":1,"y":1,"z":1} },
      "instancing": { "base": { "positions": [-0.05,0,0, 0.05,0,0, 0.05,0.5,0, -0.05,0,0, 0.05,0.5,0, -0.05,0.5,0] },
        "scatter": { "count": 4000, "area": {"x":50,"z":50}, "seed": 3, "scaleRange": [0.6,1.6] },
        "wind": { "strength": 0.25, "speed": 1.6, "turbulence": 0.4 } } },

    { "id": "orb", "name": "Shader Orb", "kind": "primitive", "shape": "Sphere", "color": "#ffffff",
      "transform": { "position": {"x":0,"y":4,"z":0}, "rotationDeg": {"x":0,"y":0,"z":0}, "scale": {"x":2,"y":2,"z":2} },
      "material": { "type": "shader", "animated": true, "doubleSide": true,
        "fragmentShader": "void main(){ float p=0.5+0.5*sin(time*3.0); float f=pow(1.0-abs(vNormal.z),2.0); gl_FragColor=vec4(f+p*0.3, f, 1.0, 1.0); }" },
      "animation": { "loop": "repeat", "tracks": [ { "property": "position", "times": [0,2,4], "values": [ {"x":0,"y":4,"z":0}, {"x":0,"y":5,"z":0}, {"x":0,"y":4,"z":0} ] } ] } }
  ]
}
```

## Checklist before returning

- Output is **valid JSON only** — the whole descriptor, no prose, no trailing commas.
- Kept `id` and `source` for every existing object you intend to preserve.
- Rotations in **degrees**; positions in **meters**, Y-up; colors flat hex.
- Used `instances` + `scatter` for many copies; `instancing.wind` (not `animation`) to animate a field.
- New objects are only `primitive` / `mesh` / `instances` (no new `character`/`model`).
