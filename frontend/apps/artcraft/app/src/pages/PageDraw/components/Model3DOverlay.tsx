import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Konva from "konva";
import { Node } from "../Node";
import {
  Model3DParams,
  DEFAULT_MODEL3D_PARAMS,
} from "../utilities/render3DModel";

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

export function Model3DOverlay({
  node,
  stageRef,
  onCommit,
  onDismiss,
}: Model3DOverlayProps) {
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
    if (!cam || !ctrl) return node.model3dParams ?? DEFAULT_MODEL3D_PARAMS;
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

    // Render at the node's native pixel dimensions for the committed bitmap
    const pixelWidth = Math.round(node.width * (node.scaleX ?? 1));
    const pixelHeight = Math.round(node.height * (node.scaleY ?? 1));
    renderer.setSize(pixelWidth, pixelHeight);
    camera.aspect = pixelWidth / pixelHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);

    const dataUrl = renderer.domElement.toDataURL("image/png");
    const params = captureParams();
    onCommit(dataUrl, params);
  }, [node, captureParams, onCommit, onDismiss]);

  // Setup Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const params = node.model3dParams ?? DEFAULT_MODEL3D_PARAMS;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(Math.round(screenRect.width), Math.round(screenRect.height));
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(
      params.fov,
      screenRect.width / screenRect.height,
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
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
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
      controls.update();
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

  const onFovChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fov = Number(e.target.value);
    if (cameraRef.current) {
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const onScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(e.target.value);
    const model = loadedModelRef.current;
    if (!model) return;

    // Multiply by ratio to go from old world scale to new world scale
    const ratio = newScale / modelScaleRef.current;
    model.scale.multiplyScalar(ratio);
    modelScaleRef.current = newScale;

    // Re-center after scale change
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    model.position.x = -scaledCenter.x;
    model.position.z = -scaledCenter.z;
    model.position.y = -scaledBox.min.y;
  };

  const currentParams = node.model3dParams ?? DEFAULT_MODEL3D_PARAMS;

  return (
    // Full-viewport capture layer for click-outside detection
    <div
      className="pointer-events-auto fixed inset-0 z-50"
      onPointerDown={onOverlayPointerDown}
    >
      {/* Overlay card positioned over the Konva node */}
      <div
        ref={overlayRef}
        className="absolute overflow-hidden rounded-lg shadow-2xl"
        style={{
          left: screenRect.left,
          top: screenRect.top,
          width: screenRect.width,
          height: screenRect.height,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Three.js canvas */}
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ display: "block" }}
        />

        {/* Controls panel at the bottom of the overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-black/60 px-3 py-2 text-xs text-white"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <label className="flex items-center gap-1 whitespace-nowrap">
            <span>FOV</span>
            <input
              type="range"
              min={20}
              max={90}
              step={1}
              defaultValue={currentParams.fov}
              onChange={onFovChange}
              className="w-20 accent-blue-400"
            />
          </label>
          <label className="flex items-center gap-1 whitespace-nowrap">
            <span>Scale</span>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.05}
              defaultValue={currentParams.modelScale}
              onChange={onScaleChange}
              className="w-20 accent-blue-400"
            />
          </label>
          <button
            onClick={commit}
            className="ml-auto rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-400"
          >
            ✓ Apply
          </button>
        </div>

        {/* Hint text at the top */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 bg-black/50 px-3 py-1 text-center text-xs text-white/70">
          Drag to rotate · Scroll to zoom · Esc or click outside to apply
        </div>
      </div>
    </div>
  );
}
