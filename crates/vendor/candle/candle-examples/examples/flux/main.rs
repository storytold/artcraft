#[cfg(feature = "accelerate")]
extern crate accelerate_src;

#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use candle_transformers::models::{clip, flux, t5};

use anyhow::{Error as E, Result};
use candle::{IndexOp, Module, Tensor};
use candle_nn::VarBuilder;
use clap::Parser;
use tokenizers::Tokenizer;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
  /// The prompt to be used for image generation.
  #[arg(long, default_value = "A rusty robot walking on a beach")]
  prompt: String,

  /// Run on CPU rather than on GPU.
  #[arg(long)]
  cpu: bool,

  /// Use the quantized model.
  #[arg(long)]
  quantized: bool,

  /// Enable tracing (generates a trace-timestamp.json file).
  #[arg(long)]
  tracing: bool,

  /// The height in pixels of the generated image.
  #[arg(long)]
  height: Option<usize>,

  /// The width in pixels of the generated image.
  #[arg(long)]
  width: Option<usize>,

  #[arg(long)]
  decode_only: Option<String>,

  #[arg(long, value_enum, default_value = "schnell")]
  model: Model,

  /// Use the slower kernels.
  #[arg(long)]
  use_dmmv: bool,

  /// The seed to use when generating random samples.
  #[arg(long)]
  seed: Option<u64>,

  #[arg(long)]
  cache_path: Option<String>,

  /// Number of blocks to keep active on GPU (default: 1).
  /// Only relevant when NOT using --use_full_gpu.
  /// Higher values use more memory but may improve performance.
  #[arg(long, default_value = "1")]
  active_blocks: usize,

  /// Use CUDA stream for faster device transfers (default: true).
  /// Only relevant when running on GPU.
  #[arg(long, default_value = "true")]
  use_cuda_stream: bool,

  /// Enable prefetching of the next batch of blocks while processing the current batch.
  /// Only relevant when NOT using --use_full_gpu.
  /// This can improve performance by overlapping memory transfers and computation.
  #[arg(long, default_value = "false")]
  prefetch_next_batch: bool,

  /// Load entire model on GPU instead of using memory-efficient active blocks approach.
  /// This uses more GPU memory but avoids CPU-GPU transfers completely.
  /// When this flag is enabled, the --active_blocks and --prefetch_next_batch flags have no effect.
  #[arg(long, default_value = "false")]
  use_full_gpu: bool,
}

#[derive(Debug, Clone, Copy, clap::ValueEnum, PartialEq, Eq)]
enum Model {
  Schnell,
  Dev,
}

fn run(args: Args) -> Result<()> {
  use tracing_chrome::ChromeLayerBuilder;
  use tracing_subscriber::prelude::*;

  let Args { prompt, cpu, height, width, tracing, decode_only, model, quantized, active_blocks, use_cuda_stream, prefetch_next_batch, use_full_gpu, .. } = args;
  let width = width.unwrap_or(1360);
  let height = height.unwrap_or(768);

  let _guard = if tracing {
    let (chrome_layer, guard) = ChromeLayerBuilder::new().build();
    tracing_subscriber::registry().with(chrome_layer).init();
    Some(guard)
  } else {
    None
  };

  let api = match args.cache_path.as_ref() {
    Some(path) => hf_hub::api::sync::ApiBuilder::from_cache(hf_hub::Cache::new(path.to_string().into())).build().map_err(anyhow::Error::msg)?,
    None => {
      let cache = hf_hub::Cache::from_env();
      hf_hub::api::sync::ApiBuilder::from_cache(cache).build().map_err(anyhow::Error::msg)?
    },
  };
  let bf_repo = {
    let name = match model {
      Model::Dev => "black-forest-labs/FLUX.1-dev",
      Model::Schnell => "black-forest-labs/FLUX.1-schnell",
    };
    api.repo(hf_hub::Repo::model(name.to_string()))
  };

  // Use CUDA with stream for faster device transfers when not in CPU mode
  let device = if cpu {
    candle::Device::Cpu
  } else {
    #[cfg(feature = "cuda")]
    {
      if use_cuda_stream {
        println!("Using CUDA with dedicated stream for faster device transfers");
        // Use device ordinal 0 (first GPU)
        candle::Device::new_cuda_with_stream(0)?
      } else {
        println!("Using standard CUDA device (no dedicated stream)");
        candle::Device::new_cuda(0)?
      }
    }
    #[cfg(not(feature = "cuda"))]
    {
      println!("CUDA not available, using CPU");
      candle::Device::Cpu
    }
  };

  if let Some(seed) = args.seed {
    device.set_seed(seed)?;
  }
  let start_time = std::time::Instant::now();
  let dtype = device.bf16_default_to_f32();
  let img = match decode_only {
    None => {
      let t5_emb = {
        let repo = api.repo(hf_hub::Repo::with_revision("google/t5-v1_1-xxl".to_string(), hf_hub::RepoType::Model, "refs/pr/2".to_string()));
        let model_file = repo.get("model.safetensors")?;
        let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[model_file], dtype, &device)? };
        let config_filename = repo.get("config.json")?;
        let config = std::fs::read_to_string(config_filename)?;
        let config: t5::Config = serde_json::from_str(&config)?;
        let mut model = t5::T5EncoderModel::load(vb, &config)?;
        let tokenizer_filename = api.model("lmz/mt5-tokenizers".to_string()).get("t5-v1_1-xxl.tokenizer.json")?;
        let tokenizer = Tokenizer::from_file(tokenizer_filename).map_err(E::msg)?;
        let mut tokens = tokenizer.encode(prompt.as_str(), true).map_err(E::msg)?.get_ids().to_vec();
        tokens.resize(256, 0);
        let input_token_ids = Tensor::new(&tokens[..], &device)?.unsqueeze(0)?;
        println!("{input_token_ids}");
        model.forward(&input_token_ids)?
      };
      println!("T5\n{t5_emb}");
      let clip_emb = {
        let repo = api.repo(hf_hub::Repo::model("openai/clip-vit-large-patch14".to_string()));
        let model_file = repo.get("model.safetensors")?;
        let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[model_file], dtype, &device)? };
        // https://huggingface.co/openai/clip-vit-large-patch14/blob/main/config.json
        let config = clip::text_model::ClipTextConfig { vocab_size: 49408, projection_dim: 768, activation: clip::text_model::Activation::QuickGelu, intermediate_size: 3072, embed_dim: 768, max_position_embeddings: 77, pad_with: None, num_hidden_layers: 12, num_attention_heads: 12 };
        let model = clip::text_model::ClipTextTransformer::new(vb.pp("text_model"), &config)?;
        let tokenizer_filename = repo.get("tokenizer.json")?;
        let tokenizer = Tokenizer::from_file(tokenizer_filename).map_err(E::msg)?;
        let tokens = tokenizer.encode(prompt.as_str(), true).map_err(E::msg)?.get_ids().to_vec();
        let input_token_ids = Tensor::new(&tokens[..], &device)?.unsqueeze(0)?;
        println!("{input_token_ids}");
        model.forward(&input_token_ids)?
      };
      println!("CLIP\n{clip_emb}");
      let img = {
        let cfg = match model {
          Model::Dev => flux::model::Config::dev(),
          Model::Schnell => flux::model::Config::schnell(),
        };
        let img = flux::sampling::get_noise(1, height, width, &device)?.to_dtype(dtype)?;
        let state = if quantized { flux::sampling::State::new(&t5_emb.to_dtype(candle::DType::F32)?, &clip_emb.to_dtype(candle::DType::F32)?, &img.to_dtype(candle::DType::F32)?)? } else { flux::sampling::State::new(&t5_emb, &clip_emb, &img)? };
        let timesteps = match model {
          Model::Dev => flux::sampling::get_schedule(28, Some((state.img.dim(1)?, 0.5, 1.15))),
          Model::Schnell => flux::sampling::get_schedule(4, None),
        };
        println!("{state:?}");
        println!("{timesteps:?}");
        if quantized {
          // Note about quantized model memory management
          let model_file = match model {
            Model::Schnell => api.repo(hf_hub::Repo::model("lmz/candle-flux".to_string())).get("flux1-schnell.gguf")?,
            Model::Dev => todo!(),
          };
          let vb = candle_transformers::quantized_var_builder::VarBuilder::from_gguf(model_file, &device)?;

          let mut model = flux::quantized_model::Flux::new(&cfg, vb)?;
          // Quantized models are always fully loaded to the selected device
          if !cpu {
            println!("Quantized model fully loaded to GPU with optimized memory layout");
          }

          flux::sampling::denoise(&mut model, &state.img, &state.img_ids, &state.txt, &state.txt_ids, &state.vec, &timesteps, 4.)?.to_dtype(dtype)?
        } else {
          let model_file = match model {
            Model::Schnell => bf_repo.get("flux1-schnell.safetensors")?,
            Model::Dev => bf_repo.get("flux1-dev.safetensors")?,
          };

          let mut model = if use_full_gpu {
            // When use_full_gpu is true, load everything directly to GPU
            println!("Loading entire model directly to GPU...");
            let gpu_vb = unsafe { VarBuilder::from_mmaped_safetensors(&[model_file], dtype, &device)? };
            let mut model = flux::model::Flux::new(&cfg, gpu_vb)?;
            model.set_use_device_management(false);
            println!("Model loaded entirely on GPU");
            model
          } else {
            // Use memory-efficient approach with blocks on CPU
            // Create a CPU device for initially loading all model weights
            let cpu_device = candle::Device::Cpu;

            // Load the entire model to CPU first (uses less memory)
            println!("Loading model to CPU to minimize GPU memory usage...");
            let cpu_vb = unsafe { VarBuilder::from_mmaped_safetensors(&[model_file], dtype, &cpu_device)? };

            // Create the model with CPU weights, then selectively move core components to GPU
            let mut model = flux::model::Flux::new_with_gpu_core(&cfg, cpu_vb, &device)?;
            println!("Model loaded (core components on GPU, blocks on CPU for reduced memory usage)");

            // Set the number of active blocks to keep on GPU
            model.set_max_active_blocks(active_blocks);
            println!("Using {} active blocks on GPU", active_blocks);

            // Enable prefetching if requested
            if prefetch_next_batch {
              model.set_prefetch_next_batch(true);
              println!("Prefetching enabled - will overlap transfers with computation");
            }

            model
          };

          // Print final memory management approach being used
          if use_full_gpu {
            println!("Using full GPU memory - entire model on GPU");
          } else {
            println!("Using device management - blocks will be transferred between CPU and GPU as needed");
          }

          flux::sampling::denoise(&mut model, &state.img, &state.img_ids, &state.txt, &state.txt_ids, &state.vec, &timesteps, 4.)?
        }
      };
      flux::sampling::unpack(&img, height, width)?
    },
    Some(file) => {
      let mut st = candle::safetensors::load(file, &device)?;
      st.remove("img").unwrap().to_dtype(dtype)?
    },
  };
  println!("latent img\n{img}");

  let end_time = std::time::Instant::now();
  println!("Time taken to decode: {:?}", end_time.duration_since(start_time));
  let img = {
    let model_file = bf_repo.get("ae.safetensors")?;
    let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[model_file], dtype, &device)? };
    let cfg = match model {
      Model::Dev => flux::autoencoder::Config::dev(),
      Model::Schnell => flux::autoencoder::Config::schnell(),
    };
    let model = flux::autoencoder::AutoEncoder::new(&cfg, vb)?;
    model.decode(&img)?
  };
  println!("img\n{img}");
  let img = ((img.clamp(-1f32, 1f32)? + 1.0)? * 127.5)?.to_dtype(candle::DType::U8)?;
  let filename = match args.seed {
    None => "out.jpg".to_string(),
    Some(s) => format!("out-{s}.jpg"),
  };
  candle_examples::save_image(&img.i(0)?, filename)?;
  Ok(())
}

fn main() -> Result<()> {
  let args = Args::parse();
  #[cfg(feature = "cuda")]
  candle::quantized::cuda::set_force_dmmv(args.use_dmmv);
  run(args)
}
