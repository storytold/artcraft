// three.js: the 3D library everything in this file is built on (scene, camera, lights, renderer, loaders).
import * as THREE from "three";
// Reads .glb files (the format the 3D uploader actually previews and uploads).
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// FontLoader + TextGeometry are used only by the dormant `.pmd` branch (see `pmdLoader` below and N-107 in BUGS.md).
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
// Spark: the third-party library that decodes and draws Gaussian-splat files (.spz). SparkRenderer is the object it
// adds to the scene to draw splats; SplatMesh is one loaded splat; SplatFileType names the file format.
import { SparkRenderer, SplatFileType, SplatMesh } from "@sparkjsdev/spark";
// Two helpers from the shared 3D viewer library: a line-drawing "skeleton" for models whose joints are plain nodes,
// and a function that frees every GPU resource held by a scene.
import { NodeHierarchyHelper, disposeObject3D } from "@storyteller/ui-viewer-3d";

// True once the splat library has put a sorted frame of the splats on screen.
// The library adds its own SparkRenderer to the scene on the first frame that contains a splat, sorts the splats in
// a worker, and only gives the renderer's viewpoint a `display` when the first sorted result comes back. Until then
// the splat is in the scene but nothing is drawn (measured in Chromium with Spark 0.1.10: about ten blank frames,
// roughly a third of a second, between the splat joining the scene and its first visible frame).
// (This is the check B-165 added; the animation loop at the bottom of `loadPreviewOnCanvas` calls it once per frame.)
const splatIsDisplayed = (scene: THREE.Scene): boolean => {
  // Assume "not yet" until the walk below finds a renderer that has a display.
  let displayed = false;
  // Visit every object in the scene (the lights, the splat, and Spark's own renderer object).
  scene.traverse((child) => {
    // Only Spark's renderer object matters, and only once its default viewpoint has a `display` (the first sorted frame).
    if (child instanceof SparkRenderer && child.defaultView.display !== null) displayed = true;
  });
  // Report the answer.
  return displayed;
};

// The bundle of inputs every format-specific loader function below (glb, pmd, image plane) receives.
interface LoaderInterface {
  // The file the user chose.
  file: File;
  // Blob URL for `file`, revoked when the preview is disposed.
  fileUrl: string;
  // The camera, scene and renderer the loader draws into (all owned by `loadPreviewOnCanvas`).
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  // How a loader tells the picker what happened: `type: "OK"` when the model is on screen, or an error type + message.
  statusCallback: (statusObject: { type: string; message?: string }) => void;
  // Receives the model's baked AnimationClips (possibly empty) once loaded.
  onAnimations?: (clips: THREE.AnimationClip[]) => void;
  // Reports what the loaded model contains — hasMesh:false means a
  // skeleton/animation-only file (e.g. a Mixamo "without skin" export).
  onModelInfo?: (info: { hasMesh: boolean; hasBones: boolean }) => void;
  // True once this preview has been superseded — async loader callbacks
  // must become no-ops (no renders on a disposed renderer, no status/UI
  // writes into the NEXT preview's state, no poisoned thumbnails).
  isCancelled?: () => boolean;
}

// What `loadPreviewOnCanvas` hands back to the picker: the handles it needs to drive the preview from its own UI.
interface PreviewReturn {
  // The renderer and camera, so the picker can take a cover snapshot (`thumbnailHelpers.ts`) from the canvas.
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  // Switch the previewed animation: a clip index, or -1 for none (skinned
  // models rest in their bind/T-pose). No-op for animation-less models.
  selectAnimation: (index: number) => void;
  // Show/hide the skeleton overlay (rigged GLBs only; no-op otherwise).
  // Defaults visible for mesh-less models so there's something to see.
  setSkeletonVisible: (visible: boolean) => void;
  // Call when a newer preview supersedes this one or the preview goes away
  // (effect cleanup): in-flight loads become no-ops, the animation loop
  // stops, and the scene, renderer and blob URL are freed.
  dispose: () => void;
}

// Draws a preview of `file` into `canvas` and returns handles to control and clean it up.
// Called from two places: `UploadFiles3D.tsx` (glb, or the GLB an FBX was converted to) and `UploadFilesSplat.tsx` (spz).
// The function is synchronous: it sets up the scene, starts the right loader for the file's extension, starts the
// animation loop, and returns. The model itself arrives later, and the loaders then report through `statusCallback`.
export const loadPreviewOnCanvas = ({
  file,
  canvas,
  statusCallback,
  onAnimationsAvailable,
  onModelInfo,
}: {
  // The file to preview.
  file: File;
  // The page's <canvas> element to draw into (it is reused from one file's preview to the next).
  canvas: HTMLCanvasElement;
  // Where "OK" / error messages go (the picker turns these into its preview status).
  statusCallback: (error: { type: string; message?: string }) => void;
  // Called with the clips' display names when the loaded model has baked
  // animations (never called with an empty list). The first clip autoplays.
  onAnimationsAvailable?: (names: string[]) => void;
  // Reports model contents (GLB only) — used to preselect "Upload as
  // Animation" for mesh-less skeleton files and to offer the bone toggle.
  onModelInfo?: (info: { hasMesh: boolean; hasBones: boolean }) => void;
}): PreviewReturn => {
  // The scene is the "stage": everything drawn (model, lights, helpers) is added to it.
  const scene = new THREE.Scene();

  // Measure the canvas as it is laid out on the page; `|| 0` turns a missing/NaN size into 0.
  const width = canvas.getBoundingClientRect().width || 0;
  const height = canvas.getBoundingClientRect().height || 0;
  // Camera shape follows the canvas shape so the model is not stretched.
  const aspectRatio = width / height;

  // A perspective camera: 35 degree field of view, the aspect ratio above, and a near/far range of 0.1 to 1000 units.
  const camera = new THREE.PerspectiveCamera(35, aspectRatio, 0.1, 1000);
  // Start two units back from the origin; the GLB loader re-aims the camera once it knows the model's size.
  camera.position.z = 2;

  // Ask the browser for a WebGL2 drawing context. `preserveDrawingBuffer: true` keeps the last frame readable,
  // which is what lets the picker copy the canvas into a cover image (`toBlob`) after the fact.
  const gl2ctx = canvas.getContext("webgl2", { preserveDrawingBuffer: true });

  // The renderer does the actual drawing. It reuses that context and canvas; `alpha: true` leaves the background
  // transparent and `antialias: true` smooths edges. (`gl2ctx!` assumes WebGL2 is available, which the Tauri webviews provide.)
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
    context: gl2ctx!,
  });

  // Match the drawing surface to the measured canvas size.
  renderer.setSize(width, height);

  // Soft sky/ground light (pinkish-white from above, grey from below) so models are not pitch black in shadow.
  const color = 0xfcece7;
  const light = new THREE.HemisphereLight(color, 0x8d8d8d, 3.0);

  // A white light shining from the front (+z, where the camera starts) so the face toward the viewer is lit.
  const frontLight = new THREE.DirectionalLight(0xffffff, 2);
  frontLight.position.set(0, 0, 10);
  // Put both lights into the scene.
  scene.add(frontLight);

  scene.add(light);

  // The splat for an `.spz` file, once created (stays null for every other file type).
  let splatMesh: SplatMesh | null = null;
  // True from the moment a .spz splat joins the scene until the animation loop sees it on screen and reports "OK".
  let splatAwaitingDisplay = false;
  // A temporary `blob:` URL that lets the loaders read the chosen file as if it were a web address.
  // It is released again in `dispose` below.
  const fileUrl = URL.createObjectURL(file);

  // Supersession flag: each preview invocation owns one. The effect that
  // created this preview flips it in its cleanup, and every async loader
  // callback checks it — a stale load must not render on the disposed
  // renderer, write status/animation/rig state into the NEXT preview, or
  // trigger a thumbnail snapshot of the wrong model.
  let cancelled = false;
  const isCancelled = () => cancelled;

  // Animation playback state for GLBs with baked clips. The mixer is rooted
  // at the preview scene (the GLB's children are re-parented into it) — clip
  // tracks resolve their nodes by name, so binding still works.
  // The clock supplies the time that passed since the last frame, which the mixer needs to advance the animation.
  const clock = new THREE.Clock();
  // The mixer plays clips; stays null until a GLB with clips has loaded.
  let mixer: THREE.AnimationMixer | null = null;
  // The clips of the loaded GLB, in file order (the picker's dropdown shows their names).
  let clips: THREE.AnimationClip[] = [];
  // Rest pose for "T-pose (none)": local transforms snapshotted before the
  // first action plays. THREE.Skeleton.pose() is deliberately NOT used — it
  // rebuilds bone locals from inverse bind matrices and mis-scales rigs
  // whose armature bakes a scale (mixamo cm-rigs), and converted plain-node
  // rigs have no Skeleton to pose at all.
  let restPose: Array<{
    node: THREE.Object3D;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    scale: THREE.Vector3;
  }> | null = null;

  // Called by the picker's animation dropdown: `index` is a clip number, or -1 for "None".
  const selectAnimation = (index: number) => {
    // No mixer means the model has no animations, so there is nothing to switch.
    if (!mixer) return;
    // Stop whatever clip is playing before starting another (or none).
    mixer.stopAllAction();
    if (index >= 0) {
      // Look up the chosen clip; an out-of-range number finds nothing and plays nothing.
      const clip = clips[index];
      // Restart the clip from its first frame and play it.
      if (clip) mixer.clipAction(clip).reset().play();
    } else {
      // "None": a stopped action would freeze the model on its last
      // evaluated frame — put every node back to its load pose instead.
      for (const { node, position, quaternion, scale } of restPose ?? []) {
        // Copy the saved position, rotation and scale back onto each node.
        node.position.copy(position);
        node.quaternion.copy(quaternion);
        node.scale.copy(scale);
      }
    }
  };

  // Skeleton overlay for rigged GLBs, shown by default when the model has
  // no mesh (skeleton/animation-only exports would otherwise be invisible).
  // Real bones get THREE.SkeletonHelper; mesh-less models whose joints
  // re-imported as plain nodes (GLTF only round-trips bone-ness through a
  // skin, and mesh-less exports have none) get the generic hierarchy lines.
  let skeletonHelper: THREE.SkeletonHelper | NodeHierarchyHelper | null = null;
  // Called by the picker's "show skeleton" toggle; does nothing when the model has no skeleton overlay.
  const setSkeletonVisible = (visible: boolean) => {
    if (skeletonHelper) skeletonHelper.visible = visible;
  };

  // BUG FIX: the loader was chosen with case-sensitive endsWith checks, but the file picker and drop handler
  // accept extensions case-insensitively, so "ROBOT.GLB" / "SCAN.SPZ" showed "Unknown file type for loader"
  // and got no cover snapshot. Compare against a lowercased copy of the name instead.
  const lowerName = file.name.toLowerCase();

  // Pick the loader by file extension. Only the `.glb` and `.spz` branches can be reached from the app today.
  if (lowerName.endsWith(".glb")) {
    glbLoader({
      file,
      fileUrl,
      scene,
      camera,
      renderer,
      statusCallback,
      isCancelled,
      // Runs once the GLB is in the scene and its contents are known (mesh? bones?).
      onModelInfo: (info) => {
        // Build the skeleton overlay when the model has bones, or has no mesh at all (so there is something to see).
        if (info.hasBones || !info.hasMesh) {
          // Real bones get three.js's own helper; mesh-less models whose joints came back as plain nodes get our line drawing.
          skeletonHelper = info.hasBones
            ? new THREE.SkeletonHelper(scene)
            : new NodeHierarchyHelper(scene);
          // Visible by default only for mesh-less models (otherwise the preview would be empty).
          skeletonHelper.visible = !info.hasMesh;
          scene.add(skeletonHelper);
        }
        // Pass the information on to the picker (it preselects "Upload as Animation" for mesh-less files).
        onModelInfo?.(info);
      },
      // Runs once with the GLB's baked animation clips (an empty list for a still model).
      onAnimations: (loadedClips) => {
        // Remember the clips for `selectAnimation`.
        clips = loadedClips;
        // Nothing to play: leave the mixer null.
        if (clips.length === 0) return;
        // Snapshot the load pose before any action can evaluate (the first
        // mixer.update runs on the next animation-loop frame). Lights get
        // captured too — nothing animates them, so restoring is a no-op.
        restPose = [];
        // Walk every object in the scene and remember where it sits right now.
        scene.traverse((node) => {
          restPose!.push({
            node,
            position: node.position.clone(),
            quaternion: node.quaternion.clone(),
            scale: node.scale.clone(),
          });
        });
        // Create the mixer on the scene and start the first clip right away.
        mixer = new THREE.AnimationMixer(scene);
        mixer.clipAction(clips[0]).play(); // autoplay the first clip
        // Tell the picker the clip names for its dropdown; an unnamed clip is shown as "Clip 1", "Clip 2", and so on.
        onAnimationsAvailable?.(
          clips.map((clip, index) => clip.name || `Clip ${index + 1}`),
        );
      },
    });
  } else if (lowerName.endsWith(".pmd")) {
    // Dormant: no picker offers `.pmd` (N-107 in BUGS.md).
    pmdLoader({
      file,
      fileUrl,
      scene,
      camera,
      renderer,
      statusCallback,
      isCancelled,
    });
  } else if (
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".gif")
  ) {
    // Dormant: the 3D and Splat pickers do not accept images (N-107 in BUGS.md).
    imagePlaneLoader({
      file,
      fileUrl,
      scene,
      camera,
      renderer,
      statusCallback,
      isCancelled,
    });
  } else if (lowerName.endsWith(".spz")) {
    // Gaussian splat: read the whole file into memory, then hand the bytes to Spark.
    file
      .arrayBuffer()
      .then((arrayBuffer) => {
        // The preview was replaced while the file was being read: do nothing.
        if (cancelled) return;
        splatMesh = new SplatMesh({
          fileBytes: arrayBuffer,
          fileType: SplatFileType.SPZ,
          // Spark calls this when it has finished DECODING the file (not yet when it is drawn).
          onLoad: () => {
            // A preview that was replaced while the splat decoded must not touch the scene or report anything.
            if (cancelled) return;
            scene.add(splatMesh!);
            // BUG FIX: the GLB, PMD and image-plane loaders all report "OK" when their model is on screen, and
            // the Splat picker (UploadFilesSplat.tsx) only takes its cover snapshot after it sees that status.
            // This loader never reported it, so no .spz upload ever got a cover image. "OK" is NOT sent from
            // here: the splat is decoded but not yet drawn (see splatIsDisplayed), and a snapshot taken now would
            // be a blank picture. The animation loop below reports it on the first frame that shows the splat.
            splatAwaitingDisplay = true;
          },
        });

        // Odd special case: a splat whose name (before the first ".") ends in "ceramic" is flipped upside down in
        // the preview. Looks like a one-off fix for a demo file (N-107 in BUGS.md); it changes the preview only,
        // not the uploaded bytes.
        if (file.name.split(".")[0].endsWith("ceramic")) {
          splatMesh.rotateX(Math.PI);
          splatMesh.rotateZ(Math.PI);
        }
      })
      .catch((loaderError) => {
        // BUG FIX: every other loader error path ignores a superseded preview;
        // this one did not, so a read failing after the user had moved on to
        // another file painted "SPLAT Loader Error" over the new preview.
        if (cancelled) return;
        // Report the failure to the picker, which shows it as the preview's status.
        statusCallback({
          type: "SPLAT Loader Error",
          message: String(loaderError),
        });
      });
  } else if (lowerName.endsWith(".vmd")) {
    // Motion-capture files have nothing to draw yet; say so instead of leaving the preview blank. (Dormant, N-107.)
    statusCallback({
      type: "Preview Error",
      message: "Sorry, Preview is not available to VMD files yet",
    });
  } else {
    // Any other extension: no loader exists for it.
    statusCallback({
      type: "Preview Error",
      message: "Unknown file type for loader",
    });
  }

  // Runs once per screen refresh (about 60 times a second) for as long as the preview is open.
  const animate = function () {
    // Tick the clock every frame (not just when a mixer exists) so the first
    // mixer update doesn't get a giant delta.
    const delta = clock.getDelta();
    // Advance the playing animation by the time since the last frame (does nothing without a mixer).
    mixer?.update(delta);
    // Draw the scene from the camera onto the canvas.
    renderer.render(scene, camera);
    // A splat preview is ready when the library has drawn its first sorted frame, not when the file is decoded.
    // Checked once per frame until it is true, then reported exactly once.
    if (splatAwaitingDisplay && !cancelled && splatIsDisplayed(scene)) {
      // Stop checking, then tell the picker the preview is on screen (it takes its cover snapshot on seeing "OK").
      splatAwaitingDisplay = false;
      statusCallback({
        type: "OK",
        message: "Preview should be available",
      });
    }
    // Spin a splat slowly around its vertical axis so the viewer sees all sides (no effect for other files).
    splatMesh?.rotateY(0.01);
  };
  // Hand the loop to three.js, which calls `animate` on every refresh.
  renderer.setAnimationLoop(animate);

  // The canvas is reused for the next file's preview, which hands that
  // renderer this same WebGL context, so the context loss is forced only
  // once the canvas has left the DOM (the modal closed).
  // Called by the picker when this preview is replaced or the dialog closes; frees everything this preview made.
  const dispose = () => {
    // Make every pending loader callback a no-op from now on.
    cancelled = true;
    // Stop the drawing loop.
    renderer.setAnimationLoop(null);
    // Free the geometry, materials and textures of everything in the scene.
    disposeObject3D(scene);
    // A splat still decoding when the preview was superseded never made it
    // into the scene.
    if (splatMesh && !splatMesh.parent) splatMesh.dispose();
    // Release the temporary blob URL created at the top.
    URL.revokeObjectURL(fileUrl);
    // Free the renderer's own resources.
    renderer.dispose();
    // Give the graphics memory back, but only when the canvas is gone from the page (a reused canvas keeps its context).
    if (!canvas.isConnected) renderer.forceContextLoss();
  };

  // Hand the controls back to the picker.
  return { renderer, camera, selectAnimation, setSkeletonVisible, dispose };
};

// Loads a .glb into the preview scene, frames the camera on it, and reports "OK" (or an error) through `statusCallback`.
// Everything inside the callbacks first checks `isCancelled`, because the load is asynchronous and the preview may
// have been replaced by the time it finishes.
const glbLoader = ({
  fileUrl,
  camera,
  scene,
  renderer,
  statusCallback,
  onAnimations,
  onModelInfo,
  isCancelled,
}: LoaderInterface) => {
  const loader = new GLTFLoader();
  // Arguments: the file's blob URL, the success callback, no progress callback, the error callback.
  loader.load(
    fileUrl,
    (data) => {
      // A newer preview replaced this one while the file loaded: do nothing.
      if (isCancelled?.()) return;
      // Inspect BEFORE re-parenting (the loop below moves children out of
      // data.scene).
      let hasMesh = false;
      let hasBones = false;
      // Look through the whole loaded model for any drawable mesh and any skeleton bone.
      data.scene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) hasMesh = true;
        if ((node as THREE.Bone).isBone) hasBones = true;
      });

      // Iterate a COPY: scene.add() re-parents the child, which mutates
      // data.scene.children mid-loop and would skip every other child.
      // `addedRoots` remembers what was moved so the camera fit below can look at only the model (not the lights).
      const addedRoots: THREE.Object3D[] = [];
      [...data.scene.children].forEach((child) => {
        // Tag each object with a white colour in its free-form data bag (read by other viewer code; not used here).
        child.userData["color"] = "#FFFFFF";
        // Move the object into the preview scene.
        scene.add(child);
        addedRoots.push(child);
      });

      // Fit the camera once, after ALL children are in. Mesh geometry
      // drives the framing; mesh-less skeleton exports fall back to node
      // world positions so an empty box can never NaN the camera math —
      // ALL nodes, not just Bones: converted mesh-less rigs re-import as
      // plain Object3Ds (GLTF only round-trips bone-ness through a skin),
      // so a bones-only fallback found nothing for exactly the models that
      // need it. Only the re-parented GLB roots are sampled; the preview
      // lights would wildly inflate the box.
      // `box` is the smallest axis-aligned box that contains the model.
      const box = new THREE.Box3();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          // Make sure the mesh's own box is computed, then grow `box` to include it.
          object.geometry.computeBoundingBox();
          box.expandByObject(object);
        }
      });
      // No meshes found (a skeleton-only file): build the box from the position of every node instead.
      if (box.isEmpty()) {
        // Make sure each node's world-space position is up to date before reading it.
        scene.updateMatrixWorld(true);
        const point = new THREE.Vector3();
        for (const root of addedRoots) {
          root.traverse((node) => {
            box.expandByPoint(node.getWorldPosition(point));
          });
        }
      }
      // Centre and overall size of that box; the radius is half its longest side.
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      const radius = Math.max(size.x, size.y, size.z) * 0.5;
      // Skip the fit for empty or point-degenerate boxes (a lone-node
      // fallback collapses to a point; distance 0 would park the camera
      // inside the model with a zero near plane) — the default camera
      // still shows something.
      if (!box.isEmpty() && radius > 1e-4) {
        // Convert the camera's field of view from degrees to radians, then work out how far back the camera must
        // be for the model (plus a 20 percent margin) to fit in view.
        const fov = camera.fov * (Math.PI / 180);
        const distance = (radius * 1.2) / Math.tan(fov * 0.5);

        // Place the camera up and to the front-right of the model, looking at its centre.
        camera.position.set(
          center.x + distance * 0.6,
          center.y + distance * 0.4,
          center.z + distance * 0.6,
        );
        camera.lookAt(center);

        // Scale the near and far clipping planes to the model's size so nothing is cut off, small or large.
        camera.near = distance * 0.01;
        camera.far = distance * 100;
        // three.js needs this call after changing the camera's lens settings.
        camera.updateProjectionMatrix();
      }

      // AFTER the model is in the preview scene: the mixer's property
      // bindings resolve nodes under `scene`, so wiring animations any
      // earlier binds against an empty graph and silently plays nothing.
      // And BEFORE the render + OK: onModelInfo is where the skeleton
      // helper gets created — emitting OK first let the thumbnail snapshot
      // race the next animation frame and capture a mesh-less model as a
      // blank render.
      onAnimations?.(data.animations ?? []);
      onModelInfo?.({ hasMesh, hasBones });

      // Draw one frame right now so the canvas shows the model before "OK" reaches the picker.
      renderer.render(scene, camera);
      // Tell the picker the preview is ready (it takes its cover snapshot when it sees this).
      statusCallback({
        type: "OK",
        message: "Preview should be available",
      });
    },
    // No progress callback.
    undefined,
    // Error callback: the file could not be read or parsed as a GLB.
    (loaderError) => {
      // Ignore the failure of a preview that was already replaced.
      if (isCancelled?.()) return;
      statusCallback({
        type: "GLB Loader Error",
        message: String(loaderError),
      });
    },
  );
};

// DORMANT (N-107 in BUGS.md): no picker accepts `.pmd`. Draws the letters "MMD" in 3D text instead of the model.
const pmdLoader = ({
  camera,
  scene,
  renderer,
  statusCallback,
  isCancelled,
}: LoaderInterface) => {
  // Back the camera far off because the text is built at a large size (then scaled down below).
  camera.position.z = 30;
  const loader = new FontLoader();
  // Downloads a font file from a third-party website at preview time (the Tauri CSP was not checked for this host).
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      // A newer preview replaced this one while the font downloaded: do nothing.
      if (isCancelled?.()) return;
      // Build extruded, bevelled 3D letters spelling "MMD".
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
      // Compute the letters' bounding box (three.js leaves it unset until asked).
      textGeometry.computeBoundingBox();
      // A plain white, lit material.
      const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      // Shrink the oversized text (and flatten its depth) and nudge it left so it sits centred in the view.
      textMesh.scale.set(0.15, 0.15, 0.01);
      textMesh.position.set(-22, -5, 0);
      scene.add(textMesh);
      // Draw once, then report ready.
      renderer.render(scene, camera);
      statusCallback({
        type: "OK",
        message: "Preview should be available",
      });
    },
    // No progress callback.
    undefined,
    (loaderError) => {
      // BUG FIX: the font fetch (remote, so slow/offline failures are common)
      // can fail long after this preview was superseded; without this guard
      // the stale "PMD Loader Error" replaced the next model's good preview.
      if (isCancelled?.()) return;
      statusCallback({
        type: "PMD Loader Error",
        message: String(loaderError),
      });
    },
  );
};

// DORMANT (N-107 in BUGS.md): no picker accepts images. Shows the picture on a flat square in the scene.
const imagePlaneLoader = ({
  fileUrl,
  scene,
  statusCallback,
  isCancelled,
}: LoaderInterface) => {
  // A flat 1 by 1 square to paint the picture on.
  const geometry = new THREE.PlaneGeometry(1, 1);
  const loader = new THREE.TextureLoader();
  // `load` returns the texture object immediately and fills it in later, when the picture has been fetched.
  const texture = loader.load(
    fileUrl,
    undefined,
    undefined,
    (loaderError) => {
      if (isCancelled?.()) return;
      statusCallback({
        type: "Image Plane Loader Error",
        message: String(loaderError),
      });
    },
  );
  // Tell three.js the picture is in the standard sRGB colour space so its colours are not washed out.
  texture.colorSpace = THREE.SRGBColorSpace;

  // An unlit material that shows the picture as is.
  const image_material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: texture,
  });
  const obj = new THREE.Mesh(geometry, image_material);
  obj.receiveShadow = true;
  obj.castShadow = true;
  scene.add(obj);
  // Reports "OK" right away, before the texture above has finished loading (the same shape as B-165; see N-107).
  statusCallback({
    type: "OK",
    message: "Preview should be available",
  });
};
