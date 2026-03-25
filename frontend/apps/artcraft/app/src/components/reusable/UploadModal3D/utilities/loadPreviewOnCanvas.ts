import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { SplatFileType, SplatMesh } from "@sparkjsdev/spark";
import { SPLAT_FILE_TYPE } from "~/enums";

interface LoaderInterface {
  file: File;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  statusCallback: (statusObject: { type: string; message?: string }) => void;
}

interface PreviewReturn {
  renderer: THREE.WebGLRenderer;
}

export const loadPreviewOnCanvas = ({
  file,
  canvas,
  statusCallback,
}: {
  file: File;
  canvas: HTMLCanvasElement;
  statusCallback: (error: { type: string; message?: string }) => void;
}): PreviewReturn => {
  // Setup of scene, camera, and renderer in the canvas
  const scene = new THREE.Scene();

  // Calculate proper aspect ratio from canvas dimensions
  const width = canvas.getBoundingClientRect().width || 0;
  const height = canvas.getBoundingClientRect().height || 0;
  const aspectRatio = width / height;

  // Reduce FOV to make objects appear larger
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

  // Add some additional lighting to better show the model
  const frontLight = new THREE.DirectionalLight(0xffffff, 2);
  frontLight.position.set(0, 0, 10);
  scene.add(frontLight);

  scene.add(light);

  let splatMesh: SplatMesh | null = null;

  // load the file into the preview mini-scene depending of the file's type
  if (file.name.endsWith(".glb")) {
    glbLoader({ file, scene, camera, renderer, statusCallback });
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

  // Render the loaded data
  const animate = function () {
    renderer.render(scene, camera);
    splatMesh?.rotateY(0.01);
  };
  renderer.setAnimationLoop(animate);

  return { renderer };
};

const glbLoader = ({
  file,
  camera,
  scene,
  renderer,
  statusCallback,
}: LoaderInterface) => {
  const loader = new GLTFLoader();
  loader.load(
    URL.createObjectURL(file),
    (data) => {
      data.scene.children.forEach((child) => {
        child.userData["color"] = "#FFFFFF";
        scene.add(child);

        // Calculate bounding box for all objects in the scene
        const box = new THREE.Box3();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.computeBoundingBox();
            box.expandByObject(object);
          }
        });

        // Get the center and size of the bounding box
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Calculate the radius of the bounding sphere
        const radius = Math.max(size.x, size.y, size.z) * 0.5;

        // Position camera to fit the object in view with minimal padding
        const fov = camera.fov * (Math.PI / 180);
        const distance = (radius * 1.2) / Math.tan(fov * 0.5);

        // Position camera at a better angle for preview
        camera.position.set(
          center.x + distance * 0.6,
          center.y + distance * 0.4,
          center.z + distance * 0.6,
        );
        camera.lookAt(center);

        // Adjust the camera's near and far planes to ensure the model is visible
        camera.near = distance * 0.01;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
        statusCallback({
          type: "OK",
          message: "Preview should be available",
        });
      });
    },
    undefined, // nothing to-do onProgress
    (loaderError) => {
      /*onError*/
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
    undefined, // nothing on Progress
    (loaderError) => {
      /*onError*/
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
    undefined, // nothing to-do onLoad
    undefined, // nothing to-do onProgress
    (loaderError) => {
      /*onError*/
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
