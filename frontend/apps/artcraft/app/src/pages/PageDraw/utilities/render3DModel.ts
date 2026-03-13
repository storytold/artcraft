import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface Model3DParams {
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  fov: number;
  modelScale: number;
  /** Native render dimensions — the undistorted pixel size for this 3D model.
   *  Stored once on first drop and preserved across re-edits. When the Konva
   *  node is stretched, the overlay renders at these native dims and Konva
   *  CSS-stretches the result to match the node's frame, preserving the stretch. */
  nativeWidth: number;
  nativeHeight: number;
}

export const DEFAULT_MODEL3D_PARAMS: Model3DParams = {
  cameraPosition: { x: 1.5, y: 1.5, z: 1.5 },
  cameraTarget: { x: 0, y: 0.4, z: 0 },
  fov: 50,
  modelScale: 1,
  nativeWidth: 512,
  nativeHeight: 512,
};

function buildScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
} {
  const scene = new THREE.Scene();
  scene.background = null; // transparent

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.set(1.5, 1.5, 1.5);
  camera.lookAt(0, 0.4, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

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

  return { scene, camera, renderer };
}

function normalizeAndPlaceModel(
  model: THREE.Object3D,
  modelScale: number,
): void {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitScale = (2 / maxDim) * modelScale;
  model.scale.multiplyScalar(fitScale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
  model.position.x = -scaledCenter.x;
  model.position.z = -scaledCenter.z;
  model.position.y = -scaledBox.min.y;
}

function disposeScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
): void {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m?.dispose());
    }
  });
  renderer.dispose();
}

export async function render3DModelToDataUrl(
  modelUrl: string,
  params: Model3DParams,
  width = 512,
  height = 512,
): Promise<string> {
  const { scene, camera, renderer } = buildScene();
  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.fov = params.fov;
  camera.position.set(
    params.cameraPosition.x,
    params.cameraPosition.y,
    params.cameraPosition.z,
  );
  camera.lookAt(
    params.cameraTarget.x,
    params.cameraTarget.y,
    params.cameraTarget.z,
  );
  camera.updateProjectionMatrix();

  return new Promise<string>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        normalizeAndPlaceModel(model, params.modelScale);
        scene.add(model);

        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL("image/png");

        disposeScene(scene, renderer);
        resolve(dataUrl);
      },
      undefined,
      (error) => {
        disposeScene(scene, renderer);
        reject(error);
      },
    );
  });
}
