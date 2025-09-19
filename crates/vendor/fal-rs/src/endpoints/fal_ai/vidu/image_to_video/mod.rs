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
pub struct ImageToVideoRequest {
    /// URL of the image to use as the first frame
    /// "https://storage.googleapis.com/falserverless/web-examples/vidu/stylish_woman.webp"
    pub image_url: String,
    /// The movement amplitude of objects in the frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub movement_amplitude: Option<String>,
    /// Text prompt for video generation, max 1500 characters
    /// "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage. She wears a black leather jacket, a long red dress, and black boots, and carries a black purse."
    pub prompt: String,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ReferenceToVideoOutput {
    /// The generated video with consistent subjects from reference images
    /// {"url":"https://storage.googleapis.com/falserverless/web-examples/vidu/new-examples/referencevideo.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ReferenceToVideoRequest {
    /// The aspect ratio of the output video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The movement amplitude of objects in the frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub movement_amplitude: Option<String>,
    /// Text prompt for video generation, max 1500 characters
    /// "The little devil is looking at the apple on the beach and walking around it."
    pub prompt: String,
    /// URLs of the reference images to use for consistent subject appearance
    /// ["https://storage.googleapis.com/falserverless/web-examples/vidu/new-examples/reference1.png","https://storage.googleapis.com/falserverless/web-examples/vidu/new-examples/reference2.png","https://storage.googleapis.com/falserverless/web-examples/vidu/new-examples/reference3.png"]
    pub reference_image_urls: Vec<String>,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct StartEndToVideoOutput {
    /// The generated transition video between start and end frames
    /// {"url":"https://storage.googleapis.com/falserverless/web-examples/vidu/2-car.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct StartEndToVideoRequest {
    /// URL of the image to use as the last frame
    /// "https://storage.googleapis.com/falserverless/web-examples/vidu/2-carbody.png"
    pub end_image_url: String,
    /// The movement amplitude of objects in the frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub movement_amplitude: Option<String>,
    /// Text prompt for video generation, max 1500 characters
    /// "Transform the car frame into a complete vehicle."
    pub prompt: String,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// URL of the image to use as the first frame
    /// "https://storage.googleapis.com/falserverless/web-examples/vidu/2-carchasis.png"
    pub start_image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TemplateToVideoOutput {
    /// The generated video using a predefined template
    /// {"url":"https://storage.googleapis.com/falserverless/web-examples/vidu/hugging.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TemplateToVideoRequest {
    /// The aspect ratio of the output video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// URLs of the images to use with the template. Number of images required varies by template: 'dynasty_dress' and 'shop_frame' accept 1-2 images, 'wish_sender' requires exactly 3 images, all other templates accept only 1 image.
    /// ["https://storage.googleapis.com/falserverless/web-examples/vidu/hug.PNG"]
    pub input_image_urls: Vec<String>,
    /// Text prompt for video generation, max 1500 characters
    /// "Couple hugging each other"
    pub prompt: String,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// AI video template to use. Pricing varies by template: Standard templates (hug, kiss, love_pose, etc.) cost 4 credits ($0.20), Premium templates (lunar_newyear, dynasty_dress, dreamy_wedding, etc.) cost 6 credits ($0.30), and Advanced templates (live_photo) cost 10 credits ($0.50).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template: Option<String>,
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
    /// The generated video
    /// {"url":"https://fal.media/files/kangaroo/gzfzC5FXvcgZegQmy90L1_output.mp4"}
    pub video: File,
}

/// Vidu Image to Video
///
/// Category: image-to-video
///
///
///
/// Vidu Image to Video API: Transform a single image into a dynamic video with motion.
pub fn image_to_video(params: ImageToVideoRequest) -> FalRequest<ImageToVideoRequest, VideoOutput> {
    FalRequest::new("fal-ai/vidu/image-to-video", params)
}
