import { GenerationModel } from "./common.js";

describe("GenerationModel", () => {
  it("matches the native Seedance 2.5 event payload identifiers", () => {
    expect([
      GenerationModel.Seedance2p5Preview,
      GenerationModel.Seedance2p5,
      GenerationModel.Seedance2p5Ultra,
    ]).toEqual(["seedance_2p5_preview", "seedance_2p5", "seedance_2p5_u"]);
  });
});
