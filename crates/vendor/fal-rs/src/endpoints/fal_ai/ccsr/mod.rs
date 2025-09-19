#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CCSRInput {
    /// Type of color correction for samples.
    /// "adain"
    /// "wavelet"
    /// "none"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_fix_type: Option<String>,
    /// The text prompt you would like to convert to speech.
    /// "https://storage.googleapis.com/falserverless/gallery/blue-bird.jpeg"
    pub image_url: String,
    /// The scale of the output image. The higher the scale, the bigger the output image will be.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// Seed for reproducibility. Different seeds will make slightly different results.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The number of steps to run the model for. The higher the number the better the quality and longer it will take to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub steps: Option<i64>,
    /// The ending point of uniform sampling strategy.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub t_max: Option<f64>,
    /// The starting point of uniform sampling strategy.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub t_min: Option<f64>,
    /// If specified, a patch-based sampling strategy will be used for sampling.
    /// "none"
    /// "mix"
    /// "gaussian"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_diffusion: Option<String>,
    /// Size of patch.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_diffusion_size: Option<i64>,
    /// Stride of sliding patch.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_diffusion_stride: Option<i64>,
    /// If specified, a patch-based sampling strategy will be used for VAE decoding.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_vae: Option<bool>,
    /// Size of VAE patch.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_vae_decoder_size: Option<i64>,
    /// Size of latent image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_vae_encoder_size: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CCSROutput {
    /// The generated image file info.
    pub image: Image,
    /// The seed used for the generation.
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

/// CCSR Upscaler
///
/// Category: image-to-image
/// Machine Type: A100
pub fn ccsr(params: CCSRInput) -> FalRequest<CCSRInput, CCSROutput> {
    FalRequest::new("fal-ai/ccsr", params)
}
