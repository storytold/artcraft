// Owns both EffectComposer chains (main + raw) and the post-process
// passes the editor actually uses today.
//
// Main composer:
//   SelectionOutlinePass -> OutputPass
//
//   SelectionOutlinePass internally branches on selection state — no
//   selection takes a single forward render path, a non-splat selection
//   does a two-pass scene-minus-selected + selected-only render and
//   composites them with a silhouette outline, and a splat selection
//   falls back to the single render path with an attached BoxHelper.
//   See SelectionOutlinePass for the full pipeline notes.
//
// Raw composer:
//   RenderPass -> CustomOutlinePass -> OutputPass
//
//   Used by the render-camera output (not the editor view). Untouched
//   by this pass — CustomOutlinePass renders feature edges via surface
//   IDs for the final-output look, which is a separate concern from
//   selection highlighting.
//
// Deliberately small surface — no `editor` reference, no circular import.
// Editor passes the renderer / scene / camera / dimensions explicitly to
// configureMain / configureRaw, and the Scene callback dispatches into
// updateSurfaceIdAttributeToMesh with the scene as an argument. The
// `?.setSize` calls inside resize() are load-bearing: configureMain and
// configureRaw run at different points in Editor.initialize, and resize
// can fire between them via the first viewport.onWindowResize() call.

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SelectionOutlinePass } from "../SelectionOutlinePass";
import { CustomOutlinePass } from "../CustomOutlinePass.js";
import FindSurfaces from "../FindSurfaces.js";

export class PostProcessingPipeline {
  composer: EffectComposer | undefined;
  render_composer: EffectComposer | undefined;
  // Set by MouseControls / SceneUtils on every selection change.
  // The pass partitions the array into splat vs. non-splat at render time.
  selectionPass: SelectionOutlinePass | undefined;
  customOutlinerPass: CustomOutlinePass | undefined;
  private surfaceFinder: FindSurfaces | undefined;

  configureMain(
    renderer: THREE.WebGLRenderer | undefined,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera | null,
    width: number,
    height: number,
  ) {
    if (renderer == undefined || camera == undefined) return;
    this.composer = new EffectComposer(renderer);

    this.selectionPass = new SelectionOutlinePass(scene, camera, width, height);
    this.composer.addPass(this.selectionPass);

    this.composer.addPass(new OutputPass());
  }

  configureRaw(
    rawRenderer: THREE.WebGLRenderer | undefined,
    scene: THREE.Scene,
    renderCamera: THREE.PerspectiveCamera | null,
    width: number,
    height: number,
  ) {
    if (rawRenderer == undefined || renderCamera == undefined) return;
    const depthTexture = new THREE.DepthTexture(width, height);
    depthTexture.type = THREE.UnsignedShortType;

    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      { depthTexture, depthBuffer: true },
    );

    this.customOutlinerPass = new CustomOutlinePass(
      new THREE.Vector2(width, height),
      scene,
      renderCamera,
    );
    this.surfaceFinder = new FindSurfaces();
    this.render_composer = new EffectComposer(rawRenderer, renderTarget);
    this.render_composer.addPass(new RenderPass(scene, renderCamera));
    this.render_composer.addPass(this.customOutlinerPass);
    this.render_composer.addPass(new OutputPass());

    // Initial visualization mode: rendered colour. The depth/normal/
    // outline-only modes that the original code carried as `setRenderDepth`
    // / `setNormalMap` / `setOutlineRender` had no callers and were
    // dropped during this extraction.
    this.refreshSurfaceIds();
    // @ts-expect-error — fsQuad.material.uniforms is added by the upstream
    // EffectComposer Pass at runtime but not declared on the base type.
    this.customOutlinerPass.fsQuad.material.uniforms.debugVisualize.value = 2;
  }

  // Resize both composers and the custom outline pass — called from
  // ViewportController via the resizePostProcessing callback. The
  // optional chaining handles configureMain having run while configureRaw
  // hasn't yet (the lifecycle gap during initialize).
  resize(width: number, height: number) {
    this.composer?.setSize(width, height);
    this.render_composer?.setSize(width, height);
    this.customOutlinerPass?.setSize(width, height);
  }

  dispose() {
    this.composer?.dispose();
    this.render_composer?.dispose();
    this.selectionPass?.dispose();
  }

  // Bound through Editor's Scene callback; called on each asset load.
  // The `_scene` arg is part of the original callback contract but unused
  // here — the actual surface-id traversal lives in CustomOutlinePass /
  // FindSurfaces; this method just resets the counter and bumps the
  // shader uniform so the next pass starts clean.
  updateSurfaceIdAttributeToMesh(_scene: THREE.Scene) {
    this.refreshSurfaceIds();
  }

  private refreshSurfaceIds() {
    if (this.surfaceFinder === undefined) return;
    this.surfaceFinder.surfaceId = 0;
    this.customOutlinerPass?.updateMaxSurfaceId(this.surfaceFinder.surfaceId + 1);
  }
}
