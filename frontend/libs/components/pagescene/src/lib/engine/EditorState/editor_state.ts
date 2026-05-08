import { SceneGenereationMetaData } from "../../models/sceneGenerationMetadata";
import { EditorStateJson } from "./EditorStateJSON";
import { SceneState } from "./scene_state";

export class EditorState {
  version: number;
  sceneGenerationMetaData: SceneGenereationMetaData | undefined;
  sceneState: SceneState | undefined;

  constructor({ editorVersion }: { editorVersion: number }) {
    this.version = editorVersion;
  }

  public async toJSON() {
    if (!this.sceneGenerationMetaData || !this.sceneState) {
      throw "Error in EditorState.toJSON: data undefined";
    }
    const result: EditorStateJson = {
      version: this.version,
      sceneGenerationMetaData: this.sceneGenerationMetaData,
      sceneStateJson: await this.sceneState.toJSON(),
      snapshotTime: new Date().toISOString(),
    };
    return result;
  }
}
