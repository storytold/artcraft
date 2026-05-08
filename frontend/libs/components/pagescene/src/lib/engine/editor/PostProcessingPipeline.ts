// Owns both EffectComposer chains (main + raw) and the post-process
// passes the editor actually uses today: OutputPass + RenderPass on each
// composer, OutlinePass on the main one (created for selection
// highlighting in MouseControls and SceneUtils, not currently added to
// the composer), and CustomOutlinePass + FindSurfaces on the raw one.
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
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CustomOutlinePass } from "../CustomOutlinePass.js";
import FindSurfaces from "../FindSurfaces.js";

export class PostProcessingPipeline {
  composer: EffectComposer | undefined;
  render_composer: EffectComposer | undefined;
  outlinePass: OutlinePass | undefined;
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
    this.composer.addPass(new RenderPass(scene, camera));

    // Created for MouseControls / SceneUtils.removeTransformControls to
    // mutate `selectedObjects`. Not currently added to the composer (the
    // historical addPass call is commented out in the original code).
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(width / 10, height / 10),
      scene,
      camera,
    );

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
