#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

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
pub struct ImageInput {
    /// The conditoning augmentation determines the amount of noise that will be
    /// added to the conditioning frame. The higher the number, the more noise
    /// there will be, and the less the video will look like the initial image.
    /// Increase it for more motion.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cond_aug: Option<f64>,
    /// The frames per second of the generated video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<i64>,
    /// The URL of the image to use as a starting point for the generation.
    /// "https://storage.googleapis.com/falserverless/model_tests/svd/rocket.png"
    /// "https://storage.googleapis.com/falserverless/model_tests/svd/mustang.png"
    /// "https://storage.googleapis.com/falserverless/model_tests/svd/ship.png"
    /// "https://storage.googleapis.com/falserverless/model_tests/svd/rocket2.png"
    pub image_url: String,
    /// The motion bucket id determines the motion of the generated video. The
    /// higher the number, the more motion there will be.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motion_bucket_id: Option<i64>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
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
pub struct TextInput {
    /// The conditoning augmentation determines the amount of noise that will be
    /// added to the conditioning frame. The higher the number, the more noise
    /// there will be, and the less the video will look like the initial image.
    /// Increase it for more motion.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cond_aug: Option<f64>,
    /// The motion bucket id determines the motion of the generated video. The
    /// higher the number, the more motion there will be.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motion_bucket_id: Option<i64>,
    /// The negative prompt to use as a starting point for the generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The prompt to use as a starting point for the generation.
    /// "A rocket flying that is about to take off"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The size of the generated video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_size: Option<VideoSizeProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoOutput {
    /// Seed for random number generator
    pub seed: i64,
    /// Generated video
    pub video: File,
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

/// High Quality Stable Video Diffusion
///
/// Category: image-to-video
/// Machine Type: A100
pub fn text_to_video(params: TextInput) -> FalRequest<TextInput, VideoOutput> {
    FalRequest::new("fal-ai/stable-video/text-to-video", params)
}
