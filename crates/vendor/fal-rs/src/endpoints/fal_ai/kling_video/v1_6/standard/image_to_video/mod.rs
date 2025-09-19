#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CameraControl {
    /// The type of camera movement
    /// "horizontal"
    pub movement_type: String,
    /// The value of the camera movement
    /// 10
    pub movement_value: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DynamicMask {
    /// URL of the image for Dynamic Brush Application Area (Mask image created by users using the motion brush)
    /// "https://h2.inkwai.com/bs2/upload-ylab-stunt/ai_portal/1732888130/WU8spl23dA/dynamic_mask_1.png"
    pub mask_url: String,
    /// List of trajectories
    /// [{"x":279,"y":219},{"x":417,"y":65}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trajectories: Option<Vec<Option<Trajectory>>>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct I2VOutput {
    /// The generated video
    /// {"url":"https://v2.fal.media/files/36087878b0c1435bb75c19b64b7db178_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoRequest {
    /// The aspect ratio of the generated video frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_scale: Option<f64>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    pub image_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct KlingV1I2VOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/kangaroo/VUmAU3JvzS7mxwdgSU9zj_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ProImageToVideoRequest {
    /// The aspect ratio of the generated video frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_scale: Option<f64>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    pub image_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// URL of the image to be used for the end of the video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tail_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct T2VOutput {
    /// The generated video
    /// {"url":"https://v2.fal.media/files/fb33a862b94d4d7195e610e4cbc5d392_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoRequest {
    /// The aspect ratio of the generated video frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_scale: Option<f64>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Trajectory {
    /// X coordinate of the motion trajectory
    /// 279
    pub x: i64,
    /// Y coordinate of the motion trajectory
    /// 219
    pub y: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct V1ImageToVideoRequest {
    /// The aspect ratio of the generated video frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_scale: Option<f64>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// List of dynamic masks
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dynamic_masks: Option<Vec<Option<DynamicMask>>>,
    /// URL of the image to be used for the video
    /// "https://h2.inkwai.com/bs2/upload-ylab-stunt/se/ai_portal_queue_mmu_image_upscale_aiweb/3214b798-e1b4-4b00-b7af-72b5b0417420_raw_image_0.jpg"
    pub image_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The prompt for the video
    /// "The astronaut stood up and walked away"
    pub prompt: String,
    /// URL of the image for Static Brush Application Area (Mask image created by users using the motion brush)
    /// "https://h2.inkwai.com/bs2/upload-ylab-stunt/ai_portal/1732888177/cOLNrShrSO/static_mask.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub static_mask_url: Option<String>,
    /// URL of the image to be used for the end of the video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tail_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct V1TextToVideoRequest {
    /// Advanced Camera control parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub advanced_camera_control: Option<Option<CameraControl>>,
    /// The aspect ratio of the generated video frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Camera control parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub camera_control: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_scale: Option<f64>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoEffectsOutput {
    /// The generated video
    /// {"content_type":"video/mp4","file_name":"output.mp4","url":"https://storage.googleapis.com/falserverless/kling/kling_ex.mp4.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoEffectsRequest {
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// The effect scene to use for the video generation
    /// "hug"
    pub effect_scene: String,
    /// URL of the image to be used for the squish and expansion video
    /// "https://h2.inkwai.com/bs2/upload-ylab-stunt/se/ai_portal_queue_mmu_image_upscale_aiweb/3214b798-e1b4-4b00-b7af-72b5b0417420_raw_image_0.jpg"
    pub image_url: String,
    /// URL of images to be used for hug, kiss or heart_gesture video.
    /// ["https://storage.googleapis.com/falserverless/juggernaut_examples/VHXMavzPyI27zi6JseyL4.png","https://storage.googleapis.com/falserverless/juggernaut_examples/QEW5VrzccxGva7mPfEXjf.png"]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_image_urls: Option<Vec<Option<String>>>,
}

/// Kling 1.0
///
/// Category: text-to-video
/// Machine Type: A100
///
///
/// Kling 1.6 (std) Image to Video API.
pub fn image_to_video(params: ImageToVideoRequest) -> FalRequest<ImageToVideoRequest, I2VOutput> {
    FalRequest::new("fal-ai/kling-video/v1.6/standard/image-to-video", params)
}
