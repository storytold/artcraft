#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProCannyControlFinetunedInput {
    /// The control image URL to generate the Canny edge map from.
    /// "https://fal.media/files/kangaroo/eNSkRdVFzNvDkrrMjxFA3.png"
    pub control_image_url: String,
    /// References your specific model
    pub finetune_id: String,
    /// Controls finetune influence.
    /// Increase this value if your target concept isn't showing up strongly enough.
    /// The optimal setting depends on your finetune and prompt
    pub finetune_strength: f64,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "A pink owl."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProCannyControlInput {
    /// The control image URL to generate the Canny edge map from.
    /// "https://fal.media/files/kangaroo/eNSkRdVFzNvDkrrMjxFA3.png"
    pub control_image_url: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "A pink owl."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProDepthControlFinetunedInput {
    /// The control image URL to generate the depth map from.
    /// "https://fal.media/files/penguin/vt-SeIOweN7_oYBsvGO6t.png"
    pub control_image_url: String,
    /// References your specific model
    pub finetune_id: String,
    /// Controls finetune influence.
    /// Increase this value if your target concept isn't showing up strongly enough.
    /// The optimal setting depends on your finetune and prompt
    pub finetune_strength: f64,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "A blackhole in space."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProDepthControlInput {
    /// The control image URL to generate the depth map from.
    /// "https://fal.media/files/penguin/vt-SeIOweN7_oYBsvGO6t.png"
    pub control_image_url: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "A blackhole in space."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProFillFinetunedInput {
    /// References your specific model
    pub finetune_id: String,
    /// Controls finetune influence.
    /// Increase this value if your target concept isn't showing up strongly enough.
    /// The optimal setting depends on your finetune and prompt
    pub finetune_strength: f64,
    /// The image URL to generate an image from. Needs to match the dimensions of the mask.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/knight.jpeg"
    pub image_url: String,
    /// The mask URL to inpaint the image. Needs to match the dimensions of the input image.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/mask_knight.jpeg"
    pub mask_url: String,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to fill the masked part of the image.
    /// "A knight in shining armour holding a greatshield with \"FAL\" on it"
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProFillInput {
    /// The image URL to generate an image from. Needs to match the dimensions of the mask.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/knight.jpeg"
    pub image_url: String,
    /// The mask URL to inpaint the image. Needs to match the dimensions of the input image.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/mask_knight.jpeg"
    pub mask_url: String,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to fill the masked part of the image.
    /// "A knight in shining armour holding a greatshield with \"FAL\" on it"
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProOutpaintInput {
    /// Pixels to expand at the bottom
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_bottom: Option<i64>,
    /// Pixels to expand on the left
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_left: Option<i64>,
    /// Pixels to expand on the right
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_right: Option<i64>,
    /// Pixels to expand at the top
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_top: Option<i64>,
    /// The image URL to expand using outpainting
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/knight.jpeg"
    pub image_url: String,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProPlusTextToImageInput {
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProRedux {
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The image URL to generate an image from. Needs to match the dimensions of the mask.
    /// "https://fal.media/files/kangaroo/acQvq-Kmo2lajkgvcEHdv.png"
    pub image_url: String,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProTextToImageFinetunedInput {
    /// References your specific model
    pub finetune_id: String,
    /// Controls finetune influence.
    /// Increase this value if your target concept isn't showing up strongly enough.
    /// The optimal setting depends on your finetune and prompt
    pub finetune_strength: f64,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProTextToImageInput {
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProUltraTextToImageFinetunedInput {
    /// The aspect ratio of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<AspectRatioProperty>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// References your specific model
    pub finetune_id: String,
    /// Controls finetune influence.
    /// Increase this value if your target concept isn't showing up strongly enough.
    /// The optimal setting depends on your finetune and prompt
    pub finetune_strength: f64,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// Generate less processed, more natural-looking images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<bool>,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProUltraTextToImageInput {
    /// The aspect ratio of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<AspectRatioProperty>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// Generate less processed, more natural-looking images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<bool>,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FluxProUltraTextToImageInputRedux {
    /// The aspect ratio of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<AspectRatioProperty>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The strength of the image prompt, between 0 and 1.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_strength: Option<f64>,
    /// The image URL to generate an image from. Needs to match the dimensions of the mask.
    /// "https://fal.media/files/kangaroo/acQvq-Kmo2lajkgvcEHdv.png"
    pub image_url: String,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// The prompt to generate an image from.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Generate less processed, more natural-looking images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<bool>,
    /// The safety tolerance level for the generated image. 1 being the most strict and 5 being the most permissive.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safety_tolerance: Option<String>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Image {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    pub height: i64,
    pub url: String,
    pub width: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageSize {
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// Whether the generated images contain NSFW concepts.
    pub has_nsfw_concepts: Vec<bool>,
    /// The generated image files info.
    pub images: Vec<Image>,
    /// The prompt used for generating the image.
    pub prompt: String,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
    pub timings: Timings,
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
pub enum AspectRatioProperty {
    #[default]
    #[serde(rename = "21:9")]
    Property_21_9,
    #[serde(rename = "16:9")]
    Property_16_9,
    #[serde(rename = "4:3")]
    Property_4_3,
    #[serde(rename = "3:2")]
    Property_3_2,
    #[serde(rename = "1:1")]
    Property_1_1,
    #[serde(rename = "2:3")]
    Property_2_3,
    #[serde(rename = "3:4")]
    Property_3_4,
    #[serde(rename = "9:16")]
    Property_9_16,
    #[serde(rename = "9:21")]
    Property_9_21,
    String(String),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ImageSizeProperty {
    #[default]
    ImageSize(ImageSize),
    #[serde(rename = "square_hd")]
    SquareHd,
    #[serde(rename = "square")]
    Square,
    #[serde(rename = "portrait_4_3")]
    Portrait43,
    #[serde(rename = "portrait_16_9")]
    Portrait169,
    #[serde(rename = "landscape_4_3")]
    Landscape43,
    #[serde(rename = "landscape_16_9")]
    Landscape169,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// FLUX1.1 [pro] ultra
///
/// Category: text-to-image
/// Machine Type: H100
/// License Type: commercial
///
/// FLUX.1 Outpaint [pro] API, expand images in any direction using outpainting.
///
/// All usages of this model must comply with [FLUX.1 PRO Terms of Service](https://blackforestlabs.ai/terms-of-service/).
pub fn outpaint(params: FluxProOutpaintInput) -> FalRequest<FluxProOutpaintInput, Output> {
    FalRequest::new("fal-ai/flux-pro/v1/outpaint", params)
}
