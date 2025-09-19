#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FooocusImagePromptInput {
    /// The size of the generated image. You can choose between some presets or
    /// custom height and width that **must be multiples of 8**.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// If set to false, the safety checker will be disabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    pub image_prompt_1: ImagePrompt,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_2: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_3: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_4: Option<ImagePrompt>,
    /// Describe what you want to inpaint.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_additional_prompt: Option<String>,
    /// The image to use as a reference for inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_image_url: Option<String>,
    /// The mode to use for inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_mode: Option<String>,
    /// The LoRAs to use for the image generation. You can use up to 5 LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The image to use as a mask for the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    /// Mixing Image Prompt and Inpaint
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mixing_image_prompt_and_inpaint: Option<bool>,
    /// Mixing Image Prompt and Vary/Upscale
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mixing_image_prompt_and_vary_upscale: Option<bool>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate in one request
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The directions to outpaint.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outpaint_selections: Option<Vec<Option<String>>>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// You can choose Speed or Quality
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "pikachu"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Refiner (SDXL or SD 1.5)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_model: Option<String>,
    /// Use 0.4 for SD1.5 realistic models; 0.667 for SD1.5 anime models
    /// 0.8 for XL-refiners; or any value for switching two SDXL models.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_switch: Option<f64>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 176400
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The sharpness of the generated image. Use it to control how sharp the generated
    /// image should be. Higher value means image and texture are sharper.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpness: Option<f64>,
    /// The style to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub styles: Option<Vec<Option<String>>>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// The image to upscale or vary.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uov_image_url: Option<String>,
    /// The method to use for upscaling or varying.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uov_method: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FooocusInpaintInput {
    /// The size of the generated image. You can choose between some presets or
    /// custom height and width that **must be multiples of 8**.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// If set to false, the safety checker will be disabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_1: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_2: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_3: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_4: Option<ImagePrompt>,
    /// Describe what you want to inpaint.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_additional_prompt: Option<String>,
    /// If set to true, the initial preprocessing will be disabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_disable_initial_latent: Option<bool>,
    /// Version of Fooocus inpaint model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_engine: Option<String>,
    /// Positive value will make white area in the mask larger, negative value will
    /// make white area smaller. (default is 0, always process before any mask
    /// invert)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_erode_or_dilate: Option<f64>,
    /// The image to use as a reference for inpainting.
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png"
    pub inpaint_image_url: String,
    /// The mode to use for inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_mode: Option<String>,
    /// The area to inpaint. Value 0 is same as "Only Masked" in A1111. Value 1 is
    /// same as "Whole Image" in A1111. Only used in inpaint, not used in outpaint.
    /// (Outpaint always use 1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_respective_field: Option<f64>,
    /// Same as the denoising strength in A1111 inpaint. Only used in inpaint, not
    /// used in outpaint. (Outpaint always use 1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_strength: Option<f64>,
    /// If set to true, the mask will be inverted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invert_mask: Option<bool>,
    /// The LoRAs to use for the image generation. You can use up to 5 LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The image to use as a mask for the generated image.
    /// "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo_mask.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    /// Mixing Image Prompt and Inpaint
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mixing_image_prompt_and_inpaint: Option<bool>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate in one request
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The directions to outpaint.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outpaint_selections: Option<Vec<Option<String>>>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// If set to true, the advanced inpaint options ('inpaint_disable_initial_latent',
    /// 'inpaint_engine', 'inpaint_strength', 'inpaint_respective_field',
    /// 'inpaint_erode_or_dilate') will be overridden.
    /// Otherwise, the default values will be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub override_inpaint_options: Option<bool>,
    /// You can choose Speed or Quality
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "a cat on a bench, realistic, highly detailed, 8k"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Refiner (SDXL or SD 1.5)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_model: Option<String>,
    /// Use 0.4 for SD1.5 realistic models; 0.667 for SD1.5 anime models
    /// 0.8 for XL-refiners; or any value for switching two SDXL models.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_switch: Option<f64>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 176400
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The sharpness of the generated image. Use it to control how sharp the generated
    /// image should be. Higher value means image and texture are sharper.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpness: Option<f64>,
    /// The style to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub styles: Option<Vec<Option<String>>>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FooocusLegacyInput {
    /// The size of the generated image. You can choose between some presets or
    /// custom height and width that **must be multiples of 8**.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The stop at value of the control image. Use it to control how much the generated image
    /// should look like the control image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_image_stop_at: Option<f64>,
    /// The image to use as a reference for the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_image_url: Option<String>,
    /// The strength of the control image. Use it to control how much the generated image
    /// should look like the control image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_image_weight: Option<f64>,
    /// The type of image control
    /// "ImagePrompt"
    /// "PyraCanny"
    /// "CPDS"
    /// "FaceSwap"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_type: Option<String>,
    /// If set to false, the safety checker will be disabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The image to use as a reference for inpainting.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inpaint_image_url: Option<String>,
    /// The LoRAs to use for the image generation. You can use up to 5 LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The image to use as a mask for the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mixing_image_prompt_and_inpaint: Option<bool>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate in one request
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// You can choose Speed or Quality
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "an astronaut in the jungle, cold color palette with butterflies in the background, highly detailed, 8k"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Refiner (SDXL or SD 1.5)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_model: Option<String>,
    /// Use 0.4 for SD1.5 realistic models; 0.667 for SD1.5 anime models
    /// 0.8 for XL-refiners; or any value for switching two SDXL models.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_switch: Option<f64>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 176400
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The sharpness of the generated image. Use it to control how sharp the generated
    /// image should be. Higher value means image and texture are sharper.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpness: Option<f64>,
    /// The style to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub styles: Option<Vec<Option<String>>>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FooocusOutput {
    /// Whether the generated images contain NSFW concepts.
    pub has_nsfw_concepts: Vec<bool>,
    /// The generated image file info.
    pub images: Vec<Image>,
    /// The time taken for the generation process.
    pub timings: Timings,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FooocusUpscaleOrVaryInput {
    /// The size of the generated image. You can choose between some presets or
    /// custom height and width that **must be multiples of 8**.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// If set to false, the safety checker will be disabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_1: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_2: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_3: Option<ImagePrompt>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_prompt_4: Option<ImagePrompt>,
    /// The LoRAs to use for the image generation. You can use up to 5 LoRAs
    /// and they will be merged together to generate the final image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// Mixing Image Prompt and Vary/Upscale
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mixing_image_prompt_and_vary_upscale: Option<bool>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    /// "(worst quality, low quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed, grayscale, bw, bad photo, bad photography, bad art:1.4), (watermark, signature, text font, username, error, logo, words, letters, digits, autograph, trademark, name:1.2), (blur, blurry, grainy), morbid, ugly, asymmetrical, mutated malformed, mutilated, poorly lit, bad shadow, draft, cropped, out of frame, cut off, censored, jpeg artifacts, out of focus, glitch, duplicate, (airbrushed, cartoon, anime, semi-realistic, cgi, render, blender, digital art, manga, amateur:1.3), (3D ,3D Game, 3D Game Scene, 3D Character:1.1), (bad hands, bad anatomy, bad body, bad face, bad teeth, bad arms, bad legs, deformities:1.3)"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of images to generate in one request
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_images: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// You can choose Speed or Quality
    #[serde(skip_serializing_if = "Option::is_none")]
    pub performance: Option<String>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "a basket of various fruits, bokeh, realistic, masterpiece"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// Refiner (SDXL or SD 1.5)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_model: Option<String>,
    /// Use 0.4 for SD1.5 realistic models; 0.667 for SD1.5 anime models
    /// 0.8 for XL-refiners; or any value for switching two SDXL models.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refiner_switch: Option<f64>,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 176400
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The sharpness of the generated image. Use it to control how sharp the generated
    /// image should be. Higher value means image and texture are sharper.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sharpness: Option<f64>,
    /// The style to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub styles: Option<Vec<Option<String>>>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
    /// The image to upscale or vary.
    /// "https://storage.googleapis.com/falserverless/model_tests/fooocus/fruit_basket.jpeg"
    pub uov_image_url: String,
    /// The method to use for upscaling or varying.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uov_method: Option<String>,
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
pub struct ImagePrompt {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop_at: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LoraWeight {
    /// URL or the path to the LoRA weights.
    /// "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_offset_example-lora_1.0.safetensors"
    pub path: String,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// Fooocus
///
/// Category: text-to-image
/// Machine Type: A100
pub fn upscale_or_vary(
    params: FooocusUpscaleOrVaryInput,
) -> FalRequest<FooocusUpscaleOrVaryInput, FooocusOutput> {
    FalRequest::new("fal-ai/fooocus/upscale-or-vary", params)
}
