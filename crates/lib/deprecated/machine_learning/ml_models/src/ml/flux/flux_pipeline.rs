use std::path::Path;
use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::model_cache::ModelCache;
use crate::ml::prompt_cache::PromptCache;
use candle_nn::VarBuilder;
use crate::ml::model_config::ModelConfig;
use anyhow::{anyhow, Error as E, Result};
use candle_core::{DType, IndexOp, Tensor, D, Device, Module};
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
use candle_transformers::models::stable_diffusion::lcm::LCMScheduler;
use image::DynamicImage;
use log::{debug, info};
use rand::Rng;
use tauri::{AppHandle, Emitter};
use candle_transformers::models::{clip, t5, flux};
use tokenizers::Tokenizer;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FluxModel {
  Schnell,
  Dev,
}

pub struct FluxPipelineArgs<'a> {
  pub image: &'a DynamicImage,
  pub prompt: String,
  pub model_cache: &'a ModelCache,
  pub prompt_cache: &'a PromptCache,
  pub app: &'a AppHandle,
  pub flux_model: FluxModel,
  pub active_blocks: Option<usize>,
  pub use_cuda_stream: Option<bool>,
  pub prefetch_next_batch: Option<bool>,
  pub use_full_gpu: Option<bool>,
  pub img2img_strength: Option<f64>,
  pub seed: Option<u64>,
  pub use_quantized_model: Option<bool>,
  pub model_config: &'a ModelConfig,
  pub flux_dev_or_schnell_path: &'a Path,
  pub flux_schnell_quantized_gguf: &'a Path,
  pub flux_autoencoder_path: &'a Path,
  pub google_t5_model_path: &'a Path,
  pub google_t5_config_path: &'a Path,
  pub lmz_t5_tokenizer_path: &'a Path,
  pub openai_clip_model_path: &'a Path,
  pub openai_clip_tokenizer_json_path: &'a Path,
}

pub fn flux_pipeline(args: FluxPipelineArgs<'_>) -> Result<RgbImage> {
  let FluxPipelineArgs { 
    prompt, 
    model_cache, 
    prompt_cache, 
    app, 
    image, 
    flux_model, 
    active_blocks, 
    use_cuda_stream, 
    prefetch_next_batch, 
    use_full_gpu, 
    img2img_strength, 
    seed, 
    use_quantized_model, 
    model_config ,
    flux_dev_or_schnell_path,
    flux_schnell_quantized_gguf,
    flux_autoencoder_path,
    google_t5_model_path,
    google_t5_config_path,
    lmz_t5_tokenizer_path,
    openai_clip_model_path,
    openai_clip_tokenizer_json_path,
  } = args;

  if use_quantized_model.unwrap_or(false) {
    #[cfg(feature = "cuda")]
    candle_core::quantized::cuda::set_force_dmmv(false);
  }

  let height = 1024;
  let width = 1024;

  let quantized = use_quantized_model.unwrap_or(false);
  let device = model_config.device.clone();
  let dtype = device.bf16_default_to_f32();

  info!("Starting image generation with FLUX model:");
  info!("  Model: {:?}", flux_model);
  info!("  Prompt: {}", prompt);
  info!("  Dimensions: {}x{}", width, height);
  info!("  Device: {:?}", model_config.device);

  let seed_value = seed.unwrap_or_else(|| rand::thread_rng().gen());
  device.set_seed(seed_value)?;
  
  info!("Using seed: {}", seed_value);

  // Setup FLUX model configuration
  let flux_config = match flux_model {
    FluxModel::Dev => flux::model::Config::dev(),
    FluxModel::Schnell => flux::model::Config::schnell(),
  };

  // Get T5 embeddings
  let t5_emb = {
    info!("Generating T5 embeddings for prompt...");
    let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[google_t5_model_path], dtype , &device)? };
    let config = std::fs::read_to_string(google_t5_config_path)?;
    let config: t5::Config = serde_json::from_str(&config)?;

    let mut model = t5::T5EncoderModel::load(vb, &config)?;
    let tokenizer = Tokenizer::from_file(lmz_t5_tokenizer_path).map_err(E::msg)?;

    let mut tokens = tokenizer.encode(prompt.as_str(), true).map_err(E::msg)?.get_ids().to_vec();
    tokens.resize(256, 0);
    let input_token_ids = Tensor::new(&tokens[..], &device)?.unsqueeze(0)?;

    model.forward(&input_token_ids)?
  };
  
  info!("T5 embeddings generated");

  // Get CLIP embeddings
  let clip_emb = {
    info!("Generating CLIP embeddings for prompt...");
    let vb =
        unsafe { VarBuilder::from_mmaped_safetensors(&[openai_clip_model_path], dtype, &device)? };
    // https://huggingface.co/openai/clip-vit-large-patch14/blob/main/config.json
    let config = clip::text_model::ClipTextConfig {
        vocab_size: 49408,
        projection_dim: 768,
        activation: clip::text_model::Activation::QuickGelu,
        intermediate_size: 3072,
        embed_dim: 768,
        max_position_embeddings: 77,
        pad_with: None,
        num_hidden_layers: 12,
        num_attention_heads: 12,
    };
    let model =
        clip::text_model::ClipTextTransformer::new(vb.pp("text_model"), &config)?;
    let tokenizer = Tokenizer::from_file(openai_clip_tokenizer_json_path).map_err(E::msg)?;
    let tokens = tokenizer
        .encode(prompt.as_str(), true)
        .map_err(E::msg)?
        .get_ids()
        .to_vec();
    let input_token_ids = Tensor::new(&tokens[..], &device)?.unsqueeze(0)?;
    model.forward(&input_token_ids)?
  };
  info!("CLIP embeddings generated");

  // Process input image to tensor
  info!("Converting input image to tensor...");
  let img_tensor = dynamic_image_to_tensor(image, &device, dtype)?;
  info!("Image tensor shape: {:?}", img_tensor.shape());

  // Create initial noise - this is important to match the expected format
  info!("Generating initial noise for FLUX...");
  let initial_tensor = flux::sampling::get_noise(1, height, width, &device)?.to_dtype(dtype)?;
  info!("Initial tensor shape: {:?}", initial_tensor.shape());
  
  // Blend initial noise with input image if img2img_strength is specified
  let initial_tensor = if let Some(strength) = img2img_strength {
    if strength > 0.0 && strength < 1.0 {
      info!("Using img2img with strength: {}", strength);
      // Reshape the input tensor to match the noise tensor dimensions
      let adjusted_img = if img_tensor.shape() != initial_tensor.shape() {
        info!("Reshaping input image to match noise dimensions...");
        // You may need more complex reshaping logic here depending on your use case
        let (_, c, h, w) = initial_tensor.dims4()?;
        img_tensor.upsample_nearest2d(h, w)?
      } else {
        img_tensor
      };
      
      // Blend the noise and the image according to strength
      let strength_tensor = Tensor::new(strength as f32, &device)?;
      let inverse_strength = Tensor::new(1.0 - strength as f32, &device)?;
      let weighted_noise = (&initial_tensor * &strength_tensor)?;
      let weighted_img = (&adjusted_img * &inverse_strength)?;
      (&weighted_noise + &weighted_img)?
    } else {
      initial_tensor
    }
  } else {
    initial_tensor
  };
  info!("Final initial tensor shape: {:?}", initial_tensor.shape());

  // Create FLUX state
  info!("Creating FLUX state...");
  let state = if quantized {
    flux::sampling::State::new(
        &t5_emb.to_dtype(DType::F32)?,
        &clip_emb.to_dtype(DType::F32)?,
        &initial_tensor.to_dtype(DType::F32)?,
    )?
  } else {
    flux::sampling::State::new(&t5_emb, &clip_emb, &initial_tensor)?
  };
  info!("{state:?}");

  // Set appropriate timesteps based on model
  let timesteps = match flux_model {
    FluxModel::Dev => flux::sampling::get_schedule(28, Some((state.img.dim(1)?, 0.5, 1.15))),
    FluxModel::Schnell => flux::sampling::get_schedule(4, None),
  };

  info!("Starting FLUX denoising with timesteps: {:?}", timesteps);

  // Actual model loading and inference
  let img_latent = if quantized {
    // Quantized model path
    info!("Loading quantized FLUX model...");
    let model_file = match flux_model {
      FluxModel::Schnell => flux_schnell_quantized_gguf,
      FluxModel::Dev => return Err(anyhow!("Quantized model not available for FLUX.1-dev")),
    };

    info!("Loading quantized model from {}", model_file.to_str().unwrap());

    let vb = candle_transformers::quantized_var_builder::VarBuilder::from_gguf(model_file, &device)?;
    let mut model = flux::quantized_model::Flux::new(&flux_config, vb)?;
    info!("Quantized model loaded on {:?}", device);

    // Run denoising
    info!("Running denoising...");
    let img_latent = flux::sampling::denoise(&mut model, &state.img, &state.img_ids, &state.txt, &state.txt_ids, &state.vec, &timesteps, 4.)?.to_dtype(dtype)?;
    info!("Denoising completed");
    img_latent
  } else {
    // Full precision model
    info!("Loading FLUX model...");

    let mut model = if use_full_gpu.unwrap_or(false) {
      // Load entire model on GPU
      info!("Loading entire model directly to GPU...");
      let gpu_vb = unsafe { VarBuilder::from_mmaped_safetensors(&[flux_dev_or_schnell_path], dtype, &device)? };
      let mut model = flux::model::Flux::new(&flux_config, gpu_vb)?;
      model.set_use_device_management(false);
      model
    } else {
      // Use memory-efficient approach with blocks on CPU
      info!("Using memory-efficient approach with blocks on CPU...");
      let cpu_device = candle_core::Device::Cpu;
      let cpu_vb = unsafe { VarBuilder::from_mmaped_safetensors(&[flux_dev_or_schnell_path], dtype, &cpu_device)? };
      let mut model = flux::model::Flux::new_with_gpu_core(&flux_config, cpu_vb, &device)?;

      // Set active blocks
      let active_blocks_count = active_blocks.unwrap_or(1);
      model.set_max_active_blocks(active_blocks_count);
      info!("Using {} active blocks on GPU", active_blocks_count);

      // Enable prefetching if requested
      if prefetch_next_batch.unwrap_or(false) {
        model.set_prefetch_next_batch(true);
        info!("Prefetching enabled - will overlap transfers with computation");
      }

      model
    };

    // Run denoising
    flux::sampling::denoise(&mut model, &state.img, &state.img_ids, &state.txt, &state.txt_ids, &state.vec, &timesteps, 4.)?
  };

  info!("FLUX denoising completed, unpacking latent image...");
  let img_unpacked = flux::sampling::unpack(&img_latent, height, width)?;

  // Load autoencoder for final decoding
  info!("Loading autoencoder for final decoding...");
  
  let ae_config = match flux_model {
    FluxModel::Dev => flux::autoencoder::Config::dev(),
    FluxModel::Schnell => flux::autoencoder::Config::schnell(),
  };

  let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[flux_autoencoder_path], dtype, &device)? };
  let ae_model = flux::autoencoder::AutoEncoder::new(&ae_config, vb)?;

  info!("Decoding final image...");
  let img = ae_model.decode(&img_unpacked)?;

  // Convert tensor to image
  info!("Converting tensor to image...");
  let img = ((img.clamp(-1f32, 1f32)? + 1.0)? * 127.5)?.to_dtype(candle_core::DType::U8)?;

  // Convert to RGB image
  let image = tensor_to_image_buffer(&img.i(0)?)?;

  info!("FLUX pipeline completed successfully");
  Ok(image)
}
