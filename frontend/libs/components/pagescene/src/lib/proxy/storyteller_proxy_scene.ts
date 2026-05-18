import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  StoryTellerProxy3DObject,
  ObjectJSON,
} from "./storyteller_proxy_3d_object";
import Scene from "../engine/scene";
import { BoneJSONHelper } from "../engine/KinHelpers/BoneJSONHelper";
import type { LoadTicket } from "../engine/save_manager";
import { BBOX_INTERNAL_KEY, isInternalBbox } from "../engine/internalBbox";

interface LookUpDictionary {
  [key: string]: StoryTellerProxy3DObject;
}

export class StoryTellerProxyScene {
  sceneItemProxy: StoryTellerProxy3DObject[];
  scene: Scene;
  glbLoader: GLTFLoader;

  lookUpDictionary: LookUpDictionary;
  version: number;

  constructor(version: number, scene: Scene) {
    this.version = version;
    this.scene = scene;
    this.glbLoader = new GLTFLoader();
    this.lookUpDictionary = {};
    this.sceneItemProxy = [];
  }

  getChildren(child: THREE.Object3D) {
    if (this.lookUpDictionary[child.uuid] == null) {
      this.lookUpDictionary[child.uuid] = new StoryTellerProxy3DObject(
        this.version,
        child.userData["media_id"],
      );
    }

    const proxyObject3D: StoryTellerProxy3DObject =
      this.lookUpDictionary[child.uuid];
    proxyObject3D.position.copy(child.position);
    proxyObject3D.rotation.copy(child.rotation);
    proxyObject3D.scale.copy(child.scale);
    proxyObject3D.object_user_data_name = child.userData.name;
    proxyObject3D.object_name = child.name;
    proxyObject3D.object_uuid = child.uuid;
    proxyObject3D.color = child.userData["color"];
    proxyObject3D.metalness = child.userData["metalness"];
    proxyObject3D.shininess = child.userData["shininess"];
    proxyObject3D.specular = child.userData["specular"];
    proxyObject3D.locked = child.userData["locked"];
    proxyObject3D.visible = child.visible;
    proxyObject3D.userData = child.userData;
    // Add rig data if present
    const boneHelper = new BoneJSONHelper(child);
    proxyObject3D.rigData = boneHelper.toJSON();

    const json_data = proxyObject3D.toJSON();
    return json_data;
  }

  public saveToSceneOlder(): ObjectJSON[] {
    const results: ObjectJSON[] = [];
    if (this.scene.scene != null) {
      for (const child of this.scene.scene.children) {
        if (isInternalBbox(child)) continue;
        if (child.userData["media_id"] != undefined) {
          if (this.lookUpDictionary[child.uuid] == null) {
            this.lookUpDictionary[child.uuid] = new StoryTellerProxy3DObject(
              this.version,
              child.userData["media_id"],
            );
          }
          const proxyObject3D: StoryTellerProxy3DObject =
            this.lookUpDictionary[child.uuid];
          proxyObject3D.position.copy(child.position);
          proxyObject3D.rotation.copy(child.rotation);
          proxyObject3D.scale.copy(child.scale);
          proxyObject3D.object_user_data_name = child.userData.name;
          proxyObject3D.object_name = child.name;
          proxyObject3D.object_uuid = child.uuid;
          proxyObject3D.color = child.userData["color"];
          proxyObject3D.metalness = child.userData["metalness"];
          proxyObject3D.shininess = child.userData["shininess"];
          proxyObject3D.specular = child.userData["specular"];
          proxyObject3D.locked = child.userData["locked"];
          const json_data = proxyObject3D.toJSON();
          results.push(json_data);
        }
      }
    } else {
      console.log("Scene doesn't exist needs to be assigned");
    }
    console.log(results);
    return results;
  }

  public saveToScene(version: number): ObjectJSON[] {
    this.version = version;
    console.log("Saving with version:", this.version);
    const results: ObjectJSON[] = [];
    if (this.scene.scene != null) {
      for (const pchild of this.scene.scene.children) {
        if (isInternalBbox(pchild)) continue;
        if (this.version >= 1.0) {
          if (pchild.userData["media_id"] != undefined) {
            console.debug("Object JSON:", pchild.toJSON());
            results.push(this.getChildren(pchild));
          }
        } else {
          console.log("Saving older.");
          return this.saveToSceneOlder();
        }
      }
    } else {
      console.log("Scene doesn't exist needs to be assigned");
    }
    console.debug("Scene saved.", results);
    return results;
  }

  public async loadFromSceneJson(
    scene_json: ObjectJSON[],
    skybox_media_id: string,
    version: number,
    ticket?: LoadTicket,
  ) {
    if (scene_json == null || this.scene == null) return;

    while (this.scene.scene.children.length > 0) {
      this.scene.scene.remove(this.scene.scene.children[0]);
    }

    // Warm Scene's URL cache up front so per-asset loadObject() calls
    // never hit the network for token→URL resolution. One batch call
    // (or N parallel singles via the fallback) instead of an N+1
    // sequential chain.
    const mediaTokens = scene_json
      .map((j) => j.media_file_token)
      .filter((t) => t.startsWith("m_"));
    if (mediaTokens.length > 0) {
      await this.scene.warmMediaURLs(mediaTokens);
    }
    if (ticket?.cancelled) return;

    // Build per-object load tasks. Each task creates its Object3D
    // (network calls happen here, in parallel across tasks) and
    // returns the pair so the post-pass can apply transforms in
    // original JSON order. Errors don't abort siblings — Promise
    // .allSettled lets one bad asset land while the rest succeed.
    const tasks = scene_json.map(
      async (
        json_object,
      ): Promise<{
        json_object: ObjectJSON;
        obj: THREE.Object3D | undefined;
      }> => {
        // Defensive: __bbox_internal helpers are rebuilt at splat
        // load and shouldn't appear in saved JSON, but skip any that
        // sneak in from hand-edited or pre-fix snapshots.
        if (json_object.user_data?.[BBOX_INTERNAL_KEY] === true) {
          return { json_object, obj: undefined };
        }
        const token = json_object.media_file_token;
        if (token === "Parim") {
          // The display name ("Cube", "Point Light") doesn't match
          // Scene.instantiate's geometry switch — that switch wants
          // the geometry key ("Box", "PointLight"). addShape stashes
          // the original key in userData.shapeKey so we can recover
          // it here; without this, instantiate falls through to its
          // else branch and returns an empty Mesh with undefined
          // geometry, which renders invisibly and isn't raycast-
          // pickable.
          const shapeKey =
            (json_object.user_data?.shapeKey as string | undefined) ??
            json_object.object_name;
          const newScene = await this.scene.instantiate(shapeKey);
          return {
            json_object,
            obj: this.scene.get_object_by_uuid(newScene.uuid),
          };
        }
        if (token === "DirectionalLight") {
          return { json_object, obj: this.scene._create_base_lighting() };
        }
        if (token.includes("m_")) {
          const obj = await this.scene.loadObject(
            token,
            json_object.object_name,
            true,
            new THREE.Vector3(-0.5, 1.5, 0),
            version,
            ticket?.signal,
          );
          // Older scene JSON may lack a `user_data` field; keep
          // THREE.Object3D's default `{}` in that case so the
          // downstream `obj.userData.name = ...` doesn't crash.
          if (json_object.user_data) {
            obj.userData = json_object.user_data;
          }
          if (json_object.rigData) {
            const boneHelper = new BoneJSONHelper(obj);
            boneHelper.poseFromBoneJSON(json_object.rigData);
          }
          return { json_object, obj };
        }
        if (token.includes("Point::")) {
          const keyframe_uuid = token.replace("Point::", "");
          const obj = this.scene.createPoint(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            keyframe_uuid,
          );
          return { json_object, obj };
        }
        if (token.includes("Image::")) {
          const prim = await this.scene.instantiate(token);
          const obj = this.scene.get_object_by_uuid(prim.uuid);
          if (obj) {
            obj.name = json_object.object_name;
            obj.userData["name"] = json_object.object_name;
          }
          return { json_object, obj };
        }
        return { json_object, obj: undefined };
      },
    );

    const settled = await Promise.allSettled(tasks);
    if (ticket?.cancelled) return;

    // Synchronous transform-application pass. We walk results in
    // original JSON order to preserve scene.children insertion
    // ordering for downstream consumers that rely on it (timeline,
    // export, etc.).
    for (const result of settled) {
      if (result.status === "rejected") {
        // Swallow aborts from cancelled loads — they're expected and
        // don't represent a real failure.
        const reason = result.reason as { name?: string } | undefined;
        if (reason?.name !== "AbortError") {
          console.error("Scene load: object failed to load", result.reason);
        }
        continue;
      }
      const { obj, json_object } = result.value;
      if (!obj) continue;
      obj.position.copy(json_object.position);
      obj.rotation.copy(
        new THREE.Euler(
          json_object.rotation.x,
          json_object.rotation.y,
          json_object.rotation.z,
        ),
      );
      obj.scale.copy(json_object.scale);
      obj.name = json_object.object_name;
      obj.userData.name = json_object.object_user_data_name;
      obj.uuid = json_object.object_uuid;
      obj.userData["media_id"] = json_object.media_file_token;
      obj.userData["locked"] = json_object.locked;
      obj.userData["color"] = json_object.color;
      obj.userData["metalness"] = json_object.metalness;
      obj.userData["shininess"] = json_object.shininess;
      obj.userData["specular"] = json_object.specular;
      obj.userData["media_file_type"] = json_object.media_file_type;
      // Re-stash the geometry key on the recreated shape so the next
      // save round-trip survives — the wholesale userData copy that
      // the m_* branch does isn't applied here.
      if (json_object.user_data?.shapeKey) {
        obj.userData.shapeKey = json_object.user_data.shapeKey;
      }
      // Restore the persisted shape marker that setColor classifies on.
      // instantiate already re-sets these on the "Parim" branch; this is
      // explicit parity with shapeKey and future-proofs any other path.
      if (json_object.user_data?.isShape !== undefined) {
        obj.userData["isShape"] = json_object.user_data.isShape;
      }
      if (json_object.user_data?.shapeType !== undefined) {
        obj.userData["shapeType"] = json_object.user_data.shapeType;
      }
      if (json_object.visible !== undefined) {
        this.scene.setVisible(obj.uuid, json_object.visible);
      }
      this.scene.setColor(obj.uuid, json_object.color);
    }

    this.scene._createGrid();
    this.scene.updateSkybox(skybox_media_id);
  }
}
