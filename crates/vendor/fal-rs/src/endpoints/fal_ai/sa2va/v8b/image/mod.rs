#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

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
    pub content_type: Option<ContentTypeProperty>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<FileNameProperty>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<HeightProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<WidthProperty>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageChatOutput {
    /// Dictionary of label: mask image
    /// [{"content_type":"image/png","file_name":"019c3c1e3c50446e9996f709d36debb4.png","file_size":15724,"height":1200,"url":"https://v3.fal.media/files/monkey/6ITmhHQJ-69s-UxajrY5T_019c3c1e3c50446e9996f709d36debb4.png","width":1800},{"content_type":"image/png","file_name":"0a1522ca410942c7ad6c73efa15b3549.png","file_size":14905,"height":1200,"url":"https://v3.fal.media/files/monkey/IljtMxahoo9-7SUpx0fth_0a1522ca410942c7ad6c73efa15b3549.png","width":1800}]
    pub masks: Vec<Image>,
    /// Generated output
    /// "<p>  A white pickup truck  </p>   [SEG]  is parked on the side of  <p>  the red building  </p>   [SEG] , creating a unique and eye-catching contrast.<|im_end|>"
    pub output: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageInput {
    /// Url for the Input image.
    /// "https://raw.githubusercontent.com/facebookresearch/segment-anything-2/main/notebooks/images/truck.jpg"
    pub image_url: String,
    /// Prompt to be used for the chat completion
    /// "Could you please give me a brief description of the image? Please respond with interleaved segmentation masks for the corresponding parts of the answer."
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
pub struct VideoInput {
    /// Number of frames to sample from the video. If not provided, all frames are sampled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames_to_sample: Option<i64>,
    /// Prompt to be used for the chat completion
    /// "Could you please give me a brief description of the video? Please respond with interleaved segmentation masks for the corresponding parts of the answer."
    pub prompt: String,
    /// The URL of the input video.
    /// "https://drive.google.com/uc?id=1iOFYbNITYwrebBBp9kaEGhBndFSRLz8k"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ContentTypeProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileNameProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileSizeProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum HeightProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum WidthProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// Sa2VA 8B Image
///
/// Category: vision
/// Machine Type: A100
/// License Type: commercial
pub fn image(params: ImageInput) -> FalRequest<ImageInput, ImageChatOutput> {
    FalRequest::new("fal-ai/sa2va/8b/image", params)
}
