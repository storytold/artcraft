import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

interface ManifestoThreeBackgroundProps {
  progressRef: React.RefObject<number>;
}

export const ManifestoThreeBackground = ({
  progressRef,
}: ManifestoThreeBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
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

    new FBXLoader().load(
      "/3d-models/sneaking-forward.fbx",
      (fbx) => {
        if (cancelled) return;

        // Mixamo defaults: ~100 unit tall, faces -Z. Scale to scene units
        // and rotate so the character faces the direction of travel (+X).
        fbx.scale.setScalar(0.035);
        fbx.rotation.y = Math.PI / 2;

        // Override Mixamo's flat default materials with the scene's PBR look,
        // and enable shadow casting so the figure grounds visually.
        fbx.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.material = characterMaterial;
            mesh.castShadow = true;
          }
        });

        scene.add(fbx);
        character = fbx;

        if (fbx.animations.length > 0) {
          mixer = new THREE.AnimationMixer(fbx);
          const clip = fbx.animations[0];
          clipDuration = clip.duration;
          action = mixer.clipAction(clip);
          action.play();
          // Pause real-time playback — we'll set action.time manually in tick.
          action.paused = true;
        }
      },
      undefined,
      (err) => console.error("manifesto character load failed", err),
    );

    const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

    let rafId = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const p = progressRef.current;

      if (character && mixer && action && clipDuration > 0) {
        const cp = clamp01(p);

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
        character.position.x = -14 + 28 * cp;
        character.position.y = -2.5 + Math.sin(t * 1.6) * 0.04;
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
