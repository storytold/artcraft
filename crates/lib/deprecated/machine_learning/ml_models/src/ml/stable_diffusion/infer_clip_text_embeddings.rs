#[cfg(feature = "accelerate")]
extern crate accelerate_src;
#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use candle_transformers::models::stable_diffusion;
use std::path::{Path, PathBuf};

use crate::ml::model_file::{ModelFile, StableDiffusionVersion};
use ml_weights_registry::weights_registry::weights::{CLIP_JSON, SDXL_TURBO_CLIP_TEXT_ENCODER, SDXL_TURBO_CLIP_TEXT_ENCODER_2};
use anyhow::Error as E;
use candle_core::{DType, Device, Module, Tensor, D};
use log::info;
use tokenizers::Tokenizer;


pub struct ClipArgs<'a, P: AsRef<Path>,  Q: AsRef<Path>> {
  pub prompt: &'a str, 
  pub uncond_prompt: &'a str, 
  pub tokenizer: Option<String>, 
  pub clip_weights: Option<String>, 
  pub clip2_weights: Option<String>, 
  pub sd_version: StableDiffusionVersion, 
  pub sd_config: &'a stable_diffusion::StableDiffusionConfig, 
  pub use_f16: bool, 
  pub device: &'a Device, 
  pub dtype: DType, 
  pub use_guide_scale: bool, 
  pub clip_json_path: P,
  pub clip_weights_path: Q,
}

#[allow(clippy::too_many_arguments)]
pub fn infer_clip_text_embeddings<P: AsRef<Path>, Q: AsRef<Path>>(args: ClipArgs<'_, P, Q>) -> anyhow::Result<Tensor> {
  let ClipArgs {
    prompt, 
    uncond_prompt, 
    tokenizer, 
    clip_weights, 
    clip2_weights, 
    sd_version, 
    sd_config, 
    use_f16, 
    device, 
    dtype, 
    use_guide_scale, 
    clip_json_path,
    clip_weights_path,
  } = args;

  info!("Preparing text embeddings... for {:?}", sd_version);

  let which = match sd_version {
    StableDiffusionVersion::Xl | StableDiffusionVersion::XlInpaint | StableDiffusionVersion::Turbo => vec![true, false],
    _ => vec![true],
  };

  let text_embeddings = which
    .iter()
    .map(|first| {
      do_infer_clip_text_embeddings(
        &prompt,
        &uncond_prompt,
        None, // tokenizer
        clip_weights.clone(),
        None, // clip2_weights
        sd_version,
        &sd_config,
        false, // use_f16
        &device,
        dtype,
        use_guide_scale,
        *first,
        clip_json_path.as_ref(),
        clip_weights_path.as_ref(),
      )
    })
    .collect::<anyhow::Result<Vec<_>>>()?;

  let text_embeddings = Tensor::cat(&text_embeddings, D::Minus1)?;

  Ok(text_embeddings)
}

#[allow(clippy::too_many_arguments)]
fn do_infer_clip_text_embeddings(
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
  clip_json_path: &Path,
  clip_weights_path: &Path,
) -> anyhow::Result<Tensor> {
  info!("do_infer_clip_text_embeddings called with args {:?}", (prompt, uncond_prompt, tokenizer.clone().unwrap_or_else(|| "None".to_string()), clip_weights.clone().unwrap_or_else(|| "None".to_string()), clip2_weights.clone().unwrap_or_else(|| "None".to_string()), sd_version, sd_config, use_f16, device, dtype, use_guide_scale, first));

  let tokenizer = clip_json_path;

  info!("Loading Clip Tokenizer path: {:?}", tokenizer);

  let tokenizer = Tokenizer::from_file(tokenizer).map_err(E::msg)?;

  let pad_id = match &sd_config.clip.pad_with {
    Some(padding) => *tokenizer.get_vocab(true).get(padding.as_str()).unwrap(),
    None => *tokenizer.get_vocab(true).get("<|endoftext|>").unwrap(),
  };

  println!("Running with prompt \"{prompt}\".");
  let mut tokens = tokenizer.encode(prompt, true).map_err(E::msg)?.get_ids().to_vec();
  if tokens.len() > sd_config.clip.max_position_embeddings {
    anyhow::bail!("the prompt is too long, {} > max-tokens ({})", tokens.len(), sd_config.clip.max_position_embeddings)
  }
  while tokens.len() < sd_config.clip.max_position_embeddings {
    tokens.push(pad_id)
  }
  let tokens = Tensor::new(tokens.as_slice(), device)?.unsqueeze(0)?;

  println!("Building the Clip transformer.");
  
  // TODO(bt,2025-03-23): These used to be two different clip models. We should only need one.
  let clip_weights = if first {
    println!(">>>>> CLIP 1");
    clip_weights_path
  } else {
    println!(">>>>> CLIP 2");
    clip_weights_path
  };
  
  let clip_config = if first { &sd_config.clip } else { sd_config.clip2.as_ref().unwrap() };
  let text_model = stable_diffusion::build_clip_transformer(clip_config, clip_weights, device, DType::F32)?;

  let text_embeddings = text_model.forward(&tokens)?;

  let text_embeddings = if use_guide_scale {
    let mut uncond_tokens = tokenizer.encode(uncond_prompt, true).map_err(E::msg)?.get_ids().to_vec();
    if uncond_tokens.len() > sd_config.clip.max_position_embeddings {
      anyhow::bail!("the negative prompt is too long, {} > max-tokens ({})", uncond_tokens.len(), sd_config.clip.max_position_embeddings)
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
