use std::path::Path;
use std::sync::{Arc, RwLock, RwLockReadGuard, RwLockWriteGuard};

use crate::ml::image::dynamic_image_to_tensor::dynamic_image_to_tensor;
use crate::ml::image::tensor_to_image_buffer::{tensor_to_image_buffer, RgbImage};
use crate::ml::model_cache::ModelCache;
use crate::ml::model_file::StableDiffusionVersion;
use crate::ml::prompt_cache::PromptCache;
use crate::ml::stable_diffusion::get_vae_scale::get_vae_scale;
use crate::ml::stable_diffusion::infer_clip_text_embeddings::{infer_clip_text_embeddings, ClipArgs};
use anyhow::{anyhow, Error as E, Result};
use candle_core::{DType, Device, IndexOp, Tensor, D};
use candle_transformers::models::stable_diffusion::vae::{AutoEncoderKL, DiagonalGaussianDistribution};
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use image::DynamicImage;
use log::info;
use rand::Rng;

pub struct Args<'a, P: AsRef<Path>, Q: AsRef<Path>, R: AsRef<Path>, S: AsRef<Path>> {
    pub image: &'a DynamicImage,
    pub prompt: String,
    pub uncond_prompt: String,
    pub cfg_scale: Option<f64>,
    pub i2i_strength: Option<u8>,
    pub model_cache: &'a ModelCache,
    pub prompt_cache: &'a PromptCache,
    pub sd_version: StableDiffusionVersion,
    pub sd_config: StableDiffusionConfig,
    pub device: &'a Device,
    pub dtype: DType,
    pub maybe_seed: Option<u64>,
    pub scheduler_steps: usize,
    pub sdxl_turbo_vae_path: P,
    pub sdxl_turbo_unet_path: Q,
    pub clip_json_path: R,
    pub clip_weights_path: S,
}

pub fn stable_diffusion_pipeline<P1, P2, P3, P4>(args: Args<'_, P1, P2, P3, P4>) -> Result<RgbImage> 
  where P1: AsRef<Path>, P2: AsRef<Path>, P3: AsRef<Path>, P4: AsRef<Path>
{
    let Args { 
        prompt, 
        uncond_prompt, 
        cfg_scale, 
        i2i_strength, 
        model_cache, 
        prompt_cache, 
        image,
        sd_version,
        sd_config,
        device,
        dtype,
        maybe_seed,
        scheduler_steps,
        sdxl_turbo_vae_path,
        sdxl_turbo_unet_path,
        clip_json_path,
        clip_weights_path,
    } = args;
    
    // TODO(bt,2025-02-18): The scheduler is `EulerAncestralDiscreteScheduler`, but we may want to port an LCM scheduler.
    //  This is a target for performance improvement
    //  See: https://github.com/huggingface/candle/issues/1331
    let mut scheduler = sd_config.build_scheduler(scheduler_steps)?;

    let seed = maybe_seed.unwrap_or_else(|| rand::thread_rng().gen());
    
    device.set_seed(seed)?;

    info!("Using seed: {}", seed);

    let guidance_scale = match cfg_scale {
        Some(guidance_scale) => guidance_scale,
        None => match sd_version {
            StableDiffusionVersion::V1_5
            | StableDiffusionVersion::V2_1
            | StableDiffusionVersion::Xl => 7.5,
            StableDiffusionVersion::Turbo => 0.,
            _ => 0., // NB: Not sure what the other model families should use, so sticking with "0"
        },
    };

    let use_guide_scale = guidance_scale > 1.0;

    info!("Using guide scale: {}", use_guide_scale);

    info!("Checking if prompt is cached");
    let maybe_cached = prompt_cache.get_copy(&prompt)?;

    let mut text_embeddings = if let Some(tensor) = maybe_cached {
        tensor
    } else {
        
        info!("Prompt is NOT cached! Calculating embedding...");
        let tensor = infer_clip_text_embeddings(ClipArgs {
            prompt: &prompt,
            uncond_prompt: &uncond_prompt,
            tokenizer: None, // tokenizer
            clip_weights: None, // clip_weights
            clip2_weights: None, // clip2_weights
            sd_version: sd_version,
            sd_config: &sd_config,
            use_f16: false, // use_f16
            device: device,
            dtype: dtype,
            use_guide_scale,
            clip_json_path: clip_json_path.as_ref(),
            clip_weights_path: clip_weights_path.as_ref(),
        })?;
        prompt_cache.store_copy(&prompt, &tensor)?;
        tensor
    };

    println!("Text embeddings shape: {:?}", text_embeddings.shape());

    println!("Loading input image into tensor...");

    let input_image = dynamic_image_to_tensor(image, device, dtype)?;

    println!("Reference image shape: {:?}", input_image.shape());

    let vae_scale = get_vae_scale(sd_version);

    let maybe_vae = model_cache.get_vae()?;
    
    let vae = match maybe_vae {
        Some(vae) => vae,
        None => {
            info!("No vae found in cache; loading...");
            
            let vae_file = sdxl_turbo_vae_path.as_ref();
            
            let vae = sd_config.build_vae(vae_file, &device, dtype)?;

            let vae = Arc::new(vae);
            
            model_cache.set_vae(vae.clone())?;

            vae
        }
    };

    let maybe_unet = model_cache.get_unet()?;

    let unet = match maybe_unet {
        Some(unet) => unet,
        None => {
            info!("No unet found in cache; loading...");

            let unet_weights_file = sdxl_turbo_unet_path.as_ref();

            let unet = sd_config.build_unet(unet_weights_file, &device, 4, true, dtype)
              .map_err(|err| anyhow!("error initializing unet model: {:?}", err))?;

            let unet = Arc::new(unet);

            model_cache.set_unet(unet.clone())?;

            unet
        }
    };

    let init_latent_dist : DiagonalGaussianDistribution = vae.encode(&input_image)?;

    // TODO(bt,2025-02-18): This takes a little bit to generate the sample.
    //  This is a target for performance improvement
    println!("Generating latents from input image...");
    let latents = (init_latent_dist.sample()? * vae_scale)?;
    
    //.to_device(&configs.device)?;
    
    println!("Initial latents shape: {:?}", latents.shape());

    println!("Calculating start step for diffusion process...");

    let img2img_strength = match i2i_strength {
        None => 0.75f64,
        Some(strength) => (strength as f64) / 100.0f64,
    };

    let t_start = {
        let start = scheduler_steps - (scheduler_steps as f64 * img2img_strength) as usize;

        println!("Starting from step {} of {} (strength: {})", start, scheduler_steps, img2img_strength);
        start
    };

    let latents = if t_start < scheduler.timesteps().len() {
        println!("Adding noise to latents...");
        let noise = latents.randn_like(0f64, 1f64)?;
        scheduler.add_noise(&latents, noise, scheduler.timesteps()[t_start])?
    } else {
        println!("Using latents directly (no noise addition needed)");
        latents
    };

    println!("Latents initialized successfully");

    let timesteps: Vec<_> = scheduler.timesteps().iter().copied().collect();

    // Initial noise shape: [1, 4, 64, 64]
    println!("Initial noise shape: {:?}", latents.shape());

    println!("Starting diffusion process...");
    
    let mut latents = latents;

    for (timestep_index, &timestep) in timesteps.iter().enumerate() {
        if timestep_index < t_start {
            continue;
        }

        println!("Processing step {}/{} @ timestamp = {}", timestep_index + 1, timesteps.len(), timestep);

        let latent_model_input = if use_guide_scale {
            Tensor::cat(&[&latents, &latents], 0)?
        } else {
            latents.clone() // TODO(bt,2025-08-18): Do we have to clone the tensor? `scale_model_input` requires ownership
        };

        let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep)?;

        let mut noise_pred = match unet.forward(&latent_model_input, timestep as f64, &text_embeddings) {
            Ok(pred) => pred,
            Err(e) => {
                println!("UNet inference failed with error: {}", e);
                return Err(anyhow::anyhow!("UNet inference failed: {}", e));
            },
        };

        if use_guide_scale {
            let chunks = noise_pred.chunk(2, 0)?;
            let (noise_pred_uncond, noise_pred_text) = (&chunks[0], &chunks[1]);
            noise_pred = (noise_pred_uncond + (guidance_scale * (noise_pred_text - noise_pred_uncond)?)?)?;
        }

        latents = scheduler.step(&noise_pred, timestep, &latents)?;
    }

    println!("Diffusion process completed, decoding image...");
    let image = vae.decode(&(latents / vae_scale)?)?;
    
    println!("VAE decode completed");

    println!("Scaling image back");
    let image = ((image / 2.)? + 0.5)?;
    
    // TODO(bt,2025-08-18): This normalization is slow.
    //  This is a target for performance improvement
    println!("Normalized image values");
    let image = (image.clamp(0f32, 1.)? * 255.)?;

    println!("Convert to int8");
    let image = image.to_dtype(DType::U8)?;
    
    println!("Converted to 8-bit format");

    let image = tensor_to_image_buffer(&image.i(0)?)?;

    Ok(image)
}
