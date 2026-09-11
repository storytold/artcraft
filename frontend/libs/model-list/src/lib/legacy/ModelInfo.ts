import { ModelCreator } from "../classes/metadata/ModelCreator.js";

export interface ModelInfo {
  // Human-readible name
  // Other components may want to rename the model, eg. to fit in smaller width elements
  name: string;

  // The identifier that Tauri uses (it may send different signals downstream)
  tauri_id: string;

  // Creator of the model type
  creator: ModelCreator;
}
