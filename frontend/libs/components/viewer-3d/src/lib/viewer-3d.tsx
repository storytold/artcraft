import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface Viewer3DProps {
  modelUrl?: string;
  previewUrl?: string;
  isActive?: boolean;
  className?: string;
}

export function Viewer3D({
  modelUrl,
  previewUrl,
  isActive,
  className = "",
}: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Use ResizeObserver for more reliable size detection
    const initScene = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) return false;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
      scene.add(gridHelper);

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

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl bg-black/20 ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" />

      {isActive && (
        <div className="absolute bottom-4 right-4 rounded bg-black/60 px-2 py-1 text-xs font-bold text-white/70">
          INTERACTIVE VIEW
        </div>
      )}
    </div>
  );
}

export default Viewer3D;
