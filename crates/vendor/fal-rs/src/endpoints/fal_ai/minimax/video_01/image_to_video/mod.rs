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
pub struct I2VDirectorOutput {
    /// The generated video
    /// {"url":"https://storage.googleapis.com/falserverless/web-examples/minimax/i2v-01.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct I2VLiveOutput {
    /// The generated video
    /// {"url":"https://fal.media/files/monkey/bkT4T4uLOXr0jDsIMlNd5_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoDirectorRequest {
    /// URL of the image to use as the first frame
    /// "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
    pub image_url: String,
    /// Text prompt for video generation. Camera movement instructions can be added using square brackets (e.g. [Pan left] or [Zoom in]). You can use up to 3 combined movements per prompt. Supported movements: Truck left/right, Pan left/right, Push in/Pull out, Pedestal up/down, Tilt up/down, Zoom in/out, Shake, Tracking shot, Static shot. For example: [Truck left, Pan right, Zoom in]. For a more detailed guide, refer https://sixth-switch-2ac.notion.site/T2V-01-Director-Model-Tutorial-with-camera-movement-1886c20a98eb80f395b8e05291ad8645
    /// "[Push in, Follow]A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage. She wears a black leather jacket, a long red dress, and black boots, and carries a black purse.[Pan left] The street opens into a small plaza where street vendors sell steaming food under colorful awnings."
    pub prompt: String,
    /// Whether to use the model's prompt optimizer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoRequest {
    /// URL of the image to use as the first frame
    /// "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg"
    pub image_url: String,
    pub prompt: String,
    /// Whether to use the model's prompt optimizer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SubjectReferenceOutput {
    /// The generated video
    /// {"url":"https://fal.media/files/rabbit/pONKqOnY7z6GlF6oDESvR_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SubjectReferenceRequest {
    pub prompt: String,
    /// Whether to use the model's prompt optimizer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
    /// URL of the subject reference image to use for consistent subject appearance
    /// "https://fal.media/files/tiger/s2xnjhLpjM6L8ISxlDCAw.png"
    pub subject_reference_image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct T2VDirectorOutput {
    /// The generated video
    /// {"url":"https://fal.media/files/panda/4Et1qL4cbedh-OACEw7OF_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct T2VLiveOutput {
    /// The generated video
    /// {"url":"https://fal.media/files/monkey/EbJRdZfaJbNiJBUvPta3c_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoDirectorRequest {
    /// Text prompt for video generation. Camera movement instructions can be added using square brackets (e.g. [Pan left] or [Zoom in]). You can use up to 3 combined movements per prompt. Supported movements: Truck left/right, Pan left/right, Push in/Pull out, Pedestal up/down, Tilt up/down, Zoom in/out, Shake, Tracking shot, Static shot. For example: [Truck left, Pan right, Zoom in]. For a more detailed guide, refer https://sixth-switch-2ac.notion.site/T2V-01-Director-Model-Tutorial-with-camera-movement-1886c20a98eb80f395b8e05291ad8645
    /// "[Push in]Close up of a tense woman looks to the left, startled by a sound, in a darkened kitchen, Pots and pans hang ominously, the window in the kitchen is open and the wind softly blows the pans and creates an ominous mood. [Shake]the woman’s shock turns to fear. Black-and-white film noir shot dimly lit, 1950s-style, with dramatic, high-contrast shadows. The overall atmosphere is reminiscent of Alfred Hitchcock’s suspenseful storytelling, evoking a looming sense of dread with stark chiaroscuro lighting and a slight film-grain texture."
    pub prompt: String,
    /// Whether to use the model's prompt optimizer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoLiveRequest {
    pub prompt: String,
    /// Whether to use the model's prompt optimizer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoRequest {
    pub prompt: String,
    /// Whether to use the model's prompt optimizer
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_optimizer: Option<bool>,
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
    /// {"url":"https://fal.media/files/monkey/vNZqQV_WgC9MhoidClLyw_output.mp4"}
    pub video: File,
}

/// MiniMax (Hailuo AI) Video 01 Live
///
/// Category: text-to-video
///
///
///
/// Hailuo I2V-01 API: Native high-resolution, high-frame-rate video generation model, supports text-to-video and image-to-video
pub fn image_to_video(params: ImageToVideoRequest) -> FalRequest<ImageToVideoRequest, VideoOutput> {
    FalRequest::new("fal-ai/minimax/video-01/image-to-video", params)
}
