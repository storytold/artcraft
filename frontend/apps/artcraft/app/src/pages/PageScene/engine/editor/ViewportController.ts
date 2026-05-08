// Owns the canvas/container DOM refs, the ResizeObserver, and the resize
// cascade that keeps the renderer, post-processing composers, and camera
// projection matrices in lockstep with the visible viewport.
//
// Cameras and renderer are forwarded via closure-based getters that
// resolve at call time (so the viewport is robust to construction-order
// changes in Editor.initialize). Post-processing is reached through a
// single `resizePostProcessing(w, h)` callback rather than three
// separate composer getters — that keeps the viewport from peeking at
// composer fields that may not exist yet at the first resize, and lets
// the post-processing module own its own undefined-pass handling.
//
// No `import type Editor`, no circular import.

import type * as THREE from "three";

export type ViewportEngineRefs = {
  getCamera: () => THREE.PerspectiveCamera | null;
  getRenderCamera: () => THREE.PerspectiveCamera | null;
  getRenderer: () => THREE.WebGLRenderer | undefined;
  getRenderAspectRatio: () => number;
  resizePostProcessing: (width: number, height: number) => void;
};

export class ViewportController {
  container: HTMLElement | null = null;
  canvReference: HTMLCanvasElement | null = null;
  canvasRenderCamReference: HTMLCanvasElement | null = null;
  lastCanvasSize: number = 0;
  private observer: ResizeObserver | undefined;

  constructor(private readonly engine: ViewportEngineRefs) {}

  containerMayReset() {
    if (!this.container) {
      console.warn(
        "ViewportController - Container does not exist, querying from DOM via document.getElementById",
      );
      this.container = document.getElementById("video-scene-container");
    }
  }

  // Full resize cascade — cameras + renderer + post-processing.
  // Called from initialize() and the per-frame check in renderSingleFrame.
  onWindowResize() {
    this.containerMayReset();
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const camera = this.engine.getCamera();
    const renderer = this.engine.getRenderer();
    if (camera == undefined || renderer == undefined) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    this.engine.resizePostProcessing(width, height);

    const renderCamera = this.engine.getRenderCamera();
    if (renderCamera == undefined) return;

    renderCamera.aspect = this.engine.getRenderAspectRatio();
    renderCamera.updateProjectionMatrix();
  }

  // Observed resizes from the ResizeObserver use a narrower update —
  // camera + renderer.setSize + setPixelRatio only — preserved from the
  // original editor.ts behaviour. Post-processing is intentionally
  // skipped here, matching the pre-refactor code.
  setupResizeObserver() {
    this.containerMayReset();
    if (!this.container) return;

    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const camera = this.engine.getCamera();
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
        const renderer = this.engine.getRenderer();
        renderer?.setSize(width, height);
        renderer?.setPixelRatio(window.devicePixelRatio);
      }
    });
    this.observer.observe(this.container);
  }
}
