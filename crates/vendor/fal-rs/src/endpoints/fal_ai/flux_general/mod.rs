#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_flux-general"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_flux-general"
    )))
)]
pub mod differential_diffusion;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_flux-general"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_flux-general"
    )))
)]
pub mod image_to_image;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_flux-general"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_flux-general"
    )))
)]
pub mod inpainting;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_flux-general"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_flux-general"
    )))
)]
pub mod rf_inversion;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ControlLoraWeight {
    /// URL of the image to be used as the control image.
    pub control_image_url: String,
    /// URL or the path to the LoRA weights.
    pub path: String,
    /// Type of preprocessing to apply to the input image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preprocess: Option<String>,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model. Providing a dictionary as {"layer_name":layer_scale} allows per-layer lora scale settings. Layers with no scale provided will have scale 1.0.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<ScaleProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ControlNet {
    /// The scale of the control net weight. This is used to scale the control net weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conditioning_scale: Option<f64>,
    /// optional URL to the controlnet config.json file.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_url: Option<String>,
    /// URL of the image to be used as the control image.
    pub control_image_url: String,
    /// The percentage of the image to end applying the controlnet in terms of the total timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_percentage: Option<f64>,
    /// URL of the mask for the control image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    /// Threshold for mask.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_threshold: Option<f64>,
    /// URL or the path to the control net weights.
    pub path: String,
    /// The percentage of the image to start applying the controlnet in terms of the total timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_percentage: Option<f64>,
    /// The optional variant if a Hugging Face repo key is used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ControlNetUnion {
    /// optional URL to the controlnet config.json file.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_url: Option<String>,
    /// The control images and modes to use for the control net.
    pub controls: Vec<ControlNetUnionInput>,
    /// URL or the path to the control net weights.
    pub path: String,
    /// The optional variant if a Hugging Face repo key is used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ControlNetUnionInput {
    /// The scale of the control net weight. This is used to scale the control net weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conditioning_scale: Option<f64>,
    /// URL of the image to be used as the control image.
    pub control_image_url: String,
    /// Control Mode for Flux Controlnet Union. Supported values are:
    /// - canny: Uses the edges for guided generation.
    /// - tile: Uses the tiles for guided generation.
    /// - depth: Utilizes a grayscale depth map for guided generation.
    /// - blur: Adds a blur to the image.
    /// - pose: Uses the pose of the image for guided generation.
    /// - gray: Converts the image to grayscale.
    /// - low-quality: Converts the image to a low-quality image.
    pub control_mode: String,
    /// The percentage of the image to end applying the controlnet in terms of the total timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_percentage: Option<f64>,
    /// URL of the mask for the control image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    /// Threshold for mask.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_threshold: Option<f64>,
    /// The percentage of the image to start applying the controlnet in terms of the total timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_percentage: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DifferentialDiffusionInput {
    /// Base shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_shift: Option<f64>,
    /// URL of change map.
    /// "https://fal.media/files/zebra/Wh4IYAiAAcVbuZ8M9ZMSn.jpeg"
    pub change_map_image_url: String,
    /// The LoRAs to use for the image generation which use a control image. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_loras: Option<Vec<Option<ControlLoraWeight>>>,
    /// The controlnet unions to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_unions: Option<Vec<Option<ControlNetUnion>>>,
    /// The controlnets to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of image to use as initial image.
    /// "https://fal.media/files/koala/h6a7KK2Ie_inuGbdartoX.jpeg"
    pub image_url: String,
    /// IP-Adapter to use for image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapters: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// Max shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_shift: Option<f64>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate an image from.
    /// "Tree of life under the sea, ethereal, glittering, lens flares, cinematic lighting, artwork by Anna Dittmann & Carne Griffiths, 8k, unreal engine 5, hightly detailed, intricate detailed."
    pub prompt: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub real_cfg_scale: Option<f64>,
    /// The percentage of the total timesteps when the reference guidance is to be ended.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_end: Option<f64>,
    /// URL of Image for Reference-Only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_image_url: Option<String>,
    /// The percentage of the total timesteps when the reference guidance is to bestarted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_start: Option<f64>,
    /// Strength of reference_only generation. Only used if a reference image is provided.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_strength: Option<f64>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength to use for differential diffusion. 1.0 is completely remakes the image while 0.0 preserves the original.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// Specifies whether beta sigmas ought to be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_beta_schedule: Option<bool>,
    /// Uses classical CFG as in SD1.5, SDXL, etc. Increases generation times and price when set to be true.
    /// If using XLabs IP-Adapter v1, this will be turned on!.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_real_cfg: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct IPAdapter {
    /// Path to the Image Encoder for the IP-Adapter, for example 'openai/clip-vit-large-patch14'
    pub image_encoder_path: String,
    /// Subfolder in which the image encoder weights exist.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_subfolder: Option<String>,
    /// Name of the image encoder.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_weight_name: Option<String>,
    /// URL of Image for IP-Adapter conditioning.
    pub image_url: String,
    /// URL of the mask for the control image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    /// Threshold for mask.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_threshold: Option<f64>,
    /// Hugging Face path to the IP-Adapter
    pub path: String,
    /// Scale for ip adapter.
    pub scale: f64,
    /// Subfolder in which the ip_adapter weights exist
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subfolder: Option<String>,
    /// Name of the safetensors file containing the ip-adapter weights
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight_name: Option<String>,
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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToImageInput {
    /// Base shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_shift: Option<f64>,
    /// The LoRAs to use for the image generation which use a control image. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_loras: Option<Vec<Option<ControlLoraWeight>>>,
    /// The controlnet unions to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_unions: Option<Vec<Option<ControlNetUnion>>>,
    /// The controlnets to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of image to use for inpainting. or img2img
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png"
    pub image_url: String,
    /// IP-Adapter to use for image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapters: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// Max shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_shift: Option<f64>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate an image from.
    /// "A photo of a lion sitting on a stone bench"
    pub prompt: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub real_cfg_scale: Option<f64>,
    /// The percentage of the total timesteps when the reference guidance is to be ended.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_end: Option<f64>,
    /// URL of Image for Reference-Only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_image_url: Option<String>,
    /// The percentage of the total timesteps when the reference guidance is to bestarted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_start: Option<f64>,
    /// Strength of reference_only generation. Only used if a reference image is provided.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_strength: Option<f64>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength to use for inpainting/image-to-image. Only used if the image_url is provided. 1.0 is completely remakes the image while 0.0 preserves the original.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// Specifies whether beta sigmas ought to be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_beta_schedule: Option<bool>,
    /// Uses classical CFG as in SD1.5, SDXL, etc. Increases generation times and price when set to be true.
    /// If using XLabs IP-Adapter v1, this will be turned on!.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_real_cfg: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InpaintInput {
    /// Base shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_shift: Option<f64>,
    /// The LoRAs to use for the image generation which use a control image. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_loras: Option<Vec<Option<ControlLoraWeight>>>,
    /// The controlnet unions to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_unions: Option<Vec<Option<ControlNetUnion>>>,
    /// The controlnets to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of image to use for inpainting. or img2img
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png"
    pub image_url: String,
    /// IP-Adapter to use for image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapters: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The mask to area to Inpaint in.
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo_mask.png"
    pub mask_url: String,
    /// Max shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_shift: Option<f64>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate an image from.
    /// "A photo of a lion sitting on a stone bench"
    pub prompt: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub real_cfg_scale: Option<f64>,
    /// The percentage of the total timesteps when the reference guidance is to be ended.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_end: Option<f64>,
    /// URL of Image for Reference-Only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_image_url: Option<String>,
    /// The percentage of the total timesteps when the reference guidance is to bestarted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_start: Option<f64>,
    /// Strength of reference_only generation. Only used if a reference image is provided.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_strength: Option<f64>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The strength to use for inpainting/image-to-image. Only used if the image_url is provided. 1.0 is completely remakes the image while 0.0 preserves the original.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// Specifies whether beta sigmas ought to be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_beta_schedule: Option<bool>,
    /// Uses classical CFG as in SD1.5, SDXL, etc. Increases generation times and price when set to be true.
    /// If using XLabs IP-Adapter v1, this will be turned on!.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_real_cfg: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LoraWeight {
    /// URL or the path to the LoRA weights.
    pub path: String,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model. Providing a dictionary as {"layer_name":layer_scale} allows per-layer lora scale settings. Layers with no scale provided will have scale 1.0.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<ScaleProperty>,
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
pub struct RFInversionInput {
    /// Base shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_shift: Option<f64>,
    /// The LoRAs to use for the image generation which use a control image. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_loras: Option<Vec<Option<ControlLoraWeight>>>,
    /// The controller guidance (gamma) used in the creation of structured noise.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controller_guidance_forward: Option<f64>,
    /// The controller guidance (eta) used in the denoising process.Using values closer to 1 will result in an image closer to input.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controller_guidance_reverse: Option<f64>,
    /// The controlnet unions to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_unions: Option<Vec<Option<ControlNetUnion>>>,
    /// The controlnets to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// URL of image to be edited
    /// "https://storage.googleapis.com/falserverless/flux-general-tests/anime_style.png"
    pub image_url: String,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// Max shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_shift: Option<f64>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to edit the image with
    /// "Wearing glasses"
    pub prompt: String,
    /// The percentage of the total timesteps when the reference guidance is to be ended.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_end: Option<f64>,
    /// URL of Image for Reference-Only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_image_url: Option<String>,
    /// The percentage of the total timesteps when the reference guidance is to bestarted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_start: Option<f64>,
    /// Strength of reference_only generation. Only used if a reference image is provided.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_strength: Option<f64>,
    /// Timestep to stop guidance during reverse process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reverse_guidance_end: Option<i64>,
    /// Scheduler for applying reverse guidance.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reverse_guidance_schedule: Option<String>,
    /// Timestep to start guidance during reverse process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reverse_guidance_start: Option<i64>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// Specifies whether beta sigmas ought to be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_beta_schedule: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageInput {
    /// Base shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_shift: Option<f64>,
    /// The LoRAs to use for the image generation which use a control image. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_loras: Option<Vec<Option<ControlLoraWeight>>>,
    /// The controlnet unions to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_unions: Option<Vec<Option<ControlNetUnion>>>,
    /// The controlnets to use for the image generation. Only one controlnet is supported at the moment.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The size of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// IP-Adapter to use for image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapters: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// Max shift for the scheduled timesteps
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_shift: Option<f64>,
    /// The number of images to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The number of inference steps to perform.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate an image from.
    /// "Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    pub prompt: String,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub real_cfg_scale: Option<f64>,
    /// The percentage of the total timesteps when the reference guidance is to be ended.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_end: Option<f64>,
    /// URL of Image for Reference-Only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_image_url: Option<String>,
    /// The percentage of the total timesteps when the reference guidance is to bestarted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_start: Option<f64>,
    /// Strength of reference_only generation. Only used if a reference image is provided.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_strength: Option<f64>,
    /// The same seed and the same prompt given to the same version of the model
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// Specifies whether beta sigmas ought to be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_beta_schedule: Option<bool>,
    /// Uses classical CFG as in SD1.5, SDXL, etc. Increases generation times and price when set to be true.
    /// If using XLabs IP-Adapter v1, this will be turned on!.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_real_cfg: Option<bool>,
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

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ScaleProperty {
    #[default]
    Object(HashMap<String, serde_json::Value>),
    Number(f64),
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// FLUX.1 [dev] with Controlnets and Loras
///
/// Category: text-to-image
/// Machine Type: A100
/// License Type: commercial
///
/// FLUX.1 [dev], next generation text-to-image model.
pub fn flux_general(params: TextToImageInput) -> FalRequest<TextToImageInput, Output> {
    FalRequest::new("fal-ai/flux-general", params)
}
