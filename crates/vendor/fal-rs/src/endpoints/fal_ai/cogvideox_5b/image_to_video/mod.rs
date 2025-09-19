#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BaseInput {
    /// The target FPS of the video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export_fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related video to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The LoRAs to use for the image generation. We currently support one lora.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The negative prompt to generate video from
    /// "Distorted, discontinuous, Ugly, blurry, low resolution, motionless, static, disfigured, disconnected limbs, Ugly faces, incomplete arms"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate the video from.
    /// "A garden comes to life as a kaleidoscope of butterflies flutters amidst the blossoms, their delicate wings casting shadows on the petals below. In the background, a grand fountain cascades water with a gentle splendor, its rhythmic sound providing a soothing backdrop. Beneath the cool shade of a mature tree, a solitary wooden chair invites solitude and reflection, its smooth surface worn by the touch of countless visitors seeking a moment of tranquility in nature's embrace."
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Use RIFE for video interpolation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_rife: Option<bool>,
    /// The size of the generated video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_size: Option<VideoSizeProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    /// The mime type of the file.
    /// "image/png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    /// File data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_data: Option<String>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<i64>,
    /// The URL where the file can be downloaded from.
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageSize {
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoInput {
    /// The target FPS of the video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export_fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related video to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The URL to the image to generate the video from.
    /// "https://d3phaj0sisr2ct.cloudfront.net/research/eugene.jpg"
    pub image_url: String,
    /// The LoRAs to use for the image generation. We currently support one lora.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The negative prompt to generate video from
    /// "Distorted, discontinuous, Ugly, blurry, low resolution, motionless, static, disfigured, disconnected limbs, Ugly faces, incomplete arms"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate the video from.
    /// "A low angle shot of a man walking down a street, illuminated by the neon signs of the bars around him"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Use RIFE for video interpolation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_rife: Option<bool>,
    /// The size of the generated video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_size: Option<VideoSizeProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LoraWeight {
    /// URL or the path to the LoRA weights.
    pub path: String,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The prompt used for generating the video.
    pub prompt: String,
    /// Seed of the generated video. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
    pub timings: Timings,
    /// The URL to the generated video
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoToVideoInput {
    /// The target FPS of the video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export_fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related video to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The LoRAs to use for the image generation. We currently support one lora.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The negative prompt to generate video from
    /// "Distorted, discontinuous, Ugly, blurry, low resolution, motionless, static, disfigured, disconnected limbs, Ugly faces, incomplete arms"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate the video from.
    /// "An astronaut stands triumphantly at the peak of a towering mountain. Panorama of rugged peaks and valleys. Very futuristic vibe and animated aesthetic. Highlights of purple and golden colors in the scene. The sky is looks like an animated/cartoonish dream of galaxies, nebulae, stars, planets, moons, but the remainder of the scene is mostly realistic. "
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same video every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength to use for Video to Video.  1.0 completely remakes the video while 0.0 preserves the original.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// Use RIFE for video interpolation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_rife: Option<bool>,
    /// The size of the generated video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_size: Option<VideoSizeProperty>,
    /// The video to generate the video from.
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/hiker.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum VideoSizeProperty {
    #[default]
    ImageSize(ImageSize),
    #[serde(rename = "square_hd")]
    SquareHd,
    #[serde(rename = "square")]
    Square,
    #[serde(rename = "portrait_4_3")]
    Portrait43,
    #[serde(rename = "portrait_16_9")]
    Portrait169,
    #[serde(rename = "landscape_4_3")]
    Landscape43,
    #[serde(rename = "landscape_16_9")]
    Landscape169,
}

/// CogVideoX-5B
///
/// Category: text-to-video
/// Machine Type: H100
///
///
/// Image to video generation using CogVideoX-5B.
pub fn image_to_video(params: ImageToVideoInput) -> FalRequest<ImageToVideoInput, Output> {
    FalRequest::new("fal-ai/cogvideox-5b/image-to-video", params)
}
