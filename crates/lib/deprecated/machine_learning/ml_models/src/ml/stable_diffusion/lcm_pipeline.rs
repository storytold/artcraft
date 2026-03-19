use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use anyhow::{anyhow, Error as E, Result};
use candle_core::{DType, Device, IndexOp, Tensor, D};
use candle_nn::VarBuilder;
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use candle_transformers::models::stable_diffusion::lcm::{LCMScheduler, LCMSchedulerConfig};
use candle_transformers::models::stable_diffusion::unet_2d::BlockConfig;
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModel;
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModelConfig;
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::model_cache::ModelCache;
use crate::ml::model_config::ModelConfig;
use crate::ml::model_file::{ModelFile, StableDiffusionVersion};
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::get_vae_scale::get_vae_scale;
use crate::ml::stable_diffusion::infer_clip_text_embeddings::{infer_clip_text_embeddings, ClipArgs};
use crate::ml::stable_diffusion::remap_lcm_strength_range::remap_lcm_strength_range;
use image::DynamicImage;
use log::{debug, error, info};
use ml_weights_registry::weights_registry::weights::{LYKON_DEAMSHAPER_7_TEXT_ENCODER_FP16, LYKON_DEAMSHAPER_7_VAE, SIMIANLUO_LCM_DREAMSHAPER_V7_UNET};
use rand::Rng;

const DEFAULT_STRENGTH : f64 = 75.0;

const DEFAULT_SEED : u64 = 42;

pub struct Args<'a, P1: AsRef<Path>, P2: AsRef<Path>, P3: AsRef<Path>, P4: AsRef<Path>> {
  pub image: &'a DynamicImage,
  pub prompt: String,
  pub uncond_prompt: String,
  pub cfg_scale: Option<f64>,
  pub img2img_strength: Option<f64>,
  pub model_cache: &'a ModelCache,
  pub prompt_cache: &'a PromptCache,
  pub use_flash_attn: bool,
  pub model_config: &'a ModelConfig,
  pub maybe_seed: Option<u64>,
  pub scheduler_steps: usize,
  pub vae_path: P1,
  pub unet_path: P2,
  pub clip_json_path: P3,
  pub clip_weights_path: P4,
}

pub fn lcm_pipeline<P1, P2, P3, P4>(args: Args<'_, P1, P2, P3, P4>) -> Result<RgbImage> 
  where P1: AsRef<Path>, P2: AsRef<Path>, P3: AsRef<Path>, P4: AsRef<Path>
{
  let Args { 
    prompt, 
    uncond_prompt, 
    cfg_scale,
    img2img_strength, 
    model_cache, 
    prompt_cache, 
    image, 
    use_flash_attn ,
    model_config: ModelConfig {
      device,
      dtype,
      sd_version,
      sd_config,
      hf_api,
    },
    maybe_seed,
    scheduler_steps,
    vae_path,
    unet_path,
    clip_json_path,
    clip_weights_path,
  } = args;
  
  let dtype = *dtype;
  let sd_version = *sd_version;

  let img2img_strength = img2img_strength
    .map(|s| remap_lcm_strength_range(s))
    .unwrap_or(DEFAULT_STRENGTH);
  
  let img2img_strength = img2img_strength / 100.0;

  let use_f16 = true;

  // Use LCM Scheduler instead of Euler Ancestral for better speed and quality
  let mut scheduler = LCMScheduler::new(scheduler_steps, img2img_strength, LCMSchedulerConfig::default())?;

  //let seed = maybe_seed.unwrap_or_else(|| rand::thread_rng().gen());
  let seed = maybe_seed.unwrap_or(DEFAULT_SEED);

  device.set_seed(seed)?;

  let guidance_scale = match cfg_scale {
    Some(guidance_scale) => guidance_scale,
    None => match sd_version {
      StableDiffusionVersion::V1_5 | StableDiffusionVersion::V2_1 | StableDiffusionVersion::Xl => 7.5,
      StableDiffusionVersion::Turbo => 0.,
      _ => 0., // NB: Not sure what the other model families should use, so sticking with "0"
    },
  };

  // let use_guide_scale = guidance_scale > 1.0;
  let use_guide_scale = false;

  let maybe_cached = prompt_cache.get_copy(&prompt)?;

  let mut text_embeddings = if let Some(tensor) = maybe_cached {
    tensor
  } else {
    info!("Prompt is NOT cached! Calculating embedding...");
    let tensor = infer_clip_text_embeddings(ClipArgs {
      prompt: & prompt,
      uncond_prompt: &uncond_prompt,
      tokenizer: None, // tokenizer
      clip_weights: None,
      clip2_weights: None, // clip2_weights
      sd_version,
      sd_config: &sd_config,
      use_f16, // use_f16
      device,
      dtype,
      use_guide_scale,
      clip_json_path,
      clip_weights_path,
    })?;

    prompt_cache.store_copy(&prompt, &tensor)?;
    tensor
  };

  debug!("Text embeddings shape: {:?}", text_embeddings.shape());

  debug!("Loading input image into tensor...");

  let input_image = dynamic_image_to_tensor(image, &device, dtype)?;

  debug!("Reference image shape: {:?}", input_image.shape());

  let vae_scale = get_vae_scale(sd_version);

  let maybe_vae = model_cache.get_vae()?;

  let vae = match maybe_vae {
    Some(vae) => vae,
    None => {
      info!("Building VAE model from file {:?}...", vae_path.as_ref());
      
      let vae = sd_config.build_vae(vae_path, &device, dtype)?;

      let vae = Arc::new(vae);

      model_cache.set_vae(vae.clone())?;

      vae
    }
  };

  let maybe_unet = model_cache.get_unet()?;

  let unet = match maybe_unet {
    Some(unet) => unet,
    None => {
      info!("Building UNET model from file {:?}...", unet_path.as_ref());

      let in_channels = match sd_version {
        StableDiffusionVersion::XlInpaint | StableDiffusionVersion::V2Inpaint | StableDiffusionVersion::V1_5Inpaint => 9,
        _ => 4,
      };

      // For LCM models, ensure that:
      // 1. We're using the correct prediction type (epsilon)
      // 2. The cross-attention dimension is correct (768 for Dreamshaper)
      // 3. The in_channels matches the expected input (4 for standard, 9 for inpainting)
      let unet_config = UNet2DConditionModelConfig {
        // LCM specific config values
        cross_attention_dim: 768,      // Dreamshaper v7 uses 768
        time_cond_proj_dim: Some(256), // LCM models use 256-dimensional guidance embeddings
        // Rest of configuration...
        center_input_sample: false,
        flip_sin_to_cos: true,
        freq_shift: 0.0,
        blocks: vec![
          BlockConfig { out_channels: 320, use_cross_attn: Some(1), attention_head_dim: 8 },
          BlockConfig { out_channels: 640, use_cross_attn: Some(1), attention_head_dim: 8 },
          BlockConfig { out_channels: 1280, use_cross_attn: Some(1), attention_head_dim: 8 },
          BlockConfig { out_channels: 1280, use_cross_attn: None, attention_head_dim: 8 }
        ],
        layers_per_block: 2,
        downsample_padding: 1,
        mid_block_scale_factor: 1.0,
        norm_num_groups: 32,
        norm_eps: 1e-5,
        sliced_attention_size: None,
        use_linear_projection: false,
        time_embed_dim: Some(1280),
        // time_embed_dim: Some(256),
      };

      // Load the model directly from the safetensors file
      let vs_unet = unsafe { VarBuilder::from_mmaped_safetensors(&[unet_path], dtype, &device)? };

      let unet = UNet2DConditionModel::new(vs_unet, in_channels, 4, use_flash_attn, unet_config)?;

      let unet = Arc::new(unet);

      model_cache.set_unet(unet.clone())?;

      unet
    },
  };

  let init_latent_dist: DiagonalGaussianDistribution = vae.encode(&input_image)?;

  // Create LCM guidance scale embeddings
  let embedding_dim = 1280;
  let guidance_scale_embedding = scheduler.get_guidance_scale_embedding(guidance_scale, embedding_dim, &device, dtype)?;

  // Generate latents from input image using the LCM approach
  debug!("Generating latents from input image...");
  let init_latents = (init_latent_dist.sample()? * vae_scale)?;

  debug!("Initial latents shape: {:?}", init_latents.shape());

  // Calculate timesteps for LCM with proper img2img handling
  let timesteps = LCMScheduler::get_timesteps_for_steps(scheduler_steps, img2img_strength);
  let t_start = timesteps[0]; // First denoising step

  // Add noise at the appropriate timestep for img2img
  debug!("Adding noise to latents for t_start={}", t_start);
  let noise = init_latents.randn_like(0f64, 1f64)?;
  let latents = scheduler.add_noise(&init_latents, noise, t_start)?;

  let mut latents = latents;
  let timesteps: Vec<_> = scheduler.timesteps().iter().copied().collect();

  for (timestep_index, &timestep) in timesteps.iter().enumerate() {
    info!("Processing step {}/{} @ timestamp = {}", timestep_index + 1, timesteps.len(), timestep);

    let latent_model_input = if use_guide_scale { Tensor::cat(&[&latents, &latents], 0)? } else { latents.clone() };

    let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep);

    // Use the guidance scale embedding in the UNet inference with the proper method name
    let mut noise_pred = match unet.forward_with_guidance(&latent_model_input, timestep as f64, &text_embeddings, Some(&guidance_scale_embedding)) {
      Ok(pred) => pred,
      Err(e) => {
        error!("UNet inference failed with error: {}", e);
        return Err(anyhow::anyhow!("UNet inference failed: {}", e));
      },
    };

    if use_guide_scale {
      let chunks = noise_pred.chunk(2, 0)?;
      let (noise_pred_uncond, noise_pred_text) = (&chunks[0], &chunks[1]);
      noise_pred = (noise_pred_uncond + (guidance_scale * (noise_pred_text - noise_pred_uncond)?)?)?;
    }

    // Apply the LCM scheduler step
    latents = scheduler.step(&noise_pred, timestep, &latents, timestep_index, scheduler_steps)?;
  }

  debug!("Diffusion process completed, decoding image...");
  let image = vae.decode(&(latents / vae_scale)?)?;

  debug!("Scaling image back");
  let image = ((image / 2.)? + 0.5)?;

  debug!("Normalized image values");
  let image = (image.clamp(0f32, 1.)? * 255.)?;

  debug!("Convert to int8");
  let image = image.to_dtype(DType::U8)?;

  debug!("Converted to 8-bit format");

  let image = tensor_to_image_buffer(&image.i(0)?)?;

  Ok(image)
}
