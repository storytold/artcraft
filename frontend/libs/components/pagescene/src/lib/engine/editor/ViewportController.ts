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
  // Called synchronously after a setSize cascade so the canvas gets a
  // fresh draw before the next browser paint. Three.js's setSize clears
  // the canvas backing buffer; without an immediate redraw the browser
  // can paint an empty canvas for one frame, which shows up as flicker
  // when the container is animating (e.g. sidebar collapse).
  renderScene: () => void;
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
  // camera + renderer.setSize only — preserved from the original
  // editor.ts behaviour. Post-processing is intentionally skipped here,
  // matching the pre-refactor code. setPixelRatio runs once at setup
  // since DPR doesn't change for the lifetime of the page short of the
  // user dragging the window across monitors with different scaling.
  setupResizeObserver() {
    this.containerMayReset();
    if (!this.container) return;

    this.engine.getRenderer()?.setPixelRatio(window.devicePixelRatio);

    this.observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const camera = this.engine.getCamera();
        if (camera) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
        const renderer = this.engine.getRenderer();
        if (!renderer) continue;
        renderer.setSize(width, height);
        // setSize wipes the canvas backing buffer. Redraw synchronously
        // so the next browser paint isn't an empty frame.
        this.engine.renderScene();
      }
    });
    this.observer.observe(this.container);
  }
}
