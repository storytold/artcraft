#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Ben2InputImage {
    /// URL of image to be used for background removal
    /// "https://storage.googleapis.com/falserverless/gallery/Ben2/arduino-uno-board-electronics-hand-600nw-1869855883.webp"
    pub image_url: String,
    /// Random seed for reproducible generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Ben2InputVideo {
    /// Random seed for reproducible generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// URL of video to be used for background removal.
    /// "https://storage.googleapis.com/falserverless/gallery/Ben2/100063-video-2160.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Ben2OutputImage {
    /// The output image after background removal.
    /// {"content_type":"image/png","file_name":"zrZNETpI_ul2jonraqpxN_a57c3f3825d9418f8b3d39cde87c3310.png","file_size":423052,"height":512,"url":"https://storage.googleapis.com/falserverless/gallery/Ben2/zrZNETpI_ul2jonraqpxN_a57c3f3825d9418f8b3d39cde87c3310.png","width":512}
    pub image: Image,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Ben2OutputVideo {
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
    /// The generated video file.
    /// {"content_type":"video/mp4","url":"https://storage.googleapis.com/falserverless/gallery/Ben2/foreground.mp4"}
    pub video: File,
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
pub struct Image {
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
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
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

/// ben-v2-image
///
/// Category: image-to-image
/// Machine Type: A100
pub fn image(params: Ben2InputImage) -> FalRequest<Ben2InputImage, Ben2OutputImage> {
    FalRequest::new("fal-ai/ben/v2/image", params)
}
