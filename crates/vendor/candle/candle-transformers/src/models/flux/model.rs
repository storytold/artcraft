use candle::{DType, IndexOp, Result, Tensor, D, Device};
use candle_nn::{LayerNorm, Linear, RmsNorm, VarBuilder, DeviceTransferable};

/// Trait for modules that can be moved between devices
///
/// This trait is intended to be implemented by model components that need
/// to be transferred between CPU and GPU to save memory.

// https://github.com/black-forest-labs/flux/blob/727e3a71faf37390f318cf9434f0939653302b60/src/flux/model.py#L12
#[derive(Debug, Clone)]
pub struct Config {
  pub in_channels: usize,
  pub vec_in_dim: usize,
  pub context_in_dim: usize,
  pub hidden_size: usize,
  pub mlp_ratio: f64,
  pub num_heads: usize,
  pub depth: usize,
  pub depth_single_blocks: usize,
  pub axes_dim: Vec<usize>,
  pub theta: usize,
  pub qkv_bias: bool,
  pub guidance_embed: bool,
}

impl Config {
  // https://github.com/black-forest-labs/flux/blob/727e3a71faf37390f318cf9434f0939653302b60/src/flux/util.py#L32
  pub fn dev() -> Self {
    Self { in_channels: 64, vec_in_dim: 768, context_in_dim: 4096, hidden_size: 3072, mlp_ratio: 4.0, num_heads: 24, depth: 19, depth_single_blocks: 38, axes_dim: vec![16, 56, 56], theta: 10_000, qkv_bias: true, guidance_embed: true }
  }

  // https://github.com/black-forest-labs/flux/blob/727e3a71faf37390f318cf9434f0939653302b60/src/flux/util.py#L64
  pub fn schnell() -> Self {
    Self { in_channels: 64, vec_in_dim: 768, context_in_dim: 4096, hidden_size: 3072, mlp_ratio: 4.0, num_heads: 24, depth: 19, depth_single_blocks: 38, axes_dim: vec![16, 56, 56], theta: 10_000, qkv_bias: true, guidance_embed: false }
  }
}

fn layer_norm(dim: usize, vb: VarBuilder) -> Result<LayerNorm> {
  let ws = Tensor::ones(dim, vb.dtype(), vb.device())?;
  Ok(LayerNorm::new_no_bias(ws, 1e-6))
}

fn scaled_dot_product_attention(q: &Tensor, k: &Tensor, v: &Tensor) -> Result<Tensor> {
  let dim = q.dim(D::Minus1)?;
  let scale_factor = 1.0 / (dim as f64).sqrt();
  let mut batch_dims = q.dims().to_vec();
  batch_dims.pop();
  batch_dims.pop();
  let q = q.flatten_to(batch_dims.len() - 1)?;
  let k = k.flatten_to(batch_dims.len() - 1)?;
  let v = v.flatten_to(batch_dims.len() - 1)?;
  let attn_weights = (q.matmul(&k.t()?)? * scale_factor)?;
  let attn_scores = candle_nn::ops::softmax_last_dim(&attn_weights)?.matmul(&v)?;
  batch_dims.push(attn_scores.dim(D::Minus2)?);
  batch_dims.push(attn_scores.dim(D::Minus1)?);
  attn_scores.reshape(batch_dims)
}

fn rope(pos: &Tensor, dim: usize, theta: usize) -> Result<Tensor> {
  if dim % 2 == 1 {
    candle::bail!("dim {dim} is odd")
  }
  let dev = pos.device();
  let theta = theta as f64;
  let inv_freq: Vec<_> = (0..dim).step_by(2).map(|i| 1f32 / theta.powf(i as f64 / dim as f64) as f32).collect();
  let inv_freq_len = inv_freq.len();
  let inv_freq = Tensor::from_vec(inv_freq, (1, 1, inv_freq_len), dev)?;
  let inv_freq = inv_freq.to_dtype(pos.dtype())?;
  let freqs = pos.unsqueeze(2)?.broadcast_mul(&inv_freq)?;
  let cos = freqs.cos()?;
  let sin = freqs.sin()?;
  let out = Tensor::stack(&[&cos, &sin.neg()?, &sin, &cos], 3)?;
  let (b, n, d, _ij) = out.dims4()?;
  out.reshape((b, n, d, 2, 2))
}

fn apply_rope(x: &Tensor, freq_cis: &Tensor) -> Result<Tensor> {
  let dims = x.dims();
  let (b_sz, n_head, seq_len, n_embd) = x.dims4()?;
  let x = x.reshape((b_sz, n_head, seq_len, n_embd / 2, 2))?;
  let x0 = x.narrow(D::Minus1, 0, 1)?;
  let x1 = x.narrow(D::Minus1, 1, 1)?;
  let fr0 = freq_cis.get_on_dim(D::Minus1, 0)?;
  let fr1 = freq_cis.get_on_dim(D::Minus1, 1)?;
  (fr0.broadcast_mul(&x0)? + fr1.broadcast_mul(&x1)?)?.reshape(dims.to_vec())
}

pub(crate) fn attention(q: &Tensor, k: &Tensor, v: &Tensor, pe: &Tensor) -> Result<Tensor> {
  let q = apply_rope(q, pe)?.contiguous()?;
  let k = apply_rope(k, pe)?.contiguous()?;
  let x = scaled_dot_product_attention(&q, &k, v)?;
  x.transpose(1, 2)?.flatten_from(2)
}

pub(crate) fn timestep_embedding(t: &Tensor, dim: usize, dtype: DType) -> Result<Tensor> {
  const TIME_FACTOR: f64 = 1000.;
  const MAX_PERIOD: f64 = 10000.;
  if dim % 2 == 1 {
    candle::bail!("{dim} is odd")
  }
  let dev = t.device();
  let half = dim / 2;
  let t = (t * TIME_FACTOR)?;
  let arange = Tensor::arange(0, half as u32, dev)?.to_dtype(candle::DType::F32)?;
  let freqs = (arange * (-MAX_PERIOD.ln() / half as f64))?.exp()?;
  let args = t.unsqueeze(1)?.to_dtype(candle::DType::F32)?.broadcast_mul(&freqs.unsqueeze(0)?)?;
  let emb = Tensor::cat(&[args.cos()?, args.sin()?], D::Minus1)?.to_dtype(dtype)?;
  Ok(emb)
}

#[derive(Debug, Clone)]
pub struct EmbedNd {
  #[allow(unused)]
  dim: usize,
  theta: usize,
  axes_dim: Vec<usize>,
}

impl EmbedNd {
  pub fn new(dim: usize, theta: usize, axes_dim: Vec<usize>) -> Self {
    Self { dim, theta, axes_dim }
  }
}

impl candle::Module for EmbedNd {
  fn forward(&self, ids: &Tensor) -> Result<Tensor> {
    let n_axes = ids.dim(D::Minus1)?;
    let mut emb = Vec::with_capacity(n_axes);
    for idx in 0..n_axes {
      let r = rope(&ids.get_on_dim(D::Minus1, idx)?, self.axes_dim[idx], self.theta)?;
      emb.push(r)
    }
    let emb = Tensor::cat(&emb, 2)?;
    emb.unsqueeze(1)
  }
}

impl DeviceTransferable for EmbedNd {
  fn to_device(&self, _device: &Device) -> Result<Self> {
    // EmbedNd doesn't contain any tensors, just configuration
    Ok(self.clone())
  }
}

#[derive(Debug, Clone)]
pub struct MlpEmbedder {
  in_layer: Linear,
  out_layer: Linear,
}

impl MlpEmbedder {
  fn new(in_sz: usize, h_sz: usize, vb: VarBuilder) -> Result<Self> {
    let in_layer = candle_nn::linear(in_sz, h_sz, vb.pp("in_layer"))?;
    let out_layer = candle_nn::linear(h_sz, h_sz, vb.pp("out_layer"))?;
    Ok(Self { in_layer, out_layer })
  }
}

impl candle::Module for MlpEmbedder {
  fn forward(&self, xs: &Tensor) -> Result<Tensor> {
    xs.apply(&self.in_layer)?.silu()?.apply(&self.out_layer)
  }
}

impl DeviceTransferable for MlpEmbedder {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { in_layer: self.in_layer.to_device(device)?, out_layer: self.out_layer.to_device(device)? })
  }
}

#[derive(Debug, Clone)]
pub struct QkNorm {
  query_norm: RmsNorm,
  key_norm: RmsNorm,
}

impl QkNorm {
  fn new(dim: usize, vb: VarBuilder) -> Result<Self> {
    let query_norm = vb.get(dim, "query_norm.scale")?;
    let query_norm = RmsNorm::new(query_norm, 1e-6);
    let key_norm = vb.get(dim, "key_norm.scale")?;
    let key_norm = RmsNorm::new(key_norm, 1e-6);
    Ok(Self { query_norm, key_norm })
  }
}

struct ModulationOut {
  shift: Tensor,
  scale: Tensor,
  gate: Tensor,
}

impl ModulationOut {
  fn scale_shift(&self, xs: &Tensor) -> Result<Tensor> {
    xs.broadcast_mul(&(&self.scale + 1.)?)?.broadcast_add(&self.shift)
  }

  fn gate(&self, xs: &Tensor) -> Result<Tensor> {
    self.gate.broadcast_mul(xs)
  }
}

#[derive(Debug, Clone)]
struct Modulation1 {
  lin: Linear,
}

impl Modulation1 {
  fn new(dim: usize, vb: VarBuilder) -> Result<Self> {
    let lin = candle_nn::linear(dim, 3 * dim, vb.pp("lin"))?;
    Ok(Self { lin })
  }

  fn forward(&self, vec_: &Tensor) -> Result<ModulationOut> {
    let ys = vec_.silu()?.apply(&self.lin)?.unsqueeze(1)?.chunk(3, D::Minus1)?;
    if ys.len() != 3 {
      candle::bail!("unexpected len from chunk {ys:?}")
    }
    Ok(ModulationOut { shift: ys[0].clone(), scale: ys[1].clone(), gate: ys[2].clone() })
  }
}

#[derive(Debug, Clone)]
struct Modulation2 {
  lin: Linear,
}

impl Modulation2 {
  fn new(dim: usize, vb: VarBuilder) -> Result<Self> {
    let lin = candle_nn::linear(dim, 6 * dim, vb.pp("lin"))?;
    Ok(Self { lin })
  }

  fn forward(&self, vec_: &Tensor) -> Result<(ModulationOut, ModulationOut)> {
    let ys = vec_.silu()?.apply(&self.lin)?.unsqueeze(1)?.chunk(6, D::Minus1)?;
    if ys.len() != 6 {
      candle::bail!("unexpected len from chunk {ys:?}")
    }
    let mod1 = ModulationOut { shift: ys[0].clone(), scale: ys[1].clone(), gate: ys[2].clone() };
    let mod2 = ModulationOut { shift: ys[3].clone(), scale: ys[4].clone(), gate: ys[5].clone() };
    Ok((mod1, mod2))
  }
}

#[derive(Debug, Clone)]
pub struct SelfAttention {
  qkv: Linear,
  norm: QkNorm,
  proj: Linear,
  num_heads: usize,
}

impl SelfAttention {
  fn new(dim: usize, num_heads: usize, qkv_bias: bool, vb: VarBuilder) -> Result<Self> {
    let head_dim = dim / num_heads;
    let qkv = candle_nn::linear_b(dim, dim * 3, qkv_bias, vb.pp("qkv"))?;
    let norm = QkNorm::new(head_dim, vb.pp("norm"))?;
    let proj = candle_nn::linear(dim, dim, vb.pp("proj"))?;
    Ok(Self { qkv, norm, proj, num_heads })
  }

  fn qkv(&self, xs: &Tensor) -> Result<(Tensor, Tensor, Tensor)> {
    let qkv = xs.apply(&self.qkv)?;
    let (b, l, _khd) = qkv.dims3()?;
    let qkv = qkv.reshape((b, l, 3, self.num_heads, ()))?;
    let q = qkv.i((.., .., 0))?.transpose(1, 2)?;
    let k = qkv.i((.., .., 1))?.transpose(1, 2)?;
    let v = qkv.i((.., .., 2))?.transpose(1, 2)?;
    let q = q.apply(&self.norm.query_norm)?;
    let k = k.apply(&self.norm.key_norm)?;
    Ok((q, k, v))
  }

  #[allow(unused)]
  fn forward(&self, xs: &Tensor, pe: &Tensor) -> Result<Tensor> {
    let (q, k, v) = self.qkv(xs)?;
    attention(&q, &k, &v, pe)?.apply(&self.proj)
  }
}

#[derive(Debug, Clone)]
struct Mlp {
  lin1: Linear,
  lin2: Linear,
}

impl Mlp {
  fn new(in_sz: usize, mlp_sz: usize, vb: VarBuilder) -> Result<Self> {
    let lin1 = candle_nn::linear(in_sz, mlp_sz, vb.pp("0"))?;
    let lin2 = candle_nn::linear(mlp_sz, in_sz, vb.pp("2"))?;
    Ok(Self { lin1, lin2 })
  }
}

impl candle::Module for Mlp {
  fn forward(&self, xs: &Tensor) -> Result<Tensor> {
    xs.apply(&self.lin1)?.gelu()?.apply(&self.lin2)
  }
}

#[derive(Debug, Clone)]
pub struct DoubleStreamBlock {
  img_mod: Modulation2,
  img_norm1: LayerNorm,
  img_attn: SelfAttention,
  img_norm2: LayerNorm,
  img_mlp: Mlp,
  txt_mod: Modulation2,
  txt_norm1: LayerNorm,
  txt_attn: SelfAttention,
  txt_norm2: LayerNorm,
  txt_mlp: Mlp,
}

impl DeviceTransferable for DoubleStreamBlock {
  fn to_device(&self, _device: &Device) -> Result<Self> {
    Ok(Self { img_mod: self.img_mod.to_device(_device)?, img_norm1: self.img_norm1.to_device(_device)?, img_attn: self.img_attn.to_device(_device)?, img_norm2: self.img_norm2.to_device(_device)?, img_mlp: self.img_mlp.to_device(_device)?, txt_mod: self.txt_mod.to_device(_device)?, txt_norm1: self.txt_norm1.to_device(_device)?, txt_attn: self.txt_attn.to_device(_device)?, txt_norm2: self.txt_norm2.to_device(_device)?, txt_mlp: self.txt_mlp.to_device(_device)? })
  }
}

impl DoubleStreamBlock {
  fn new(cfg: &Config, vb: VarBuilder) -> Result<Self> {
    let h_sz = cfg.hidden_size;
    let mlp_sz = (h_sz as f64 * cfg.mlp_ratio) as usize;
    let img_mod = Modulation2::new(h_sz, vb.pp("img_mod"))?;
    let img_norm1 = layer_norm(h_sz, vb.pp("img_norm1"))?;
    let img_attn = SelfAttention::new(h_sz, cfg.num_heads, cfg.qkv_bias, vb.pp("img_attn"))?;
    let img_norm2 = layer_norm(h_sz, vb.pp("img_norm2"))?;
    let img_mlp = Mlp::new(h_sz, mlp_sz, vb.pp("img_mlp"))?;
    let txt_mod = Modulation2::new(h_sz, vb.pp("txt_mod"))?;
    let txt_norm1 = layer_norm(h_sz, vb.pp("txt_norm1"))?;
    let txt_attn = SelfAttention::new(h_sz, cfg.num_heads, cfg.qkv_bias, vb.pp("txt_attn"))?;
    let txt_norm2 = layer_norm(h_sz, vb.pp("txt_norm2"))?;
    let txt_mlp = Mlp::new(h_sz, mlp_sz, vb.pp("txt_mlp"))?;
    Ok(Self { img_mod, img_norm1, img_attn, img_norm2, img_mlp, txt_mod, txt_norm1, txt_attn, txt_norm2, txt_mlp })
  }

  fn forward(&self, img: &Tensor, txt: &Tensor, vec_: &Tensor, pe: &Tensor) -> Result<(Tensor, Tensor)> {
    let (img_mod1, img_mod2) = self.img_mod.forward(vec_)?; // shift, scale, gate
    let (txt_mod1, txt_mod2) = self.txt_mod.forward(vec_)?; // shift, scale, gate
    let img_modulated = img.apply(&self.img_norm1)?;
    let img_modulated = img_mod1.scale_shift(&img_modulated)?;
    let (img_q, img_k, img_v) = self.img_attn.qkv(&img_modulated)?;

    let txt_modulated = txt.apply(&self.txt_norm1)?;
    let txt_modulated = txt_mod1.scale_shift(&txt_modulated)?;
    let (txt_q, txt_k, txt_v) = self.txt_attn.qkv(&txt_modulated)?;

    let q = Tensor::cat(&[txt_q, img_q], 2)?;
    let k = Tensor::cat(&[txt_k, img_k], 2)?;
    let v = Tensor::cat(&[txt_v, img_v], 2)?;

    let attn = attention(&q, &k, &v, pe)?;
    let txt_attn = attn.narrow(1, 0, txt.dim(1)?)?;
    let img_attn = attn.narrow(1, txt.dim(1)?, attn.dim(1)? - txt.dim(1)?)?;

    let img = (img + img_mod1.gate(&img_attn.apply(&self.img_attn.proj)?))?;
    let img = (&img + img_mod2.gate(&img_mod2.scale_shift(&img.apply(&self.img_norm2)?)?.apply(&self.img_mlp)?)?)?;

    let txt = (txt + txt_mod1.gate(&txt_attn.apply(&self.txt_attn.proj)?))?;
    let txt = (&txt + txt_mod2.gate(&txt_mod2.scale_shift(&txt.apply(&self.txt_norm2)?)?.apply(&self.txt_mlp)?)?)?;

    Ok((img, txt))
  }
}

#[derive(Debug, Clone)]
pub struct SingleStreamBlock {
  linear1: Linear,
  linear2: Linear,
  norm: QkNorm,
  pre_norm: LayerNorm,
  modulation: Modulation1,
  h_sz: usize,
  mlp_sz: usize,
  num_heads: usize,
}

impl DeviceTransferable for SingleStreamBlock {
  fn to_device(&self, _device: &Device) -> Result<Self> {
    Ok(Self { linear1: self.linear1.to_device(_device)?, linear2: self.linear2.to_device(_device)?, norm: self.norm.to_device(_device)?, pre_norm: self.pre_norm.to_device(_device)?, modulation: self.modulation.to_device(_device)?, h_sz: self.h_sz, mlp_sz: self.mlp_sz, num_heads: self.num_heads })
  }
}

impl SingleStreamBlock {
  fn new(cfg: &Config, vb: VarBuilder) -> Result<Self> {
    let h_sz = cfg.hidden_size;
    let mlp_sz = (h_sz as f64 * cfg.mlp_ratio) as usize;
    let head_dim = h_sz / cfg.num_heads;
    let linear1 = candle_nn::linear(h_sz, h_sz * 3 + mlp_sz, vb.pp("linear1"))?;
    let linear2 = candle_nn::linear(h_sz + mlp_sz, h_sz, vb.pp("linear2"))?;
    let norm = QkNorm::new(head_dim, vb.pp("norm"))?;
    let pre_norm = layer_norm(h_sz, vb.pp("pre_norm"))?;
    let modulation = Modulation1::new(h_sz, vb.pp("modulation"))?;
    Ok(Self { linear1, linear2, norm, pre_norm, modulation, h_sz, mlp_sz, num_heads: cfg.num_heads })
  }

  fn forward(&self, xs: &Tensor, vec_: &Tensor, pe: &Tensor) -> Result<Tensor> {
    let mod_ = self.modulation.forward(vec_)?;
    let x_mod = mod_.scale_shift(&xs.apply(&self.pre_norm)?)?;
    let x_mod = x_mod.apply(&self.linear1)?;
    let qkv = x_mod.narrow(D::Minus1, 0, 3 * self.h_sz)?;
    let (b, l, _khd) = qkv.dims3()?;
    let qkv = qkv.reshape((b, l, 3, self.num_heads, ()))?;
    let q = qkv.i((.., .., 0))?.transpose(1, 2)?;
    let k = qkv.i((.., .., 1))?.transpose(1, 2)?;
    let v = qkv.i((.., .., 2))?.transpose(1, 2)?;
    let mlp = x_mod.narrow(D::Minus1, 3 * self.h_sz, self.mlp_sz)?;
    let q = q.apply(&self.norm.query_norm)?;
    let k = k.apply(&self.norm.key_norm)?;
    let attn = attention(&q, &k, &v, pe)?;
    let output = Tensor::cat(&[attn, mlp.gelu()?], 2)?.apply(&self.linear2)?;
    xs + mod_.gate(&output)
  }
}

#[derive(Debug, Clone)]
pub struct LastLayer {
  norm_final: LayerNorm,
  linear: Linear,
  ada_ln_modulation: Linear,
}

impl LastLayer {
  fn new(h_sz: usize, p_sz: usize, out_c: usize, vb: VarBuilder) -> Result<Self> {
    let norm_final = layer_norm(h_sz, vb.pp("norm_final"))?;
    let linear = candle_nn::linear(h_sz, p_sz * p_sz * out_c, vb.pp("linear"))?;
    let ada_ln_modulation = candle_nn::linear(h_sz, 2 * h_sz, vb.pp("adaLN_modulation.1"))?;
    Ok(Self { norm_final, linear, ada_ln_modulation })
  }

  fn forward(&self, xs: &Tensor, vec: &Tensor) -> Result<Tensor> {
    let chunks = vec.silu()?.apply(&self.ada_ln_modulation)?.chunk(2, 1)?;
    let (shift, scale) = (&chunks[0], &chunks[1]);
    let xs = xs.apply(&self.norm_final)?.broadcast_mul(&(scale.unsqueeze(1)? + 1.0)?)?.broadcast_add(&shift.unsqueeze(1)?)?;
    xs.apply(&self.linear)
  }
}

impl DeviceTransferable for LastLayer {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { norm_final: self.norm_final.to_device(device)?, linear: self.linear.to_device(device)?, ada_ln_modulation: self.ada_ln_modulation.to_device(device)? })
  }
}

#[derive(Debug, Clone)]
pub struct Flux {
  img_in: Linear,
  txt_in: Linear,
  time_in: MlpEmbedder,
  vector_in: MlpEmbedder,
  guidance_in: Option<MlpEmbedder>,
  pe_embedder: EmbedNd,
  double_blocks: Vec<DoubleStreamBlock>,
  single_blocks: Vec<SingleStreamBlock>,
  final_layer: LastLayer,
  max_active_blocks: usize,    // Maximum number of blocks to keep on GPU simultaneously
  prefetch_next_batch: bool,   // Whether to prefetch the next batch while processing the current one
  use_device_management: bool, // Whether to use device management (moving blocks between CPU/GPU)
}

impl Flux {
  pub fn new(cfg: &Config, vb: VarBuilder) -> Result<Self> {
    let img_in = candle_nn::linear(cfg.in_channels, cfg.hidden_size, vb.pp("img_in"))?;
    let txt_in = candle_nn::linear(cfg.context_in_dim, cfg.hidden_size, vb.pp("txt_in"))?;
    let mut double_blocks = Vec::with_capacity(cfg.depth);
    let vb_d = vb.pp("double_blocks");
    for idx in 0..cfg.depth {
      let db = DoubleStreamBlock::new(cfg, vb_d.pp(idx))?;
      double_blocks.push(db)
    }
    let mut single_blocks = Vec::with_capacity(cfg.depth_single_blocks);
    let vb_s = vb.pp("single_blocks");
    for idx in 0..cfg.depth_single_blocks {
      let sb = SingleStreamBlock::new(cfg, vb_s.pp(idx))?;
      single_blocks.push(sb)
    }
    let time_in = MlpEmbedder::new(256, cfg.hidden_size, vb.pp("time_in"))?;
    let vector_in = MlpEmbedder::new(cfg.vec_in_dim, cfg.hidden_size, vb.pp("vector_in"))?;
    let guidance_in = if cfg.guidance_embed {
      let mlp = MlpEmbedder::new(256, cfg.hidden_size, vb.pp("guidance_in"))?;
      Some(mlp)
    } else {
      None
    };
    let final_layer = LastLayer::new(cfg.hidden_size, 1, cfg.in_channels, vb.pp("final_layer"))?;
    let pe_dim = cfg.hidden_size / cfg.num_heads;
    let pe_embedder = EmbedNd::new(pe_dim, cfg.theta, cfg.axes_dim.to_vec());
    Ok(Self {
      img_in,
      txt_in,
      time_in,
      vector_in,
      guidance_in,
      pe_embedder,
      double_blocks,
      single_blocks,
      final_layer,
      max_active_blocks: 1,        // Default to keeping 1 block active
      prefetch_next_batch: false,  // Default to no prefetching
      use_device_management: true, // Default to using device management
    })
  }

  /// Create a new Flux model with everything initially on CPU, then selectively
  /// moving core components to GPU for better memory efficiency.
  /// This approach avoids the initial GPU memory spike.
  pub fn new_with_gpu_core(cfg: &Config, cpu_vb: VarBuilder, gpu_device: &Device) -> Result<Self> {
    // Step 1: Create model with all components on CPU
    // This is much more memory efficient as it never loads blocks to GPU
    let cpu_model = Self::new(cfg, cpu_vb)?;

    // Step 2: Move only the core components to GPU (keeping blocks on CPU)
    // This selectively moves the lightweight components that need to be on GPU
    // for efficient processing, while leaving the memory-heavy blocks on CPU
    Ok(Self {
      img_in: cpu_model.img_in.to_device(gpu_device)?,
      txt_in: cpu_model.txt_in.to_device(gpu_device)?,
      time_in: cpu_model.time_in.to_device(gpu_device)?,
      vector_in: cpu_model.vector_in.to_device(gpu_device)?,
      guidance_in: match cpu_model.guidance_in {
        Some(g) => Some(g.to_device(gpu_device)?),
        None => None,
      },
      pe_embedder: cpu_model.pe_embedder,
      double_blocks: cpu_model.double_blocks,
      single_blocks: cpu_model.single_blocks,
      final_layer: cpu_model.final_layer.to_device(gpu_device)?,
      max_active_blocks: cpu_model.max_active_blocks,
      prefetch_next_batch: cpu_model.prefetch_next_batch,
      use_device_management: cpu_model.use_device_management,
    })
  }

  /// Set the maximum number of active blocks to keep on GPU simultaneously
  pub fn set_max_active_blocks(&mut self, max_blocks: usize) {
    self.max_active_blocks = max_blocks;
  }

  /// Enable or disable prefetching of the next batch
  /// When enabled, this will attempt to load the next batch
  /// of blocks to GPU while processing the current batch
  pub fn set_prefetch_next_batch(&mut self, prefetch: bool) {
    self.prefetch_next_batch = prefetch;
  }

  /// Enable or disable device management
  /// When enabled (default), blocks are kept on CPU and only moved to GPU when needed
  /// When disabled, all blocks stay on their current device (typically GPU)
  pub fn set_use_device_management(&mut self, use_management: bool) {
    self.use_device_management = use_management;
  }
}

impl DeviceTransferable for Flux {
  fn to_device(&self, device: &Device) -> Result<Self> {
    let guidance_in = match &self.guidance_in {
      Some(g) => Some(g.to_device(device)?),
      None => None,
    };

    // When not using device management, move all blocks to the target device
    let double_blocks = if !self.use_device_management {
      let mut blocks = Vec::with_capacity(self.double_blocks.len());
      for block in &self.double_blocks {
        blocks.push(block.to_device(device)?);
      }
      blocks
    } else {
      // Otherwise keep them on their current device (CPU)
      self.double_blocks.clone()
    };

    let single_blocks = if !self.use_device_management {
      let mut blocks = Vec::with_capacity(self.single_blocks.len());
      for block in &self.single_blocks {
        blocks.push(block.to_device(device)?);
      }
      blocks
    } else {
      // Otherwise keep them on their current device (CPU)
      self.single_blocks.clone()
    };

    Ok(Self { img_in: self.img_in.to_device(device)?, txt_in: self.txt_in.to_device(device)?, time_in: self.time_in.to_device(device)?, vector_in: self.vector_in.to_device(device)?, guidance_in, pe_embedder: self.pe_embedder.clone(), double_blocks, single_blocks, final_layer: self.final_layer.to_device(device)?, max_active_blocks: self.max_active_blocks, prefetch_next_batch: self.prefetch_next_batch, use_device_management: self.use_device_management })
  }
}

impl super::WithForward for Flux {
  #[allow(clippy::too_many_arguments)]
  fn forward(&mut self, img: &Tensor, img_ids: &Tensor, txt: &Tensor, txt_ids: &Tensor, timesteps: &Tensor, y: &Tensor, guidance: Option<&Tensor>) -> Result<Tensor> {
    if self.use_device_management {
      self.forward_with_device_management(img, img_ids, txt, txt_ids, timesteps, y, guidance)
    } else {
      self.forward_without_device_management(img, img_ids, txt, txt_ids, timesteps, y, guidance)
    }
  }
}

// This would be the implementation with full device management when available
impl Flux {
  /// Forward implementation with no device management - keeps all blocks on their current device.
  /// This uses more GPU memory but may be faster since it avoids device transfers.
  #[allow(clippy::too_many_arguments)]
  fn forward_without_device_management(&mut self, img: &Tensor, img_ids: &Tensor, txt: &Tensor, txt_ids: &Tensor, timesteps: &Tensor, y: &Tensor, guidance: Option<&Tensor>) -> Result<Tensor> {
    // Initial setup and preparation
    if txt.rank() != 3 {
      candle::bail!("unexpected shape for txt {:?}", txt.shape())
    }
    if img.rank() != 3 {
      candle::bail!("unexpected shape for img {:?}", img.shape())
    }
    let dtype = img.dtype();
    let pe = {
      let ids = Tensor::cat(&[txt_ids, img_ids], 1)?;
      ids.apply(&self.pe_embedder)?
    };
    let mut txt = txt.apply(&self.txt_in)?;
    let mut img = img.apply(&self.img_in)?;
    let vec_ = timestep_embedding(timesteps, 256, dtype)?.apply(&self.time_in)?;
    let vec_ = match (self.guidance_in.as_ref(), guidance) {
      (Some(g_in), Some(guidance)) => (vec_ + timestep_embedding(guidance, 256, dtype)?.apply(g_in))?,
      _ => vec_,
    };
    let vec_ = (vec_ + y.apply(&self.vector_in))?;

    // Process all double blocks at once (they're already on the device)
    for block in &self.double_blocks {
      let (new_img, new_txt) = block.forward(&img, &txt, &vec_, &pe)?;
      img = new_img;
      txt = new_txt;
    }

    // Combine tensors for single block processing
    let mut img = Tensor::cat(&[&txt, &img], 1)?;

    // Process all single blocks at once (they're already on the device)
    for block in &self.single_blocks {
      img = block.forward(&img, &vec_, &pe)?;
    }

    // Extract the relevant part of the output
    let img = img.i((.., txt.dim(1)?..))?;

    // Apply final layer
    self.final_layer.forward(&img, &vec_)
  }

  /// Forward implementation with device management to reduce GPU memory usage.
  /// Blocks are kept on CPU and only moved to GPU when needed.
  #[allow(clippy::too_many_arguments)]
  fn forward_with_device_management(&mut self, img: &Tensor, img_ids: &Tensor, txt: &Tensor, txt_ids: &Tensor, timesteps: &Tensor, y: &Tensor, guidance: Option<&Tensor>) -> Result<Tensor> {
    // Initial setup and preparation
    if txt.rank() != 3 {
      candle::bail!("unexpected shape for txt {:?}", txt.shape())
    }
    if img.rank() != 3 {
      candle::bail!("unexpected shape for img {:?}", img.shape())
    }
    let dtype = img.dtype();
    let pe = {
      let ids = Tensor::cat(&[txt_ids, img_ids], 1)?;
      ids.apply(&self.pe_embedder)?
    };
    let mut txt = txt.apply(&self.txt_in)?;
    let mut img = img.apply(&self.img_in)?;
    let vec_ = timestep_embedding(timesteps, 256, dtype)?.apply(&self.time_in)?;
    let vec_ = match (self.guidance_in.as_ref(), guidance) {
      (Some(g_in), Some(guidance)) => (vec_ + timestep_embedding(guidance, 256, dtype)?.apply(g_in))?,
      _ => vec_,
    };
    let vec_ = (vec_ + y.apply(&self.vector_in))?;

    // Get original device for moving blocks back and forth
    let original_device = img.device().clone();

    // Calculate batch size (number of blocks to process at once)
    let batch_size = self.max_active_blocks;
    let num_double_batches = (self.double_blocks.len() + batch_size - 1) / batch_size;

    if self.prefetch_next_batch {
      println!("Processing {} double blocks in {} batches with prefetching enabled", self.double_blocks.len(), num_double_batches);
    } else {
      println!("Processing {} double blocks in {} batches", self.double_blocks.len(), num_double_batches);
    }

    // If prefetching is enabled, set up the first batch
    let mut next_batch: Option<Vec<DoubleStreamBlock>> = None;
    if self.prefetch_next_batch && num_double_batches > 1 {
      // Prefetch the first batch
      let mut prefetch_blocks = Vec::with_capacity(batch_size);
      for i in 0..batch_size.min(self.double_blocks.len()) {
        match self.double_blocks[i].to_device(&original_device) {
          Ok(block) => prefetch_blocks.push(block),
          Err(_) => prefetch_blocks.push(self.double_blocks[i].clone()),
        }
      }
      next_batch = Some(prefetch_blocks);
    }

    // Process double blocks in batches
    for batch_idx in 0..num_double_batches {
      let start_idx = batch_idx * batch_size;
      let end_idx = (start_idx + batch_size).min(self.double_blocks.len());

      // Get the current GPU blocks (either prefetched or newly loaded)
      let mut gpu_blocks = if let Some(prefetched) = next_batch.take() {
        prefetched
      } else {
        // If not prefetched, load now
        let mut blocks = Vec::with_capacity(end_idx - start_idx);
        for i in start_idx..end_idx {
          match self.double_blocks[i].to_device(&original_device) {
            Ok(block) => blocks.push(block),
            Err(_) => blocks.push(self.double_blocks[i].clone()),
          }
        }
        blocks
      };

      // Start prefetching the next batch if enabled and not the last batch
      if self.prefetch_next_batch && batch_idx < num_double_batches - 1 {
        let next_start = (batch_idx + 1) * batch_size;
        let next_end = (next_start + batch_size).min(self.double_blocks.len());

        // Create a prefetch vector
        let mut prefetch_blocks = Vec::with_capacity(next_end - next_start);
        for i in next_start..next_end {
          match self.double_blocks[i].to_device(&original_device) {
            Ok(block) => prefetch_blocks.push(block),
            Err(_) => prefetch_blocks.push(self.double_blocks[i].clone()),
          }
        }
        next_batch = Some(prefetch_blocks);
      }

      // Process blocks
      for block in &gpu_blocks {
        let (new_img, new_txt) = block.forward(&img, &txt, &vec_, &pe)?;
        img = new_img;
        txt = new_txt;
      }

      // Let GPU blocks go out of scope
    }

    // Combine tensors for single block processing
    let mut img = Tensor::cat(&[&txt, &img], 1)?;

    // Process single blocks in batches
    let num_single_batches = (self.single_blocks.len() + batch_size - 1) / batch_size;

    // Reset next_batch for single blocks processing
    let mut next_batch: Option<Vec<SingleStreamBlock>> = None;
    if self.prefetch_next_batch && num_single_batches > 1 {
      // Prefetch the first batch
      let mut prefetch_blocks = Vec::with_capacity(batch_size);
      for i in 0..batch_size.min(self.single_blocks.len()) {
        match self.single_blocks[i].to_device(&original_device) {
          Ok(block) => prefetch_blocks.push(block),
          Err(_) => prefetch_blocks.push(self.single_blocks[i].clone()),
        }
      }
      next_batch = Some(prefetch_blocks);
    }

    println!("Processing {} single blocks in {} batches", self.single_blocks.len(), num_single_batches);

    for batch_idx in 0..num_single_batches {
      let start_idx = batch_idx * batch_size;
      let end_idx = (start_idx + batch_size).min(self.single_blocks.len());

      // Get the current GPU blocks (either prefetched or newly loaded)
      let mut gpu_blocks = if let Some(prefetched) = next_batch.take() {
        prefetched
      } else {
        // If not prefetched, load now
        let mut blocks = Vec::with_capacity(end_idx - start_idx);
        for i in start_idx..end_idx {
          match self.single_blocks[i].to_device(&original_device) {
            Ok(block) => blocks.push(block),
            Err(_) => blocks.push(self.single_blocks[i].clone()),
          }
        }
        blocks
      };

      // Start prefetching the next batch if enabled and not the last batch
      if self.prefetch_next_batch && batch_idx < num_single_batches - 1 {
        let next_start = (batch_idx + 1) * batch_size;
        let next_end = (next_start + batch_size).min(self.single_blocks.len());

        // Create a prefetch vector
        let mut prefetch_blocks = Vec::with_capacity(next_end - next_start);
        for i in next_start..next_end {
          match self.single_blocks[i].to_device(&original_device) {
            Ok(block) => prefetch_blocks.push(block),
            Err(_) => prefetch_blocks.push(self.single_blocks[i].clone()),
          }
        }
        next_batch = Some(prefetch_blocks);
      }

      // Process blocks
      for block in &gpu_blocks {
        img = block.forward(&img, &vec_, &pe)?;
      }

      // Let GPU blocks go out of scope
    }

    // Extract the relevant part of the output
    let img = img.i((.., txt.dim(1)?..))?;

    // Apply final layer
    self.final_layer.forward(&img, &vec_)
  }
}

// Add DeviceTransferable for ModulationOut
impl DeviceTransferable for ModulationOut {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { shift: self.shift.to_device(device)?, scale: self.scale.to_device(device)?, gate: self.gate.to_device(device)? })
  }
}

// Replace conflicting implementations with placeholders
// These will use the default trait implementation
impl DeviceTransferable for Modulation1 {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { lin: self.lin.to_device(device)? })
  }
}
impl DeviceTransferable for Modulation2 {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { lin: self.lin.to_device(device)? })
  }
}
impl DeviceTransferable for QkNorm {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { query_norm: self.query_norm.to_device(device)?, key_norm: self.key_norm.to_device(device)? })
  }
}
impl DeviceTransferable for SelfAttention {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { qkv: self.qkv.to_device(device)?, norm: self.norm.to_device(device)?, proj: self.proj.to_device(device)?, num_heads: self.num_heads })
  }
}
impl DeviceTransferable for Mlp {
  fn to_device(&self, device: &Device) -> Result<Self> {
    Ok(Self { lin1: self.lin1.to_device(device)?, lin2: self.lin2.to_device(device)? })
  }
}
