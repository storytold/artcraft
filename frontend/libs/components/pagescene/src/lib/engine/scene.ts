import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MMDLoader } from "three/addons/loaders/MMDLoader.js";

import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { generateUUID } from "three/src/math/MathUtils.js";
import { LoadingPlaceHolderManager } from "./placeholder_manager";
import { MMDAnimationHelper, Water } from "three/examples/jsm/Addons.js";
import { MediaFileType } from "../enums";
import { ChromaKeyMaterial } from "./chromakey";
import { InfiniteGridHelper } from "./InfiniteGridHelper";
import type { Camera } from "@storyteller/common";
import toast from "react-hot-toast";
import { SplatMesh } from "@sparkjsdev/spark";
import { ensureInternalBbox } from "./internalBbox";

// ── Experimental scene-descriptor: shader/instancing helpers ────────────

// One per-instance transform for instantiateInstancedMesh.
type InstanceLike = {
  position?: { x: number; y: number; z: number };
  rotationDeg?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  color?: string;
};

// Default vertex shader for LLM-authored materials: exposes the varyings a
// fragment shader most commonly wants, so a bare `fragmentShader` works.
const DEFAULT_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Instancing-aware default vertex shader: same varyings, but places each
// vertex through the per-instance `instanceMatrix` so a custom material on
// an InstancedMesh keeps every instance in its scattered position.
const DEFAULT_VERTEX_SHADER_INSTANCED = `
attribute mat4 instanceMatrix;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

// Prepended to every custom fragment shader so the injected uniforms and
// the default vertex varyings are always in scope.
const SHADER_PREAMBLE = `
uniform float time;
uniform vec2 resolution;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
`;

// Built-in GPU wind for instanced fields (grass/foliage). Height-weighted
// sway so each instance pivots at its base, with a per-instance phase so
// the field doesn't move in unison — all on the GPU, one draw call.
const WIND_VERTEX_SHADER = `
attribute mat4 instanceMatrix;
attribute float instancePhase;
uniform float time;
uniform float windStrength;
uniform float windSpeed;
uniform float windTurbulence;
varying float vPhase;
void main() {
  vec3 pos = position;
  float h = max(pos.y, 0.0);
  float w = sin(time * windSpeed + instancePhase)
          + windTurbulence * sin(time * windSpeed * 2.3 + instancePhase * 1.7);
  float sway = w * windStrength * h;
  pos.x += sway;
  pos.z += sway * 0.35;
  vPhase = instancePhase;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
}
`;

const WIND_FRAGMENT_SHADER = `
uniform vec3 baseColor;
varying float vPhase;
void main() {
  // Subtle per-instance shade variation (free organic colour).
  float v = 0.85 + 0.15 * sin(vPhase * 3.1);
  gl_FragColor = vec4(baseColor * v, 1.0);
}
`;

// Capabilities Scene needs from outside its own state. Editor wires
// these in inline at construction (Phase 2 idiom — same shape as
// SceneUtilsDeps, SaveManagerDeps, etc.). Scene does NOT import the
// Zustand store directly and has no Tauri imports; the host (artcraft
// wrapper) supplies fetchAsset (CORS-bypassed binary fetch) and
// getMediaUrlByToken (resolves a media_file_token to its CDN URL).
export type SceneDeps = {
  getCameras: () => Camera[];
  getSelectedCameraId: () => string;
  // Adapter-supplied binary fetch. Optional `init.signal` lets the
  // scene loader cancel in-flight downloads when its load is
  // superseded.
  fetchAsset: (
    url: string,
    init?: { signal?: AbortSignal },
  ) => Promise<Response>;
  getMediaUrlByToken: (token: string) => Promise<string>;
  // Optional batch resolver — when provided, the proxy scene loader
  // warms a URL cache with one roundtrip instead of N. When absent,
  // Scene.warmMediaURLs falls back to Promise.all of the single-token
  // method.
  getMediaUrlsByTokens?: (tokens: string[]) => Promise<Record<string, string>>;
};

class Scene {
  name: string;
  gridHelper: InfiniteGridHelper | undefined;
  groundPlane: THREE.Mesh | undefined;
  scene: THREE.Scene;
  hot_items: THREE.Object3D[] | undefined;

  // Display message
  message_mesh: THREE.Mesh | undefined;
  loading_placeholder: THREE.Object3D | undefined;
  message_font: Font | undefined;

  // global names
  camera_name: string;

  shader_objects: Water[] = [];
  video_planes: HTMLVideoElement[] = [];

  // Per-object animation mixers (experimental scene descriptor), keyed by
  // object uuid. Ticked each frame from the editor render loop.
  animationMixers: Map<string, THREE.AnimationMixer> = new Map();

  skybox: string;

  // loading indicator manager
  placeholder_manager: LoadingPlaceHolderManager | undefined;

  updateSurfaceIdAttributeToMesh: Function;
  helper: MMDAnimationHelper;
  ambientLight: THREE.AmbientLight | undefined;
  hemisphereLight: THREE.HemisphereLight | undefined;
  directional_light: THREE.DirectionalLight | undefined;
  version: number;

  // This is used to ensure we do not rerender or process the video if we already have done so.
  // This allows us to reprompt things quickly. This is only written when a snap shot is taken.
  // Which guarentees that the scene is availible.
  current_scene_checksum: string;
  private deps: SceneDeps;
  constructor(
    name: string,
    camera_name: string,
    updateSurfaceIdAttributeToMesh: Function,
    version: number,
    deps: SceneDeps,
  ) {
    this.version = version;
    this.name = name;
    this.gridHelper;
    this.scene = new THREE.Scene();
    this.hot_items = [];

    this.message_mesh = undefined;
    this.loading_placeholder = undefined;
    this.message_font = undefined;
    this.skybox = "m_1";

    // global names
    this.camera_name = camera_name;
    this.placeholder_manager = undefined;
    this.updateSurfaceIdAttributeToMesh = updateSurfaceIdAttributeToMesh;
    this.deps = deps;

    this.current_scene_checksum = "";
  }

  initialize() {
    this.scene = new THREE.Scene();
    this.placeholder_manager = new LoadingPlaceHolderManager(this.scene);
    this.placeholder_manager.initialize();

    this._createGrid();
    this._create_base_lighting();
    this._create_skybox();
    // this._create_camera_obj();

    this.helper = new MMDAnimationHelper({ afterglow: 0.0 });
    this.scene.userData["helper"] = this.helper;
  }

  // Apply a grid visibility change. Pure THREE-side mutation — the
  // store subscription that drives this lives at the engine boundary
  // (editor.ts), not inside Scene itself.
  applyGridVisibility(visible: boolean) {
    if (!this.gridHelper) return;
    if (visible) {
      if (!this.scene.children.includes(this.gridHelper)) {
        this.scene.add(this.gridHelper);
      }
    } else {
      this.scene.remove(this.gridHelper);
    }
  }

  clear() {
    this.scene.children = [];
    this._createGrid();
    this._create_base_lighting();
    this._create_skybox();
    // this._create_camera_obj();
  }

  async instantiate(
    name: string,
    pos: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  ) {
    const material = new THREE.MeshPhongMaterial({ color: 0xdacbce });
    material.shininess = 0.0;
    let geometry;
    if (name == "Box") {
      geometry = new THREE.BoxGeometry(1, 1, 1);
    } else if (name == "Cone") {
      geometry = new THREE.ConeGeometry(0.5, 1, 16);
    } else if (name == "Cylinder") {
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 12);
    } else if (name == "Sphere") {
      geometry = new THREE.SphereGeometry(0.5, 18, 12);
    } else if (name == "Donut") {
      geometry = new THREE.TorusGeometry(0.5, 0.25, 8, 24);
    } else if (name == "Water") {
      geometry = new THREE.PlaneGeometry(100, 100);
    } else if (name == "PointLight") {
      geometry = new THREE.SphereGeometry(0.06, 18, 12);
    } else if (name.includes("Image::")) {
      geometry = new THREE.PlaneGeometry(1, 1);
    }

    let obj;
    if (name == "Water" && geometry) {
      obj = new Water(geometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load(
          "https://threejs.org/examples/textures/waternormals.jpg",
          function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          },
        ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x00d8ff,
        distortionScale: 0.3,
        fog: this.scene.fog !== undefined,
      });
      obj.material.uniforms.size.value = 4.1;
      obj.rotation.x = -Math.PI / 2;
      obj.userData["water"] = true;
      obj.userData["color"] = new THREE.Color(0x00d8ff).getHex();
      obj.userData["base"] = new THREE.Color(0x00d8ff).getHex();
      this.shader_objects.push(obj);
      obj.userData["media_id"] = "Parim";
    } else if (name.includes("Image::")) {
      const image_token = name.replace("Image::", "");
      let texture;

      if (image_token.includes(".mp4")) {
        const Video_token = name.replace("Image::", "");
        const videoElement = document.createElement("video");
        videoElement.controls = true;
        videoElement.muted = true;
        //videoElement.loop = true;
        videoElement.crossOrigin = "anonymous";
        videoElement.preload = "auto";
        videoElement.src = Video_token;
        videoElement.preload = "auto";
        videoElement.playbackRate = 6;
        //await videoElement.play();
        this.video_planes.push(videoElement);

        texture = new THREE.VideoTexture(videoElement);

        texture.colorSpace = THREE.SRGBColorSpace;
        const image_material = new ChromaKeyMaterial(
          texture,
          0x00ff00,
          1920,
          1080,
          0.159,
          0.082,
          0.0,
        );
        obj = new THREE.Mesh(geometry, image_material);
        obj.userData["media_id"] = name;
        obj.userData["media_file_type"] = MediaFileType.Video;
      } else {
        const loader = new THREE.TextureLoader();
        // NB(bt,2025-08-26): Images loaded throughout the rest of ArtCraft with the <img> tag set
        // the "sec-fetch-mode: no-cors" header. On Safari (Mac), this is cached and makes the image
        // permanently impossible to use in Three.js. We bypass this by appending a query parameter
        // to the URL.
        const modifiedUrl = image_token + "?threejs=true";
        texture = loader.load(modifiedUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        const image_material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        obj = new THREE.Mesh(geometry, image_material);
        obj.userData["media_id"] = name;
        obj.userData["media_file_type"] = MediaFileType.Image;
      }
    } else if (name == "PointLight") {
      const light_material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      obj = new THREE.Mesh(geometry, light_material);
      obj.userData["media_id"] = "Parim";
    } else {
      obj = new THREE.Mesh(geometry, material);
      obj.userData["media_id"] = "Parim";
    }
    obj.receiveShadow = true;
    obj.castShadow = true;
    //obj.type = "Object3D";
    obj.name = name;
    obj.position.copy(pos);
    obj.userData["color"] = "#FFFFFF";
    obj.userData["metalness"] = 0.0;
    obj.userData["shininess"] = 0.5;
    obj.userData["specular"] = 0.0;
    obj.userData["locked"] = false;
    obj.userData["media_file_type"] = MediaFileType.None;
    // Dedicated, persisted shape marker. `media_id === "Parim"` is set
    // by every geometric primitive (Box/Cone/Cylinder/Sphere/Donut/
    // PointLight/Water) and NOT by Image::/video planes, so this tags
    // exactly the constant-color shapes. setColor reads userData.isShape
    // to decide constant-color (shapes) vs leave-textures (everything
    // else). instantiate is the single creation chokepoint (fresh add,
    // paste, undo/redo, proxy load), so this is always present.
    if (obj.userData["media_id"] === "Parim") {
      obj.userData["isShape"] = true;
      obj.userData["shapeType"] = name;
    }

    this.scene.add(obj);

    if (name == "PointLight") {
      const light = new THREE.PointLight(0xffffff, 1, 100);
      this.scene.add(light);
      light.position.copy(obj.position);
      obj.attach(light);
      obj.layers.set(1);
      obj.userData["light"] = light.uuid;
    }

    this.updateSurfaceIdAttributeToMesh(this.scene);
    return obj;
  }

  // Build a gray-box mesh from a raw, non-indexed vertex position buffer
  // ([x,y,z, ...], every 3 vertices = 1 triangle). Used by the
  // experimental scene-descriptor path to reconstruct per-object vertex
  // data. Registers like instantiate() so selection/post-processing work,
  // and tags userData so the proxy serializer round-trips the geometry.
  async instantiateMeshFromPositions(
    positions: number[],
    color = "#9a9a9a",
  ): Promise<THREE.Mesh> {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3),
    );
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(color) });
    material.shininess = 0.0;
    const obj = new THREE.Mesh(geometry, material);
    obj.receiveShadow = true;
    obj.castShadow = true;
    obj.name = "Mesh";
    obj.userData["media_id"] = "Mesh::" + obj.uuid;
    obj.userData["isMeshGeometry"] = true;
    // isShape lets setColor() apply a flat constant color (gray-box).
    obj.userData["isShape"] = true;
    obj.userData["color"] = color;
    obj.userData["metalness"] = 0.0;
    obj.userData["shininess"] = 0.5;
    obj.userData["specular"] = 0.0;
    obj.userData["locked"] = false;
    obj.userData["media_file_type"] = MediaFileType.None;

    this.scene.add(obj);
    this.updateSurfaceIdAttributeToMesh(this.scene);
    return obj;
  }

  // ── Experimental scene-descriptor: instancing + custom shaders ──────────

  // Build one InstancedMesh from a base geometry + a list of per-instance
  // transforms (and optional per-instance color). One draw call for many
  // copies — the path for performance forests / grass fields. The resolved
  // spec is stashed on userData so the proxy serializer round-trips it.
  async instantiateInstancedMesh(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spec: any,
    color = "#9a9a9a",
  ): Promise<THREE.InstancedMesh> {
    const instances: InstanceLike[] = spec?.instances ?? [];
    const geometry = this.buildBaseGeometry(spec?.base);
    const wind = spec?.wind;

    // Wind = a GPU vertex shader driven by the shared `time` uniform +
    // per-instance phase (one draw call, no per-frame CPU). Otherwise a
    // flat gray-box Phong material.
    let material: THREE.Material;
    if (wind) {
      material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          windStrength: { value: wind.strength ?? 0.15 },
          windSpeed: { value: wind.speed ?? 1.5 },
          windTurbulence: { value: wind.turbulence ?? 0 },
          baseColor: { value: new THREE.Color(color) },
        },
        vertexShader: WIND_VERTEX_SHADER,
        fragmentShader: WIND_FRAGMENT_SHADER,
        side: THREE.DoubleSide,
      });
    } else {
      const phong = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
      });
      phong.shininess = 0.0;
      material = phong;
    }

    const count = Math.max(1, instances.length);
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3(1, 1, 1);
    // Per-instance color only applies to the flat (non-wind) material.
    const hasColors = !wind && instances.some((i) => !!i.color);
    if (hasColors) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3),
        3,
      );
    }
    instances.forEach((it, i) => {
      p.set(it.position?.x ?? 0, it.position?.y ?? 0, it.position?.z ?? 0);
      e.set(
        THREE.MathUtils.degToRad(it.rotationDeg?.x ?? 0),
        THREE.MathUtils.degToRad(it.rotationDeg?.y ?? 0),
        THREE.MathUtils.degToRad(it.rotationDeg?.z ?? 0),
      );
      q.setFromEuler(e);
      s.set(it.scale?.x ?? 1, it.scale?.y ?? 1, it.scale?.z ?? 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      if (hasColors) mesh.setColorAt(i, new THREE.Color(it.color || color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Wind: per-instance phase attribute + register for the per-frame
    // `time` tick so the GPU sway animates.
    if (wind) {
      const phases = new Float32Array(count);
      for (let i = 0; i < count; i++) phases[i] = (i * 2.399963) % 6.28318;
      geometry.setAttribute(
        "instancePhase",
        new THREE.InstancedBufferAttribute(phases, 1),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.shader_objects.push(mesh as any);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Instances";
    mesh.userData["media_id"] = "Instanced::" + mesh.uuid;
    mesh.userData["isInstanced"] = true;
    mesh.userData["instancingSpec"] = spec;
    mesh.userData["isShape"] = true; // lets setColor apply a flat base color
    mesh.userData["color"] = color;
    mesh.userData["metalness"] = 0.0;
    mesh.userData["shininess"] = 0.5;
    mesh.userData["specular"] = 0.0;
    mesh.userData["locked"] = false;
    mesh.userData["media_file_type"] = MediaFileType.None;

    this.scene.add(mesh);
    this.updateSurfaceIdAttributeToMesh(this.scene);
    return mesh;
  }

  // Build (or replace) a custom ShaderMaterial on an object's meshes from a
  // spec — the path for LLM-described materials. Injects `time`/`resolution`
  // uniforms and a default vertex shader exposing vUv/vNormal/vPosition, so
  // a bare fragment shader "just works". Animated specs are registered for
  // the per-frame `time` tick. Stashes the spec on userData for round-trip.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyShaderMaterial(object_uuid: string, spec: any): void {
    const object = this.get_object_by_uuid(object_uuid);
    if (!object || !spec?.fragmentShader) return;
    let registered = false;
    object.traverse((c: THREE.Object3D) => {
      if (!(c instanceof THREE.Mesh)) return;
      // InstancedMesh needs an instancing-aware vertex shader so each
      // instance keeps its scattered position.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instanced = (c as any).isInstancedMesh === true;
      c.material = this.buildShaderMaterial(spec, instanced);
      // Register a single representative mesh for the time tick.
      if (spec.animated && !registered) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.shader_objects.push(c as any);
        registered = true;
      }
    });
    object.userData["shaderMaterialSpec"] = spec;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildShaderMaterial(spec: any, instanced = false): THREE.ShaderMaterial {
    const uniforms: Record<string, THREE.IUniform> = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
    };
    // Build the value objects AND the GLSL declarations for custom
    // uniforms. ShaderMaterial does NOT auto-declare uniforms in the shader
    // source, so without these any custom uniform the author references
    // (e.g. `tint`) is an undeclared identifier and the shader fails to
    // compile. We infer the GLSL type from the value's arity.
    const raw = spec.uniforms ?? {};
    const customDecls: string[] = [];
    for (const key of Object.keys(raw)) {
      const v = raw[key];
      const glslType = Array.isArray(v)
        ? v.length === 2
          ? "vec2"
          : v.length === 3
            ? "vec3"
            : "vec4"
        : "float";
      customDecls.push(`uniform ${glslType} ${key};`);
      uniforms[key] = {
        value: Array.isArray(v)
          ? v.length === 2
            ? new THREE.Vector2(v[0], v[1])
            : v.length === 3
              ? new THREE.Vector3(v[0], v[1], v[2])
              : new THREE.Vector4(v[0], v[1], v[2], v[3] ?? 1)
          : v,
      };
    }
    const customUniformGlsl = customDecls.length
      ? customDecls.join("\n") + "\n"
      : "";

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader:
        spec.vertexShader ||
        (instanced ? DEFAULT_VERTEX_SHADER_INSTANCED : DEFAULT_VERTEX_SHADER),
      fragmentShader: SHADER_PREAMBLE + customUniformGlsl + spec.fragmentShader,
      transparent: !!spec.transparent,
      side: spec.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildBaseGeometry(base: any): THREE.BufferGeometry {
    if (base?.positions?.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(base.positions), 3),
      );
      g.computeVertexNormals();
      return g;
    }
    if (base?.plane) {
      return new THREE.PlaneGeometry(base.plane.width ?? 1, base.plane.height ?? 1);
    }
    switch (base?.shape) {
      case "Cone":
        return new THREE.ConeGeometry(0.5, 1, 6);
      case "Cylinder":
        return new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
      case "Sphere":
        return new THREE.SphereGeometry(0.5, 8, 6);
      case "Donut":
        return new THREE.TorusGeometry(0.5, 0.2, 6, 12);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  // Attach (or replace) a keyframe animation on an object. Builds a
  // THREE.AnimationClip from the spec's tracks (or plays a baked GLTF clip
  // by name), drives it with an AnimationMixer, and registers the mixer for
  // the per-frame tick. The spec is stashed on userData for round-trip.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachAnimation(object_uuid: string, spec: any): void {
    const object = this.get_object_by_uuid(object_uuid);
    if (!object || !spec) return;

    // Replace any existing mixer on this object.
    const existing = this.animationMixers.get(object_uuid);
    if (existing) {
      existing.stopAllAction();
      this.animationMixers.delete(object_uuid);
    }

    const mixer = new THREE.AnimationMixer(object);
    let clip: THREE.AnimationClip | null = null;

    // Baked GLTF clip by name (e.g. a mixamo "Walk") if present.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baked = (object as any).animations as THREE.AnimationClip[] | undefined;
    if (spec.clip && baked && baked.length > 0) {
      clip = THREE.AnimationClip.findByName(baked, spec.clip) ?? null;
    }
    if (!clip) clip = this.buildAnimationClip(spec);
    if (!clip) return;

    const action = mixer.clipAction(clip);
    action.loop =
      spec.loop === "once"
        ? THREE.LoopOnce
        : spec.loop === "pingpong"
          ? THREE.LoopPingPong
          : THREE.LoopRepeat;
    if (spec.loop === "once") action.clampWhenFinished = true;
    mixer.timeScale = spec.timeScale ?? 1;
    if (spec.autoplay !== false) action.play();

    this.animationMixers.set(object_uuid, mixer);
    object.userData["animationSpec"] = spec;
  }

  // Advance all mixers. Called from the editor render loop each frame.
  tickAnimations(delta: number): void {
    this.animationMixers.forEach((mixer) => mixer.update(delta));
  }

  // Stop and drop all mixers (scene reset / reload).
  clearAnimations(): void {
    this.animationMixers.forEach((mixer) => mixer.stopAllAction());
    this.animationMixers.clear();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildAnimationClip(spec: any): THREE.AnimationClip | null {
    const tracks: THREE.KeyframeTrack[] = [];
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let maxTime = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const t of (spec.tracks ?? []) as any[]) {
      const times: number[] = t.times ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values: any[] = t.values ?? [];
      if (times.length === 0 || values.length === 0) continue;
      maxTime = Math.max(maxTime, ...times);

      // Track node: "" → the object itself (root), else a child by name
      // (e.g. a mixamo bone). PropertyBinding resolves names in the subtree.
      const node = t.target === "bone" && t.bone ? t.bone : "";

      if (t.property === "position" || t.property === "scale") {
        const flat: number[] = [];
        for (const v of values) flat.push(v.x ?? 0, v.y ?? 0, v.z ?? 0);
        const track = new THREE.VectorKeyframeTrack(
          `${node}.${t.property}`,
          times,
          flat,
        );
        this.applyTrackInterpolation(track, t.interpolation);
        tracks.push(track);
      } else if (t.property === "rotationDeg") {
        const flat: number[] = [];
        for (const v of values) {
          e.set(
            THREE.MathUtils.degToRad(v.x ?? 0),
            THREE.MathUtils.degToRad(v.y ?? 0),
            THREE.MathUtils.degToRad(v.z ?? 0),
          );
          q.setFromEuler(e);
          flat.push(q.x, q.y, q.z, q.w);
        }
        // Quaternion tracks interpolate spherically by default.
        tracks.push(
          new THREE.QuaternionKeyframeTrack(`${node}.quaternion`, times, flat),
        );
      }
    }

    // Pose-keyframes: a timeline of whole-body poses → one
    // QuaternionKeyframeTrack per bone (+ a root position track). Each
    // bone only gets keys at the poses that set it, so limbs interpolate
    // on their own cadence. This is the character-friendly authoring path.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poses = spec.poses as any[] | undefined;
    if (poses && poses.length > 0) {
      const sorted = [...poses].sort(
        (a, b) => (a.timeSec ?? 0) - (b.timeSec ?? 0),
      );
      const boneTimes: Record<string, number[]> = {};
      const boneQuats: Record<string, number[]> = {};
      const rootTimes: number[] = [];
      const rootVals: number[] = [];

      for (const pk of sorted) {
        const t = pk.timeSec ?? 0;
        maxTime = Math.max(maxTime, t);
        if (pk.rootPosition) {
          rootTimes.push(t);
          rootVals.push(
            pk.rootPosition.x ?? 0,
            pk.rootPosition.y ?? 0,
            pk.rootPosition.z ?? 0,
          );
        }
        const bones = pk.bones ?? {};
        for (const boneName of Object.keys(bones)) {
          const rot = bones[boneName]?.rotationDeg ?? bones[boneName];
          if (!rot) continue;
          e.set(
            THREE.MathUtils.degToRad(rot.x ?? 0),
            THREE.MathUtils.degToRad(rot.y ?? 0),
            THREE.MathUtils.degToRad(rot.z ?? 0),
          );
          q.setFromEuler(e);
          if (!boneTimes[boneName]) {
            boneTimes[boneName] = [];
            boneQuats[boneName] = [];
          }
          boneTimes[boneName].push(t);
          boneQuats[boneName].push(q.x, q.y, q.z, q.w);
        }
      }

      for (const boneName of Object.keys(boneTimes)) {
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${boneName}.quaternion`,
            boneTimes[boneName],
            boneQuats[boneName],
          ),
        );
      }
      if (rootTimes.length > 0) {
        tracks.push(new THREE.VectorKeyframeTrack(`.position`, rootTimes, rootVals));
      }
    }

    if (tracks.length === 0) return null;
    const duration = spec.durationSec ?? (maxTime > 0 ? maxTime : -1);
    return new THREE.AnimationClip(spec.name ?? "clip", duration, tracks);
  }

  private applyTrackInterpolation(
    track: THREE.KeyframeTrack,
    interpolation: string | undefined,
  ): void {
    if (interpolation === "smooth") track.setInterpolation(THREE.InterpolateSmooth);
    else if (interpolation === "discrete")
      track.setInterpolation(THREE.InterpolateDiscrete);
    // default: linear (THREE.InterpolateLinear)
  }

  get_objects_name(uuid: string): string {
    const object = this.get_object_by_uuid(uuid);
    if (object) {
      return object.name;
    }
    return uuid;
  }

  get_objects_position(uuid: string): THREE.Vector3 {
    const object = this.get_object_by_uuid(uuid);
    let pos = new THREE.Vector3(0, 0, 0);
    if (object) {
      pos = pos.copy(object.position);
    }
    return pos;
  }

  get_objects_userdata(uuid: string): Record<string, any> {
    const object = this.get_object_by_uuid(uuid);
    let userdata = {};
    if (object) {
      userdata = object.userData;
    }
    return userdata;
  }

  get_object_by_uuid(uuid: string) {
    return this.scene.getObjectByProperty("uuid", uuid);
  }

  get_object_by_name(name: string) {
    return this.scene.getObjectByName(name);
  }

  createPoint(
    pos: THREE.Vector3,
    rot: THREE.Vector3,
    scale: THREE.Vector3,
    keyframe_uuid: string,
  ): THREE.Object3D {
    const geometry = new THREE.SphereGeometry(0.1, 18, 12);
    const material = new THREE.MeshBasicMaterial({ color: 0x05c3dd });
    const obj = new THREE.Mesh(geometry, material);
    const first_quat = new THREE.Euler(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z),
    );
    obj.position.copy(pos);
    obj.rotation.copy(first_quat);
    //obj.scale.copy(scale);
    obj.receiveShadow = false;
    obj.castShadow = false;
    obj.userData["media_id"] = "Point::" + keyframe_uuid;
    obj.layers.set(1); // Enable default layer
    if (this.hot_items != undefined) {
      this.hot_items.push(obj);
    }
    this.scene.add(obj);
    return obj;
  }

  deletePoint(keyframe_uuid: string) {
    this.scene.children.forEach((object) => {
      if (object.userData.media_id) {
        const obj_keyframe_uuid = object.userData.media_id.replace(
          "Point::",
          "",
        );
        if (obj_keyframe_uuid === keyframe_uuid) {
          this.scene.remove(object);
          return;
        }
      }
    });
  }

  getPoint(keyframe_uuid: string): THREE.Object3D | undefined {
    let keyframe_point = undefined;
    this.scene.children.forEach((object) => {
      if (object.userData.media_id) {
        const obj_keyframe_uuid = object.userData.media_id.replace(
          "Point::",
          "",
        );
        if (obj_keyframe_uuid === keyframe_uuid) {
          keyframe_point = object;
          return;
        }
      }
    });
    return keyframe_point;
  }

  updatePoint(
    keyframe_uuid: string,
    keyframe_pos: THREE.Vector3,
    keyframe_rot: THREE.Vector3,
    // keyframe_scl: THREE.Vector3,
  ) {
    this.scene.traverse((object) => {
      if (object.userData.media_id) {
        const obj_keyframe_uuid = object.userData.media_id.replace(
          "Point::",
          "",
        );
        if (obj_keyframe_uuid === keyframe_uuid) {
          const first_quat = new THREE.Euler(
            THREE.MathUtils.degToRad(keyframe_rot.x),
            THREE.MathUtils.degToRad(keyframe_rot.y),
            THREE.MathUtils.degToRad(keyframe_rot.z),
          );
          object.position.copy(keyframe_pos);
          object.rotation.copy(first_quat);
          //object.scale.copy(keyframe_scl);

          return;
        }
      }
    });
  }

  _disable_skybox() {
    //this.scene.background = null;
  }

  async _create_camera_obj() {
    const cameras = this.deps.getCameras();
    const selectedCameraId = this.deps.getSelectedCameraId();
    cameras.forEach((cameraConfig) => {
      const camera_position = new THREE.Vector3(
        cameraConfig.position.x,
        cameraConfig.position.y,
        cameraConfig.position.z,
      );

      const camera_id = "m_cxh4asqhapdz10j880755dg4yevshb";

      this.loadGlbWithPlaceholder(
        camera_id,
        "Camera",
        false,
        camera_position,
      ).then((camera_obj) => {
        camera_obj.userData["name"] = cameraConfig.label;
        camera_obj.name = cameraConfig.label;
        camera_obj.position.set(
          camera_position.x,
          camera_position.y,
          camera_position.z,
        );
        camera_obj.layers.set(1);
        camera_obj.children.forEach((child) => {
          child.layers.set(1);
        });
        this.scene.add(camera_obj);

        if (cameraConfig.id === selectedCameraId) {
          camera_obj.visible = false;
          camera_obj.layers.disableAll(); // Make the active camera not touchable
        } else {
          camera_obj.visible = true;
        }
      });
    });
  }

  renderMode(enabled: boolean = true) {
    if (this.gridHelper == undefined) {
      return;
    }
    if (enabled) {
      this._disable_skybox();
      this.scene.remove(this.gridHelper);
    } else {
      this.scene.add(this.gridHelper);
      this._create_skybox();
    }
  }

  // URL cache populated by warmMediaURLs() before a scene load. Lets
  // every per-asset loadObject() skip its own metadata roundtrip. Lives
  // for the lifetime of the Scene; entries are cheap (string→string).
  private mediaUrlCache: Map<string, string> = new Map();

  // Resolve a media_file_token to its CDN URL. Reads from the warm
  // cache first (populated by warmMediaURLs during a scene load) before
  // falling back to a single-token metadata fetch.
  async getMediaURL(media_id: string) {
    const cached = this.mediaUrlCache.get(media_id);
    if (cached !== undefined) return cached;
    return this.deps.getMediaUrlByToken(media_id);
  }

  // Warm the URL cache for a batch of tokens up front. Uses the host's
  // batch resolver when available (one roundtrip), otherwise fans out
  // single-token requests in parallel. Missing tokens (e.g. an asset
  // was deleted) silently fall through to the per-asset fetch path.
  async warmMediaURLs(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    const unique = Array.from(new Set(tokens));
    if (this.deps.getMediaUrlsByTokens) {
      const urls = await this.deps.getMediaUrlsByTokens(unique);
      for (const [token, url] of Object.entries(urls)) {
        if (url) this.mediaUrlCache.set(token, url);
      }
      return;
    }
    const results = await Promise.all(
      unique.map((token) =>
        this.deps
          .getMediaUrlByToken(token)
          .then((url) => [token, url] as const)
          .catch(() => [token, ""] as const),
      ),
    );
    for (const [token, url] of results) {
      if (url) this.mediaUrlCache.set(token, url);
    }
  }

  private floatToPercent(value: number) {
    return `${(value * 100).toFixed(0)}%`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setColor(object_uuid: string, hex_color: string) {
    const object = this.get_object_by_uuid(object_uuid);
    if (!object) return;
    object.userData["color"] = hex_color;
    // Deterministic, classification-based color (see instantiate, where
    // the persisted userData.isShape / shapeType marker is set):
    //   shape → exact constant solid color (incl. white). No heuristic.
    //   non-shape (character/GLB/MMD/image) → leave its own
    //     texture/material colors untouched; the picker does not flatten
    //     it. userData.color is still recorded so the inspector swatch
    //     stays controlled.
    //   water → its dedicated shader-uniform path, unchanged.
    const isShape = object.userData["isShape"] === true;
    const picked = new THREE.Color(hex_color);
    object.traverse((c: THREE.Object3D) => {
      if (!(c instanceof THREE.Mesh)) return;
      if (c.userData["water"]) {
        c.material.uniforms.waterColor.value = new THREE.Color(hex_color);
        return;
      }
      if (!isShape) return;
      if (c.material.color === undefined) return;
      c.material.color.set(picked);
      if (c.name == "PointLight") {
        const light = this.get_object_by_uuid(c.userData["light"]);
        if (light) {
          (light as THREE.PointLight).color = new THREE.Color(hex_color);
        }
      }
    });
  }

  setVisible(object_uuid: string, visible: boolean) {
    const object = this.get_object_by_uuid(object_uuid);
    if (object) {
      object.visible = visible;
      object.userData["visible"] = object.visible;
    }
  }

  async loadMMDWithPlaceholder(
    media_id: string,
    name: string,
    auto_add: boolean = true,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
  ): Promise<THREE.Object3D> {
    if (this.placeholder_manager === undefined) {
      throw Error("Place holder Manager is undefined");
    }
    const url = await this.getMediaURL(media_id);
    const key = media_id + name + generateUUID();
    await this.placeholder_manager.add(key, `Loading: ${name}`, position);
    const mmd = await this.load_mmd_wrapped(url, async (progress) => {
      const total_loaded = progress.loaded / progress.total;
      if (total_loaded == 1.0) {
        if (this.placeholder_manager === undefined) {
          throw Error("Place holder Manager is undefined");
        }
        await this.placeholder_manager.remove(key);
      }
    }).catch((error: Error) => {
      throw error;
    });
    mmd.traverse((c: THREE.Object3D) => {
      if (c instanceof THREE.Mesh) {
        c.material.metalness = 0.0;
        c.material.specular = 0.5;
        c.material.shininess = 0.0;
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = false;
        c.material.transparent = false;
      }
    });
    mmd.castShadow = true;
    mmd.receiveShadow = true;
    mmd.frustumCulled = false;
    mmd.name = "MMD" + name;
    mmd.frustumCulled = false;
    mmd.userData["media_id"] = media_id;
    mmd.userData["color"] = "#FFFFFF";
    mmd.userData["metalness"] = 0.0;
    mmd.userData["shininess"] = 0.5;
    mmd.userData["specular"] = 0.5;
    mmd.userData["locked"] = false;
    mmd.userData["media_file_type"] = MediaFileType.MMD;
    mmd.layers.enable(0);
    mmd.layers.enable(1);
    mmd.position.copy(position);
    this.scene.add(mmd);
    this.updateSurfaceIdAttributeToMesh(this.scene);
    return mmd;
  }

  async loadObjectFromUrl(
    url: string,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
  ): Promise<THREE.Object3D | undefined> {
    console.log("loadObjectFromUrl!!!!!!!!", url);
    if (
      url.includes(".png") ||
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".mp4")
    ) {
      const obj = await this.instantiate("Image::" + url);
      obj.position.copy(position);
      if (url.includes(".mp4")) {
        obj.userData["media_file_type"] = MediaFileType.Video;
      } else {
        obj.userData["media_file_type"] = MediaFileType.Image;
      }
      return obj;
    }
    return undefined;
  }

  async loadObject(
    media_id: string,
    name: string,
    auto_add: boolean = true,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
    version: number = 1.0,
    signal?: AbortSignal,
  ): Promise<THREE.Object3D> {
    const url = await this.getMediaURL(media_id);

    if (url.includes(".pmd") || url.includes(".pmx")) {
      return await this.loadMMDWithPlaceholder(
        media_id,
        name,
        auto_add,
        position,
      );
    } else if (
      url.includes(".png") ||
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".mp4")
    ) {
      const obj = await this.instantiate("Image::" + url);
      obj.position.copy(position);
      // Preserve original token to enable copy/paste and timeline mapping
      obj.userData["media_id"] = media_id;
      if (url.includes(".mp4")) {
        obj.userData["media_file_type"] = MediaFileType.Video;
      } else {
        obj.userData["media_file_type"] = MediaFileType.Image;
      }
      return obj;
    } else if (url.includes(".spz")) {
      return await this.loadSplatWithPlaceholder(
        media_id,
        name,
        auto_add,
        position,
        signal,
      );
    }

    return await this.loadGlbWithPlaceholder(
      media_id,
      name,
      auto_add,
      position,
      version,
      signal,
    );
  }

  addChildrenToScene(parent: THREE.Object3D, scene: THREE.Scene): void {
    parent.children.forEach((child: THREE.Object3D) => {
      scene.add(child);
      // If the child has its own children, recursively add them
      if (child.children && child.children.length > 0) {
        this.addChildrenToScene(child, scene);
      }
    });
  }

  containsGroup(object: THREE.Object3D): boolean {
    if (object instanceof THREE.Group) {
      return true;
    }
    for (const child of object.children) {
      if (this.containsGroup(child)) {
        return true;
      }
    }
    return false;
  }

  async loadSplatWithPlaceholder(
    media_id: string,
    name: string,
    auto_add: boolean = true,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
    signal?: AbortSignal,
  ): Promise<THREE.Object3D> {
    if (this.placeholder_manager === undefined) {
      throw Error("Place holder Manager is undefined");
    }

    const url = await this.getMediaURL(media_id);
    const key = media_id + name + generateUUID();
    await this.placeholder_manager.add(key, `Loading: ${name}`, position);

    const splat: SplatMesh = await this.load_splat_wrapped_no_cors(
      url,
      async () => {
        if (this.placeholder_manager === undefined) {
          throw Error("Place holder Manager is undefined");
        }
        await this.placeholder_manager.remove(key);
      },
      signal,
    ).catch(async (error) => {
      if (this.placeholder_manager !== undefined) {
        await this.placeholder_manager.remove(key);
      }
      // Don't toast aborts — those are us cancelling a superseded load.
      if ((error as { name?: string })?.name !== "AbortError") {
        toast.error("Failed to load splat.");
      }
      throw error;
    });

    splat.rotation.z = Math.PI;
    splat.position.copy(position);
    splat.userData["media_id"] = media_id;
    splat.userData["media_file_type"] = MediaFileType.SPZ;

    // Build the selection bbox child once. SplatMesh.initialized
    // resolves after the gaussian data is fully ready, so
    // getBoundingBox() returns real local-space extents. The wireframe
    // is hidden by default; SelectionOutlinePass flips its visibility
    // on select/deselect. ensureInternalBbox no-ops if an identical
    // child is already present.
    try {
      await splat.initialized;
      ensureInternalBbox(splat, splat.getBoundingBox());
    } catch (e) {
      console.warn("Splat bbox skipped: initialized promise rejected", e);
    }

    if (auto_add) {
      this.scene.add(splat);
    }
    this.updateSurfaceIdAttributeToMesh(this.scene);
    return splat;
  }

  async loadGlbWithPlaceholder(
    media_id: string,
    name: string,
    auto_add: boolean = true,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
    load_version: number = 1.0,
    signal?: AbortSignal,
  ): Promise<THREE.Object3D> {
    if (this.placeholder_manager === undefined) {
      throw Error("Place holder Manager is undefined");
    }

    const url = await this.getMediaURL(media_id);
    const key = media_id + name + generateUUID();
    await this.placeholder_manager.add(key, `Loading: ${name}`, position);

    // await this.delay(3000); // artificial delay.

    // NB(bt,2025-07-22): This is causing a lot of CORS errors in dev, so I'm starting
    // to funnel everything through Tauri. Not sure if that'll be more inefficient due
    // to spinning up new HTTP clients with new SSL handshakes without caching, but at
    // least it should bypass the cors errors.
    //
    // const glb = await this.load_glb_wrapped(url, async (progress) => {
    //   const total_loaded = progress.loaded / progress.total;
    //   //const percent = this.floatToPercent(total_loaded);
    //   //console.log(`GLB Loading: ${percent}`);
    //
    //   if (total_loaded == 1.0) {
    //     if (this.placeholder_manager === undefined) {
    //       throw Error("Place holder Manager is undefined");
    //     }
    //     //console.log(`GLB Loading: ${total_loaded} === ${key}`);
    //     await this.placeholder_manager.remove(key);
    //   }
    // }).catch((error: Error) => {
    //   throw error;
    // });

    const glb = await this.load_glb_wrapped_no_cors(
      url,
      async () => {
        if (this.placeholder_manager === undefined) {
          throw Error("Place holder Manager is undefined");
        }
        await this.placeholder_manager.remove(key);
      },
      signal,
    ).catch(async (error) => {
      if (this.placeholder_manager !== undefined) {
        await this.placeholder_manager.remove(key);
      }
      // Don't toast aborts — those are us cancelling a superseded load.
      if ((error as { name?: string })?.name !== "AbortError") {
        toast.error("Failed to load 3D asset.");
      }
      throw error;
    });

    let child_result = undefined;
    // Loads the first child
    glb.scene.children.forEach((child) => {
      child.traverse((c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          c.material.metalness = 0.0;
          c.material.specular = 0.5;
          c.material.shininess = 0.0;
          c.castShadow = true;
          c.receiveShadow = true;
          c.frustumCulled = false;
          c.material.transparent = false;
        }
      });

      child.frustumCulled = false;
      child.userData["media_id"] = media_id;
      child.userData["color"] = "#FFFFFF";
      child.userData["metalness"] = 0.0;
      child.userData["shininess"] = 0.5;
      child.userData["specular"] = 0.5;
      child.userData["locked"] = false;
      child.userData["media_file_type"] = MediaFileType.GLB;

      child.layers.enable(0);
      child.layers.enable(1);
      if (load_version <= 1.0) {
        child_result = child;
        console.log(
          "Loading older model consider resaving to upgrade to newer version of save file. Save Version:",
          load_version,
        );
      }
    });

    if (load_version <= 1.0) {
      glb.scene.name = "Scene";
      glb.scene.userData["name"] = "Scene";
      glb.scene.userData["media_id"] = media_id;
      glb.scene.userData["color"] = "#FFFFFF";
      glb.scene.userData["metalness"] = 0.0;
      glb.scene.userData["shininess"] = 0.5;
      glb.scene.userData["specular"] = 0.5;
      glb.scene.userData["locked"] = false;
    } else if (load_version > 1.0) {
      glb.scene.name = name;
      glb.scene.userData["name"] = name;
      glb.scene.userData["media_id"] = media_id;
      glb.scene.userData["color"] = "#FFFFFF";
      glb.scene.userData["metalness"] = 0.0;
      glb.scene.userData["shininess"] = 0.5;
      glb.scene.userData["specular"] = 0.5;
      glb.scene.userData["locked"] = false;
    }
    glb.scene.userData["media_file_type"] = MediaFileType.GLB;

    if (load_version > 1.0) {
      child_result = glb.scene;
    }

    if (child_result == undefined) {
      throw Error("GLB Did not contain an object or children.");
    }

    child_result.position.copy(position);

    if (auto_add) {
      this.scene.add(child_result);
      if (glb.animations.length > 0) {
        child_result.animations = glb.animations;
      }
    }
    this.updateSurfaceIdAttributeToMesh(this.scene);
    return child_result;
  }

  /**
   * Load a full media_url via Tauri (without browser cors)
   * @param media_url
   * @param onComplete
   * @returns
   */
  private async load_glb_wrapped_no_cors(
    media_url: string,
    onComplete: () => void,
    signal?: AbortSignal,
  ): Promise<GLTF> {
    return new Promise<GLTF>(async (resolve, reject) => {
      let buffer;
      try {
        // Host-supplied CORS-bypassed binary fetch (FetchProxy under
        // Tauri; plain fetch under web hosts that allow it).
        buffer = await (
          await this.deps.fetchAsset(media_url, { signal })
        ).arrayBuffer();
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          console.error("load GLB from Tauri error:", error);
        }
        reject(error);
        return;
      }
      const glbLoader = new GLTFLoader();
      glbLoader.parse(
        buffer,
        "", // NB: No relative path to load additional assets!
        (gltf) => {
          resolve(gltf);
          onComplete();
        },
        (error) => {
          console.error("GLTF loader error:", error);
          reject(error);
        },
      );
    });
  }

  /**
   * Load a full media_url via Tauri (without browser cors)
   * @param media_url
   * @param onComplete
   * @returns
   */
  private async load_splat_wrapped_no_cors(
    media_url: string,
    onComplete: () => void,
    signal?: AbortSignal,
  ): Promise<SplatMesh> {
    return new Promise(async (resolve, reject) => {
      let buffer;
      try {
        // Host-supplied CORS-bypassed binary fetch (FetchProxy under
        // Tauri; plain fetch under web hosts that allow it).
        buffer = await (
          await this.deps.fetchAsset(media_url, { signal })
        ).arrayBuffer();
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          console.error("load Splat from Tauri error:", error);
        }
        reject(error);
        return;
      }

      new SplatMesh({
        fileBytes: buffer,
        onLoad: (mesh) => {
          resolve(mesh);
          onComplete();
        },
      });
    });
  }

  /**
   * Using a constructed media_url load a glb, grab the progress.
   * @param media_url
   * @param progress
   * @returns
   */
  private load_glb_wrapped(
    media_url: string,
    progress: (event: ProgressEvent) => void,
  ): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      const glbLoader = new GLTFLoader();
      glbLoader.load(
        media_url,
        (gltf) => {
          resolve(gltf);
        },
        progress,
        (error) => {
          reject(error);
        },
      );
    });
  }

  // This allows to wait for Ammo to fully load.
  delay_mmd(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async load_mmd_wrapped(
    media_url: string,
    progress: (event: ProgressEvent) => void,
  ): Promise<THREE.SkinnedMesh> {
    // TODO: When converted to ts remove this and make ammo await instead.
    await this.delay_mmd(100);

    console.log("Load MMD");
    const scriptModule = document.createElement("script");
    scriptModule.type = "module";

    scriptModule.textContent = `
      Ammo().then(function (AmmoLib) {
        Ammo = AmmoLib;
    });
    `;
    document.head.appendChild(scriptModule);

    // TODO: When converted to ts remove this and make ammo await instead.
    await this.delay_mmd(500);

    return new Promise((resolve, reject) => {
      const mmdLoader = new MMDLoader();
      mmdLoader.loadWithAnimation(
        media_url,
        ["/resources/pose/Lumine Idle cycle.vmd"],
        (mmd) => {
          this.helper.add(mmd.mesh, {
            animation: mmd.animation,
            physics: false,
          });

          mmd.mesh.scale.set(0.1, 0.1, 0.1);
          resolve(mmd.mesh);
        },
        progress,
        (error) => {
          reject(error);
        },
      );
    });
  }

  // default skybox.
  _create_skybox() {
    const loader = new THREE.CubeTextureLoader();

    // Theme-aware: in light mode, use a near-white background for better contrast with UI
    try {
      if (
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("theme-light")
      ) {
        this.scene.background = new THREE.Color("#f5f6f8");
        if (this.ambientLight) this.scene.add(this.ambientLight);
        if (this.directional_light) this.scene.remove(this.directional_light);
        if (this.hemisphereLight) this.scene.add(this.hemisphereLight);
        return;
      }
    } catch (_) {
      // no-op: fallback to defaults below
    }

    if (this.skybox == "Default") {
      const texture = loader.load([
        "/resources/skybox/day/px.png",
        "/resources/skybox/day/nx.png",
        "/resources/skybox/day/py.png",
        "/resources/skybox/day/ny.png",
        "/resources/skybox/day/pz.png",
        "/resources/skybox/day/nz.png",
      ]);
      this.scene.background = texture;
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directional_light) this.scene.add(this.directional_light);
      if (this.hemisphereLight) this.scene.add(this.hemisphereLight);
    } else if (this.skybox == "m_0") {
      const texture = loader.load([
        "/resources/skybox/night/Night_Moon_Burst_Cam_2_LeftX.png",
        "/resources/skybox/night/Night_Moon_Burst_Cam_3_Right-X.png",
        "/resources/skybox/night/Night_Moon_Burst_Cam_4_UpY.png",
        "/resources/skybox/night/Night_Moon_Burst_Cam_5_Down-Y.png",
        "/resources/skybox/night/Night_Moon_Burst_Cam_0_FrontZ.png",
        "/resources/skybox/night/Night_Moon_Burst_Cam_1_Back-Z.png",
      ]);
      this.scene.background = texture;
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directional_light) this.scene.add(this.directional_light);
      if (this.hemisphereLight) this.scene.add(this.hemisphereLight);
    } else if (this.skybox == "m_1") {
      // Empty skybox - just a plain color
      this.scene.background = new THREE.Color("#282828");
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directional_light) this.scene.add(this.directional_light);
      if (this.hemisphereLight) this.scene.add(this.hemisphereLight);
    } else if (this.skybox == "m_2") {
      this.scene.background = new THREE.Color("#000000");
      if (this.ambientLight) this.scene.add(this.ambientLight);
      if (this.directional_light) this.scene.remove(this.directional_light);
      if (this.hemisphereLight) this.scene.remove(this.hemisphereLight);
    } else if (this.skybox == "m_3") {
      const texture = loader.load([
        "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_2_LeftX.png",
        "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_3_Right-X.png",
        "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_4_UpY.png",
        "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_5_Down-Y.png",
        "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_0_FrontZ.png",
        "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_1_Back-Z.png",
      ]);
      this.scene.background = texture;
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directional_light) this.scene.add(this.directional_light);
      if (this.hemisphereLight) this.scene.add(this.hemisphereLight);
    } else {
      // Default to empty skybox if no match
      this.scene.background = new THREE.Color("#282828");
      if (this.ambientLight) this.scene.remove(this.ambientLight);
      if (this.directional_light) this.scene.add(this.directional_light);
      if (this.hemisphereLight) this.scene.add(this.hemisphereLight);
    }

    console.log("Background creation..");
  }

  updateSkybox(media_id: string) {
    this.skybox = media_id;
    this._create_skybox();
  }

  // deafult image skybox.
  _create_single_skybox() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/resources/skybox/single.jpg", () => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      this.scene.background = texture;
    });
  }

  _create_base_lighting() {
    const color = 0xfcece7;
    this.hemisphereLight = new THREE.HemisphereLight(color, 0x8d8d8d, 3.0);
    this.scene.add(this.hemisphereLight);

    this.ambientLight = new THREE.AmbientLight(new THREE.Color("#ffffff"), 3);

    this.directional_light = new THREE.DirectionalLight(color, 2.0);

    this.directional_light.position.set(5, 10, 3);
    this.directional_light.shadow.mapSize.width = 2048;
    this.directional_light.shadow.mapSize.height = 2048;
    this.directional_light.shadow.map = null;
    this.directional_light.castShadow = false;
    this.directional_light.shadow.bias = 0.00004;
    this.directional_light.userData["media_id"] = "DirectionalLight";

    this.scene.add(this.directional_light);
    this.scene.add(this.directional_light.target);
    return this.directional_light;
  }

  _createGrid() {
    // Create visual infinite grid
    const size1 = 0.5; // Primary grid
    const size2 = 2.5; // Secondary grid
    const color = new THREE.Color(0xffffff);
    const distance = 80;

    this.gridHelper = new InfiniteGridHelper(size1, size2, color, distance);
    this.gridHelper.layers.set(1); // Enable default layer
    this.scene.add(this.gridHelper);

    // Create invisible ground plane for proper object placement
    const planeGeometry = new THREE.PlaneGeometry(300, 300); // Same as original grid size
    const planeMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    });
    this.groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.name = ""; // Empty name to avoid selection
    this.groundPlane.layers.set(0); // Put in layer 0 for placement raycasting
    this.groundPlane.userData["selectable"] = false; // Mark as non-selectable
    this.groundPlane.userData["placementOnly"] = false; // Don't include in interactable list
    this.groundPlane.matrixAutoUpdate = false; // Optimize performance since it never moves
    this.groundPlane.updateMatrix();
    this.groundPlane.receiveShadow = false;
    // Store the original raycast function
    const originalRaycast = this.groundPlane.raycast;
    // Override raycast to only work when the raycaster is checking layer 0
    this.groundPlane.raycast = function (raycaster, intersects) {
      if (raycaster.layers.test(this.layers)) {
        return originalRaycast.call(this, raycaster, intersects);
      }
    };
    this.scene.add(this.groundPlane);
  }

}

export default Scene;
