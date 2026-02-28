
// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum CommonVideoModel {
  GrokVideo = "grok_video",
  Kling16Pro = "kling_1p6_pro",
  Kling21Pro = "kling_2p1_pro",
  Kling21Master = "kling_2p1_master",
  Kling2p5TurboPro = "kling_2p5_turbo_pro",
  Kling2p6Pro = "kling_2p6_pro",
  Seedance10Lite = "seedance_1p0_lite",
  Seedance2p0 = "seedance_2p0",
  Sora2 = "sora_2",
  Sora2Pro = "sora_2_pro",
  Veo2 = "veo_2",
  Veo3 = "veo_3",
  Veo3Fast = "veo_3_fast",
  Veo3p1 = "veo_3p1",
  Veo3p1Fast = "veo_3p1_fast",
}
