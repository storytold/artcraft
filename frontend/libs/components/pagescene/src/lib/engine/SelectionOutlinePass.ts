// Custom three.js post-process pass that replaces the standard RenderPass
// and the (since-disabled) stock OutlinePass in the editor's main composer.
//
// Render pathway branches on selection state:
//
//   Path 1 — nothing outlineable selected
//     Single forward render into writeBuffer. Identical cost to a stock
//     RenderPass. Splats (if selected) end up here too — their cue is
//     the pre-built __bbox_internal child whose visibility we toggled
//     during the selection event (see setSelectedObjects).
//
//   Path 2 — a non-splat object is selected
//     1. Forward render the whole scene -> writeBuffer
//        Selected mesh appears at its natural depth, hidden by occluders
//        like any other geometry. The gizmo paints on top via its
//        renderOrder=Infinity. This step is identical to path 1.
//     2. Selected-only depth -> selectedTarget
//        Hide everything except the selected subtree (plus lights, since
//        toggling Light.visible would skip them during lighting accum).
//        We only need the depth attachment afterwards; the color
//        attachment is a side effect of WebGL framebuffer completeness.
//     3. Silhouette overlay quad -> writeBuffer with autoClear=false
//        Sample a 3x3 neighborhood on selectedTarget.depthTexture. Where
//        neighbors straddle "selected here" vs "not here," the fragment
//        is on the silhouette and the shader paints outlineColor.
//        Non-silhouette fragments discard, preserving the writeBuffer
//        content from step 1 (including the gizmo on top).
//
// Partitioning of the current selection into "outline target" vs
// "splat target" happens in setSelectedObjects on the selection-event
// path, NOT each frame in render(). render() reads a cached
// outlineTarget reference; the splat bbox is a pre-built hidden child
// whose visibility was flipped at selection time.
//
// Cosmetic note: the outline ring overwrites color at silhouette pixels
// regardless of what was there. Gizmo handles that cross the silhouette
// ring will show a 1-2 pixel "scratch" of outline color. This is the
// same behavior as three.js' stock OutlinePass and considered acceptable.

import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { SplatMesh } from "@sparkjsdev/spark";
import { MediaFileType } from "../enums";
import { findInternalBbox } from "./internalBbox";
import {
  SELECTION_OUTLINE_COLOR,
  SELECTION_OUTLINE_ACCENT_COLOR,
} from "./selectionColors";

// Two-color pulse so the outline reads as motion. Pale-orange ↔ dark-
// orange in the Blender editor selection style — both ends sit in a
// warm hue that stands out against typical scene neutrals.
// Pulse period (seconds). Angular freq baked into the uniform.
const SELECTION_PULSE_PERIOD_SEC = 3.0;
// Sample radius for the silhouette edge detect, in screen pixels.
const OUTLINE_THICKNESS = 1;
// Depth value at the far plane after clear. Anything below means
// "selected geometry rasterized here."
const FAR_DEPTH_THRESHOLD = 0.999999;

// Walk the parent chain looking for a splat. Primary detector is
// `instanceof SplatMesh` — robust across JSON reload because the
// SplatMesh instance is freshly constructed by Scene.loadObject
// regardless of saved userData. The userData tag check is a secondary
// fallback for future non-SparkJS splat backends, and so we don't
// regress if someone wraps a SplatMesh in a Group.
function findSplatAncestor(
  obj: THREE.Object3D,
): SplatMesh | THREE.Object3D | undefined {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur instanceof SplatMesh) return cur;
    if (cur.userData?.["media_file_type"] === MediaFileType.SPZ) return cur;
    cur = cur.parent;
  }
  return undefined;
}

export class SelectionOutlinePass extends Pass {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;

  // Cached partition results — written by setSelectedObjects on each
  // selection change; read by render() each frame. No per-frame work.
  private outlineTarget: THREE.Object3D | undefined;
  // The currently-visible __bbox_internal child of a selected splat.
  // Kept so we can hide it again when the selection changes.
  private activeSplatBbox: THREE.Object3D | undefined;

  // When true, render() still does the Step-1 forward scene render but
  // skips the outline overlay (and the splat bbox is hidden). Used by
  // the snapshot path — see setOutlineSuppressed.
  private suppressOutline = false;

  // Off-screen target for step 2. Only the depth attachment is read by
  // the silhouette shader; the color attachment exists because WebGL
  // requires a complete framebuffer.
  private selectedTarget: THREE.WebGLRenderTarget;

  // Full-screen quad + outline shader for step 3.
  private readonly fsQuad: FullScreenQuad;
  private readonly outlineMaterial: THREE.ShaderMaterial;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
  ) {
    super();
    this.scene = scene;
    this.camera = camera;
    // After we render, OutputPass needs to read what we wrote.
    this.needsSwap = true;

    const selectedDepth = new THREE.DepthTexture(width, height);
    selectedDepth.type = THREE.UnsignedShortType;
    this.selectedTarget = new THREE.WebGLRenderTarget(width, height, {
      depthTexture: selectedDepth,
      depthBuffer: true,
    });

    this.outlineMaterial = this.createOutlineMaterial(width, height);
    this.fsQuad = new FullScreenQuad(this.outlineMaterial);
  }

  // Selection-event hook. Replaces the public-field assignment that
  // previously lived at MouseControls.selectObject (and the deselect
  // paths in SceneUtils/MouseControls). Partitioning + splat bbox
  // toggle happen here, ONCE per selection change, not per frame.
  setSelectedObjects(objects: THREE.Object3D[]): void {
    let outlineTarget: THREE.Object3D | undefined;
    let splatTarget: THREE.Object3D | undefined;
    for (const obj of objects) {
      const splatAncestor = findSplatAncestor(obj);
      if (splatAncestor) {
        if (!splatTarget) splatTarget = splatAncestor;
      } else {
        if (!outlineTarget) outlineTarget = obj;
      }
    }
    this.outlineTarget = outlineTarget;
    this.toggleSplatBbox(splatTarget);
  }

  // Snapshot hook: keep the Step-1 scene render but drop the outline
  // overlay AND the selected splat's __bbox_internal wireframe, so the
  // captured reference frame is clean. Toggling the whole pass off would
  // skip Step 1 (EffectComposer skips disabled passes) and leave the
  // composer with an empty buffer -> a flat gray snapshot.
  setOutlineSuppressed(suppressed: boolean): void {
    this.suppressOutline = suppressed;
    if (this.activeSplatBbox) this.activeSplatBbox.visible = !suppressed;
  }

  override setSize(width: number, height: number) {
    this.selectedTarget.setSize(width, height);
    this.outlineMaterial.uniforms["screenSize"].value.set(
      width,
      height,
      1 / width,
      1 / height,
    );
  }

  override dispose() {
    this.selectedTarget.dispose();
    this.fsQuad.dispose();
    this.outlineMaterial.dispose();
    // Note: __bbox_internal children are owned by their splat parents
    // and disposed when the splat is removed from the scene. We just
    // drop the visible reference here.
    if (this.activeSplatBbox) {
      this.activeSplatBbox.visible = false;
      this.activeSplatBbox = undefined;
    }
  }

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    _readBuffer: THREE.WebGLRenderTarget,
    _deltaTime?: number,
    _maskActive?: boolean,
  ) {
    // Step 1: forward render the whole scene. Always runs — identical
    // to the no-selection path. The selected mesh ends up in writeBuffer
    // at its natural depth (occluders hide its body), the gizmo appears
    // on top via renderOrder=Infinity, and any visible __bbox_internal
    // child of a selected splat renders as part of its parent's subtree.
    renderer.setRenderTarget(writeBuffer);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    // Outline suppressed (snapshot) or nothing to outline -> stop after
    // step 1. The scene is already in writeBuffer either way.
    if (this.suppressOutline || !this.outlineTarget) return;

    // Step 2: selected-only depth -> selectedTarget. Build a keep set
    // for the selected subtree plus its ancestors (Object3D.visible is
    // transitive, so hiding an ancestor hides the descendant too).
    // Hide everything else, render, restore.
    const keepVisible = new Set<THREE.Object3D>();
    let ancestor: THREE.Object3D | null = this.outlineTarget;
    while (ancestor) {
      keepVisible.add(ancestor);
      ancestor = ancestor.parent;
    }
    this.outlineTarget.traverse((d) => keepVisible.add(d));

    const hidden: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (!obj.visible || keepVisible.has(obj)) return;
      // Leave lights alone — toggling Light.visible drops them from
      // lighting accumulation and the selected mesh would render unlit.
      // (We only care about depth here, but cost is identical and this
      // keeps the keep set logic identical to a fully-shaded selected
      // render if we ever need it.)
      if ((obj as THREE.Light).isLight) return;
      hidden.push(obj);
      obj.visible = false;
    });
    renderer.setRenderTarget(this.selectedTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    for (const obj of hidden) obj.visible = true;

    // Step 3: silhouette overlay quad. Reads selectedTarget.depthTexture,
    // paints outline color where the 3x3 neighborhood straddles selected/
    // not-selected, discards otherwise. autoClear=false preserves
    // writeBuffer from step 1. `uTime` (seconds) drives the color pulse
    // inside the fragment shader.
    this.outlineMaterial.uniforms["selectedDepth"].value =
      this.selectedTarget.depthTexture;
    this.outlineMaterial.uniforms["uTime"].value = performance.now() * 0.001;
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(writeBuffer);
    this.fsQuad.render(renderer);
    renderer.autoClear = prevAutoClear;
  }

  // Toggle the splat's pre-built __bbox_internal child. The wireframe
  // is constructed once at splat load (see scene.ts:loadSplatWithPlaceholder
  // -> internalBbox.ensureInternalBbox), so this method just flips
  // `.visible`. Tracks transforms automatically via the matrix chain
  // because the child is parented under the splat.
  private toggleSplatBbox(target: THREE.Object3D | undefined): void {
    // Same target — bbox is already in the right state.
    if (target === this.activeSplatBbox?.parent) return;
    // Hide previous bbox.
    if (this.activeSplatBbox) {
      this.activeSplatBbox.visible = false;
      this.activeSplatBbox = undefined;
    }
    if (!target) return;
    const bbox = findInternalBbox(target);
    if (bbox) {
      bbox.visible = true;
      this.activeSplatBbox = bbox;
    }
  }

  private createOutlineMaterial(
    width: number,
    height: number,
  ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        selectedDepth: { value: null },
        screenSize: {
          value: new THREE.Vector4(width, height, 1 / width, 1 / height),
        },
        outlineColor: {
          value: new THREE.Color(SELECTION_OUTLINE_COLOR),
        },
        outlineAccentColor: {
          value: new THREE.Color(SELECTION_OUTLINE_ACCENT_COLOR),
        },
        // Angular frequency for the pulse: 2π / period.
        // Multiply by uTime (seconds) inside the shader.
        pulseAngularFreq: {
          value: (2 * Math.PI) / SELECTION_PULSE_PERIOD_SEC,
        },
        // Seconds since some arbitrary origin. Updated each render()
        // from `performance.now() * 0.001`.
        uTime: { value: 0 },
        outlineThickness: { value: OUTLINE_THICKNESS },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      // Fragment shader:
      //   selectedDepth.x < ${FAR_DEPTH_THRESHOLD} encodes "selected
      //   geometry rasterized here." Sample a 3x3 neighborhood; if any
      //   neighbor's selected-presence differs from the center's, the
      //   fragment is on the silhouette. Non-silhouette fragments
      //   discard so the quad blends onto writeBuffer without
      //   overwriting non-silhouette pixels.
      //
      //   Silhouette pixels mix between outlineColor and
      //   outlineAccentColor via a 0..1 sine driven by uTime. Two
      //   colors (rather than a single intensity pulse) so the outline
      //   remains visible against backgrounds of either tone — a pure
      //   white pulse is easy to lose against white scene edges.
      fragmentShader: /* glsl */ `
        uniform sampler2D selectedDepth;
        uniform vec4 screenSize;
        uniform vec3 outlineColor;
        uniform vec3 outlineAccentColor;
        uniform float pulseAngularFreq;
        uniform float uTime;
        uniform float outlineThickness;

        varying vec2 vUv;

        bool hasSelected(vec2 uv) {
          return texture2D(selectedDepth, uv).x < ${FAR_DEPTH_THRESHOLD.toFixed(6)};
        }

        void main() {
          bool selHere = hasSelected(vUv);

          bool edge = false;
          vec2 px = screenSize.zw * outlineThickness;
          for (int dx = -1; dx <= 1; dx++) {
            for (int dy = -1; dy <= 1; dy++) {
              if (dx == 0 && dy == 0) continue;
              vec2 nuv = vUv + vec2(float(dx), float(dy)) * px;
              if (hasSelected(nuv) != selHere) {
                edge = true;
              }
            }
          }

          if (!edge) discard;
          float pulse = sin(uTime * pulseAngularFreq) * 0.5 + 0.5;
          vec3 col = mix(outlineColor, outlineAccentColor, pulse);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }
}
