import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ManifestoThreeBackgroundProps {
  progressRef: React.RefObject<number>;
  /**
   * When `true`, the render loop skips the expensive `renderer.render` +
   * `mixer.update` calls. Used to halt GPU work once the character has walked
   * off screen and the canvas is fully covered by other UI — saves significant
   * paint cost on high-DPI / large displays.
   */
  pausedRef?: React.RefObject<boolean>;
}

export const ManifestoThreeBackground = ({
  progressRef,
  pausedRef,
}: ManifestoThreeBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // CAPTURE MODE — disabled. Uncomment this block + the matching sections
    // below (search "CAPTURE MODE") to record a self-driven walk video via
    // `?capture=manifesto`. Used to produce a motion-reference clip for
    // Seedance without depending on smooth manual scrolling.
    // const captureMode =
    //   typeof window !== "undefined" &&
    //   new URLSearchParams(window.location.search).get("capture") ===
    //     "manifesto";

    const scene = new THREE.Scene();
    // if (captureMode) {
    //   // Solid background so the recorded video is self-contained (no alpha).
    //   scene.background = new THREE.Color(0x101014);
    // }
    // Long-lens (telephoto) feel — narrow FOV + camera pulled further back.
    // Flattens perspective distortion so the scene reads as a 2D-ish plane
    // instead of a wide-angle bowl.
    const camera = new THREE.PerspectiveCamera(
      22,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.7;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Pre-baked environment for PBR reflections — what makes metals/clearcoat
    // actually look like materials instead of flat-shaded primitives.
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    const envTexture = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envTexture;

    // Cinematic three-point lighting — softer ambient so shadows read deeper,
    // strong key (with shadow casting) for grounding, cool blue rim behind
    // for silhouette definition against the dark scene.
    scene.add(new THREE.HemisphereLight(0x3d6cb0, 0x06060c, 0.12));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(6, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0008;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x6ba6ff, 0.8);
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x3a78d6, 0.3, 20);
    fillLight.position.set(-3, -2, 5);
    scene.add(fillLight);

    // Invisible ground plane — only shows the cast shadow. Sits at the
    // character's feet so the contact point reads.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      new THREE.ShadowMaterial({ opacity: 0.25 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Character loaded async from FBX. The mixer is driven by scroll progress
    // (not a real-time clock) so the animation scrubs with the user's scroll.
    let character: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let action: THREE.AnimationAction | null = null;
    let clipDuration = 0;
    let cancelled = false;

    // Number of walk cycles played across the full section scroll. >1 keeps
    // the legs cycling visibly rather than crawling through a single step.
    const WALK_CYCLES = 2;

    const characterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x07142a,
      metalness: 0.35,
      roughness: 0.55,
      clearcoat: 0.4,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.45,
    });

    new GLTFLoader().load(
      "/3d-models/sneaking-forward.glb",
      (gltf) => {
        if (cancelled) return;

        const root = gltf.scene;

        // Mixamo defaults: ~100 unit tall, faces -Z. FBX → GLB conversions
        // typically apply a 0.01 cm→m scale, so the GLB lands roughly 100×
        // smaller than the FBX. Scale up to match the previous on-screen
        // size and rotate so the character faces the direction of travel (+X).
        root.scale.setScalar(3.5);
        root.rotation.y = Math.PI / 2;

        // Override default materials with the scene's PBR look, and enable
        // shadow casting so the figure grounds visually.
        root.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = characterMaterial;
            mesh.castShadow = true;
          }
        });

        scene.add(root);
        character = root;

        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(root);
          const clip = gltf.animations[0];
          clipDuration = clip.duration;
          action = mixer.clipAction(clip);
          action.play();
          // Pause real-time playback — we'll set action.time manually in tick.
          // (For CAPTURE MODE: set this to `!captureMode` instead.)
          action.paused = true;
        }

        // CAPTURE MODE: if (captureMode) startCaptureRecording();
      },
      undefined,
      (err: unknown) => console.error("manifesto character load failed", err),
    );

    const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

    // CAPTURE MODE — disabled. Records the canvas in real time and downloads
    // the walk as a video. To re-enable: uncomment, restore the call in the
    // GLTF load callback above, and the capture branch in the tick below.
    // let recorder: MediaRecorder | null = null;
    // let captureStart = 0;
    // const captureChunks: Blob[] = [];
    // const captureDuration = 6; // seconds of recorded walk
    // const startCaptureRecording = () => {
    //   const stream = (
    //     renderer.domElement as HTMLCanvasElement
    //   ).captureStream(60);
    //   // Prefer MP4 — MediaRecorder's webm output has a known broken duration
    //   // header (file contains all frames but most players report ~1s). MP4
    //   // writes duration correctly. Fall back to webm where MP4 isn't supported.
    //   const mimeCandidates = [
    //     "video/mp4;codecs=h264",
    //     "video/mp4;codecs=avc1",
    //     "video/mp4",
    //     "video/webm;codecs=vp9",
    //     "video/webm",
    //   ];
    //   const mimeType =
    //     mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ??
    //     "video/webm";
    //   const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    //   recorder = new MediaRecorder(stream, {
    //     mimeType,
    //     videoBitsPerSecond: 12_000_000,
    //   });
    //   recorder.ondataavailable = (e) => {
    //     if (e.data.size > 0) captureChunks.push(e.data);
    //   };
    //   recorder.onstop = () => {
    //     const blob = new Blob(captureChunks, { type: mimeType });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = `manifesto-walk.${ext}`;
    //     document.body.appendChild(a);
    //     a.click();
    //     a.remove();
    //     setTimeout(() => URL.revokeObjectURL(url), 1000);
    //   };
    //   // Timeslice forces periodic chunk emission instead of buffering
    //   // everything until stop() — more reliable across browsers.
    //   recorder.start(100);
    //   captureStart = performance.now();
    // };

    let rafId = 0;
    // CAPTURE MODE: also track `let lastFrame = performance.now();` and
    // `const dt = (now - lastFrame) / 1000; lastFrame = now;` for mixer.update.
    const start = performance.now();
    const tick = () => {
      // Skip the entire render pass when the parent flags us as paused.
      // We still loop rAF (cheap) so resuming is instantaneous, but the
      // expensive WebGL render + mixer update are gated. Saves 5-15ms per
      // frame on high-DPI / large displays once the character is off-screen.
      if (pausedRef?.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const now = performance.now();
      const t = (now - start) / 1000;

      if (character && mixer && action && clipDuration > 0) {
        // CAPTURE MODE branch (disabled):
        // if (captureMode && captureStart > 0) {
        //   const elapsed = (now - captureStart) / 1000;
        //   const cp = clamp01(elapsed / captureDuration);
        //   mixer.update(dt);
        //   character.position.x = -11 + 25 * cp;
        //   character.position.y = -2.5 + Math.sin(t * 1.6) * 0.04;
        //   if (elapsed >= captureDuration && recorder?.state === "recording") {
        //     recorder.stop();
        //   }
        // } else {
        const cp = clamp01(progressRef.current);

        // Drive animation time from scroll. Multiplier sets how many walk
        // cycles play across the full section so the legs cycle visibly.
        // Modulo wraps the time so the loop chains together cleanly.
        const animTime = (cp * clipDuration * WALK_CYCLES) % clipDuration;
        action.time = animTime;
        mixer.update(0);

        // Linear scroll-linked traversal. Progress spans the full visible
        // duration of the section (top entering viewport → bottom exiting),
        // so the text-reveal end falls at ~p=0.55 (sticky duration / total
        // visible duration). At that point the character is around mid-frame.
        // From p=0.55 → 1.0 the character continues walking and exits to
        // the right while the section scrolls away.
        character.position.x = -11 + 25 * cp;
        character.position.y = -2.5 + Math.sin(t * 1.6) * 0.04;
        // }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      // CAPTURE MODE: if (recorder && recorder.state === "recording") recorder.stop();
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      if (mixer) mixer.stopAllAction();
      if (character) {
        scene.remove(character);
        character.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
          }
        });
      }
      characterMaterial.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [progressRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
    />
  );
};

export default ManifestoThreeBackground;
