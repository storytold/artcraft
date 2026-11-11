import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { disposeObject3D } from "@storyteller/ui-viewer-3d";

const THUMBNAIL_SIZE = 512;
const FOV = 50;
const LOAD_TIMEOUT_MS = 30000;

// Offscreen thumbnail capture: loads the model into a throwaway renderer,
// renders one square frame and returns it as a PNG data URL (null on
// failure or timeout). The renderer, its WebGL context and the model are
// freed exactly once, whichever of load, error or timeout comes first.
export async function captureModelThumbnail(
  modelUrl: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x282828);

      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000); // Aspect ratio 1 for square

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
      renderer.setPixelRatio(1);

      addLights(scene);

      let done = false;
      const finish = (dataUrl: string | null) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        disposeObject3D(scene);
        renderer.dispose();
        // The renderer's canvas is never attached, so nothing else can use
        // this context; release it now instead of at garbage collection.
        renderer.forceContextLoss();
        resolve(dataUrl);
      };

      const timeout = setTimeout(() => finish(null), LOAD_TIMEOUT_MS);

      const loader = new GLTFLoader();
      // Without anonymous CORS the GLTF + textures taint the WebGL canvas, so
      // toDataURL() below throws a SecurityError and the thumbnail is lost.
      loader.setCrossOrigin("anonymous");
      loader.load(
        modelUrl,
        (gltf) => {
          // Timed out already: the renderer is gone, just free the model.
          if (done) {
            disposeObject3D(gltf.scene);
            return;
          }
          const model = gltf.scene;
          const modelHeight = fitModel(model);
          scene.add(model);
          frameCamera(camera, model, modelHeight);

          // Render and capture
          renderer.render(scene, camera);
          let dataUrl: string | null = null;
          try {
            dataUrl = renderer.domElement.toDataURL("image/png");
          } catch (err) {
            // A tainted canvas (CORS) throws SecurityError here. Log so the
            // failure is diagnosable instead of silently producing no thumbnail.
            console.warn(
              "[captureModelThumbnail] toDataURL failed (likely CORS taint):",
              err,
            );
          }
          finish(dataUrl);
        },
        undefined,
        (error) => {
          console.error("[captureModelThumbnail] Error loading model:", error);
          finish(null);
        },
      );
    } catch (error) {
      console.error("[captureModelThumbnail] Error:", error);
      resolve(null);
    }
  });
}

// Scale the model to a 2-unit max dimension and stand it centered on the
// origin. Returns its scaled height.
function fitModel(model: THREE.Object3D): number {
  const box = new THREE.Box3().setFromObject(model);
  const modelSize = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
  const scale = 2 / maxDim;
  model.scale.multiplyScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

  model.position.x = -scaledCenter.x;
  model.position.z = -scaledCenter.z;
  model.position.y = -scaledBox.min.y;

  return scaledBox.getSize(new THREE.Vector3()).y;
}

// Place the camera on a 45-degree diagonal, far enough to fit the model.
function frameCamera(
  camera: THREE.PerspectiveCamera,
  model: THREE.Object3D,
  modelHeight: number,
): void {
  const scaledSize = new THREE.Box3()
    .setFromObject(model)
    .getSize(new THREE.Vector3());
  const maxModelDim = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);

  // Calculate distance needed to fit the model based on FOV
  // For a 45-degree camera angle, we view from a diagonal
  const fovRad = (FOV * Math.PI) / 180;
  const fitDistance = maxModelDim / 2 / Math.tan(fovRad / 2);

  // Add some padding (1.3x) and account for diagonal viewing angle
  const cameraDistance = fitDistance * 1.3;

  // Position camera at 45-degree angle
  const angle = Math.PI / 4; // 45 degrees
  camera.position.set(
    Math.sin(angle) * cameraDistance,
    modelHeight * 0.5 + cameraDistance * 0.4,
    Math.cos(angle) * cameraDistance,
  );
  camera.lookAt(0, modelHeight * 0.4, 0);
}

function addLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
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
}
