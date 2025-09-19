#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

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
pub struct ImageProcessingInput {
    /// Blue channel shift direction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blue_direction: Option<String>,
    /// Blue channel shift amount
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blue_shift: Option<i64>,
    /// Blur radius
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blur_radius: Option<i64>,
    /// Sigma for Gaussian blur
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blur_sigma: Option<f64>,
    /// Type of blur to apply
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blur_type: Option<String>,
    /// Brightness adjustment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brightness: Option<f64>,
    /// CAS sharpening amount
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cas_amount: Option<f64>,
    /// Contrast adjustment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contrast: Option<f64>,
    /// Desaturation factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub desaturate_factor: Option<f64>,
    /// Desaturation method
    #[serde(skip_serializing_if = "Option::is_none")]
    pub desaturate_method: Option<String>,
    /// Dissolve blend factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dissolve_factor: Option<f64>,
    /// URL of second image for dissolve
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dissolve_image_url: Option<String>,
    /// Dodge and burn intensity
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dodge_burn_intensity: Option<f64>,
    /// Dodge and burn mode
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dodge_burn_mode: Option<String>,
    /// Enable blur effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_blur: Option<bool>,
    /// Enable chromatic aberration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_chromatic: Option<bool>,
    /// Enable color correction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_color_correction: Option<bool>,
    /// Enable desaturation effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_desaturate: Option<bool>,
    /// Enable dissolve effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_dissolve: Option<bool>,
    /// Enable dodge and burn effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_dodge_burn: Option<bool>,
    /// Enable glow effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_glow: Option<bool>,
    /// Enable film grain effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_grain: Option<bool>,
    /// Enable parabolize effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_parabolize: Option<bool>,
    /// Enable sharpen effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_sharpen: Option<bool>,
    /// Enable solarize effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_solarize: Option<bool>,
    /// Enable color tint effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_tint: Option<bool>,
    /// Enable vignette effect
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_vignette: Option<bool>,
    /// Gamma adjustment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gamma: Option<f64>,
    /// Glow intensity
    #[serde(skip_serializing_if = "Option::is_none")]
    pub glow_intensity: Option<f64>,
    /// Glow blur radius
    #[serde(skip_serializing_if = "Option::is_none")]
    pub glow_radius: Option<i64>,
    /// Film grain intensity (when enabled)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grain_intensity: Option<f64>,
    /// Film grain scale (when enabled)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grain_scale: Option<f64>,
    /// Style of film grain to apply
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grain_style: Option<String>,
    /// Green channel shift direction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub green_direction: Option<String>,
    /// Green channel shift amount
    #[serde(skip_serializing_if = "Option::is_none")]
    pub green_shift: Option<i64>,
    /// URL of image to process
    /// "https://storage.googleapis.com/falserverless/web-examples/post-process/postpro-input.jpg"
    pub image_url: String,
    /// Noise radius for smart sharpen
    #[serde(skip_serializing_if = "Option::is_none")]
    pub noise_radius: Option<i64>,
    /// Parabolize coefficient
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parabolize_coeff: Option<f64>,
    /// Edge preservation factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preserve_edges: Option<f64>,
    /// Red channel shift direction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub red_direction: Option<String>,
    /// Red channel shift amount
    #[serde(skip_serializing_if = "Option::is_none")]
    pub red_shift: Option<i64>,
    /// Saturation adjustment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub saturation: Option<f64>,
    /// Sharpen strength (for basic mode)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpen_alpha: Option<f64>,
    /// Type of sharpening to apply
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpen_mode: Option<String>,
    /// Sharpen radius (for basic mode)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpen_radius: Option<i64>,
    /// Smart sharpen blend ratio
    #[serde(skip_serializing_if = "Option::is_none")]
    pub smart_sharpen_ratio: Option<f64>,
    /// Smart sharpen strength
    #[serde(skip_serializing_if = "Option::is_none")]
    pub smart_sharpen_strength: Option<f64>,
    /// Solarize threshold
    #[serde(skip_serializing_if = "Option::is_none")]
    pub solarize_threshold: Option<f64>,
    /// Color temperature adjustment
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    /// Tint color mode
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tint_mode: Option<String>,
    /// Tint strength
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tint_strength: Option<f64>,
    /// Vertex X position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vertex_x: Option<f64>,
    /// Vertex Y position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vertex_y: Option<f64>,
    /// Vignette strength (when enabled)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vignette_strength: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessedOutput {
    /// The processed images
    pub images: Vec<Image>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Post Processing
///
/// Category: image-to-image
pub fn post_processing(
    params: ImageProcessingInput,
) -> FalRequest<ImageProcessingInput, ProcessedOutput> {
    FalRequest::new("fal-ai/post-processing", params)
}
