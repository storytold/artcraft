#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ControlNeXtInput {
    /// Number of frames to process in each batch.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_frames: Option<i64>,
    /// Condition scale for ControlNeXt.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnext_cond_scale: Option<f64>,
    /// Chunk size for decoding frames.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub decode_chunk_size: Option<i64>,
    /// Frames per second for the output video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fps: Option<i64>,
    /// Guidance scale for the diffusion process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// Height of the output video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// URL of the reference image.
    /// "https://storage.googleapis.com/falserverless/model_tests/musepose/ref.png"
    pub image_url: String,
    /// Maximum number of frames to process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_frame_num: Option<i64>,
    /// Motion bucket ID for the pipeline.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub motion_bucket_id: Option<f64>,
    /// Number of inference steps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Number of overlapping frames between batches.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overlap: Option<i64>,
    /// Stride for sampling frames from the input video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_stride: Option<i64>,
    /// URL of the input video.
    /// "https://storage.googleapis.com/falserverless/model_tests/musepose/dance.mp4"
    pub video_url: String,
    /// Width of the output video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ControlNeXtOutput {
    /// The generated video.
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
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

/// ControlNeXt SVD
///
/// Category: video-to-video
/// Machine Type: A100
/// License Type: commercial
pub fn controlnext(params: ControlNeXtInput) -> FalRequest<ControlNeXtInput, ControlNeXtOutput> {
    FalRequest::new("fal-ai/controlnext", params)
}
