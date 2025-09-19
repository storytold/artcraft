#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffT2VInput {
    /// Number of frames per second to extract from the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The motions to apply to the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motions: Option<Vec<Option<String>>>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of frames to generate for the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the video. Be as descriptive as possible for best results.
    /// "masterpiece, best quality, 1girl, solo, cherry blossoms, hanami, pink flower, white flower, spring season, wisteria, petals, flower, plum blossoms, outdoors, falling petals, white hair, black eyes"
    /// "panda playing a guitar, on a boat, in the ocean, high quality, high quality, ultra HD, realistic"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The size of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_size: Option<VideoSizeProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffT2VOutput {
    /// Seed used for generating the video.
    pub seed: i64,
    /// Generated video file.
    /// {"url":"https://fal-cdn.batuhan-941.workers.dev/files/kangaroo/DSrFBOk9XXIplm_kukI4n.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffT2VTurboInput {
    /// Number of frames per second to extract from the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The motions to apply to the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motions: Option<Vec<Option<String>>>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of frames to generate for the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<i64>,
    /// The number of inference steps to perform. 4-12 is recommended for turbo mode.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the video. Be as descriptive as possible for best results.
    /// "masterpiece, best quality, 1girl, solo, cherry blossoms, hanami, pink flower, white flower, spring season, wisteria, petals, flower, plum blossoms, outdoors, falling petals, white hair, black eyes"
    /// "panda playing a guitar, on a boat, in the ocean, high quality, high quality, ultra HD, realistic"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The size of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_size: Option<VideoSizeProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffV2VInput {
    /// The first N number of seconds of video to animate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_n_seconds: Option<i64>,
    /// Number of frames per second to extract from the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The motions to apply to the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motions: Option<Vec<Option<String>>>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "closeup of tony stark, robert downey jr, fireworks, high quality, ultra HD"
    /// "panda playing a guitar, on a boat, in the ocean, high quality, high quality, ultra HD, realistic"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength of the input video in the final output.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// URL of the video.
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/animatediff-vid2vid-input-2.gif"
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/animatediff-vid2vid-input-1.gif"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnimateDiffV2VOutput {
    /// Seed used for generating the video.
    pub seed: i64,
    /// Generated video file.
    /// {"url":"https://fal-cdn.batuhan-941.workers.dev/files/koala/5Cb_6P_s9wW8f8-g9c4yj.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffV2VTurboInput {
    /// The first N number of seconds of video to animate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_n_seconds: Option<i64>,
    /// Number of frames per second to extract from the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<i64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The motions to apply to the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motions: Option<Vec<Option<String>>>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to perform. 4-12 is recommended for turbo mode.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "closeup of tony stark, robert downey jr, fireworks, high quality, ultra HD"
    /// "panda playing a guitar, on a boat, in the ocean, high quality, high quality, ultra HD, realistic"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength of the input video in the final output.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// URL of the video.
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/animatediff-vid2vid-input-2.gif"
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/animatediff-vid2vid-input-1.gif"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    /// The mime type of the file.
    /// "image/png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
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
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
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

/// AnimateDiff
///
/// Category: text-to-video
/// Machine Type: A100
pub fn video_to_video(
    params: AnimateDiffV2VTurboInput,
) -> FalRequest<AnimateDiffV2VTurboInput, AnimateDiffV2VOutput> {
    FalRequest::new("fal-ai/fast-animatediff/turbo/video-to-video", params)
}
