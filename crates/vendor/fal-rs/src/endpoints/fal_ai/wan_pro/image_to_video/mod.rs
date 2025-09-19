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
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WanProI2VRequest {
    /// Whether to enable the safety checker
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The URL of the image to generate the video from
    /// "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
    pub image_url: String,
    /// The prompt to generate the video
    /// "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage."
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WanProI2VResponse {
    /// The generated video
    /// {"url":"https://fal.media/files/kangaroo/K1hB3k-IXBzq9rz1kNOxy.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WanProT2VRequest {
    /// Whether to enable the safety checker
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The prompt to generate the video
    /// "A lone astronaut in a detailed NASA spacesuit performs an exuberant dance on the lunar surface, arms outstretched in joyful abandon against the stark moonscape. The Earth hangs dramatically in the black sky, appearing to streak past due to the motion of the dance, creating a sense of dynamic movement. The scene captures extreme contrasts between the brilliant white of the spacesuit reflecting harsh sunlight and the deep shadows of the lunar craters. Every detail is rendered with photorealistic precision: the texture of the regolith disturbed by the astronaut's boots, the reflections on the helmet visor."
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WanProT2VResponse {
    /// The generated video
    /// {"url":"https://fal.media/files/panda/YxRLson-aETxeBK1DI4VW.mp4"}
    pub video: File,
}

/// Wan-2.1 Pro Image-to-Video
///
/// Category: image-to-video
/// Machine Type: H100
///
///
/// Generate a 6-second 1080p video (at 30 FPS) from an image and text using an enhanced version of Wan 2.1.
pub fn image_to_video(params: WanProI2VRequest) -> FalRequest<WanProI2VRequest, WanProI2VResponse> {
    FalRequest::new("fal-ai/wan-pro/image-to-video", params)
}
