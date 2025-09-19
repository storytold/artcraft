#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DepthMapInput {
    /// a
    #[serde(skip_serializing_if = "Option::is_none")]
    pub a: Option<f64>,
    /// bg_th
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bg_th: Option<f64>,
    /// depth_and_normal
    #[serde(skip_serializing_if = "Option::is_none")]
    pub depth_and_normal: Option<bool>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DepthMapOutput {
    /// The depth map.
    pub image: Image,
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
pub struct MarigoldDepthMapInput {
    /// Number of predictions to average over. Defaults to `10`. The higher the number, the more accurate the result, but the slower the inference.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ensemble_size: Option<i64>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    pub image_url: String,
    /// Number of denoising steps. Defaults to `10`. The higher the number, the more accurate the result, but the slower the inference.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Maximum processing resolution. Defaults `0` which means it uses the size of the input image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub processing_res: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MarigoldDepthMapOutput {
    /// The depth map.
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NSFWImageDetectionInput {
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct NSFWImageDetectionOutput {
    /// The probability of the image being NSFW.
    pub nsfw_probability: f64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RemoveBackgroundInput {
    /// If set to true, the resulting image be cropped to a bounding box around the subject
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crop_to_bbox: Option<bool>,
    /// Input image url.
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    pub image_url: String,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RemoveBackgroundOutput {
    /// Background removed image.
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SamInput {
    /// Attempt better quality output using morphologyEx
    #[serde(skip_serializing_if = "Option::is_none")]
    pub better_quality: Option<bool>,
    /// Output black and white, multiple masks will be combined into one mask
    #[serde(skip_serializing_if = "Option::is_none")]
    pub black_white: Option<bool>,
    /// Coordinates for multiple boxes, e.g. [[x,y,w,h],[x2,y2,w2,h2]]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub box_prompt: Option<Vec<Option<Vec<Option<serde_json::Value>>>>>,
    /// Object confidence threshold
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
    /// Url to input image
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    pub image_url: String,
    /// Invert mask colors
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invert: Option<bool>,
    /// IOU threshold for filtering the annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub iou: Option<f64>,
    /// Label for point, [1,0], 0 = background, 1 = foreground
    #[serde(skip_serializing_if = "Option::is_none")]
    pub point_label: Option<Vec<Option<i64>>>,
    /// Coordinates for multiple points [[x1,y1],[x2,y2]]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub point_prompt: Option<Vec<Option<Vec<Option<serde_json::Value>>>>>,
    /// Draw high-resolution segmentation masks
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retina: Option<bool>,
    /// Image size
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<i64>,
    /// The prompt to use when generating masks
    /// "a photo of elephant"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_prompt: Option<String>,
    /// Draw the edges of the masks
    #[serde(skip_serializing_if = "Option::is_none")]
    pub with_contours: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SamOutput {
    /// Combined image of all detected masks
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<Option<Image>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpscaleInput {
    /// Upscaling a face
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face: Option<bool>,
    /// Url to input image
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    /// "https://storage.googleapis.com/falserverless/gallery/blue-bird.jpeg"
    /// "https://storage.googleapis.com/falserverless/model_tests/upscale/image%20(8).png"
    pub image_url: String,
    /// Model to use for upscaling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Output image format (png or jpeg)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Rescaling factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// Tile size. Default is 0, that is no tile. When encountering the out-of-GPU-memory issue, please specify it, e.g., 400 or 200
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpscaleOutput {
    /// Upscaled image
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Midas Depth Estimation
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn esrgan(params: UpscaleInput) -> FalRequest<UpscaleInput, UpscaleOutput> {
    FalRequest::new("fal-ai/imageutils/esrgan", params)
}
