import { Object3DModel } from "../classes/Object3DModel.js";
import { ModelCreator } from "../classes/metadata/ModelCreator.js";
import { GenerationProvider } from "@storyteller/api-enums";

export const OBJECT_3D_MODELS: Object3DModel[] = [
  new Object3DModel({
    id: "hunyuan_3d_3",
    tauriId: "hunyuan_3d_3",
    fullName: "Hunyuan 3D 3.0",
    category: "3d_object",
    creator: ModelCreator.Tencent,
    selectorName: "Hunyuan 3.0",
    selectorDescription: "Highest quality 3D mesh generation",
    selectorBadges: ["~2 min."],
    providers: [GenerationProvider.Artcraft],
    progressBarTime: 120000,
  }),
  new Object3DModel({
    id: "hunyuan_3d_2_0",
    tauriId: "hunyuan_3d_2_0",
    fullName: "Hunyuan 3D 2.0",
    category: "3d_object",
    creator: ModelCreator.Tencent,
    selectorName: "Hunyuan 2.0",
    selectorDescription: "Faster, lower fidelity 3D mesh",
    selectorBadges: ["~45 sec."],
    providers: [GenerationProvider.Artcraft],
    progressBarTime: 60000,
  }),
];

export const OBJECT_3D_MODELS_BY_ID: Map<string, Object3DModel> = new Map(
  OBJECT_3D_MODELS.map((model) => [model.id, model]),
);

if (OBJECT_3D_MODELS_BY_ID.size !== OBJECT_3D_MODELS.length) {
  throw new Error("All 3D object models must have unique IDs");
}
