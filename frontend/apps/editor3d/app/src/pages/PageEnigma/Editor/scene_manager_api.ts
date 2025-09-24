import * as THREE from "three";
import {
  IconDefinition,
  faCamera,
  faCube,
  faPerson,
} from "@fortawesome/pro-solid-svg-icons";
import Scene from "./scene";
import { MouseControls } from "./keybinds_controls";
import { ClipGroup } from "~/enums";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { fromEngineActions } from "~/pages/PageEnigma/Queue/fromEngineActions";
import { MediaItem } from "~/pages/PageEnigma/models";
import { AssetType } from "~/enums";
import {
  CommandInputTypes,
  CreationSceneItem,
  DeletionData,
  DeletionSceneItem,
  ICommand,
  SceneState,
  TransformData,
  TransformSceneItem,
  UserData,
  UserDataSceneItem,
} from "./Commands";

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
  undo(): void;
  redo(): void;
  selected(): void;
  render_outliner(timeline_characters: { [key: string]: ClipGroup }): void;
  onMouseMove(event: MouseEvent): void;
  onMouseClick(): void;
  onKeyDown(event: KeyboardEvent): void;
  onMouseDown(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  select_object(id: string): void;
}

type UpdateOutliner = () => void;

export class SceneManager implements SceneManagerAPI {
  scene: Scene;
  mouse_controls: MouseControls;
  version: number;
  selected_objects: THREE.Object3D[] | undefined;
  private updateOutliner: UpdateOutliner;
  public undoStack: ICommand<CommandInputTypes>[] = [];
  private undoIndex: number = 0;
  private lastSceneState: SceneState;
  private copiedObject: THREE.Object3D | undefined;
  private is_character: Function;
  private devMode: boolean;

  constructor(
    version: number,
    mouse_controls: MouseControls,
    scene: Scene,
    devMode: boolean = false,
    updateOutliner: UpdateOutliner,
    is_character: Function,
  ) {
    this.mouse_controls = mouse_controls;
    this.scene = scene;
    this.version = version;
    this.lastSceneState = this.getSceneState();
    this.updateOutliner = updateOutliner;
    this.is_character = is_character;
    this.devMode = devMode;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseClick = this.onMouseClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  public attachEventListeners() {
    if (!this.devMode) {
      return;
    }
    window.addEventListener("mousemove", this.onMouseMove, false);
    window.addEventListener("click", this.onMouseClick, false);
    window.addEventListener("keydown", this.onKeyDown, false);
    window.addEventListener("mousedown", this.onMouseDown, false);
    window.addEventListener("mouseup", this.onMouseUp, false);
  }

  public detachEventListeners() {
    if (!this.devMode) {
      return;
    }
    window.removeEventListener("mousemove", this.onMouseMove, false);
    window.removeEventListener("click", this.onMouseClick, false);
    window.removeEventListener("keydown", this.onKeyDown, false);
    window.removeEventListener("mousedown", this.onMouseDown, false);
    window.removeEventListener("mouseup", this.onMouseUp, false);
  }

  public async undo() {
    this.undoIndex += 1;
    if (this.undoIndex >= this.undoStack.length) {
      this.undoIndex = this.undoStack.length;
    }
    const undoCommand = this.undoStack.at(
      this.undoStack.length - this.undoIndex,
    );
    await undoCommand?.undo();
    this.updateOutliner(); // In the future we will address this because of its relational issues with editor and the current class.
    this.lastSceneState = this.getSceneState();
  }

  public async redo() {
    const undoCommand = this.undoStack.at(
      this.undoStack.length - this.undoIndex,
    );
    await undoCommand?.redo();
    this.undoIndex -= 1;
    if (this.undoIndex <= -1) {
      this.undoIndex = 0;
    }
    this.updateOutliner(); // In the future we will address this because of its relational issues with editor and the current class.
    this.lastSceneState = this.getSceneState();
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

  public async paste() {
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
      this.updateOutliner();

      if (wasCharacter) {
        Queue.publish({
          queueName: QueueNames.FROM_ENGINE,
          action: fromEngineActions.UPDATE_CHARACTER_ID,
          data: {
            version: 1,
            type: AssetType.CHARACTER,
            media_id: media_id,
            object_uuid: obj.uuid,
            name: name,
          } as MediaItem,
        });
      } else {
        Queue.publish({
          queueName: QueueNames.FROM_ENGINE,
          action: fromEngineActions.ADD_OBJECT,
          data: {
            version: 1,
            type: AssetType.OBJECT,
            media_id: media_id,
            object_uuid: obj.uuid,
            name: name,
          } as MediaItem,
        });
      }

      await this.copy();
      await this.add_creation_undostack(obj);
    }
  }

  public onMouseMove(event: MouseEvent) {
    this.mouse_controls.onMouseMove(event);
  }

  public onMouseClick() {
    this.mouse_controls.onMouseClick();
  }

  public onKeyDown(event: KeyboardEvent) {
    this.mouse_controls.onkeydown(event);
  }

  public onMouseDown(event: MouseEvent) {
    this.mouse_controls.onMouseDown(event);
  }

  public onMouseUp(event: MouseEvent) {
    this.mouse_controls.onMouseUp(event);
    this.check_scene_for_updates();
  }

  private getSceneState(): SceneState {
    const scene_objects: string[] = [];
    const scene_names: string[] = [];
    const scene_positions: string[] = [];
    const scene_userdata: string[] = [];
    const scene_rotations: string[] = [];
    const scene_scales: string[] = [];

    this.scene.scene.children.forEach((child) => {
      if (child.name != "") {
        scene_objects.push(child.uuid);
        scene_names.push(child.name);
        scene_userdata.push(JSON.stringify(child.userData));
        scene_positions.push(JSON.stringify(child.position.clone()));
        scene_rotations.push(JSON.stringify(child.rotation.clone()));
        scene_scales.push(JSON.stringify(child.scale.clone()));
      }
    });
    return {
      scene_objects: scene_objects,
      scene_names: scene_names,
      scene_userdata: scene_userdata,
      scene_positions: scene_positions,
      scene_rotations: scene_rotations,
      scene_scales: scene_scales,
    };
  }

  private is_creation(sceneState: SceneState): string {
    let resp = "";
    sceneState.scene_objects.forEach((object) => {
      if (!this.lastSceneState.scene_objects.includes(object)) {
        resp = object;
        return resp;
      }
    });
    return resp;
  }

  private is_deletion(sceneState: SceneState): string {
    let resp = "";
    this.lastSceneState.scene_objects.forEach((object) => {
      if (sceneState.scene_objects.includes(object) == false) {
        resp = object;
        return resp;
      }
    });
    return resp;
  }

  private is_userdata(sceneState: SceneState): string {
    let resp = "";
    this.lastSceneState.scene_userdata.forEach((object) => {
      if (sceneState.scene_userdata.includes(object) == false) {
        const respIdx = this.lastSceneState.scene_userdata.indexOf(object);
        resp = sceneState.scene_objects[respIdx];
        return sceneState.scene_objects[respIdx];
      }
    });
    return resp;
  }

  private is_transformation(sceneState: SceneState): string {
    let resp = "";
    if (resp === "") {
      sceneState.scene_positions.forEach((object) => {
        if (this.lastSceneState.scene_positions.includes(object) == false) {
          const respIdx = sceneState.scene_positions.indexOf(object);
          resp = sceneState.scene_objects[respIdx];
          return sceneState.scene_objects[respIdx];
        }
      });
    }
    if (resp === "") {
      sceneState.scene_rotations.forEach((object) => {
        if (this.lastSceneState.scene_rotations.includes(object) == false) {
          const respIdx = sceneState.scene_rotations.indexOf(object);
          resp = sceneState.scene_objects[respIdx];
          return sceneState.scene_objects[respIdx];
        }
      });
    }
    if (resp === "") {
      sceneState.scene_scales.forEach((object) => {
        if (this.lastSceneState.scene_scales.includes(object) == false) {
          const respIdx = sceneState.scene_scales.indexOf(object);
          resp = sceneState.scene_objects[respIdx];
          return sceneState.scene_objects[respIdx];
        }
      });
    }
    return resp;
  }

  public async add_creation_undostack(object: THREE.Object3D) {
    this.undoStack.push(
      new CreationSceneItem(this, {
        object_uuid: object.uuid,
        name: object.name,
        position: object.position.clone(),
        userdata: object.userData,
      }),
    );
    this.lastSceneState = this.getSceneState();
  }

  /* Can be called Internally or Externally for undo redo stack */
  // This function allows you to capture transform states and occurs on mouse up.
  public async check_scene_for_updates() {
    const sceneState = this.getSceneState();
    if (JSON.stringify(this.lastSceneState) !== JSON.stringify(sceneState)) {
      // Add Scene state for undo redo here.
      const is_deleted = this.is_deletion(sceneState);
      const is_transform = this.is_transformation(sceneState);
      const is_userdata = this.is_userdata(sceneState);

      this.undoStack = this.undoStack.slice(-16);

      if (is_deleted != "") {
        const objectIndex =
          this.lastSceneState.scene_objects.indexOf(is_deleted);
        const name = this.lastSceneState.scene_names[objectIndex];
        const position = this.lastSceneState.scene_positions[objectIndex];
        const userdata = JSON.parse(
          this.lastSceneState.scene_userdata[objectIndex],
        );

        const undoPush: DeletionData = {
          object_uuid: is_deleted,
          name: name,
          position: JSON.parse(position),
          userdata: userdata,
        };
        this.undoStack.push(new DeletionSceneItem(this, undoPush));
      } else if (is_userdata != "") {
        const objectIndex = sceneState.scene_objects.indexOf(is_userdata);
        const startUserdata = JSON.parse(
          this.lastSceneState.scene_userdata[objectIndex],
        );
        const userdata = JSON.parse(sceneState.scene_userdata[objectIndex]);

        const endPush: UserData = {
          object_uuid: is_userdata,
          color: userdata["color"],
          locked: userdata["locked"],
          visible: userdata["visible"],
        };

        const startPush: UserData = {
          object_uuid: is_userdata,
          color: startUserdata["color"],
          locked: startUserdata["locked"],
          visible: startUserdata["visible"],
        };

        this.undoStack.push(new UserDataSceneItem(this, startPush, endPush));
      } else if (is_transform != "") {
        const objectIndexStart =
          this.lastSceneState.scene_objects.indexOf(is_transform);
        if (
          this.lastSceneState.scene_positions[objectIndexStart] !== undefined
        ) {
          const objectIndexEnd = sceneState.scene_objects.indexOf(is_transform);

          const startPush: TransformData = {
            object_uuid: is_transform,
            position: JSON.parse(
              this.lastSceneState.scene_positions[objectIndexStart],
            ),
            rotation: JSON.parse(
              this.lastSceneState.scene_rotations[objectIndexStart],
            ),
            scale: JSON.parse(
              this.lastSceneState.scene_scales[objectIndexStart],
            ),
          };
          const endPush: TransformData = {
            object_uuid: is_transform,
            position: JSON.parse(sceneState.scene_positions[objectIndexEnd]),
            rotation: JSON.parse(sceneState.scene_rotations[objectIndexEnd]),
            scale: JSON.parse(sceneState.scene_scales[objectIndexEnd]),
          };
          this.undoStack.push(new TransformSceneItem(this, startPush, endPush));
        }
      }
    }
    this.undoIndex = 0;
    this.lastSceneState = sceneState;
  }
}
