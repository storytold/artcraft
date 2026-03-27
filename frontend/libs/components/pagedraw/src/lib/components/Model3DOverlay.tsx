import React, { useEffect, useRef, useCallback, useImperativeHandle } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Konva from "konva";
import { Node } from "../Node";
import {
  Model3DParams,
  DEFAULT_MODEL3D_PARAMS,
} from "../utilities/render3DModel";

export interface Model3DOverlayHandle {
  onScaleDrag: (dx: number, dy: number) => void;
  onRotateDrag: (dx: number, dy: number) => void;
  onFovDrag: (dx: number, dy: number) => void;
  commit: () => void;
}

interface Model3DOverlayProps {
  node: Node;
  stageRef: React.MutableRefObject<Konva.Stage>;
  onCommit: (imageDataUrl: string, params: Model3DParams) => void;
  onDismiss: () => void;
}

/** Returns viewport-relative rect for the Konva node, suitable for `position:fixed` overlays. */
function buildNodeScreenRect(
  node: Node,
  stageRef: React.MutableRefObject<Konva.Stage>,
): { left: number; top: number; width: number; height: number } {
  const stage = stageRef.current;
  if (!stage) {
    return { left: 0, top: 0, width: 300, height: 300 };
  }

  const stageContainerRect = stage.container().getBoundingClientRect();
  const stageScaleX = stage.scaleX();
  const stageScaleY = stage.scaleY();
  const nodeScaleX = node.scaleX ?? 1;
  const nodeScaleY = node.scaleY ?? 1;

  const left = stageContainerRect.left + stage.x() + node.x * stageScaleX;
  const top = stageContainerRect.top + stage.y() + node.y * stageScaleY;
  const width = node.width * nodeScaleX * stageScaleX;
  const height = node.height * nodeScaleY * stageScaleY;

  return { left, top, width, height };
}

export const Model3DOverlay = React.forwardRef<Model3DOverlayHandle, Model3DOverlayProps>(
  function Model3DOverlay({ node, stageRef, onCommit, onDismiss }, ref) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const modelScaleRef = useRef<number>(
      node.model3dParams?.modelScale ?? DEFAULT_MODEL3D_PARAMS.modelScale,
    );
    const loadedModelRef = useRef<THREE.Object3D | null>(null);
    const committedRef = useRef(false);

    const screenRect = buildNodeScreenRect(node, stageRef);

    const captureParams = useCallback((): Model3DParams => {
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;
      const baseParams = node.model3dParams ?? DEFAULT_MODEL3D_PARAMS;
      if (!cam || !ctrl) return baseParams;
      return {
        cameraPosition: {
          x: cam.position.x,
          y: cam.position.y,
          z: cam.position.z,
        },
        cameraTarget: {
          x: ctrl.target.x,
          y: ctrl.target.y,
          z: ctrl.target.z,
        },
        fov: cam.fov,
        modelScale: modelScaleRef.current,
        // Preserve native dims — they are fixed for the lifetime of this 3D model node
        nativeWidth: baseParams.nativeWidth,
        nativeHeight: baseParams.nativeHeight,
      };
    }, [node.model3dParams]);

    const commit = useCallback(() => {
      if (committedRef.current) return;
      committedRef.current = true;

      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!renderer || !scene || !camera) {
        onDismiss();
        return;
      }

      // Render at native (undistorted) dimensions. Konva will stretch the committed
      // PNG to fill the node's current frame, preserving any user-applied stretch.
      const baseParams = node.model3dParams ?? DEFAULT_MODEL3D_PARAMS;
      const nativeW = baseParams.nativeWidth ?? Math.round(node.width * (node.scaleX ?? 1));
      const nativeH = baseParams.nativeHeight ?? Math.round(node.height * (node.scaleY ?? 1));
      renderer.setSize(nativeW, nativeH);
      camera.aspect = nativeW / nativeH;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const dataUrl = renderer.domElement.toDataURL("image/png");
      const params = captureParams();
      onCommit(dataUrl, params);
    }, [node, captureParams, onCommit, onDismiss]);

    const onScaleDrag = useCallback((dx: number, _dy: number) => {
      const model = loadedModelRef.current;
      if (!model) return;
      const newScale = Math.max(0.1, Math.min(3, modelScaleRef.current + dx * 0.01));
      const ratio = newScale / modelScaleRef.current;
      model.scale.multiplyScalar(ratio);
      modelScaleRef.current = newScale;
      // Reset position first so bbox is computed from origin — avoids world-space drift
      model.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x = -center.x;
      model.position.z = -center.z;
      model.position.y = -box.min.y;
    }, []);

    const onRotateDrag = useCallback((dx: number, dy: number) => {
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;
      if (!cam || !ctrl) return;
      const offset = new THREE.Vector3().subVectors(cam.position, ctrl.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      sph.theta -= dx * 0.01;
      sph.phi = Math.max(0.01, Math.min(Math.PI - 0.01, sph.phi - dy * 0.01));
      offset.setFromSpherical(sph);
      cam.position.copy(ctrl.target).add(offset);
      cam.lookAt(ctrl.target);
      ctrl.update();
    }, []);

    const onFovDrag = useCallback((dx: number, _dy: number) => {
      const cam = cameraRef.current;
      if (!cam) return;
      cam.fov = Math.max(20, Math.min(90, cam.fov + dx * 0.3));
      cam.updateProjectionMatrix();
    }, []);

    useImperativeHandle(ref, () => ({
      onScaleDrag,
      onRotateDrag,
      onFovDrag,
      commit,
    }), [onScaleDrag, onRotateDrag, onFovDrag, commit]);

    // Setup Three.js scene
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const params = node.model3dParams ?? DEFAULT_MODEL3D_PARAMS;
      // Render Three.js at native (undistorted) dimensions. The canvas element
      // uses h-full w-full so the browser CSS-stretches the framebuffer to fill
      // the overlay div, giving a live preview of how the stretch will look.
      const nativeW = params.nativeWidth ?? Math.round(screenRect.width);
      const nativeH = params.nativeHeight ?? Math.round(screenRect.height);

      const scene = new THREE.Scene();
      scene.background = null;
      sceneRef.current = scene;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas,
      });
      renderer.setClearColor(0x000000, 0);
      // Pass false so Three.js does NOT update canvas.style.width/height — we let
      // Tailwind's h-full w-full CSS scale the native framebuffer to the overlay
      // div's dimensions, giving a live stretched/squished preview.
      renderer.setSize(nativeW, nativeH, false);
      rendererRef.current = renderer;

      const camera = new THREE.PerspectiveCamera(
        params.fov,
        nativeW / nativeH,
        0.1,
        1000,
      );
      camera.position.set(
        params.cameraPosition.x,
        params.cameraPosition.y,
        params.cameraPosition.z,
      );
      cameraRef.current = camera;

      const controls = new OrbitControls(camera, canvas);
      controls.target.set(
        params.cameraTarget.x,
        params.cameraTarget.y,
        params.cameraTarget.z,
      );
      controls.enabled = false; // interaction handled via scrub buttons
      controls.update();
      controlsRef.current = controls;

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 2);
      key.position.set(2, 10, 8);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 1.2);
      fill.position.set(-6, 6, -4);
      scene.add(fill);
      const front = new THREE.DirectionalLight(0xffffff, 1);
      front.position.set(0, 4, 10);
      scene.add(front);

      // Load model
      const loader = new GLTFLoader();
      loader.load(
        node.modelUrl!,
        (gltf) => {
          const model = gltf.scene;

          // Auto-fit + apply user scale
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fitScale = (2 / maxDim) * params.modelScale;
          model.scale.multiplyScalar(fitScale);

          const scaledBox = new THREE.Box3().setFromObject(model);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          model.position.x = -scaledCenter.x;
          model.position.z = -scaledCenter.z;
          model.position.y = -scaledBox.min.y;

          scene.add(model);
          loadedModelRef.current = model;
        },
        undefined,
        (err) => console.error("[Model3DOverlay] Failed to load model:", err),
      );

      // RAF loop
      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        controls.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            const mats = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            mats.forEach((m) => m?.dispose());
          }
        });
        renderer.dispose();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [node.modelUrl]);

    // Keyboard handler
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          commit();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [commit]);

    // Click-outside to commit
    const onOverlayPointerDown = (e: React.PointerEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(e.target as Element)
      ) {
        commit();
      }
    };

    return (
      // Full-viewport capture layer for click-outside detection
      <div
        className="pointer-events-auto fixed inset-0 z-50"
        onPointerDown={onOverlayPointerDown}
      >
        {/* Overlay card positioned over the Konva node, CSS-rotated to match */}
        <div
          ref={overlayRef}
          className="absolute overflow-hidden rounded-lg shadow-2xl"
          style={{
            left: screenRect.left,
            top: screenRect.top,
            width: screenRect.width,
            height: screenRect.height,
            transform: `rotate(${node.rotation ?? 0}deg)`,
            transformOrigin: "0 0",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{ display: "block" }}
          />
        </div>
      </div>
    );
  },
);
