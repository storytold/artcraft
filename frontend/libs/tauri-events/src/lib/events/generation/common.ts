
export enum GenerationServiceProvider {
  Sora = "sora",
  Fal = "fal",
}

export enum GenerationModel {
  Kling1_6 = "kling_1.6",
  Kling2_0 = "kling_2.0",
  Sora = "sora",
}

export enum GenerationAction {
  GenerateImage = "generate_image",
  GenerateVideo = "generate_video",
  GenerateAudio = "generate_audio",
  RemoveBackground = "remove_background",
  ImageTo3d = "image_to_3d",
  GenerateGaussian = "generate_gaussian",
  ImageInpaintEdit = "image_inpaint_edit",
}
