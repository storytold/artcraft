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
pub struct I2VOutput {
    /// The generated video
    /// {"url":"https://v2.fal.media/files/8c216fcbc4ed41cd8840bd48c1ec6dd6_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// An image to blend the end of the video with
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_image_url: Option<String>,
    pub image_url: String,
    /// Whether the video should loop (end of video is blended with the beginning)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "loop")]
    pub r#loop: Option<bool>,
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Ray2I2VOutput {
    /// URL of the generated video
    /// {"url":"https://v3.fal.media/files/zebra/9aDde3Te2kuJYHdR0Kz8R_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Ray2ImageToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// Final image to end the video with. Can be used together with image_url.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_image_url: Option<String>,
    /// Initial image to start the video from. Can be used together with end_image_url.
    /// "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// Whether the video should loop (end of video is blended with the beginning)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "loop")]
    pub r#loop: Option<bool>,
    pub prompt: String,
    /// The resolution of the generated video (720p costs 2x more, 1080p costs 4x more)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Ray2T2VOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/penguin/Om3xjcOwiSCJwrXs7DUi__output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Ray2TextToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video (9s costs 2x more)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// Whether the video should loop (end of video is blended with the beginning)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "loop")]
    pub r#loop: Option<bool>,
    pub prompt: String,
    /// The resolution of the generated video (720p costs 2x more, 1080p costs 4x more)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct T2VOutput {
    /// The generated video
    /// {"url":"https://v2.fal.media/files/807e842c734f4127a36de9262a2d292c_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether the video should loop (end of video is blended with the beginning)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "loop")]
    pub r#loop: Option<bool>,
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Luma Ray 2 Flash
///
/// Category: text-to-video
/// Machine Type: A100
///
///
/// Luma's state of the art Ray2 model for image-to-video generation.
///
/// Takes initial and/or final images and generates a video that starts from
/// and/or ends with those images.
pub fn image_to_video(
    params: Ray2ImageToVideoRequest,
) -> FalRequest<Ray2ImageToVideoRequest, Ray2I2VOutput> {
    FalRequest::new(
        "fal-ai/luma-dream-machine/ray-2-flash/image-to-video",
        params,
    )
}
