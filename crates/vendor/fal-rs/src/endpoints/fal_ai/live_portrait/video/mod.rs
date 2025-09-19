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
pub struct LivePortraitImageInput {
    /// Amount to open mouth in 'aaa' shape
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aaa: Option<f64>,
    /// Amount to blink the eyes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blink: Option<f64>,
    /// Size of the output image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dsize: Option<i64>,
    /// Amount to shape mouth in 'eee' position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eee: Option<f64>,
    /// Whether to enable the safety checker. If enabled, the model will check if the input image contains a face before processing it.
    /// The safety checker will process the input image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// Amount to raise or lower eyebrows
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eyebrow: Option<f64>,
    /// Whether to crop the source portrait to the face-cropping space.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_do_crop: Option<bool>,
    /// Whether to conduct the rotation when flag_do_crop is True.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_do_rot: Option<bool>,
    /// Whether to set the lip to closed state before animation. Only takes effect when flag_eye_retargeting and flag_lip_retargeting are False.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_lip_zero: Option<bool>,
    /// Whether to paste-back/stitch the animated face cropping from the face-cropping space to the original image space.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_pasteback: Option<bool>,
    /// URL of the image to be animated
    /// "https://storage.googleapis.com/falserverless/model_tests/live-portrait/XKEmk3mAzGHUjK3qqH-UL.jpeg"
    pub image_url: String,
    /// Output format
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Amount to move pupils horizontally
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pupil_x: Option<f64>,
    /// Amount to move pupils vertically
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pupil_y: Option<f64>,
    /// Amount to rotate the face in pitch
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotate_pitch: Option<f64>,
    /// Amount to rotate the face in roll
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotate_roll: Option<f64>,
    /// Amount to rotate the face in yaw
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotate_yaw: Option<f64>,
    /// Scaling factor for the face crop.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// Amount to smile
    #[serde(skip_serializing_if = "Option::is_none")]
    pub smile: Option<f64>,
    /// Horizontal offset ratio for face crop.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vx_ratio: Option<f64>,
    /// Vertical offset ratio for face crop. Positive values move up, negative values move down.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vy_ratio: Option<f64>,
    /// Amount to wink
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wink: Option<f64>,
    /// Amount to shape mouth in 'woo' position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub woo: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LivePortraitImageOutput {
    /// The generated image file.
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LivePortraitInput {
    /// Amount to open mouth in 'aaa' shape
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aaa: Option<f64>,
    /// Batch size for the model. The larger the batch size, the faster the model will run, but the more memory it will consume.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_size: Option<i64>,
    /// Amount to blink the eyes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blink: Option<f64>,
    /// Size of the output image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dsize: Option<i64>,
    /// Amount to shape mouth in 'eee' position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eee: Option<f64>,
    /// Whether to enable the safety checker. If enabled, the model will check if the input image contains a face before processing it.
    /// The safety checker will process the input image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// Amount to raise or lower eyebrows
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eyebrow: Option<f64>,
    /// Whether to crop the source portrait to the face-cropping space.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_do_crop: Option<bool>,
    /// Whether to conduct the rotation when flag_do_crop is True.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_do_rot: Option<bool>,
    /// Whether to enable eye retargeting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_eye_retargeting: Option<bool>,
    /// Whether to enable lip retargeting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_lip_retargeting: Option<bool>,
    /// Whether to set the lip to closed state before animation. Only takes effect when flag_eye_retargeting and flag_lip_retargeting are False.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_lip_zero: Option<bool>,
    /// Whether to paste-back/stitch the animated face cropping from the face-cropping space to the original image space.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_pasteback: Option<bool>,
    /// Whether to use relative motion.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_relative: Option<bool>,
    /// Whether to enable stitching. Recommended to set to True.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flag_stitching: Option<bool>,
    /// URL of the image to be animated
    /// "https://storage.googleapis.com/falserverless/model_tests/live-portrait/XKEmk3mAzGHUjK3qqH-UL.jpeg"
    pub image_url: String,
    /// Amount to move pupils horizontally
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pupil_x: Option<f64>,
    /// Amount to move pupils vertically
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pupil_y: Option<f64>,
    /// Amount to rotate the face in pitch
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotate_pitch: Option<f64>,
    /// Amount to rotate the face in roll
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotate_roll: Option<f64>,
    /// Amount to rotate the face in yaw
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotate_yaw: Option<f64>,
    /// Scaling factor for the face crop.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// Amount to smile
    #[serde(skip_serializing_if = "Option::is_none")]
    pub smile: Option<f64>,
    /// URL of the video to drive the lip syncing.
    /// "https://storage.googleapis.com/falserverless/model_tests/live-portrait/liveportrait-example.mp4"
    pub video_url: String,
    /// Horizontal offset ratio for face crop.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vx_ratio: Option<f64>,
    /// Vertical offset ratio for face crop. Positive values move up, negative values move down.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vy_ratio: Option<f64>,
    /// Amount to wink
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wink: Option<f64>,
    /// Amount to shape mouth in 'woo' position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub woo: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LivePortraitOutput {
    /// The generated video file.
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LivePortraitVideoInput {
    /// Whether to prioritize source or driving audio.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audio_priority: Option<String>,
    /// URL of the video to drive the lip syncing.
    /// "https://storage.googleapis.com/falserverless/model_tests/live-portrait/liveportrait-example.mp4"
    pub driving_video_url: String,
    /// Whether to filter out NSFW content.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// URL of the video to drive the lip syncing.
    /// "https://storage.googleapis.com/falserverless/videos/s13.mp4"
    pub source_video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Live Portrait
///
/// Category: image-to-video
/// Machine Type: A6000
/// License Type: commercial
pub fn video(
    params: LivePortraitVideoInput,
) -> FalRequest<LivePortraitVideoInput, LivePortraitOutput> {
    FalRequest::new("fal-ai/live-portrait/video", params)
}
