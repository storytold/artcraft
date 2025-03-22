#[cfg(not(target_os = "macos"))]
use ml_models::ml::flux::flux_pipeline::{flux_pipeline, FluxPipelineArgs, FluxModel};

use crate::state::app_config::AppConfig;
use crate::state::app_dir::AppDataRoot;
use crate::stubs::model_cache::ModelCache;
use crate::stubs::prompt_cache::PromptCache;
use crate::utils::image::encode_dynamic_image_base64_png::encode_dynamic_image_base64_png;
use image::imageops::FilterType;
use image::{DynamicImage, ImageReader, RgbImage};
use log::{error, info};
use ml_weights_registry::weights_registry::weights::{CLIP_JSON, LYKON_DEAMSHAPER_7_VAE, SDXL_TURBO_CLIP_TEXT_ENCODER, SIMIANLUO_LCM_DREAMSHAPER_V7_UNET};

use once_cell::sync::Lazy;
use std::io::Cursor;
use tauri::{AppHandle, State};

const RANDOM_SEED: u32 = 42;

const STRENGTH: f64 = 100.0;
const PNG_BYTES : &[u8] = include_bytes!("../../binary_includes/1024.png");

// NB: We're just hacking a temporary "text to image" test endpoint leveraging the existing image to image modality.
static IMAGE : Lazy<DynamicImage> = Lazy::new(||{
  ImageReader::new(Cursor::new(PNG_BYTES))
    .with_guessed_format()
    .expect("failed to detect png format")
    .decode()
    .expect("failed to decode image")
});

#[tauri::command]
pub async fn text_to_image(
  prompt: String,
  model_config: State<'_, AppConfig>,
  model_cache: State<'_, ModelCache>,
  prompt_cache: State<'_, PromptCache>,
  app_data_root: State<'_, AppDataRoot>,
  app: AppHandle,
) -> Result<String, String> {
  info!("text_to_image endpoint called.");

  let mut image = IMAGE.resize(512, 512, FilterType::CatmullRom);

  #[cfg(not(target_os = "macos"))]
  {
    let result = text_to_image_impl(
      &prompt,
      image,
      Some(STRENGTH),
      &model_config,
      &model_cache,
      prompt_cache,
      app,
      &app_data_root
    ).await;

    image = match result {
      Ok(img) => DynamicImage::ImageRgb8(img),
      Err(err) => {
        error!("There was an error generating the image: {:?}", err);
        return Err(format!("There was an error generating the image: {}", err));
      }
    };
  }

  let bytes = encode_dynamic_image_base64_png(image)
    .map_err(|err| format!("failure to encode image: {:?}", err))?;

  info!("Inference successful; image converted to base64, serving back to browser...");

  Ok(bytes)
}

#[cfg(not(target_os = "macos"))]
async fn text_to_image_impl(
  prompt: &str,
  image: DynamicImage,
  strength: Option<f64>,
  config: &AppConfig,
  model_cache: &ModelCache,
  prompt_cache: State<'_, PromptCache>,
  app: AppHandle,
  app_data_root: &AppDataRoot,
) -> Result<RgbImage, String> {
  
  let args = FluxPipelineArgs {
    image: &image,
    prompt: prompt.to_string(),
    model_cache,
    prompt_cache: &prompt_cache,
    app: &app,
    flux_model: FluxModel::Schnell,
    active_blocks: None,
    use_cuda_stream: Some(true),
    prefetch_next_batch: Some(false),
    use_full_gpu: Some(true),
    img2img_strength: strength,
    seed: None,
    use_quantized_model: Some(true),
    model_config: &config.model_config,
  };

  let image = flux_pipeline(args)
    .map_err(|err| format!("failure to encode image: {:?}", err))?;

  Ok(image)
}
