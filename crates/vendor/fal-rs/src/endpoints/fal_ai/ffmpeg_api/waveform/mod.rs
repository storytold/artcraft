#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Audio {
    /// Overall bitrate of the media in bits per second
    pub bitrate: i64,
    /// Number of audio channels
    pub channels: i64,
    /// Codec used to encode the media
    pub codec: String,
    /// Container format of the media file (e.g., 'mp4', 'mov')
    pub container: String,
    /// MIME type of the media file
    pub content_type: String,
    /// Duration of the media in seconds
    pub duration: f64,
    /// Original filename of the media
    pub file_name: String,
    /// Size of the file in bytes
    pub file_size: i64,
    /// Type of media (always 'audio')
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_type: Option<String>,
    /// Audio sample rate in Hz
    pub sample_rate: i64,
    /// URL where the media file can be accessed
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AudioTrack {
    /// Audio bitrate in bits per second
    pub bitrate: i64,
    /// Number of audio channels
    pub channels: i64,
    /// Audio codec used (e.g., 'aac', 'mp3')
    pub codec: String,
    /// Audio sample rate in Hz
    pub sample_rate: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Input {
    /// List of tracks to be combined into the final media
    pub tracks: Vec<Track>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Keyframe {
    /// The duration in milliseconds of this keyframe
    pub duration: f64,
    /// The timestamp in milliseconds where this keyframe starts
    pub timestamp: f64,
    /// The URL where this keyframe's media file can be accessed
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MetadataInput {
    /// Whether to extract the start and end frames for videos. Note that when true the request will be slower.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extract_frames: Option<bool>,
    /// URL of the media file (video or audio) to analyze
    pub media_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MetadataOutput {
    /// Metadata for the analyzed media file (either Video or Audio)
    pub media: MediaProperty,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Output {
    /// URL of the video's thumbnail image
    pub thumbnail_url: String,
    /// URL of the processed video file
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Resolution {
    /// Display aspect ratio (e.g., '16:9')
    pub aspect_ratio: String,
    /// Height of the video in pixels
    pub height: i64,
    /// Width of the video in pixels
    pub width: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Track {
    /// Unique identifier for the track
    pub id: String,
    /// List of keyframes that make up this track
    pub keyframes: Vec<Keyframe>,
    /// Type of track ('video' or 'audio')
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Video {
    /// Audio track information if video has audio
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audio: Option<Option<AudioTrack>>,
    /// Overall bitrate of the media in bits per second
    pub bitrate: i64,
    /// Codec used to encode the media
    pub codec: String,
    /// Container format of the media file (e.g., 'mp4', 'mov')
    pub container: String,
    /// MIME type of the media file
    pub content_type: String,
    /// Duration of the media in seconds
    pub duration: f64,
    /// URL of the extracted last frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_frame_url: Option<String>,
    /// Original filename of the media
    pub file_name: String,
    /// Size of the file in bytes
    pub file_size: i64,
    /// Detailed video format information
    pub format: VideoFormat,
    /// Frames per second
    pub fps: i64,
    /// Total number of frames in the video
    pub frame_count: i64,
    /// Type of media (always 'video')
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_type: Option<String>,
    /// Video resolution information
    pub resolution: Resolution,
    /// URL of the extracted first frame
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_frame_url: Option<String>,
    /// Time base used for frame timestamps
    pub timebase: String,
    /// URL where the media file can be accessed
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoFormat {
    /// Video bitrate in bits per second
    pub bitrate: i64,
    /// Container format of the video
    pub container: String,
    /// Codec level (e.g., 4.1)
    pub level: f64,
    /// Pixel format used (e.g., 'yuv420p')
    pub pixel_format: String,
    /// Codec profile (e.g., 'main', 'high')
    pub profile: String,
    /// Video codec used (e.g., 'h264')
    pub video_codec: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WaveformInput {
    /// URL of the audio file to analyze
    pub media_url: String,
    /// Controls how many points are sampled per second of audio. Lower values (e.g. 1-2) create a coarser waveform, higher values (e.g. 4-10) create a more detailed one.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub points_per_second: Option<f64>,
    /// Number of decimal places for the waveform values. Higher values provide more precision but increase payload size.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub precision: Option<i64>,
    /// Size of the smoothing window. Higher values create a smoother waveform. Must be an odd number.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub smoothing_window: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WaveformOutput {
    /// Duration of the audio in seconds
    pub duration: f64,
    /// Number of points in the waveform data
    pub points: i64,
    /// Number of decimal places used in the waveform values
    pub precision: i64,
    /// Normalized waveform data as an array of values between -1 and 1. The number of points is determined by audio duration × points_per_second.
    pub waveform: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum MediaProperty {
    #[default]
    Video(Video),
    Audio(Audio),
}

/// FFmpeg API Compose
///
/// Category: video-to-video
/// Machine Type: L
pub fn waveform(params: WaveformInput) -> FalRequest<WaveformInput, WaveformOutput> {
    FalRequest::new("fal-ai/ffmpeg-api/waveform", params)
}
