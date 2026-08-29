
export enum GenerationServiceProvider {
  Sora = "sora",
  Fal = "fal",
}

export enum GenerationModel {
  Kling1_6 = "kling_1.6",
  Kling2_0 = "kling_2.0",
  Seedance2p5Preview = "seedance_2p5_preview",
  Seedance2p5 = "seedance_2p5",
  Seedance2p5Ultra = "seedance_2p5_u",
  Sora = "sora",
}

export enum GenerationAction {
  GenerateImage = "generate_image",
  GenerateVideo = "generate_video",
  RemoveBackground = "remove_background",
  ImageTo3d = "image_to_3d",
  GenerateGaussian = "generate_gaussian",
  ImageInpaintEdit = "image_inpaint_edit",
}
