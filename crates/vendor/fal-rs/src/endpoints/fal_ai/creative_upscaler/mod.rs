#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CreativeUpscalerInput {
    /// The URL to the additional embeddings to use for the upscaling. Default is None
    #[serde(skip_serializing_if = "Option::is_none")]
    pub additional_embedding_url: Option<String>,
    /// The scale of the additional LORA model to use for the upscaling. Default is 1.0
    #[serde(skip_serializing_if = "Option::is_none")]
    pub additional_lora_scale: Option<f64>,
    /// The URL to the additional LORA model to use for the upscaling. Default is None
    #[serde(skip_serializing_if = "Option::is_none")]
    pub additional_lora_url: Option<String>,
    /// The URL to the base model to use for the upscaling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_model_url: Option<String>,
    /// How much the output can deviate from the original
    #[serde(skip_serializing_if = "Option::is_none")]
    pub creativity: Option<f64>,
    /// How much detail to add
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<f64>,
    /// If set to true, the resulting image will be checked whether it includes any
    /// potentially unsafe content. If it does, it will be replaced with a black
    /// image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checks: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The image to upscale.
    /// "https://storage.googleapis.com/falserverless/model_tests/upscale/owl.png"
    /// "https://storage.googleapis.com/falserverless/gallery/blue-bird.jpeg"
    pub image_url: String,
    /// The type of model to use for the upscaling. Default is SD_1_5
    /// "SD_1_5"
    /// "SDXL"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_type: Option<String>,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "blurry, low resolution, bad, ugly, low quality, pixelated, interpolated, compression artifacts, noisey, grainy"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to use for generating the image. The more steps
    /// the better the image will be but it will also take longer to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Allow for large uploads that could take a very long time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub override_size_limits: Option<bool>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results. If no prompt is provide BLIP2 will be used to generate a prompt.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// The suffix to add to the prompt. This is useful to add a common ending to all prompts such as 'high quality' etc or embedding tokens.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_suffix: Option<String>,
    /// The scale of the output image. The higher the scale, the bigger the output image will be.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 42
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// How much to preserve the shape of the original image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape_preservation: Option<f64>,
    /// If set to true, the image will not be processed by the CCSR model before
    /// being processed by the creativity model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip_ccsr: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreativeUpscalerOutput {
    /// The generated image file info.
    pub image: Image,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
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

/// Creative Upscaler
///
/// Category: image-to-image
/// Machine Type: A100
pub fn creative_upscaler(
    params: CreativeUpscalerInput,
) -> FalRequest<CreativeUpscalerInput, CreativeUpscalerOutput> {
    FalRequest::new("fal-ai/creative-upscaler", params)
}
