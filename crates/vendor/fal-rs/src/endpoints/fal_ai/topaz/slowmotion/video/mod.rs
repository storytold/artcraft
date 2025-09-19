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
pub struct RecoverUpscaleRequest {
    /// Target FPS for the output video. Defaults to source FPS if not specified.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_fps: Option<TargetFpsProperty>,
    /// Factor to upscale the video by (e.g. 2.0 doubles width and height)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscale_factor: Option<f64>,
    /// URL of the low-quality video to upscale and recover
    /// "https://v3.fal.media/files/kangaroo/y5-1YTGpun17eSeggZMzX_video-1733468228.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SlowMotionRequest {
    /// Factor to slow down the video by (e.g. 4 means 4x slower)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slowdown_factor: Option<i64>,
    /// Optional factor to upscale the video by (e.g. 2.0 doubles width and height)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscale_factor: Option<UpscaleFactorProperty>,
    /// URL of the video to apply slow motion to
    /// "https://v3.fal.media/files/kangaroo/y5-1YTGpun17eSeggZMzX_video-1733468228.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct StrongAIUpscaleRequest {
    /// Target FPS for the output video. Defaults to source FPS if not specified.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_fps: Option<TargetFpsProperty>,
    /// Target height of the output video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_height: Option<i64>,
    /// Target width of the output video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_width: Option<i64>,
    /// URL of the AI-generated video to upscale
    /// "https://v3.fal.media/files/kangaroo/y5-1YTGpun17eSeggZMzX_video-1733468228.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoUpscaleOutput {
    /// The upscaled video file
    /// {"url":"https://v3.fal.media/files/penguin/ztj_LB4gQlW6HIfVs8zX4_upscaled.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoUpscaleRequest {
    /// Target FPS for frame interpolation. If set, frame interpolation will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_fps: Option<TargetFpsProperty>,
    /// Factor to upscale the video by (e.g. 2.0 doubles width and height)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscale_factor: Option<f64>,
    /// URL of the video to upscale
    /// "https://v3.fal.media/files/kangaroo/y5-1YTGpun17eSeggZMzX_video-1733468228.mp4"
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
pub enum TargetFpsProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum UpscaleFactorProperty {
    #[default]
    Number(f64),
    Null(serde_json::Value),
}

/// Topaz Video Upscale
///
/// Category: video-to-video
///
///
///
/// Apply slow motion to videos, optionally with upscaling.
///
/// Uses Apollo v8 model to slow down videos up to 8x. Can also upscale the video
/// simultaneously if upscale_factor is specified.
pub fn video(params: SlowMotionRequest) -> FalRequest<SlowMotionRequest, VideoUpscaleOutput> {
    FalRequest::new("fal-ai/topaz/slowmotion/video", params)
}
