// import * as THREE from "three";
import { Object3DJSON } from "./object_3d_json";

export interface SceneStateJson {
  version: number;
  sceneItems: Object3DJSON[];
}
