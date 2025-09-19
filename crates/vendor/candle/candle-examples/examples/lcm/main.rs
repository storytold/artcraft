#[cfg(feature = "accelerate")]
extern crate accelerate_src;

#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use candle_transformers::models::stable_diffusion;
use candle_transformers::models::stable_diffusion::lcm::LCMScheduler;
use std::ops::Div;

use anyhow::{Error as E, Result};
use candle::{DType, Device, IndexOp, Module, Tensor, D};
use clap::Parser;
use rand::Rng;
use stable_diffusion::vae::AutoEncoderKL;
use tokenizers::Tokenizer;
use candle_nn::VarBuilder;
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModel;
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModelConfig;
use candle_transformers::models::stable_diffusion::unet_2d::BlockConfig;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// The prompt to be used for image generation.
    #[arg(
        long,
        default_value = "A very realistic photo of a rusty robot walking on a sandy beach"
    )]
    prompt: String,

    #[arg(long, default_value = "")]
    uncond_prompt: String,

    /// Run on CPU rather than on GPU.
    #[arg(long)]
    cpu: bool,

    /// Enable tracing (generates a trace-timestamp.json file).
    #[arg(long)]
    tracing: bool,

    /// The height in pixels of the generated image.
    #[arg(long)]
    height: Option<usize>,

    /// The width in pixels of the generated image.
    #[arg(long)]
    width: Option<usize>,

    /// The UNet weight file, in .safetensors format.
    #[arg(long, value_name = "FILE")]
    unet_weights: Option<String>,

    /// The CLIP weight file, in .safetensors format.
    #[arg(long, value_name = "FILE")]
    clip_weights: Option<String>,

    /// The CLIP2 weight file, in .safetensors format.
    #[arg(long, value_name = "FILE")]
    clip2_weights: Option<String>,

    /// The VAE weight file, in .safetensors format.
    #[arg(long, value_name = "FILE")]
    vae_weights: Option<String>,

    #[arg(long, value_name = "FILE")]
    /// The file specifying the tokenizer to used for tokenization.
    tokenizer: Option<String>,

    /// The size of the sliced attention or 0 for automatic slicing (disabled by default)
    #[arg(long)]
    sliced_attention_size: Option<usize>,

    /// The number of inference steps to run.
    #[arg(long, default_value_t = 4)]
    n_steps: usize,

    /// The number of samples to generate iteratively.
    #[arg(long, default_value_t = 1)]
    num_samples: usize,

    /// The numbers of samples to generate simultaneously.
    #[arg[long, default_value_t = 1]]
    bsize: usize,

    /// The name of the final image to generate.
    #[arg(long, value_name = "FILE", default_value = "sd_final.png")]
    final_image: String,

    #[arg(long, value_enum, default_value = "v2-1")]
    sd_version: StableDiffusionVersion,

    /// Generate intermediary images at each step.
    #[arg(long, action)]
    intermediary_images: bool,

    #[arg(long)]
    use_flash_attn: bool,

    #[arg(long)]
    use_f16: bool,

    /// The guidance scale for classifier-free guidance.
    #[arg(long, default_value_t = 7.5)]
    guidance_scale: f64,

    /// Path to the mask image for inpainting.
    #[arg(long, value_name = "FILE")]
    mask_path: Option<String>,

    /// Path to the image used to initialize the latents. For inpainting, this is the image to be masked.
    #[arg(long, value_name = "FILE")]
    img2img: Option<String>,

    /// The strength parameter for img2img, between 0 and 1.
    #[arg(long, default_value_t = 0.7)]
    strength: f64,

    /// The seed to use when generating random samples.
    #[arg(long)]
    seed: Option<u64>,

    /// Force the saved image to update only the masked region
    #[arg(long)]
    only_update_masked: bool,
}

#[derive(Debug, Clone, Copy, clap::ValueEnum, PartialEq, Eq)]
enum StableDiffusionVersion {
    V1_5,
    V1_5Inpaint,
    V2_1,
    V2Inpaint,
    Xl,
    XlInpaint,
    Turbo,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ModelFile {
    Tokenizer,
    Tokenizer2,
    Clip,
    Clip2,
    Unet,
    UnetLcm,
    Vae,
}

impl StableDiffusionVersion {
    fn repo(&self) -> &'static str {
        match self {
            Self::XlInpaint => "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
            Self::Xl => "stabilityai/stable-diffusion-xl-base-1.0",
            Self::V2Inpaint => "stabilityai/stable-diffusion-2-inpainting",
            Self::V2_1 => "stabilityai/stable-diffusion-2-1",
            Self::V1_5 => "runwayml/stable-diffusion-v1-5",
            Self::V1_5Inpaint => "stable-diffusion-v1-5/stable-diffusion-inpainting",
            Self::Turbo => "stabilityai/sdxl-turbo",
        }
    }

    fn unet_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "unet/diffusion_pytorch_model.fp16.safetensors"
                } else {
                    "unet/diffusion_pytorch_model.safetensors"
                }
            }
        }
    }

    fn vae_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "vae/diffusion_pytorch_model.fp16.safetensors"
                } else {
                    "vae/diffusion_pytorch_model.safetensors"
                }
            }
        }
    }

    fn clip_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "text_encoder/model.fp16.safetensors"
                } else {
                    "text_encoder/model.safetensors"
                }
            }
        }
    }

    fn clip2_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "text_encoder_2/model.fp16.safetensors"
                } else {
                    "text_encoder_2/model.safetensors"
                }
            }
        }
    }
}

impl ModelFile {
    fn get(
        &self,
        filename: Option<String>,
        version: StableDiffusionVersion,
        use_f16: bool,
    ) -> Result<std::path::PathBuf> {
        use hf_hub::api::sync::Api;
        match filename {
            Some(filename) => Ok(std::path::PathBuf::from(filename)),
            None => {
                let (repo, path) = match self {
                    Self::Tokenizer => {
                        let tokenizer_repo = match version {
                            StableDiffusionVersion::V1_5
                            | StableDiffusionVersion::V2_1
                            | StableDiffusionVersion::V1_5Inpaint
                            | StableDiffusionVersion::V2Inpaint => "openai/clip-vit-base-patch32",
                            StableDiffusionVersion::Xl
                            | StableDiffusionVersion::XlInpaint
                            | StableDiffusionVersion::Turbo => {
                                // This seems similar to the patch32 version except some very small
                                // difference in the split regex.
                                "openai/clip-vit-large-patch14"
                            }
                        };
                        (tokenizer_repo, "tokenizer.json")
                    }
                    Self::Tokenizer2 => {
                        ("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k", "tokenizer.json")
                    }
                    Self::Clip => (version.repo(), version.clip_file(use_f16)),
                    Self::Clip2 => (version.repo(), version.clip2_file(use_f16)),
                    Self::UnetLcm => (
                        "SimianLuo/LCM_Dreamshaper_v7",
                        if use_f16 {
                            "unet/diffusion_pytorch_model.fp16.safetensors"
                        } else {
                            "unet/diffusion_pytorch_model.safetensors"
                        },
                    ),
                    Self::Unet => (version.repo(), version.unet_file(use_f16)),
                    Self::Vae => {
                        // Override for SDXL when using f16 weights.
                        // See https://github.com/huggingface/candle/issues/1060
                        if matches!(
                            version,
                            StableDiffusionVersion::Xl | StableDiffusionVersion::Turbo,
                        ) && use_f16
                        {
                            (
                                "madebyollin/sdxl-vae-fp16-fix",
                                "diffusion_pytorch_model.safetensors",
                            )
                        } else {
                            (version.repo(), version.vae_file(use_f16))
                        }
                    }
                };
                let filename = Api::new()?.model(repo.to_string()).get(path)?;
                Ok(filename)
            }
        }
    }
}

fn output_filename(
    basename: &str,
    sample_idx: usize,
    num_samples: usize,
    timestep_idx: Option<usize>,
) -> String {
    let filename = if num_samples > 1 {
        match basename.rsplit_once('.') {
            None => format!("{basename}.{sample_idx}.png"),
            Some((filename_no_extension, extension)) => {
                format!("{filename_no_extension}.{sample_idx}.{extension}")
            }
        }
    } else {
        basename.to_string()
    };
    match timestep_idx {
        None => filename,
        Some(timestep_idx) => match filename.rsplit_once('.') {
            None => format!("{filename}-{timestep_idx}.png"),
            Some((filename_no_extension, extension)) => {
                format!("{filename_no_extension}-{timestep_idx}.{extension}")
            }
        },
    }
}

#[allow(clippy::too_many_arguments)]
fn save_image(
    vae: &AutoEncoderKL,
    latents: &Tensor,
    vae_scale: f64,
    bsize: usize,
    idx: usize,
    final_image: &str,
    num_samples: usize,
    timestep_ids: Option<usize>,
) -> Result<()> {
    let images = vae.decode(&(latents / vae_scale)?)?;
    let images = ((images / 2.)? + 0.5)?.to_device(&Device::Cpu)?;
    let images = (images.clamp(0f32, 1.)? * 255.)?.to_dtype(DType::U8)?;
    for batch in 0..bsize {
        let image = images.i(batch)?;
        let image_filename = output_filename(
            final_image,
            (bsize * idx) + batch + 1,
            batch + num_samples,
            timestep_ids,
        );
        candle_examples::save_image(&image, image_filename)?;
    }
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn text_embeddings(
    prompt: &str,
    uncond_prompt: &str,
    tokenizer: Option<String>,
    clip_weights: Option<String>,
    clip2_weights: Option<String>,
    sd_version: StableDiffusionVersion,
    sd_config: &stable_diffusion::StableDiffusionConfig,
    use_f16: bool,
    device: &Device,
    dtype: DType,
    use_guide_scale: bool,
    first: bool,
) -> Result<Tensor> {
    let tokenizer_file = if first {
        ModelFile::Tokenizer
    } else {
        ModelFile::Tokenizer2
    };
    let tokenizer = tokenizer_file.get(tokenizer, sd_version, use_f16)?;
    let tokenizer = Tokenizer::from_file(tokenizer).map_err(E::msg)?;
    let pad_id = match &sd_config.clip.pad_with {
        Some(padding) => *tokenizer.get_vocab(true).get(padding.as_str()).unwrap(),
        None => *tokenizer.get_vocab(true).get("<|endoftext|>").unwrap(),
    };
    println!("Running with prompt \"{prompt}\".");
    let mut tokens = tokenizer
        .encode(prompt, true)
        .map_err(E::msg)?
        .get_ids()
        .to_vec();
    if tokens.len() > sd_config.clip.max_position_embeddings {
        anyhow::bail!(
            "the prompt is too long, {} > max-tokens ({})",
            tokens.len(),
            sd_config.clip.max_position_embeddings
        )
    }
    while tokens.len() < sd_config.clip.max_position_embeddings {
        tokens.push(pad_id)
    }
    let tokens = Tensor::new(tokens.as_slice(), device)?.unsqueeze(0)?;

    println!("Building the Clip transformer.");
    let clip_weights_file = if first {
        ModelFile::Clip
    } else {
        ModelFile::Clip2
    };
    let clip_weights = if first {
        clip_weights_file.get(clip_weights, sd_version, use_f16)?
    } else {
        clip_weights_file.get(clip2_weights, sd_version, use_f16)?
    };
    let clip_config = if first {
        &sd_config.clip
    } else {
        sd_config.clip2.as_ref().unwrap()
    };
    let text_model =
        stable_diffusion::build_clip_transformer(clip_config, clip_weights, device, DType::F32)?;
    let text_embeddings = text_model.forward(&tokens)?;

    let text_embeddings = if use_guide_scale {
        let mut uncond_tokens = tokenizer
            .encode(uncond_prompt, true)
            .map_err(E::msg)?
            .get_ids()
            .to_vec();
        if uncond_tokens.len() > sd_config.clip.max_position_embeddings {
            anyhow::bail!(
                "the negative prompt is too long, {} > max-tokens ({})",
                uncond_tokens.len(),
                sd_config.clip.max_position_embeddings
            )
        }
        while uncond_tokens.len() < sd_config.clip.max_position_embeddings {
            uncond_tokens.push(pad_id)
        }

        let uncond_tokens = Tensor::new(uncond_tokens.as_slice(), device)?.unsqueeze(0)?;
        let uncond_embeddings = text_model.forward(&uncond_tokens)?;

        Tensor::cat(&[uncond_embeddings, text_embeddings], 0)?.to_dtype(dtype)?
    } else {
        text_embeddings.to_dtype(dtype)?
    };
    Ok(text_embeddings)
}

fn image_preprocess<T: AsRef<std::path::Path>>(path: T) -> anyhow::Result<Tensor> {
    let img = image::ImageReader::open(path)?.decode()?;
    let (height, width) = (img.height() as usize, img.width() as usize);
    let height = height - height % 32;
    let width = width - width % 32;
    let img = img.resize_to_fill(
        width as u32,
        height as u32,
        image::imageops::FilterType::CatmullRom,
    );
    let img = img.to_rgb8();
    let img = img.into_raw();
    let img = Tensor::from_vec(img, (height, width, 3), &Device::Cpu)?
        .permute((2, 0, 1))?
        .to_dtype(DType::F32)?
        .affine(2. / 255., -1.)?
        .unsqueeze(0)?;
    Ok(img)
}

/// Convert the mask image to a single channel tensor. Also ensure the image is a multiple of 32 in both dimensions.
fn mask_preprocess<T: AsRef<std::path::Path>>(path: T) -> anyhow::Result<Tensor> {
    let img = image::open(path)?.to_luma8();
    let (new_width, new_height) = {
        let (width, height) = img.dimensions();
        (width - width % 32, height - height % 32)
    };
    let img = image::imageops::resize(
        &img,
        new_width,
        new_height,
        image::imageops::FilterType::CatmullRom,
    )
    .into_raw();
    let mask = Tensor::from_vec(img, (new_height as usize, new_width as usize), &Device::Cpu)?
        .unsqueeze(0)?
        .to_dtype(DType::F32)?
        .div(255.0)?
        .unsqueeze(0)?;
    Ok(mask)
}

/// Generates the mask latents, scaled mask and mask_4 for inpainting. Returns a tuple of None if inpainting is not
/// being used.
#[allow(clippy::too_many_arguments)]
fn inpainting_tensors(
    sd_version: StableDiffusionVersion,
    mask_path: Option<String>,
    dtype: DType,
    device: &Device,
    use_guide_scale: bool,
    vae: &AutoEncoderKL,
    image: Option<Tensor>,
    vae_scale: f64,
) -> Result<(Option<Tensor>, Option<Tensor>, Option<Tensor>)> {
    match sd_version {
        StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::V2Inpaint
        | StableDiffusionVersion::V1_5Inpaint => {
            let inpaint_mask = mask_path.ok_or_else(|| {
                anyhow::anyhow!("An inpainting model was requested but mask-path is not provided.")
            })?;
            // Get the mask image with shape [1, 1, 128, 128]
            let mask = mask_preprocess(inpaint_mask)?
                .to_device(device)?
                .to_dtype(dtype)?;
            // Generate the masked image from the image and the mask with shape [1, 3, 1024, 1024]
            let xmask = mask.le(0.5)?.repeat(&[1, 3, 1, 1])?.to_dtype(dtype)?;
            let image = &image
                .ok_or_else(|| anyhow::anyhow!(
                    "An inpainting model was requested but img2img which is used as the input image is not provided."
                ))?;
            let masked_img = (image * xmask)?;
            // Scale down the mask
            let shape = masked_img.shape();
            let (w, h) = (shape.dims()[3] / 8, shape.dims()[2] / 8);
            let mask = mask.interpolate2d(w, h)?;
            // shape: [1, 4, 128, 128]
            let mask_latents = vae.encode(&masked_img)?;
            let mask_latents = (mask_latents.sample()? * vae_scale)?.to_device(device)?;

            let mask_4 = mask.as_ref().repeat(&[1, 4, 1, 1])?;
            let (mask_latents, mask) = if use_guide_scale {
                (
                    Tensor::cat(&[&mask_latents, &mask_latents], 0)?,
                    Tensor::cat(&[&mask, &mask], 0)?,
                )
            } else {
                (mask_latents, mask)
            };
            Ok((Some(mask_latents), Some(mask), Some(mask_4)))
        }
        _ => Ok((None, None, None)),
    }
}

fn get_tensor_stats(tensor: &Tensor) -> Result<(f32, f32, f32, f32)> {
    let flat = tensor.flatten_all()?;
    let min = flat.min(0)?.to_scalar::<f32>()?;
    let max = flat.max(0)?.to_scalar::<f32>()?;
    let mean = flat.mean_all()?.to_scalar::<f32>()?;
    
    // Calculate standard deviation manually
    // Create a tensor with the same shape as flat but filled with the mean value
    let mean_tensor = Tensor::new(&[mean], flat.device())?;
    let mean_tensor = mean_tensor.broadcast_as(flat.shape().dims())?;
    let diff = (flat - mean_tensor)?;
    let squared = diff.sqr()?;
    let variance = squared.mean_all()?;
    let std = variance.sqrt()?.to_scalar::<f32>()?;
    
    Ok((min, max, mean, std))
}

fn run(args: Args) -> Result<()> {
    use tracing_chrome::ChromeLayerBuilder;
    use tracing_subscriber::prelude::*;

    let Args {
        prompt,
        uncond_prompt,
        cpu,
        height,
        width,
        n_steps,
        tokenizer,
        final_image,
        sliced_attention_size,
        num_samples,
        bsize,
        sd_version,
        clip_weights,
        clip2_weights,
        vae_weights,
        unet_weights,
        tracing,
        use_f16,
        guidance_scale,
        use_flash_attn,
        mask_path,
        img2img,
        strength,
        seed,
        ..
    } = args;

    if !(0. ..=1.).contains(&strength) {
        anyhow::bail!("strength should be between 0 and 1, got {strength}")
    }

    let _guard = if tracing {
        let (chrome_layer, guard) = ChromeLayerBuilder::new().build();
        tracing_subscriber::registry().with(chrome_layer).init();
        Some(guard)
    } else {
        None
    };

    let dtype = if use_f16 { DType::F16 } else { DType::F32 };
    let sd_config = match sd_version {
        StableDiffusionVersion::V1_5 | StableDiffusionVersion::V1_5Inpaint => {
            stable_diffusion::StableDiffusionConfig::v1_5(sliced_attention_size, height, width)
        }
        StableDiffusionVersion::V2_1 | StableDiffusionVersion::V2Inpaint => {
            stable_diffusion::StableDiffusionConfig::v2_1(sliced_attention_size, height, width)
        }
        StableDiffusionVersion::Xl | StableDiffusionVersion::XlInpaint => {
            stable_diffusion::StableDiffusionConfig::sdxl(sliced_attention_size, height, width)
        }
        StableDiffusionVersion::Turbo => stable_diffusion::StableDiffusionConfig::sdxl_turbo(
            sliced_attention_size,
            height,
            width,
        ),
    };

    let mut scheduler = stable_diffusion::lcm::LCMScheduler::new(
        n_steps,
        strength,
        stable_diffusion::lcm::LCMSchedulerConfig::default(),
    )?;

    let device = candle_examples::device(cpu)?;
    // If a seed is not given, generate a random seed and print it
    let seed = seed.unwrap_or(rand::thread_rng().gen_range(0u64..u64::MAX));
    println!("Using seed {seed}");
    device.set_seed(seed)?;
    // let use_guide_scale = guidance_scale > 1.0;
    let use_guide_scale = false;

    let which = match sd_version {
        StableDiffusionVersion::Xl
        | StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::Turbo => vec![true, false],
        _ => vec![true],
    };

    // Define the base model and LCM model repositories
    let base_model_repo = match sd_version {
        StableDiffusionVersion::V1_5 | StableDiffusionVersion::V1_5Inpaint => {
            // Dreamshaper is based on SD 1.5, so use it for those versions
            "Lykon/dreamshaper-7"
        },
        _ => {
            // For other versions, use the standard repo
            sd_version.repo()
        }
    };
    let lcm_model_repo = "SimianLuo/LCM_Dreamshaper_v7"; // LCM UNet

    // Create a custom ModelFile enum variant for the base model
    let clip_weights = if clip_weights.is_none() {
        use hf_hub::api::sync::Api;
        let api = Api::new()?;
        let clip_path = api.model(base_model_repo.to_string())
            .get(if use_f16 { "text_encoder/model.fp16.safetensors" } 
                 else { "text_encoder/model.safetensors" })?;
        Some(clip_path.to_string_lossy().to_string())
    } else {
        clip_weights
    };

    let vae_weights = if vae_weights.is_none() {
        use hf_hub::api::sync::Api;
        let api = Api::new()?;
        let vae_path = api.model(base_model_repo.to_string())
            .get(if use_f16 { "vae/diffusion_pytorch_model.fp16.safetensors" } 
                 else { "vae/diffusion_pytorch_model.safetensors" })?;
        Some(vae_path.to_string_lossy().to_string())
    } else {
        vae_weights
    };

    // For the UNet, always use the LCM model
    let unet_weights = {
        use hf_hub::api::sync::Api;
        let api = Api::new()?;
        let unet_path = api.model(lcm_model_repo.to_string())
            .get(if use_f16 { "unet/diffusion_pytorch_model.fp16.safetensors" } 
                 else { "unet/diffusion_pytorch_model.safetensors" })?;
        Some(unet_path.to_string_lossy().to_string())
    };

    // Load text embeddings from the base model
    let text_embeddings = which
        .iter()
        .map(|first| {
            text_embeddings(
                &prompt,
                &uncond_prompt,
                tokenizer.clone(),
                clip_weights.clone(),
                clip2_weights.clone(),
                sd_version,
                &sd_config,
                use_f16,
                &device,
                dtype,
                use_guide_scale,
                *first,
            )
        })
        .collect::<Result<Vec<_>>>()?;

    let text_embeddings = Tensor::cat(&text_embeddings, D::Minus1)?;
    let text_embeddings = text_embeddings.repeat((bsize, 1, 1))?;
    println!("Text embeddings shape: {:?}", text_embeddings.shape());
    println!("Text embeddings first few values: {}", 
             text_embeddings.i(0)?.i(0)?.narrow(0, 0, 10)?);

    // Replace the random projection with a fixed one to match diffusers
    let text_embeddings = if text_embeddings.dim(2)? == 2048 {
        println!("Projecting text embeddings from 2048 to 768 dimensions");
        
        // Load the projection matrix from a file (you'll need to extract this from the diffusers model)
        // For now, we'll still use a random one but with a fixed seed
        device.set_seed(42)?; // Use a fixed seed for the projection
        let projection = Tensor::randn(
            0.0, 
            0.02, 
            (2048, 768), 
            &device,
        )?.to_dtype(dtype)?;
        
        let proj_embeddings = text_embeddings.matmul(&projection)?;
        proj_embeddings
    } else {
        text_embeddings
    };
    println!("Projected text embeddings: {:?}", text_embeddings);

    println!("Building the autoencoder.");
    let vae_weights = ModelFile::Vae.get(vae_weights, sd_version, use_f16)?;
    let vae = sd_config.build_vae(vae_weights, &device, dtype)?;

    let (image, init_latent_dist) = match &img2img {
        None => (None, None),
        Some(image) => {
            let image = image_preprocess(image)?
                .to_device(&device)?
                .to_dtype(dtype)?;
            println!("Input image shape: {:?}", image.shape());
            (Some(image.clone()), Some(vae.encode(&image)?))
        }
    };

    println!("Latent shape after VAE encoding: {:?}", 
             init_latent_dist.as_ref().map(|dist| {
                 // Try to get shape from a temporary sample
                 match dist.sample() {
                     Ok(sample) => format!("{:?}", sample.shape()),
                     Err(_) => "Unable to determine shape".to_string()
                 }
             }));

    println!("Building the unet.");
    let unet_weights = ModelFile::UnetLcm.get(unet_weights, sd_version, use_f16)?;
    let in_channels = match sd_version {
        StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::V2Inpaint
        | StableDiffusionVersion::V1_5Inpaint => 9,
        _ => 4,
    };
    println!("Loading UNet weights from: {:?}", unet_weights);
    
    // Load tensors using candle's safetensors loader
    let tensors = candle::safetensors::load(&unet_weights, &device)?;
    
    // Create a new HashMap to store the processed tensors
    let mut processed_tensors = std::collections::HashMap::new();
    
    // Process and print shapes of tensors
    for (name, tensor) in tensors.iter() {
        let processed_tensor = if name.contains("proj_in.weight") || name.contains("proj_out.weight") {
            let shape = tensor.shape();
            if shape.dims().len() == 2 {
                // If it's a 2D tensor, reshape it to 4D with trailing 1s
                println!("Expanding tensor {} from {:?}", name, shape);
                tensor.reshape((shape.dims()[0], shape.dims()[1], 1, 1))?
            } else {
                tensor.clone()
            }
        } else {
            tensor.clone()
        };
        
        if name.contains("down_blocks.1.attentions.0.proj_in") {
            println!("Found tensor: {} with shape: {:?} -> {:?}", 
                    name, tensor.shape(), processed_tensor.shape());
        }
        
        processed_tensors.insert(name.clone(), processed_tensor);
    }
    
    println!("Building UNet with in_channels: {}", in_channels);

    // Make sure the UNet config exactly matches the diffusers model
    let unet_config = UNet2DConditionModelConfig {
        // LCM specific config values
        cross_attention_dim: 768,  // Dreamshaper v7 uses 768
        time_cond_proj_dim: Some(256),  // LCM models use 256-dimensional guidance embeddings
        // Rest of configuration...
        center_input_sample: false,
        flip_sin_to_cos: true,
        freq_shift: 0.0,
        blocks: vec![
            BlockConfig {
                out_channels: 320,
                use_cross_attn: Some(1),
                attention_head_dim: 8,
            },
            BlockConfig {
                out_channels: 640,
                use_cross_attn: Some(1),
                attention_head_dim: 8,
            },
            BlockConfig {
                out_channels: 1280,
                use_cross_attn: Some(1),
                attention_head_dim: 8,
            },
            BlockConfig {
                out_channels: 1280,
                use_cross_attn: None,
                attention_head_dim: 8,
            },
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
    
    
    // Let's try a different approach - load the model directly from the safetensors file
    // and modify the weights after loading
    let vs_unet = unsafe { 
        VarBuilder::from_mmaped_safetensors(&[unet_weights], dtype, &device)? 
    };
    
    let unet = UNet2DConditionModel::new(
        vs_unet,
        in_channels,
        4,
        use_flash_attn,
        unet_config,
    )?;

    // Run with a much higher strength to ensure sufficient transformation
    let effective_strength = if img2img.is_some() {
        // Force at least 0.8 strength for good results 
        strength.max(0.8)
    } else {
        strength
    };

    // Use this effective_strength in the t_start calculation
    // let raw_t_start = n_steps - (n_steps as f64 * effective_strength) as usize;
    // let raw_t_start = (n_steps as f64 * (1.0 - effective_strength)).round() as usize;
    let raw_t_start = ((n_steps as f64 * (1.0 - effective_strength)).round() as usize).min(n_steps - 1);

    println!("Using img2img with strength={}, raw t_start={}", effective_strength, raw_t_start);
    
    // Ensure we have at least 2 steps for img2img (more steps = more transformation)
    if raw_t_start >= n_steps - 1 {
        println!("WARNING: strength too low, forcing more steps");
        n_steps - 2 // Ensure we do at least 2 steps
    } else {
        raw_t_start
    };

    let vae_scale = match sd_version {
        StableDiffusionVersion::V1_5
        | StableDiffusionVersion::V1_5Inpaint
        | StableDiffusionVersion::V2_1
        | StableDiffusionVersion::V2Inpaint
        | StableDiffusionVersion::XlInpaint
        | StableDiffusionVersion::Xl => 0.18215,
        StableDiffusionVersion::Turbo => 0.13025,
    };

    let (mask_latents, mask, mask_4) = inpainting_tensors(
        sd_version,
        mask_path,
        dtype,
        &device,
        use_guide_scale,
        &vae,
        image,
        vae_scale,
    )?;

    println!("Timesteps: {:?}", scheduler.timesteps());
    println!("Alpha cumprod: {:?}", scheduler.alphas_cumprod());

    for idx in 0..num_samples {
        let timesteps = scheduler.timesteps().to_vec();
        
        // Initialize latents
        // let latents = match &init_latent_dist {
        //     Some(init_latent_dist) => {
        //         let latents = (init_latent_dist.sample()? * vae_scale)?.to_device(&device)?;
        //         if raw_t_start < timesteps.len() {
        //             println!("Adding noise to image latents for img2img");
        //             let noise = latents.randn_like(0f64, 1f64)?;
                    
        //             // Print the latents before and after adding noise
        //             // println!("Latents before noise: {}", 
        //                     // latents.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
                    
        //             let noised_latents = scheduler.add_noise(&latents, noise, timesteps[raw_t_start])?;
                    
        //             let scaled_noised_latents = ((latents.clone() * (1.0 - strength))? + (noised_latents.clone() * strength)?)?;
        //             // println!("Latents after noise: {}", 
        //                     // noised_latents.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
                    
        //             // Print the amount of noise added - clone tensors to avoid moves
        //             let latents_clone = latents.clone();
        //             let noised_clone = noised_latents.clone();
        //             println!("Amount of noise added: {}", 
        //                     ((noised_clone - latents_clone)?.div(&latents)?).i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
                    
        //             scaled_noised_latents
        //         } else {
        //             println!("No noise added (t_start >= timesteps.len())");
        //             latents
        //         }
        //     }
        //     None => {
        //         let latents = Tensor::randn(
        //             0f32,
        //             1f32,
        //             (bsize, 4, sd_config.height / 8, sd_config.width / 8),
        //             &device,
        //         )?;
        //         (latents * scheduler.init_noise_sigma())?
        //     }
        // };
        let latents = match &init_latent_dist {
            Some(init_latent_dist) => {
                let latents = (init_latent_dist.sample()? * vae_scale)?.to_device(&device)?;
        
                // Compute `t_start`
                let timesteps = LCMScheduler::get_timesteps_for_steps(n_steps, strength);
                let t_start = timesteps[0]; // First denoising step
        
                // Add noise at `t_start`
                let noise = latents.randn_like(0f64, 1f64)?;
                let noisy_latents = scheduler.add_noise(&latents, noise, t_start)?;
        
                println!("Latents after adding noise at {}: {:?}", t_start, noisy_latents.shape());
                noisy_latents
            }
            None => {
                let latents = Tensor::randn(
                    0f32,
                    1f32,
                    (bsize, 4, sd_config.height / 8, sd_config.width / 8),
                    &device,
                )?;
                (latents * scheduler.init_noise_sigma())?
            }
        };

        let mut latents = latents.to_dtype(dtype)?;

        println!("Setting seed to {}", seed);
        device.set_seed(seed)?;

        println!("Initial latents shape: {:?}", latents.shape());
        println!("Initial latents first few values: {}", 
                 latents.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);

        println!("Starting LCM sampling");
        let start_time = std::time::Instant::now();

        let embedding_dim = 1280;
        let guidance_scale_embedding = scheduler.get_guidance_scale_embedding(guidance_scale, embedding_dim, &device, dtype)?;

        for (timestep_index, &timestep) in timesteps.iter().enumerate() {
            if timestep_index < raw_t_start  {
                println!("Skipping timestep {} because it's before t_start", timestep);
                // continue;
            }

            println!("\n--- Timestep {}/{} (value: {}) ---", 
                     timestep_index + 1, timesteps.len(), timestep);
            
            let latent_model_input = if use_guide_scale {
                println!("Using classifier-free guidance with scale: {}", guidance_scale);
                Tensor::cat(&[&latents, &latents], 0)?
            } else {
                latents.clone()
            };
            
            println!("Latent input shape before scaling: {:?}", latent_model_input.shape());
            println!("Latent input first few values: {}", 
                     latent_model_input.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);

            let latent_model_input = scheduler.scale_model_input(latent_model_input, timestep);
            
            println!("Latent input shape after scaling: {:?}", latent_model_input.shape());
            println!("Scaled latent input first few values: {}", 
                     latent_model_input.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);

            println!("Running UNet forward pass...");
            let noise_pred = unet.forward_with_guidance(&latent_model_input, timestep as f64, &text_embeddings, Some(&guidance_scale_embedding))?;
            
            println!("Noise prediction shape: {:?}", noise_pred.shape());
            println!("Noise prediction first few values: {}", 
                     noise_pred.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);

            let noise_pred = if use_guide_scale {
                let noise_pred = noise_pred.chunk(2, 0)?;
                let (noise_pred_uncond, noise_pred_text) = (&noise_pred[0], &noise_pred[1]);
                
                println!("Uncond noise pred first few values: {}", 
                         noise_pred_uncond.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
                println!("Text noise pred first few values: {}", 
                         noise_pred_text.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
                
                let guided = (noise_pred_uncond + ((noise_pred_text - noise_pred_uncond)? * guidance_scale)?)?;
                
                println!("Guided noise pred first few values: {}", 
                         guided.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
                guided
            } else {
                noise_pred
            };

            println!("Latents before step first few values: {}", 
                     latents.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
            
            println!("Applying scheduler step...");
            latents = scheduler.step(&noise_pred, timestep, &latents, timestep_index, n_steps)?;
            
            println!("Latents after step first few values: {}", 
                     latents.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);
            
            println!("Step {}/{} completed", timestep_index + 1, n_steps);
        }

        let dt = start_time.elapsed().as_secs_f32();
        println!("Sampling completed in {:.2}s", dt);

        // Generate final image
        println!("Generating final image for sample {}/{}", idx + 1, num_samples);
        save_image(&vae, &latents, vae_scale, bsize, idx, &final_image, num_samples, None)?;
    }
    Ok(())
}

fn main() -> Result<()> {
    let args = Args::parse();
    run(args)
}
