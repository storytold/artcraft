import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface Viewer3DProps {
  modelUrl?: string;
  previewUrl?: string;
  isActive?: boolean;
  className?: string;
  showGrid?: boolean;
  onThumbnailCapture?: (dataUrl: string) => void;
}

export function Viewer3D({
  modelUrl,
  previewUrl,
  isActive,
  className = "",
  showGrid = true,
  onThumbnailCapture,
}: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const loadedModelRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const thumbnailCapturedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Use ResizeObserver for more reliable size detection
    const initScene = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) return false;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x282828);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(3, 3, 3);
      camera.lookAt(0, 0.5, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 0.5, 0);
      controls.update();
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(0xffffff, 2);
      scene.add(ambientLight);

      const hemisphereLight = new THREE.HemisphereLight(
        0xffffff,
        0x888888,
        1.2
      );
      scene.add(hemisphereLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2);
      keyLight.position.set(2, 10, 8);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
      fillLight.position.set(-6, 6, -4);
      scene.add(fillLight);

      const frontLight = new THREE.DirectionalLight(0xffffff, 1);
      frontLight.position.set(0, 4, 10);
      scene.add(frontLight);

      const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x333333);
      gridHelper.visible = showGrid;
      scene.add(gridHelper);
      gridRef.current = gridHelper;

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4a9eff,
        roughness: 0.5,
        metalness: 0.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = 0.5;
      scene.add(cube);
      cubeRef.current = cube;

      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        if (cubeRef.current) {
          cubeRef.current.rotation.y += 0.01;
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return true;
    };

    // Try to initialize, retry if container not ready
    let initialized = initScene();
    let retryTimeout: number | null = null;

    if (!initialized) {
      retryTimeout = window.setTimeout(() => {
        initialized = initScene();
      }, 100);
    }

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Also listen to window resize as backup
    window.addEventListener("resize", handleResize);

    return () => {
      if (retryTimeout) window.clearTimeout(retryTimeout);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (
        rendererRef.current &&
        container.contains(rendererRef.current.domElement)
      ) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();

      if (cubeRef.current) {
        const cube = cubeRef.current;
        if (cube.geometry) cube.geometry.dispose();
        if (cube.material) {
          if (Array.isArray(cube.material)) {
            cube.material.forEach((m) => m.dispose());
          } else {
            cube.material.dispose();
          }
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;

    console.log("[Viewer3D] Loading model from URL:", modelUrl);
    setIsModelLoaded(false);
    thumbnailCapturedRef.current = false;

    const scene = sceneRef.current;
    const loader = new GLTFLoader();

    if (loadedModelRef.current) {
      console.log("[Viewer3D] Removing previous model");
      scene.remove(loadedModelRef.current);
      loadedModelRef.current = null;
    }

    if (cubeRef.current) {
      cubeRef.current.visible = false;
    }

    loader.load(
      modelUrl,
      (gltf) => {
        console.log("[Viewer3D] Model loaded successfully");
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.multiplyScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        const scaledSize = scaledBox.getSize(new THREE.Vector3());

        model.position.x = -scaledCenter.x;
        model.position.z = -scaledCenter.z;
        model.position.y = -scaledBox.min.y;

        scene.add(model);
        loadedModelRef.current = model;
        setIsModelLoaded(true);

        const modelHeight = scaledSize.y;
        const maxModelDim = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);

        // Calculate distance needed to fit the model based on camera FOV (50 degrees)
        const fov = 50;
        const fovRad = (fov * Math.PI) / 180;
        const fitDistance = maxModelDim / 2 / Math.tan(fovRad / 2);

        // Add padding (1.4x) to ensure model isn't touching edges
        const cameraDistance = fitDistance * 1.4;

        if (cameraRef.current && controlsRef.current) {
          // Position camera at 45-degree angle
          const angle = Math.PI / 4;
          cameraRef.current.position.set(
            Math.sin(angle) * cameraDistance,
            modelHeight * 0.5 + cameraDistance * 0.35,
            Math.cos(angle) * cameraDistance
          );
          controlsRef.current.target.set(0, modelHeight * 0.4, 0);
          controlsRef.current.update();
        }

        // Capture thumbnail after a short delay to ensure rendering is complete
        if (onThumbnailCapture && !thumbnailCapturedRef.current) {
          thumbnailCapturedRef.current = true;
          setTimeout(() => {
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
              // Temporarily hide grid for thumbnail
              if (gridRef.current) {
                gridRef.current.visible = false;
              }
              // Also hide placeholder cube
              if (cubeRef.current) {
                cubeRef.current.visible = false;
              }

              // Render and capture
              rendererRef.current.render(sceneRef.current, cameraRef.current);
              const dataUrl =
                rendererRef.current.domElement.toDataURL("image/png");
              onThumbnailCapture(dataUrl);

              // Restore grid visibility
              if (gridRef.current) {
                gridRef.current.visible = showGrid;
              }
            }
          }, 100);
        }
      },
      (progress) => {
        console.log(
          "[Viewer3D] Loading progress:",
          ((progress.loaded / progress.total) * 100).toFixed(2) + "%"
        );
      },
      (error) => {
        console.error("[Viewer3D] Error loading model:", error);
        if (cubeRef.current) {
          cubeRef.current.visible = true;
        }
      }
    );

    return () => {
      if (loadedModelRef.current && sceneRef.current) {
        sceneRef.current.remove(loadedModelRef.current);
        loadedModelRef.current = null;
      }
    };
  }, [modelUrl, onThumbnailCapture, showGrid]);

  // Update grid visibility when prop changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
    }
  }, [showGrid]);

  const showViewer = modelUrl && isModelLoaded;
  const showSpinner = !showViewer;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl bg-[#282828] ${className}`}
    >
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/20 border-t-primary" />
        </div>
      )}

      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ visibility: showViewer ? "visible" : "hidden" }}
      />
    </div>
  );
}

export default Viewer3D;
