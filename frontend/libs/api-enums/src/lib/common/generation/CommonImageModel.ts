
// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum CommonImageModel {
  Flux1Dev = "flux_1_dev",
  Flux1Schnell = "flux_1_schnell",
  FluxPro11 = "flux_pro_1p1",
  FluxPro11Ultra = "flux_pro_1p1_ultra",
  GptImage1p5 = "gpt_image_1p5",
  NanaBanana = "nano_banana",
  NanaBanana2 = "nano_banana_2",
  NanaBananaPro = "nano_banana_pro",
  Seedream4 = "seedream_4",
  Seedream4p5 = "seedream_4p5",
  Seedream5Lite = "seedream_5_lite",
}
