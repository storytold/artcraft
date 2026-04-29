import { Simple3DVector } from "~/pages/PageScene/datastructures/common";
import { ClipGroup } from "~/enums";

export type ControlPanel = {
  isShowing: boolean;
  currentSceneObject: SceneObject;
};
export type SceneObject = {
  group: ClipGroup; // TODO: add meta data to determine what it is a camera or a object or a character into prefab clips
  object_uuid: string;
  object_name: string;
  version: string;
  objectVectors: Simple3DVector;
};
