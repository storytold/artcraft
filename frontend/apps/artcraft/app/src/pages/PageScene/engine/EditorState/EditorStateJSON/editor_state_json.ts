import { SceneGenereationMetaData } from "../../../models/sceneGenerationMetadata";
import { SceneStateJson } from "./scene_state_json";

export interface EditorStateJson {
  version: number;
  sceneGenerationMetaData: SceneGenereationMetaData;
  sceneStateJson: SceneStateJson;
  snapshotTime: string; // make one via `new Date().toISOString()`
}
