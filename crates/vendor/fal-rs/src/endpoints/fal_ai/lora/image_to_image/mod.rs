#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ControlNet {
    /// The scale of the control net weight. This is used to scale the control net weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conditioning_scale: Option<f64>,
    /// optional URL to the controlnet config.json file.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config_url: Option<String>,
    /// The percentage of the image to end applying the controlnet in terms of the total timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_percentage: Option<f64>,
    /// URL of the image to be used as the control net.
    pub image_url: String,
    /// The index of the IP adapter to be applied to the controlnet. This is only needed for InstantID ControlNets.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter_index: Option<i64>,
    /// The mask to use for the controlnet. When using a mask, the control image size and the mask size must be the same and divisible by 32.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_url: Option<String>,
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
pub struct Embedding {
    /// URL or the path to the embedding weights.
    pub path: String,
    /// The tokens to map the embedding weights to. Use these tokens in your prompts.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokens: Option<Vec<Option<String>>>,
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
pub struct IPAdapter {
    /// The value to set the image projection shortcut to. For FaceID plus V1 models,
    /// this should be set to False. For FaceID plus V2 models, this should be set to True.
    /// Default is True.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_projection_shortcut: Option<bool>,
    /// URL or the path to the InsightFace model weights.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub insight_face_model_path: Option<String>,
    /// URL of the image to be used as the IP adapter.
    pub ip_adapter_image_url: IpAdapterImageUrlProperty,
    /// The mask to use for the IP adapter. When using a mask, the ip-adapter image size and the mask size must be the same
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter_mask_url: Option<String>,
    /// Subfolder in the model directory where the IP adapter weights are stored.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_subfolder: Option<String>,
    /// URL or the path to the IP adapter weights.
    pub path: String,
    /// The scale of the IP adapter weight. This is used to scale the IP adapter weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// The scale of the IP adapter weight. This is used to scale the IP adapter weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale_json: Option<HashMap<String, serde_json::Value>>,
    /// The factor to apply to the unconditional noising of the IP adapter.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unconditional_noising_factor: Option<f64>,
    /// Name of the weight file.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight_name: Option<String>,
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
    /// Skips part of the image generation process, leading to slightly different results.
    /// This means the image renders faster, too.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clip_skip: Option<i64>,
    /// If set to true, the controlnet will be applied to only the conditional predictions.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_guess_mode: Option<bool>,
    /// The control nets to use for the image generation. You can use any number of control nets
    /// and they will be applied to the image at the specified timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the latents will be saved for debugging.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_latents: Option<bool>,
    /// If set to true, the latents will be saved for debugging per pass.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_per_pass_latents: Option<bool>,
    /// The embeddings to use for the image generation. Only a single embedding is supported at the moment.
    /// The embeddings will be used to map the tokens in the prompt to the embedding weights.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embeddings: Option<Vec<Option<Embedding>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The eta value to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta: Option<f64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The URL of the IC Light model image to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_image_url: Option<String>,
    /// The URL of the IC Light model background image to use for the image generation.
    /// Make sure to use a background compatible with the model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_model_background_image_url: Option<String>,
    /// The URL of the IC Light model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_model_url: Option<String>,
    /// The path to the image encoder model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_path: Option<String>,
    /// The subfolder of the image encoder model to use for the image generation.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_subfolder: Option<String>,
    /// The weight name of the image encoder model to use for the image generation.
    /// "pytorch_model.bin"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_weight_name: Option<String>,
    /// The format of the generated image.
    /// "jpeg"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_format: Option<String>,
    /// URL of image to use for image to image/inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// The IP adapter to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// URL or HuggingFace ID of the base model to generate the image.
    /// "stabilityai/stable-diffusion-xl-base-1.0"
    /// "runwayml/stable-diffusion-v1-5"
    /// "SG161222/Realistic_Vision_V2.0"
    pub model_name: String,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "cartoon, painting, illustration, worst quality, low quality, normal quality"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The amount of noise to add to noise image for image. Only used if the image_url is provided. 1.0 is complete noise and 0 is no noise.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub noise_strength: Option<f64>,
    /// Number of images to generate in one request. Note that the higher the batch size,
    /// the longer it will take to generate the images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The type of prediction to use for the image generation.
    /// The `epsilon` is the default.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prediction_type: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "Photo of a european medieval 40 year old queen, silver hair, highly detailed face, detailed eyes, head shot, intricate crown, age spots, wrinkles"
    /// "Photo of a classic red mustang car parked in las vegas strip at night"
    pub prompt: String,
    /// If set to true, the prompt weighting syntax will be used.
    /// Additionally, this will lift the 77 token limit by averaging embeddings.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_weighting: Option<bool>,
    /// Whether to set the rescale_betas_snr_zero option or not for the sampler
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rescale_betas_snr_zero: Option<bool>,
    /// Scheduler / sampler to use for the image denoising process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Optionally override the sigmas to use for the denoising process. Only works with schedulers which support the `sigmas` argument in their `set_sigmas` method.
    /// Defaults to not overriding, in which case the scheduler automatically sets the sigmas based on the `num_inference_steps` parameter.
    /// If set to a custom sigma schedule, the `num_inference_steps` parameter will be ignored. Cannot be set if `timesteps` is set.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sigmas: Option<Option<SigmasInput>>,
    /// The size of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_height: Option<i64>,
    /// The stride of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_stride_height: Option<i64>,
    /// The stride of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_stride_width: Option<i64>,
    /// The size of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_width: Option<i64>,
    /// Optionally override the timesteps to use for the denoising process. Only works with schedulers which support the `timesteps` argument in their `set_timesteps` method.
    /// Defaults to not overriding, in which case the scheduler automatically sets the timesteps based on the `num_inference_steps` parameter.
    /// If set to a custom timestep schedule, the `num_inference_steps` parameter will be ignored. Cannot be set if `sigmas` is set.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timesteps: Option<Option<TimestepsInput>>,
    /// URL or HuggingFace ID of the custom U-Net model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unet_name: Option<String>,
    /// The variant of the model to use for huggingface models, e.g. 'fp16'.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct InpaintInput {
    /// Skips part of the image generation process, leading to slightly different results.
    /// This means the image renders faster, too.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clip_skip: Option<i64>,
    /// If set to true, the controlnet will be applied to only the conditional predictions.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_guess_mode: Option<bool>,
    /// The control nets to use for the image generation. You can use any number of control nets
    /// and they will be applied to the image at the specified timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the latents will be saved for debugging.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_latents: Option<bool>,
    /// If set to true, the latents will be saved for debugging per pass.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_per_pass_latents: Option<bool>,
    /// The embeddings to use for the image generation. Only a single embedding is supported at the moment.
    /// The embeddings will be used to map the tokens in the prompt to the embedding weights.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embeddings: Option<Vec<Option<Embedding>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The eta value to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta: Option<f64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The URL of the IC Light model image to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_image_url: Option<String>,
    /// The URL of the IC Light model background image to use for the image generation.
    /// Make sure to use a background compatible with the model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_model_background_image_url: Option<String>,
    /// The URL of the IC Light model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_model_url: Option<String>,
    /// The path to the image encoder model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_path: Option<String>,
    /// The subfolder of the image encoder model to use for the image generation.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_subfolder: Option<String>,
    /// The weight name of the image encoder model to use for the image generation.
    /// "pytorch_model.bin"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_weight_name: Option<String>,
    /// The format of the generated image.
    /// "jpeg"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_format: Option<String>,
    /// URL of image to use for image to image/inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// The IP adapter to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// URL of black-and-white image to use as mask during inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_url: Option<String>,
    /// URL or HuggingFace ID of the base model to generate the image.
    /// "stabilityai/stable-diffusion-xl-base-1.0"
    /// "runwayml/stable-diffusion-v1-5"
    /// "SG161222/Realistic_Vision_V2.0"
    pub model_name: String,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "cartoon, painting, illustration, worst quality, low quality, normal quality"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The amount of noise to add to noise image for image. Only used if the image_url is provided. 1.0 is complete noise and 0 is no noise.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub noise_strength: Option<f64>,
    /// Number of images to generate in one request. Note that the higher the batch size,
    /// the longer it will take to generate the images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The type of prediction to use for the image generation.
    /// The `epsilon` is the default.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prediction_type: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "Photo of a european medieval 40 year old queen, silver hair, highly detailed face, detailed eyes, head shot, intricate crown, age spots, wrinkles"
    /// "Photo of a classic red mustang car parked in las vegas strip at night"
    pub prompt: String,
    /// If set to true, the prompt weighting syntax will be used.
    /// Additionally, this will lift the 77 token limit by averaging embeddings.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_weighting: Option<bool>,
    /// Whether to set the rescale_betas_snr_zero option or not for the sampler
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rescale_betas_snr_zero: Option<bool>,
    /// Scheduler / sampler to use for the image denoising process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Optionally override the sigmas to use for the denoising process. Only works with schedulers which support the `sigmas` argument in their `set_sigmas` method.
    /// Defaults to not overriding, in which case the scheduler automatically sets the sigmas based on the `num_inference_steps` parameter.
    /// If set to a custom sigma schedule, the `num_inference_steps` parameter will be ignored. Cannot be set if `timesteps` is set.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sigmas: Option<Option<SigmasInput>>,
    /// The size of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_height: Option<i64>,
    /// The stride of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_stride_height: Option<i64>,
    /// The stride of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_stride_width: Option<i64>,
    /// The size of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_width: Option<i64>,
    /// Optionally override the timesteps to use for the denoising process. Only works with schedulers which support the `timesteps` argument in their `set_timesteps` method.
    /// Defaults to not overriding, in which case the scheduler automatically sets the timesteps based on the `num_inference_steps` parameter.
    /// If set to a custom timestep schedule, the `num_inference_steps` parameter will be ignored. Cannot be set if `sigmas` is set.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timesteps: Option<Option<TimestepsInput>>,
    /// URL or HuggingFace ID of the custom U-Net model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unet_name: Option<String>,
    /// The variant of the model to use for huggingface models, e.g. 'fp16'.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LoraWeight {
    /// URL or the path to the LoRA weights.
    pub path: String,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OutputParameters {
    /// The latents saved for debugging.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_latents: Option<Option<File>>,
    /// The latents saved for debugging per pass.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_per_pass_latents: Option<Option<File>>,
    /// Whether the generated images contain NSFW concepts.
    pub has_nsfw_concepts: Vec<bool>,
    /// The generated image files info.
    pub images: Vec<Image>,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SigmasInput {
    /// Sigmas schedule to be used if 'custom' method is selected.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub array: Option<Vec<Option<f64>>>,
    /// The method to use for the sigmas. If set to 'custom', the sigmas will be set based
    /// on the provided sigmas schedule in the `array` field.
    /// Defaults to 'default' which means the scheduler will use the sigmas of the scheduler.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageInput {
    /// Skips part of the image generation process, leading to slightly different results.
    /// This means the image renders faster, too.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clip_skip: Option<i64>,
    /// If set to true, the controlnet will be applied to only the conditional predictions.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_guess_mode: Option<bool>,
    /// The control nets to use for the image generation. You can use any number of control nets
    /// and they will be applied to the image at the specified timesteps.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnets: Option<Vec<Option<ControlNet>>>,
    /// If set to true, the latents will be saved for debugging.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_latents: Option<bool>,
    /// If set to true, the latents will be saved for debugging per pass.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub debug_per_pass_latents: Option<bool>,
    /// The embeddings to use for the image generation. Only a single embedding is supported at the moment.
    /// The embeddings will be used to map the tokens in the prompt to the embedding weights.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embeddings: Option<Vec<Option<Embedding>>>,
    /// If set to true, the safety checker will be enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The eta value to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eta: Option<f64>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The URL of the IC Light model image to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_image_url: Option<String>,
    /// The URL of the IC Light model background image to use for the image generation.
    /// Make sure to use a background compatible with the model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_model_background_image_url: Option<String>,
    /// The URL of the IC Light model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ic_light_model_url: Option<String>,
    /// The path to the image encoder model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_path: Option<String>,
    /// The subfolder of the image encoder model to use for the image generation.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_subfolder: Option<String>,
    /// The weight name of the image encoder model to use for the image generation.
    /// "pytorch_model.bin"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_encoder_weight_name: Option<String>,
    /// The format of the generated image.
    /// "jpeg"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_format: Option<String>,
    /// The size of the generated image. You can choose between some presets or custom height and width
    /// that **must be multiples of 8**.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    /// The IP adapter to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_adapter: Option<Vec<Option<IPAdapter>>>,
    /// The LoRAs to use for the image generation. You can use any number of LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// URL or HuggingFace ID of the base model to generate the image.
    /// "stabilityai/stable-diffusion-xl-base-1.0"
    /// "runwayml/stable-diffusion-v1-5"
    /// "SG161222/Realistic_Vision_V2.0"
    pub model_name: String,
    /// The negative prompt to use.Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "cartoon, painting, illustration, worst quality, low quality, normal quality"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate in one request. Note that the higher the batch size,
    /// the longer it will take to generate the images.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The type of prediction to use for the image generation.
    /// The `epsilon` is the default.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prediction_type: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "Photo of a european medieval 40 year old queen, silver hair, highly detailed face, detailed eyes, head shot, intricate crown, age spots, wrinkles"
    /// "Photo of a classic red mustang car parked in las vegas strip at night"
    pub prompt: String,
    /// If set to true, the prompt weighting syntax will be used.
    /// Additionally, this will lift the 77 token limit by averaging embeddings.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_weighting: Option<bool>,
    /// Whether to set the rescale_betas_snr_zero option or not for the sampler
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rescale_betas_snr_zero: Option<bool>,
    /// Scheduler / sampler to use for the image denoising process.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<String>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Optionally override the sigmas to use for the denoising process. Only works with schedulers which support the `sigmas` argument in their `set_sigmas` method.
    /// Defaults to not overriding, in which case the scheduler automatically sets the sigmas based on the `num_inference_steps` parameter.
    /// If set to a custom sigma schedule, the `num_inference_steps` parameter will be ignored. Cannot be set if `timesteps` is set.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sigmas: Option<Option<SigmasInput>>,
    /// The size of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_height: Option<i64>,
    /// The stride of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_stride_height: Option<i64>,
    /// The stride of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_stride_width: Option<i64>,
    /// The size of the tiles to be used for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile_width: Option<i64>,
    /// Optionally override the timesteps to use for the denoising process. Only works with schedulers which support the `timesteps` argument in their `set_timesteps` method.
    /// Defaults to not overriding, in which case the scheduler automatically sets the timesteps based on the `num_inference_steps` parameter.
    /// If set to a custom timestep schedule, the `num_inference_steps` parameter will be ignored. Cannot be set if `sigmas` is set.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timesteps: Option<Option<TimestepsInput>>,
    /// URL or HuggingFace ID of the custom U-Net model to use for the image generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unet_name: Option<String>,
    /// The variant of the model to use for huggingface models, e.g. 'fp16'.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TimestepsInput {
    /// Timesteps schedule to be used if 'custom' method is selected.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub array: Option<Vec<Option<i64>>>,
    /// The method to use for the timesteps. If set to 'array', the timesteps will be set based
    /// on the provided timesteps schedule in the `array` field.
    /// Defaults to 'default' which means the scheduler will use the `num_inference_steps` parameter.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
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
pub enum IpAdapterImageUrlProperty {
    #[default]
    String(String),
    Array(Vec<String>),
}

/// Stable Diffusion with LoRAs
///
/// Category: text-to-image
/// Machine Type: A100
pub fn image_to_image(
    params: ImageToImageInput,
) -> FalRequest<ImageToImageInput, OutputParameters> {
    FalRequest::new("fal-ai/lora/image-to-image", params)
}
