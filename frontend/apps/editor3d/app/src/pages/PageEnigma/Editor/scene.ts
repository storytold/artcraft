import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MMDLoader } from "three/addons/loaders/MMDLoader.js";

import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { generateUUID } from "three/src/math/MathUtils.js";
import { LoadingPlaceHolderManager } from "./placeholder_manager";
import { MMDAnimationHelper, Water } from "three/examples/jsm/Addons.js";
import { MediaFileType } from "../enums";
import { ChromaKeyMaterial } from "./chromakey";
import { TimeLine } from "./timeline";
import { ClipGroup, ClipType } from "~/enums";
import { ClipUI } from "../clips/clip_ui";
import { LoadWithoutCors } from "@storyteller/tauri-api";
import { gridVisibility } from "../signals/engine";
import { InfiniteGridHelper } from "./InfiniteGridHelper";
import { cameras, selectedCameraId } from "../signals/camera";
import { MediaFilesApi } from "@storyteller/api";
import toast from "react-hot-toast";

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

  skybox: string;

  // loading indicator manager
  placeholder_manager: LoadingPlaceHolderManager | undefined;

  mediaFilesApi: MediaFilesApi;

  updateSurfaceIdAttributeToMesh: Function;
  helper: MMDAnimationHelper;
  ambientLight: THREE.AmbientLight | undefined;
  hemisphereLight: THREE.HemisphereLight | undefined;
  directional_light: THREE.DirectionalLight | undefined;
  timeline: TimeLine | undefined;
  version: number;

  // This is used to ensure we do not rerender or process the video if we already have done so.
  // This allows us to reprompt things quickly. This is only written when a snap shot is taken.
  // Which guarentees that the scene is availible.
  current_scene_checksum: string;
  constructor(
    name: string,
    camera_name: string,
    updateSurfaceIdAttributeToMesh: Function,
    version: number,
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
    this.mediaFilesApi = new MediaFilesApi();
    this.updateSurfaceIdAttributeToMesh = updateSurfaceIdAttributeToMesh;

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

    // Subscribe to grid visibility changes
    gridVisibility.subscribe((isVisible) => {
      if (this.gridHelper) {
        if (isVisible) {
          if (!this.scene.children.includes(this.gridHelper)) {
            this.scene.add(this.gridHelper);
          }
        } else {
          this.scene.remove(this.gridHelper);
        }
      }
    });
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
          return object;
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
    cameras.value.forEach((cameraConfig) => {
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

        if (cameraConfig.id === selectedCameraId.value) {
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

  // TODO: REPLACE
  async getMediaURL(media_id: string) {
    console.log("getMediaID!!!!!!!!!!!!!", media_id);
    const response = await this.mediaFilesApi.GetMediaFileByToken({
      mediaFileToken: media_id,
    });
    console.log("response!!!!!!!!!!!!!!", response);
    return response.data!.media_links.cdn_url;
  }

  private floatToPercent(value: number) {
    return `${(value * 100).toFixed(0)}%`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setColor(object_uuid: string, hex_color: string) {
    const object = this.get_object_by_uuid(object_uuid);
    if (object) {
      object.userData["color"] = hex_color;
      object.traverse((c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          if (c.userData["water"]) {
            c.material.uniforms.waterColor.value = new THREE.Color(hex_color);
          } else if (c.material.color !== undefined) {
            if (c.userData["base"] === undefined) {
              c.userData["base"] = c.material.color.getHex();
            }
            if (c.material.map === undefined || c.material.map === null) {
              const currentColor = new THREE.Color(c.userData["base"]);
              const tint = new THREE.Color(hex_color);
              currentColor.multiply(tint);
              c.material.color.set(new THREE.Color(currentColor));
            } else {
              c.material.color.set(new THREE.Color(hex_color));
            }

            if (c.name == "PointLight") {
              const light = this.get_object_by_uuid(c.userData["light"]);
              if (light) {
                (light as THREE.PointLight).color = new THREE.Color(hex_color);
              }
            }
          }
        }
      });
    }
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
    this.scene.add(mmd);
    this.updateSurfaceIdAttributeToMesh(this.scene);
    return mmd;
  }

  async loadObjectFromUrl(
    url: string,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
  ): Promise<THREE.Object3D> {
    console.log("loadObjectFromUrl!!!!!!!!", url);
    if (
      url.includes(".png") ||
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".mp4")
    ) {
      return await this.instantiate("Image::" + url);
    }
  }

  async loadObject(
    media_id: string,
    name: string,
    auto_add: boolean = true,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
    version: number = 1.0,
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
      return await this.instantiate("Image::" + url);
    }
    return await this.loadGlbWithPlaceholder(
      media_id,
      name,
      auto_add,
      position,
      version,
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

  async loadGlbWithPlaceholder(
    media_id: string,
    name: string,
    auto_add: boolean = true,
    position: THREE.Vector3 = new THREE.Vector3(-0.5, 1.5, 0),
    load_version: number = 1.0,
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

    const glb = await this.load_glb_wrapped_no_cors(url, async () => {
      if (this.placeholder_manager === undefined) {
        throw Error("Place holder Manager is undefined");
      }
      await this.placeholder_manager.remove(key);
    }).catch(async (error) => {
      if (this.placeholder_manager !== undefined) {
        await this.placeholder_manager.remove(key);
      }
      toast.error("Failed to load 3D asset.");
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

    if (auto_add) {
      this.scene.add(child_result);
      if (glb.animations.length > 0) {
        console.log(glb.animations);
        const animation = glb.animations[0];
        child_result.animations = glb.animations;
        // load first animation
        this.timeline?.addSelfAnimationClip(
          new ClipUI(
            this.version,
            ClipType.ANIMATION,
            ClipGroup.CHARACTER,
            animation.name,
            "SelfClip",
            animation.uuid,
            child_result.uuid,
            name,
            0,
            100,
            0,
            MediaFileType.GLB,
          ),
          animation,
        );
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
  ) {
    return new Promise(async (resolve, reject) => {
      let buffer;
      try {
        buffer = await LoadWithoutCors(media_url); // Load via Tauri!
      } catch (error) {
        console.error("load GLB from Tauri error:", error);
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
    const color = new THREE.Color(0x444444);
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

  // Update grid visibility based on the signal
  updateGridVisibility() {
    if (gridVisibility.value) {
      if (!this.scene.children.includes(this.gridHelper)) {
        this.scene.add(this.gridHelper);
      }
    } else {
      this.scene.remove(this.gridHelper);
    }
    // Keep the ground plane regardless of grid visibility
  }
}

export default Scene;
