import * as THREE from "three";
import {
  IconDefinition,
  faCamera,
  faCube,
  faPerson,
} from "@fortawesome/pro-solid-svg-icons";
import Scene from "./scene";
import { MouseControls } from "./keybinds_controls";
import { ClipGroup, AssetType } from "../enums";
import { XYZ } from "../datastructures/common";
import type { EngineEventBus } from "./events/EngineEventBus";
import { ObjectAddedEvent } from "./events/EngineEvent";
import { isInternalBbox } from "./internalBbox";

export type SceneObject = {
  id: string;
  icon: IconDefinition;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
};

export interface SceneManagerAPI {
  create(media_token: string, name: string, position: THREE.Vector3): void;
  retrieve(object_uuid: string): void;
  delete(object_uuid: string): void;
  update(
    object_uuid: string,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
  ): void;
  selected(): void;
  render_outliner(timeline_characters: { [key: string]: ClipGroup }): void;
  select_object(id: string): void;
}

export class SceneManager implements SceneManagerAPI {
  scene: Scene;
  mouse_controls: MouseControls;
  version: number;
  selected_objects: THREE.Object3D[] | undefined;
  private copiedObject: THREE.Object3D | undefined;
  private bus: EngineEventBus;

  constructor(
    version: number,
    mouse_controls: MouseControls,
    scene: Scene,
    bus: EngineEventBus,
  ) {
    this.mouse_controls = mouse_controls;
    this.scene = scene;
    this.version = version;
    this.bus = bus;
  }

  public async create(
    media_token: string,
    name: string,
    position: THREE.Vector3,
  ): Promise<THREE.Object3D<THREE.Object3DEventMap> | undefined> {
    if (media_token.includes("SKY::")) {
      const token = media_token.replace("SKY::", "");
      this.scene.updateSkybox(token);
    } else if (media_token !== "Parim") {
      // Support direct image/video URL pastes via the Image::<url> scheme
      if (media_token.startsWith("Image::")) {
        const url = media_token.replace("Image::", "");
        const obj = await this.scene.loadObjectFromUrl(url, position);
        if (obj) {
          obj.name = name;
          obj.userData["name"] = name;
        }
        return obj as THREE.Object3D<THREE.Object3DEventMap>;
      }

      const obj = await this.scene.loadObject(
        media_token,
        name,
        true,
        position,
        this.version,
      );
      if (obj) {
        obj.name = name;
        obj.userData["name"] = name;
      }
      return obj as THREE.Object3D<THREE.Object3DEventMap> | undefined;
    } else {
      return this.scene.instantiate(name, position);
    }
  }

  updateSkybox(media_id: string) {
    this.scene.updateSkybox(media_id);
  }

  /* NEVER CALL THIS INTERNALLY */
  public render_outliner(timeline_characters: { [key: string]: ClipGroup }) {
    // needs timeline_characters to render favicons.
    // Not permanent just in place until we have multi object select ability.
    const selected_item = this.selected();
    const signal_items: SceneObject[] = [];
    this.scene.scene.children.forEach((child) => {
      // Internal selection-bbox helpers (children of splats) shouldn't
      // appear in the outliner. They're parented under the splat, so
      // top-level enumeration already skips them in practice — this
      // guard hardens the boundary in case anyone ever promotes one.
      if (isInternalBbox(child)) return;
      const converted = this.convert_object(child, timeline_characters);
      if (converted.name !== "") {
        signal_items.push(converted);
      }
    });
    const outlinerState = {
      selectedItem: selected_item,
      items: signal_items,
    };
    return outlinerState;
  }

  public async retrieve(object_uuid: string) {
    return this.scene.get_object_by_uuid(object_uuid);
  }

  public async update(
    object_uuid: string,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
  ) {
    const object = await this.retrieve(object_uuid);
    if (object) {
      object.position.copy(position);
      object.rotation.copy(rotation);
      object.scale.copy(scale);
    }
  }

  public async delete(object_uuid: string) {
    // Deletes an object.
    this.mouse_controls.deleteObject(object_uuid);
  }

  public async double_click() {
    this.mouse_controls.focus();
  }

  public async hideObject(object_uuid: string) {
    const object = await this.retrieve(object_uuid);
    if (object?.visible !== undefined) {
      object.visible = !object.visible;
      object.userData["visible"] = object.visible;
    }
  }

  public selected() {
    let selected_item = null;
    if (this.selected_objects && this.selected_objects.length > 0) {
      selected_item = this.selected_objects[0];
    }
    if (selected_item) {
      return this.convert_object(selected_item, {});
    }
    return null;
  }

  public select_object(id: string) {
    const object = this.scene.get_object_by_uuid(id);
    if (object) {
      this.mouse_controls.selected = [object];
      this.mouse_controls.selectObject(object);
    }
  }

  // Writes position/rotation/scale onto the currently selected object.
  // Rotation is taken in degrees (matches the Object Panel input).
  public updateSelectedTransform(position: XYZ, rotation: XYZ, scale: XYZ) {
    const object = this.selected_objects?.[0];
    if (!object) return;
    object.position.set(position.x, position.y, position.z);
    object.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z),
    );
    object.scale.set(scale.x, scale.y, scale.z);
  }

  // Converts a 3d object to signal item format.
  private convert_object(
    object: THREE.Object3D,
    timeline_characters: { [key: string]: ClipGroup },
  ) {
    let faicon = faCube;
    let name = object.name;
    if (object.name == "::CAM::") {
      faicon = faCamera;
      name = "Camera";
    } else if (object.uuid in timeline_characters) {
      faicon = faPerson;
    }
    let locked = object.userData["locked"];
    if (locked == undefined) {
      locked = false;
    }
    return {
      id: object.uuid,
      icon: faicon,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      type: object.type,
      visible: object.visible,
      locked: object.userData["locked"],
    };
  }

  public async copy() {
    const object = this.mouse_controls.selected?.at(0);
    if (object !== undefined && object.name !== "::CAM::") {
      this.copiedObject = object;
    }
  }

  public async paste(): Promise<THREE.Object3D | undefined> {
    if (this.copiedObject && this.copiedObject.name != "::CAM::") {
      const userdata = this.copiedObject.userData;
      const position = this.copiedObject.position.clone();
      const rotation = this.copiedObject.rotation.clone();
      const scale = this.copiedObject.scale.clone();

      const media_id = userdata["media_id"];
      const color = userdata["color"];
      const name = this.copiedObject.name;
      const wasCharacter: boolean = !!this.copiedObject.userData.isCharacter;

      const obj = await this.create(media_id, name, position);
      if (!obj) {
        return;
      }
      this.scene.setColor(obj.uuid, color);
      obj.position.copy(position.add(new THREE.Vector3(0.5, 0.0, 0.5)));
      obj.rotation.copy(rotation);
      obj.scale.copy(scale);

      // Preserve character stuff on pasted object
      if (wasCharacter) {
        obj.userData.isCharacter = true;
      }

      this.mouse_controls.selectObject(obj);

      this.bus.emit(
        new ObjectAddedEvent({
          id: obj.uuid,
          kind: wasCharacter ? "character" : "object",
          name,
          mediaId: media_id,
        }),
      );

      await this.copy();
      return obj;
    }
    return undefined;
  }

}
