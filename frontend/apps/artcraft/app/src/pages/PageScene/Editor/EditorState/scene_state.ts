// import * as THREE from "three";
import { Object3D } from "./object_3d";
import { Object3DJSON } from "./EditorStateJSON/object_3d_json";
import Scene from "../../Editor/scene";
import { SceneStateJson } from "./EditorStateJSON/scene_state_json";
const DEFAULT_SCENE_VER = 1.0;

export class SceneState {
  version: number;
  sceneItems: Object3D[] | undefined;

  constructor({ scene, version }: { scene?: Scene; version?: number }) {
    this.version = version ?? scene?.version ?? DEFAULT_SCENE_VER;
  }

  public async initiateFromScene({ scene }: { scene: Scene }): Promise<void> {
    if (this.version < 1) {
      this.saveFromSceneObjectVer0(scene)
        .then((result) => {
          this.sceneItems = result;
        })
        .catch((e) => {
          throw e;
        });
    }

    const result = new Array<Object3D>();
    // TODO turn the sceneItems into an object3d-json
    // reject if something goes wrong
    // or else send the result via resolve
    this.sceneItems = result;
    return;
  }

  public async initiateFromObject3DJson({
    objectJsons,
  }: {
    objectJsons: Object3DJSON[];
  }): Promise<void> {
    const sceneItems = objectJsons.map((jsonObject: Object3DJSON) => {
      console.log(jsonObject);
      const object3D = new Object3D(this.version, "placeholder-token");
      // TODO: now translate that jsonObject back into a ThreeJS 3D object
      return object3D;
    });
    this.sceneItems = sceneItems;
    return;
  }

  public async saveFromSceneObjectVer0(scene: Scene): Promise<Object3D[]> {
    console.log("saveFromSceneObjectVer0", scene);
    const results: Object3D[] = [];
    // TODO: turn sceneItems fron type of Object3D into Object3DJSON, the old way

    // if (this.scene.scene != null) {
    //   for (const child of this.scene.scene.children) {
    //     if (child.userData["media_id"] != undefined) {
    //       if (this.lookUpDictionary[child.uuid] == null) {
    //         this.lookUpDictionary[child.uuid] = new Object3D(
    //           this.version,
    //           child.userData["media_id"],
    //         );
    //       }
    //       const proxyObject3D: Object3D = this.lookUpDictionary[child.uuid];
    //       proxyObject3D.position.copy(child.position);
    //       proxyObject3D.rotation.copy(child.rotation);
    //       proxyObject3D.scale.copy(child.scale);
    //       proxyObject3D.object_user_data_name = child.userData.name;
    //       proxyObject3D.object_name = child.name;
    //       proxyObject3D.object_uuid = child.uuid;
    //       proxyObject3D.color = child.userData["color"];
    //       proxyObject3D.metalness = child.userData["metalness"];
    //       proxyObject3D.shininess = child.userData["shininess"];
    //       proxyObject3D.specular = child.userData["specular"];
    //       proxyObject3D.locked = child.userData["locked"];
    //       const json_data = await proxyObject3D.toJSON();
    //       results.push(json_data);
    //     }
    //   }
    // } else {
    //   console.log("Scene doesn't exist needs to be assigned");
    // }
    // console.log(results);
    return results;
  }

  public async toJSON(): Promise<SceneStateJson> {
    const result: SceneStateJson = {
      version: this.version,
      sceneItems: [],
    };
    if (this.sceneItems) {
      for (let i = 0; i < this.sceneItems.length; i = i + 1) {
        const itemJson = await this.sceneItems[i].toJSON();
        result.sceneItems.push(itemJson);
      }
    }
    return result;
  }
}
