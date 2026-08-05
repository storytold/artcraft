import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { SplatFileType, SplatMesh } from "@sparkjsdev/spark";

interface LoaderInterface {
  file: File;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  statusCallback: (statusObject: { type: string; message?: string }) => void;
  // Receives the model's baked AnimationClips (possibly empty) once loaded.
  onAnimations?: (clips: THREE.AnimationClip[]) => void;
  // Reports what the loaded model contains — hasMesh:false means a
  // skeleton/animation-only file (e.g. a Mixamo "without skin" export).
  onModelInfo?: (info: { hasMesh: boolean; hasBones: boolean }) => void;
}

interface PreviewReturn {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  // Switch the previewed animation: a clip index, or -1 for none (skinned
  // models rest in their bind/T-pose). No-op for animation-less models.
  selectAnimation: (index: number) => void;
  // Show/hide the skeleton overlay (rigged GLBs only; no-op otherwise).
  // Defaults visible for mesh-less models so there's something to see.
  setSkeletonVisible: (visible: boolean) => void;
}

export const loadPreviewOnCanvas = ({
  file,
  canvas,
  statusCallback,
  onAnimationsAvailable,
  onModelInfo,
}: {
  file: File;
  canvas: HTMLCanvasElement;
  statusCallback: (error: { type: string; message?: string }) => void;
  // Called with the clips' display names when the loaded model has baked
  // animations (never called with an empty list). The first clip autoplays.
  onAnimationsAvailable?: (names: string[]) => void;
  // Reports model contents (GLB only) — used to preselect "Upload as
  // Animation" for mesh-less skeleton files and to offer the bone toggle.
  onModelInfo?: (info: { hasMesh: boolean; hasBones: boolean }) => void;
}): PreviewReturn => {
  const scene = new THREE.Scene();

  const width = canvas.getBoundingClientRect().width || 0;
  const height = canvas.getBoundingClientRect().height || 0;
  const aspectRatio = width / height;

  const camera = new THREE.PerspectiveCamera(35, aspectRatio, 0.1, 1000);
  camera.position.z = 2;

  const gl2ctx = canvas.getContext("webgl2", { preserveDrawingBuffer: true });

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
    context: gl2ctx!,
  });

  renderer.setSize(width, height);

  const color = 0xfcece7;
  const light = new THREE.HemisphereLight(color, 0x8d8d8d, 3.0);

  const frontLight = new THREE.DirectionalLight(0xffffff, 2);
  frontLight.position.set(0, 0, 10);
  scene.add(frontLight);

  scene.add(light);

  let splatMesh: SplatMesh | null = null;

  // Animation playback state for GLBs with baked clips. The mixer is rooted
  // at the preview scene (the GLB's children are re-parented into it) — clip
  // tracks resolve their nodes by name, so binding still works.
  const clock = new THREE.Clock();
  let mixer: THREE.AnimationMixer | null = null;
  let clips: THREE.AnimationClip[] = [];

  const selectAnimation = (index: number) => {
    if (!mixer) return;
    mixer.stopAllAction();
    if (index >= 0) {
      const clip = clips[index];
      if (clip) mixer.clipAction(clip).reset().play();
    } else {
      // "None": rest skinned models in their bind (T) pose — a stopped
      // action would freeze the skeleton on its last evaluated frame.
      scene.traverse((child) => {
        const skinned = child as THREE.SkinnedMesh;
        if (skinned.isSkinnedMesh && skinned.skeleton) skinned.skeleton.pose();
      });
    }
  };

  // Skeleton overlay for rigged GLBs, shown by default when the model has
  // no mesh (skeleton/animation-only exports would otherwise be invisible).
  let skeletonHelper: THREE.SkeletonHelper | null = null;
  const setSkeletonVisible = (visible: boolean) => {
    if (skeletonHelper) skeletonHelper.visible = visible;
  };

  if (file.name.endsWith(".glb")) {
    glbLoader({
      file,
      scene,
      camera,
      renderer,
      statusCallback,
      onModelInfo: (info) => {
        if (info.hasBones) {
          skeletonHelper = new THREE.SkeletonHelper(scene);
          skeletonHelper.visible = !info.hasMesh;
          scene.add(skeletonHelper);
        }
        onModelInfo?.(info);
      },
      onAnimations: (loadedClips) => {
        clips = loadedClips;
        if (clips.length === 0) return;
        mixer = new THREE.AnimationMixer(scene);
        mixer.clipAction(clips[0]).play(); // autoplay the first clip
        onAnimationsAvailable?.(
          clips.map((clip, index) => clip.name || `Clip ${index + 1}`),
        );
      },
    });
  } else if (file.name.endsWith(".pmd")) {
    pmdLoader({ file, scene, camera, renderer, statusCallback });
  } else if (
    file.name.endsWith(".png") ||
    file.name.endsWith(".jpg") ||
    file.name.endsWith(".jpeg") ||
    file.name.endsWith(".gif")
  ) {
    imagePlaneLoader({ file, scene, camera, renderer, statusCallback });
  } else if (file.name.endsWith(".spz")) {
    file
      .arrayBuffer()
      .then((arrayBuffer) => {
        splatMesh = new SplatMesh({
          fileBytes: arrayBuffer,
          fileType: SplatFileType.SPZ,
          onLoad: () => {
            scene.add(splatMesh!);
          },
        });

        if (file.name.split(".")[0].endsWith("ceramic")) {
          splatMesh.rotateX(Math.PI);
          splatMesh.rotateZ(Math.PI);
        }
      })
      .catch((loaderError) => {
        statusCallback({
          type: "SPLAT Loader Error",
          message: String(loaderError),
        });
      });
  } else if (file.name.endsWith(".vmd")) {
    statusCallback({
      type: "Preview Error",
      message: "Sorry, Preview is not available to VMD files yet",
    });
  } else {
    statusCallback({
      type: "Preview Error",
      message: "Unknown file type for loader",
    });
  }

  const animate = function () {
    // Tick the clock every frame (not just when a mixer exists) so the first
    // mixer update doesn't get a giant delta.
    const delta = clock.getDelta();
    mixer?.update(delta);
    renderer.render(scene, camera);
    splatMesh?.rotateY(0.01);
  };
  renderer.setAnimationLoop(animate);

  return { renderer, camera, selectAnimation, setSkeletonVisible };
};

const glbLoader = ({
  file,
  camera,
  scene,
  renderer,
  statusCallback,
  onAnimations,
  onModelInfo,
}: LoaderInterface) => {
  const loader = new GLTFLoader();
  loader.load(
    URL.createObjectURL(file),
    (data) => {
      // Inspect BEFORE re-parenting (the loop below moves children out of
      // data.scene).
      let hasMesh = false;
      let hasBones = false;
      data.scene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) hasMesh = true;
        if ((node as THREE.Bone).isBone) hasBones = true;
      });

      // Iterate a COPY: scene.add() re-parents the child, which mutates
      // data.scene.children mid-loop and would skip every other child.
      [...data.scene.children].forEach((child) => {
        child.userData["color"] = "#FFFFFF";
        scene.add(child);
      });

      // Fit the camera once, after ALL children are in. Mesh geometry
      // drives the framing; mesh-less skeleton exports fall back to bone
      // world positions so an empty box can never NaN the camera math.
      const box = new THREE.Box3();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.computeBoundingBox();
          box.expandByObject(object);
        }
      });
      if (box.isEmpty()) {
        scene.updateMatrixWorld(true);
        const point = new THREE.Vector3();
        scene.traverse((node) => {
          if ((node as THREE.Bone).isBone) {
            box.expandByPoint(node.getWorldPosition(point));
          }
        });
      }
      if (!box.isEmpty()) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        const radius = Math.max(size.x, size.y, size.z) * 0.5;

        const fov = camera.fov * (Math.PI / 180);
        const distance = (radius * 1.2) / Math.tan(fov * 0.5);

        camera.position.set(
          center.x + distance * 0.6,
          center.y + distance * 0.4,
          center.z + distance * 0.6,
        );
        camera.lookAt(center);

        camera.near = distance * 0.01;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
      statusCallback({
        type: "OK",
        message: "Preview should be available",
      });

      // AFTER the model is in the preview scene: the mixer's property
      // bindings resolve nodes under `scene`, so wiring animations any
      // earlier binds against an empty graph and silently plays nothing.
      onAnimations?.(data.animations ?? []);
      onModelInfo?.({ hasMesh, hasBones });
    },
    undefined,
    (loaderError) => {
      statusCallback({
        type: "GLB Loader Error",
        message: String(loaderError),
      });
    },
  );
};

const pmdLoader = ({
  camera,
  scene,
  renderer,
  statusCallback,
}: LoaderInterface) => {
  camera.position.z = 30;
  const loader = new FontLoader();
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const textGeometry = new TextGeometry("MMD", {
        font: font,
        size: 100,
        depth: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 5,
      });
      textGeometry.computeBoundingBox();
      const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.scale.set(0.15, 0.15, 0.01);
      textMesh.position.set(-22, -5, 0);
      scene.add(textMesh);
      renderer.render(scene, camera);
      statusCallback({
        type: "OK",
        message: "Preview should be available",
      });
    },
    undefined,
    (loaderError) => {
      statusCallback({
        type: "PMD Loader Error",
        message: String(loaderError),
      });
    },
  );
};

const imagePlaneLoader = ({ file, scene, statusCallback }: LoaderInterface) => {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    URL.createObjectURL(file),
    undefined,
    undefined,
    (loaderError) => {
      statusCallback({
        type: "Image Plane Loader Error",
        message: String(loaderError),
      });
    },
  );
  texture.colorSpace = THREE.SRGBColorSpace;

  const image_material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: texture,
  });
  const obj = new THREE.Mesh(geometry, image_material);
  obj.receiveShadow = true;
  obj.castShadow = true;
  scene.add(obj);
  statusCallback({
    type: "OK",
    message: "Preview should be available",
  });
};
