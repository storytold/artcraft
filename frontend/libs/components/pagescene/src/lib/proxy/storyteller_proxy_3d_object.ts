import * as THREE from "three";
import { MediaFileType } from "../enums";

export interface ObjectJSON {
  version: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
  object_name: string;
  object_uuid: string;
  object_user_data_name: string;
  media_file_token: string;
  color: string;
  metalness: number;
  shininess: number;
  specular: number;
  locked: boolean;
  visible: boolean | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rigData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user_data: Record<string, any>;
}

export class StoryTellerProxy3DObject {
  version: number;

  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;

  object_uuid: string;
  object_name: string;
  object_user_data_name: string; // changable name
  media_file_token: string;
  color: string;
  metalness: number;
  shininess: number;
  specular: number;
  locked: boolean;
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rigData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: Record<string, any>;

  constructor(version: number, media_file_token: string) {
    this.version = version;
    this.media_file_token = media_file_token;

    this.position = new THREE.Vector3(0.0, 0.0, 0.0);
    this.rotation = new THREE.Euler(0.0, 0.0, 0.0);
    this.scale = new THREE.Vector3(1.0, 1.0, 1.0);

    this.object_name = "";
    this.object_user_data_name = "";
    this.object_uuid = "";

    this.color = "";

    this.metalness = 0.0;
    this.shininess = 0.0;
    this.specular = 0.5;
    this.locked = false;
    this.visible = true;
    this.rigData = undefined;
    this.userData = {};
    this.userData.media_file_type = MediaFileType.None;
  }

  getColorAsHexString(object: THREE.Object3D): string {
    if (
      object instanceof THREE.Mesh &&
      object.material instanceof THREE.MeshBasicMaterial
    ) {
      return "#" + object.material.color.getHexString();
    }
    return "#FFFFFF";
  }

  public async initialize(object: THREE.Object3D) {
    this.position = object.position;
    this.rotation = object.rotation;
    this.scale = object.scale;

    this.object_name = object.name;
    this.object_user_data_name = object.userData.name;
    this.object_uuid = object.uuid;
    this.color = object.userData["color"];
    this.metalness = object.userData["metalness"];
    this.shininess = object.userData["shininess"];
    this.specular = object.userData["specular"];
    this.locked = object.userData["locked"];
  }

  public toJSON(): ObjectJSON {
    const json: ObjectJSON = {
      version: this.version,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      },
      rotation: {
        x: this.rotation.x,
        y: this.rotation.y,
        z: this.rotation.z,
      },
      scale: {
        x: this.scale.x,
        y: this.scale.y,
        z: this.scale.z,
      },
      object_name: this.object_name,
      object_uuid: this.object_uuid,
      object_user_data_name: this.object_user_data_name,
      media_file_token: this.media_file_token,
      color: this.color,
      metalness: this.metalness,
      shininess: this.shininess,
      specular: this.specular,
      locked: this.locked,
      visible: this.visible,
      user_data: this.userData,
      rigData: this.rigData,
    };
    return json;
  }
}
