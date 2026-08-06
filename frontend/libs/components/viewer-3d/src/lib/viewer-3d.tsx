import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SplatMesh } from "@sparkjsdev/spark";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBone } from "@fortawesome/pro-solid-svg-icons";
import { Select } from "@storyteller/ui-select";
import {
  NodeHierarchyHelper,
  createRigHelper,
} from "./NodeHierarchyHelper";

// Dropdown value for the "no animation" choice (models rest in their bind /
// T-pose). Clip values are their stringified index.
const NO_ANIMATION_VALUE = "-1";

// Bounding box for camera framing. Geometry-less models (skeleton/animation-
// only exports) produce an EMPTY Box3 from setFromObject — which would NaN
// the camera math — so fall back to the bone world positions, then to a
// humanoid-ish default so framing always succeeds.
const computeModelBox = (target: THREE.Object3D): THREE.Box3 => {
  const box = new THREE.Box3().setFromObject(target);
  if (box.isEmpty()) {
    target.updateMatrixWorld(true);
    const point = new THREE.Vector3();
    target.traverse((node) => {
      if ((node as THREE.Bone).isBone) {
        box.expandByPoint(node.getWorldPosition(point));
      }
    });
  }
  if (box.isEmpty()) {
    box.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1));
  }
  return box;
};

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
  showGrid = false,
  onThumbnailCapture,
}: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const loadedModelRef = useRef<THREE.Object3D | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const thumbnailCapturedRef = useRef(false);

  // Animation playback for models that ship clips. The dropdown only renders
  // when the loaded model actually has animations; the first clip autoplays.
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clipsRef = useRef<THREE.AnimationClip[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [selectedClip, setSelectedClip] = useState(-1);

  // Skeleton overlay for rigged models. Defaults ON for mesh-less models
  // (skeleton/animation-only exports would otherwise render nothing). Real
  // bones get THREE.SkeletonHelper; converted mesh-less exports (whose
  // joints re-import as plain nodes — GLTF only round-trips bone-ness via a
  // skin) get the generic NodeHierarchyHelper.
  const skeletonHelperRef = useRef<
    THREE.SkeletonHelper | NodeHierarchyHelper | null
  >(null);
  const [hasRig, setHasRig] = useState(false);
  const [skeletonVisible, setSkeletonVisible] = useState(false);

  const stopAnimations = () => {
    mixerRef.current?.stopAllAction();
    mixerRef.current = null;
    clipsRef.current = [];
  };

  const removeSkeletonHelper = () => {
    const helper = skeletonHelperRef.current;
    if (helper) {
      sceneRef.current?.remove(helper);
      helper.dispose();
      skeletonHelperRef.current = null;
    }
  };

  // Rest pose for skinned models when "no animation" is chosen — a stopped
  // action would otherwise freeze the skeleton on its last evaluated frame.
  const restoreBindPose = (model: THREE.Object3D) => {
    model.traverse((child) => {
      const skinned = child as THREE.SkinnedMesh;
      if (skinned.isSkinnedMesh && skinned.skeleton) skinned.skeleton.pose();
    });
  };

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
        1.2,
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

      const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
      gridHelper.material.opacity = 0.05;
      gridHelper.material.transparent = true;
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

        // Tick the clock every frame (not just when a mixer exists) so the
        // first mixer update after a model loads doesn't get a giant delta.
        const delta = clockRef.current.getDelta();
        mixerRef.current?.update(delta);

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

    if (loadedModelRef.current) {
      console.log("[Viewer3D] Removing previous model");
      scene.remove(loadedModelRef.current);
      loadedModelRef.current = null;
    }
    stopAnimations();
    removeSkeletonHelper();
    setAnimationNames([]);
    setSelectedClip(-1);
    setHasRig(false);
    setSkeletonVisible(false);

    if (cubeRef.current) {
      cubeRef.current.visible = false;
    }

    const onModelLoaded = (model: THREE.Object3D) => {
      const box = computeModelBox(model);
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.multiplyScalar(scale);

      const scaledBox = computeModelBox(model);
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
          Math.cos(angle) * cameraDistance,
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
    };

    // Route by the URL's file extension, ignoring query strings / hashes
    // (plain endsWith broke on CDN URLs with query params). Gaussian-splat
    // formats go to Spark's SplatMesh; glTF goes to GLTFLoader; other model
    // formats (obj/fbx/pmx…) have no loader here — show the fallback shape
    // instead of letting GLTFLoader choke trying to JSON.parse binary data.
    let urlExtension = "";
    try {
      const pathname = new URL(modelUrl, window.location.href).pathname;
      urlExtension = (pathname.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
    } catch {
      // Unparseable URL — fall through to the GLTF attempt below.
    }
    const SPLAT_EXTENSIONS = ["spz", "ply", "splat", "ksplat"];
    const GLTF_EXTENSIONS = ["glb", "gltf", ""];

    if (SPLAT_EXTENSIONS.includes(urlExtension)) {
      console.log(`[Viewer3D] splat format detected (.${urlExtension})`);
      new SplatMesh({
        url: modelUrl,
        onLoad: (mesh) => {
          mesh.rotation.z = Math.PI;
          mesh.position.y = 1;
          scene.add(mesh);
          loadedModelRef.current = mesh;
          setIsModelLoaded(true);

          if (cameraRef.current && controlsRef.current) {
            const angle = Math.PI / 4;
            const cameraDistance = 1.2;
            cameraRef.current.position.set(
              Math.sin(angle) * cameraDistance,
              1.0,
              Math.cos(angle) * cameraDistance,
            );
            controlsRef.current.target.set(0, 1, 0);
            controlsRef.current.update();
          }

          console.log("Splat loaded");
        },
      });
    } else if (!GLTF_EXTENSIONS.includes(urlExtension)) {
      // Known non-glTF model format with no loader wired here (obj, fbx,
      // pmx, …). Show the fallback shape rather than spamming a parse error.
      console.warn(
        `[Viewer3D] unsupported model format ".${urlExtension}" — showing placeholder`,
      );
      if (cubeRef.current) {
        cubeRef.current.visible = true;
      }
    } else {
      const loader = new GLTFLoader();
      // Anonymous CORS keeps the WebGL canvas untainted so thumbnail capture
      // (offscreen toDataURL elsewhere) works on models loaded from the CDN.
      loader.setCrossOrigin("anonymous");
      loader.load(
        modelUrl,
        (gltf) => {
          console.log("[Viewer3D] Model loaded successfully");
          const model = gltf.scene;
          onModelLoaded(model);
          // Wire up any clips the model ships with; autoplay the first one.
          const clips = gltf.animations ?? [];
          if (clips.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            mixerRef.current = mixer;
            clipsRef.current = clips;
            mixer.clipAction(clips[0]).play();
            setAnimationNames(
              clips.map((clip, index) => clip.name || `Clip ${index + 1}`),
            );
            setSelectedClip(0);
          }
          // Skeleton overlay: offered for any model with real bones, and for
          // any MESH-LESS model regardless (its joints may have re-imported
          // as plain nodes — without the overlay there is nothing to see).
          // Shown by default only in the mesh-less case.
          let modelHasBones = false;
          let modelHasMesh = false;
          model.traverse((node) => {
            if ((node as THREE.Bone).isBone) modelHasBones = true;
            if ((node as THREE.Mesh).isMesh) modelHasMesh = true;
          });
          if (modelHasBones || !modelHasMesh) {
            const helper = createRigHelper(model);
            helper.visible = !modelHasMesh;
            scene.add(helper);
            skeletonHelperRef.current = helper;
            setHasRig(true);
            setSkeletonVisible(!modelHasMesh);
          }
        },
        (progress) => {
          console.log(
            "[Viewer3D] Loading progress:",
            ((progress.loaded / progress.total) * 100).toFixed(2) + "%",
          );
        },
        (error) => {
          console.error("[Viewer3D] Error loading model:", error);
          if (cubeRef.current) {
            cubeRef.current.visible = true;
          }
        },
      );
    }

    return () => {
      stopAnimations();
      removeSkeletonHelper();
      if (loadedModelRef.current && sceneRef.current) {
        sceneRef.current.remove(loadedModelRef.current);
        loadedModelRef.current = null;
      }
    };
  }, [modelUrl, onThumbnailCapture, showGrid]);

  // Reflect the toggle onto the helper.
  useEffect(() => {
    if (skeletonHelperRef.current) {
      skeletonHelperRef.current.visible = skeletonVisible;
    }
  }, [skeletonVisible]);

  // Switch the playing clip when the dropdown changes. The load path starts
  // clip 0 directly, so this only needs to handle user switches.
  useEffect(() => {
    const mixer = mixerRef.current;
    const model = loadedModelRef.current;
    if (!mixer) return;
    mixer.stopAllAction();
    if (selectedClip >= 0) {
      const clip = clipsRef.current[selectedClip];
      if (clip) mixer.clipAction(clip).reset().play();
    } else if (model) {
      restoreBindPose(model);
    }
  }, [selectedClip]);

  // Update grid visibility when prop changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
    }
  }, [showGrid]);

  const showViewer = modelUrl && isModelLoaded;
  const showSpinner = !showViewer;

  const stopPropagation = (
    e: React.MouseEvent | React.WheelEvent | React.PointerEvent,
  ) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-l-xl bg-[#282828] ${className}`}
      onMouseDown={stopPropagation}
      onMouseMove={stopPropagation}
      onMouseUp={stopPropagation}
      onWheel={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      onContextMenu={stopPropagation}
    >
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/20 border-t-primary" />
        </div>
      )}

      {/* Top-right controls: skeleton overlay toggle (rigged models) and
          the animation picker (models that ship clips). Models with
          neither get no extra chrome. */}
      {showViewer && (hasRig || animationNames.length > 0) && (
        <div className="absolute right-2.5 top-2.5 z-20 flex items-start gap-2">
          {hasRig && (
            <button
              type="button"
              title={skeletonVisible ? "Hide skeleton" : "Show skeleton"}
              onClick={() => setSkeletonVisible((visible) => !visible)}
              className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                skeletonVisible
                  ? "border-primary bg-primary/20 text-white"
                  : "border-ui-controls-border bg-ui-controls text-white/70 hover:text-white"
              }`}
            >
              <FontAwesomeIcon icon={faBone} />
            </button>
          )}
          {animationNames.length > 0 && (
            <div className="w-44">
              <Select
                value={String(selectedClip)}
                onChange={(value) => setSelectedClip(Number(value))}
                options={[
                  ...animationNames.map((name, index) => ({
                    label: name,
                    value: String(index),
                  })),
                  { label: "T-pose (none)", value: NO_ANIMATION_VALUE },
                ]}
              />
            </div>
          )}
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
