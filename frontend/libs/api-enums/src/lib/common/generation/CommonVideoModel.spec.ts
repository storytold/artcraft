import { TaskModelType } from "../../tauri/tasks/task_model_type.js";
import { CommonVideoModel } from "./CommonVideoModel.js";

describe("Seedance 2.5 model identifiers", () => {
  it("keeps common generation and task enums aligned with the native schema", () => {
    expect([
      CommonVideoModel.Seedance2p5Preview,
      CommonVideoModel.Seedance2p5,
      CommonVideoModel.Seedance2p5Ultra,
    ]).toEqual(["seedance_2p5_preview", "seedance_2p5", "seedance_2p5_u"]);

    expect([
      TaskModelType.Seedance2p5Preview,
      TaskModelType.Seedance2p5,
      TaskModelType.Seedance2p5Ultra,
    ]).toEqual(["seedance_2p5_preview", "seedance_2p5", "seedance_2p5_u"]);
  });
});
