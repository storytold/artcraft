import { SceneManager } from "./scene_manager_api";
import * as THREE from "three";

export interface ICommand<T> {
  undo(): Promise<void>;
  redo(): Promise<void>;
}

export interface TransformData {
  object_uuid: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

export interface UserData {
  object_uuid: string;
  color: string;
  visible: boolean;
  locked: boolean;
}

export interface CreationData {
  object_uuid: string;
  name: string;
  position: THREE.Vector3;
  userdata: Record<string, any>;
}

export interface DeletionData {
  object_uuid: string;
  name: string;
  position: THREE.Vector3;
  userdata: Record<string, any>;
}

export interface SceneState {
  scene_objects: string[];
  scene_names: string[];
  scene_userdata: string[];
  scene_positions: string[];
  scene_rotations: string[];
  scene_scales: string[];
}

export type CommandInputTypes = TransformData | CreationData | DeletionData;

export class CreationSceneItem implements ICommand<string> {
  private component: SceneManager;
  private creationData: CreationData;

  public constructor(sceneManager: SceneManager, creationData: CreationData) {
    this.component = sceneManager;
    this.creationData = creationData;
  }

  public async undo(): Promise<void> {
    this.component.delete(this.creationData.object_uuid);
  }

  public async redo(): Promise<void> {
    const object = await this.component.create(
      this.creationData.userdata["media_id"],
      this.creationData.name,
      this.creationData.position,
    );
    object.position.copy(this.creationData.position);
    object.uuid = this.creationData.object_uuid;
    if (this.creationData.userdata["visible"] !== undefined) {
      object.visible = this.creationData.userdata["visible"];
    }
    this.component.scene.setColor(
      object.uuid,
      this.creationData.userdata["color"],
    );
  }
}

export class DeletionSceneItem implements ICommand<string> {
  private component: SceneManager;
  private deletionData: DeletionData;

  public constructor(sceneManager: SceneManager, creationData: DeletionData) {
    this.component = sceneManager;
    this.deletionData = creationData;
  }

  public async undo(): Promise<void> {
    const object = await this.component.create(
      this.deletionData.userdata["media_id"],
      this.deletionData.name,
      this.deletionData.position,
    );
    object.uuid = this.deletionData.object_uuid;
    object.visible = this.deletionData.userdata["visible"];
    this.component.scene.setColor(
      object.uuid,
      this.deletionData.userdata["color"],
    );
  }

  public async redo(): Promise<void> {
    this.component.delete(this.deletionData.object_uuid);
  }
}

export class TransformSceneItem implements ICommand<string> {
  private component: SceneManager;
  private transformDataStart: TransformData;
  private transformDataEnd: TransformData;

  public constructor(
    sceneManager: SceneManager,
    transformDataStart: TransformData,
    transformDataEnd: TransformData,
  ) {
    this.component = sceneManager;
    this.transformDataStart = transformDataStart;
    this.transformDataEnd = transformDataEnd;
  }

  public async undo(): Promise<void> {
    this.component.update(
      this.transformDataStart.object_uuid,
      this.transformDataStart.position,
      this.transformDataStart.rotation,
      this.transformDataStart.scale,
    );
  }

  public async redo(): Promise<void> {
    this.component.update(
      this.transformDataEnd.object_uuid,
      this.transformDataEnd.position,
      this.transformDataEnd.rotation,
      this.transformDataEnd.scale,
    );
  }
}

export class UserDataSceneItem implements ICommand<string> {
  private component: SceneManager;
  private startUserData: UserData;
  private endUserData: UserData;

  public constructor(
    sceneManager: SceneManager,
    startUserData: UserData,
    endUserData: UserData,
  ) {
    this.component = sceneManager;
    this.startUserData = startUserData;
    this.endUserData = endUserData;
  }

  public async undo(): Promise<void> {
    this.component.scene.setColor(
      this.startUserData.object_uuid,
      this.startUserData.color,
    );
  }

  public async redo(): Promise<void> {
    this.component.scene.setColor(
      this.endUserData.object_uuid,
      this.endUserData.color,
    );
  }
}
