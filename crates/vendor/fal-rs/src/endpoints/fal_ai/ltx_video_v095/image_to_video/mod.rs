#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ExtendVideoInput {
    /// Aspect ratio of the generated video (16:9 or 9:16).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to expand the prompt using the model's own capabilities.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// Negative prompt for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of inference steps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Text prompt to guide generation
    /// "Woman walking on a street in Tokyo"
    pub prompt: String,
    /// Resolution of the generated video (480p or 720p).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Video to be extended.
    /// {"start_frame_num":24,"video_url":"https://storage.googleapis.com/falserverless/web-examples/wan/t2v.mp4"}
    pub video: VideoConditioningInput,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ExtendVideoOutput {
    /// The seed used for generation.
    pub seed: i64,
    /// The generated video file.
    /// {"url":"https://storage.googleapis.com/falserverless/example_outputs/ltx-v095_extend.mp4"}
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
pub struct ImageConditioningInput {
    /// URL of image to use as conditioning
    pub image_url: String,
    /// Frame number of the image from which the conditioning starts. Must be a multiple of 8.
    pub start_frame_num: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoInput {
    /// Aspect ratio of the generated video (16:9 or 9:16).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to expand the prompt using the model's own capabilities.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// Image URL for Image-to-Video task
    /// "https://h2.inkwai.com/bs2/upload-ylab-stunt/se/ai_portal_queue_mmu_image_upscale_aiweb/3214b798-e1b4-4b00-b7af-72b5b0417420_raw_image_0.jpg"
    pub image_url: String,
    /// Negative prompt for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of inference steps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Text prompt to guide generation
    /// "The astronaut gets up and walks away"
    pub prompt: String,
    /// Resolution of the generated video (480p or 720p).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageToVideoOutput {
    /// The seed used for generation.
    pub seed: i64,
    /// The generated video file.
    /// {"url":"https://storage.googleapis.com/falserverless/example_outputs/ltx_i2v_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MultiConditioningVideoInput {
    /// Aspect ratio of the generated video (16:9 or 9:16).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to expand the prompt using the model's own capabilities.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// URL of images to use as conditioning
    /// [{"image_url":"https://storage.googleapis.com/falserverless/model_tests/ltx/NswO1P8sCLzrh1WefqQFK_9a6bdbfa54b944c9a770338159a113fd.jpg","start_frame_num":0},{"image_url":"https://storage.googleapis.com/falserverless/model_tests/ltx/YAPOGvmS2tM_Krdp7q6-d_267c97e017c34f679844a4477dfcec38.jpg","start_frame_num":120}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<Option<ImageConditioningInput>>>,
    /// Negative prompt for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of inference steps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Text prompt to guide generation
    /// "\n            A vibrant, abstract composition featuring a person with outstretched arms, rendered in a kaleidoscope of colors against a deep, dark background. The figure is composed of intricate, swirling patterns reminiscent of a mosaic, with hues of orange, yellow, blue, and green that evoke the style of artists such as Wassily Kandinsky or Bridget Riley. \n\nThe camera zooms into the face striking portrait of a man, reimagined through the lens of old-school video-game graphics. The subject's face is rendered in a kaleidoscope of colors, with bold blues and reds set against a vibrant yellow backdrop. His dark hair is pulled back, framing his profile in a dramatic pose\n        "
    pub prompt: String,
    /// Resolution of the generated video (480p or 720p).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Videos to use as conditioning
    #[serde(skip_serializing_if = "Option::is_none")]
    pub videos: Option<Vec<Option<VideoConditioningInput>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MulticonditioningVideoOutput {
    /// The seed used for generation.
    pub seed: i64,
    /// The generated video file.
    /// {"url":"https://storage.googleapis.com/falserverless/gallery/ltx-multicondition.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoInput {
    /// Aspect ratio of the generated video (16:9 or 9:16).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to expand the prompt using the model's own capabilities.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// Negative prompt for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of inference steps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Text prompt to guide generation
    /// "A cute cat walking on a sidewalk"
    pub prompt: String,
    /// Resolution of the generated video (480p or 720p).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// Random seed for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoOutput {
    /// The seed used for generation.
    pub seed: i64,
    /// The generated video file.
    /// {"url":"https://storage.googleapis.com/falserverless/example_outputs/ltx-t2v_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoConditioningInput {
    /// Frame number of the video from which the conditioning starts. Must be a multiple of 8.
    pub start_frame_num: i64,
    /// URL of video to be extended
    pub video_url: String,
}

/// LTX Video-0.9.5
///
/// Category: text-to-video
/// Machine Type: H100
///
///
/// Generate a video from a prompt.
pub fn image_to_video(
    params: ImageToVideoInput,
) -> FalRequest<ImageToVideoInput, ImageToVideoOutput> {
    FalRequest::new("fal-ai/ltx-video-v095/image-to-video", params)
}
