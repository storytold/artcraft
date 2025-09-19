//! 2D UNet Denoising Models
//!
//! The 2D Unet models take as input a noisy sample and the current diffusion
//! timestep and return a denoised version of the input.
use super::embeddings::{TimestepEmbedding, Timesteps};
use super::unet_2d_blocks::*;
use crate::models::with_tracing::{conv2d, Conv2d};
use candle::{DType, Device, Result, Tensor};
use candle_nn as nn;
use candle_nn::Module;
use log::debug;
use std::collections::HashMap;

// fn save_tensor_as_numpy(tensor: &Tensor, filename: &str) -> Result<()> {
//     // Use Candle's built-in NPY serialization
//     tensor.write_npy(filename).map_err(|e| anyhow::anyhow!("{}", e))
// }
#[derive(Debug, Clone, Copy)]
pub struct BlockConfig {
    pub out_channels: usize,
    /// When `None` no cross-attn is used, when `Some(d)` then cross-attn is used and `d` is the
    /// number of transformer blocks to be used.
    pub use_cross_attn: Option<usize>,
    pub attention_head_dim: usize,
}

#[derive(Debug, Clone)]
pub struct UNet2DConditionModelConfig {
    pub center_input_sample: bool,
    pub flip_sin_to_cos: bool,
    pub freq_shift: f64,
    pub blocks: Vec<BlockConfig>,
    pub layers_per_block: usize,
    pub downsample_padding: usize,
    pub mid_block_scale_factor: f64,
    pub norm_num_groups: usize,
    pub norm_eps: f64,
    pub cross_attention_dim: usize,
    pub sliced_attention_size: Option<usize>,
    pub use_linear_projection: bool,
    pub time_cond_proj_dim: Option<usize>,
    pub time_embed_dim: Option<usize>,
}

impl Default for UNet2DConditionModelConfig {
    fn default() -> Self {
        Self {
            center_input_sample: false,
            flip_sin_to_cos: true,
            freq_shift: 0.,
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
            mid_block_scale_factor: 1.,
            norm_num_groups: 32,
            norm_eps: 1e-5,
            cross_attention_dim: 1280,
            sliced_attention_size: None,
            use_linear_projection: false,
            time_cond_proj_dim: Some(256),
            time_embed_dim: None,
        }
    }
}

#[derive(Debug)]
pub(crate) enum UNetDownBlock {
    Basic(DownBlock2D),
    CrossAttn(CrossAttnDownBlock2D),
}

#[derive(Debug)]
enum UNetUpBlock {
    Basic(UpBlock2D),
    CrossAttn(CrossAttnUpBlock2D),
}

#[derive(Debug)]
pub struct UNet2DConditionModel {
    conv_in: Conv2d,
    time_proj: Timesteps,
    time_embedding: TimestepEmbedding,
    down_blocks: Vec<UNetDownBlock>,
    mid_block: UNetMidBlock2DCrossAttn,
    up_blocks: Vec<UNetUpBlock>,
    conv_norm_out: nn::GroupNorm,
    conv_out: Conv2d,
    span: tracing::Span,
    config: UNet2DConditionModelConfig,
}

impl UNet2DConditionModel {
    pub fn new(
        vs: nn::VarBuilder,
        in_channels: usize,
        out_channels: usize,
        use_flash_attn: bool,
        config: UNet2DConditionModelConfig,
    ) -> Result<Self> {
        let n_blocks = config.blocks.len();
        let b_channels = config.blocks[0].out_channels;
        let bl_channels = config.blocks.last().unwrap().out_channels;
        let bl_attention_head_dim = config.blocks.last().unwrap().attention_head_dim;
        let time_embed_dim = config.time_embed_dim.unwrap_or(b_channels * 4);
        let conv_cfg = nn::Conv2dConfig {
            padding: 1,
            ..Default::default()
        };

        // Log important configuration details
        debug!("Creating UNet2DConditionModel with {} blocks", n_blocks);
        if let Some(proj_dim) = config.time_cond_proj_dim {
            debug!("UNet configured with time_cond_proj_dim: {}", proj_dim);
            debug!(
                "This means the model expects guidance embeddings of dimension {}",
                proj_dim
            );
        }

        let conv_in = conv2d(in_channels, b_channels, 3, conv_cfg, vs.pp("conv_in"))?;

        let time_proj = Timesteps::new(b_channels, config.flip_sin_to_cos, config.freq_shift);
        let time_embedding =
            TimestepEmbedding::new(vs.pp("time_embedding"), b_channels, time_embed_dim)?;

        let vs_db = vs.pp("down_blocks");
        let down_blocks = (0..n_blocks)
            .map(|i| {
                let BlockConfig {
                    out_channels,
                    use_cross_attn,
                    attention_head_dim,
                } = config.blocks[i];

                // Enable automatic attention slicing if the config sliced_attention_size is set to 0.
                let sliced_attention_size = match config.sliced_attention_size {
                    Some(0) => Some(attention_head_dim / 2),
                    _ => config.sliced_attention_size,
                };

                let in_channels = if i > 0 {
                    config.blocks[i - 1].out_channels
                } else {
                    b_channels
                };
                let db_cfg = DownBlock2DConfig {
                    num_layers: config.layers_per_block,
                    resnet_eps: config.norm_eps,
                    resnet_groups: config.norm_num_groups,
                    add_downsample: i < n_blocks - 1,
                    downsample_padding: config.downsample_padding,
                    ..Default::default()
                };
                if let Some(transformer_layers_per_block) = use_cross_attn {
                    let config = CrossAttnDownBlock2DConfig {
                        downblock: db_cfg,
                        attn_num_head_channels: attention_head_dim,
                        cross_attention_dim: config.cross_attention_dim,
                        sliced_attention_size,
                        use_linear_projection: config.use_linear_projection,
                        transformer_layers_per_block,
                    };
                    let block = CrossAttnDownBlock2D::new(
                        vs_db.pp(i.to_string()),
                        in_channels,
                        out_channels,
                        Some(time_embed_dim),
                        use_flash_attn,
                        config,
                    )?;
                    Ok(UNetDownBlock::CrossAttn(block))
                } else {
                    let block = DownBlock2D::new(
                        vs_db.pp(i.to_string()),
                        in_channels,
                        out_channels,
                        Some(time_embed_dim),
                        db_cfg,
                    )?;
                    Ok(UNetDownBlock::Basic(block))
                }
            })
            .collect::<Result<Vec<_>>>()?;

        // https://github.com/huggingface/diffusers/blob/a76f2ad538e73b34d5fe7be08c8eb8ab38c7e90c/src/diffusers/models/unet_2d_condition.py#L462
        let mid_transformer_layers_per_block = match config.blocks.last() {
            None => 1,
            Some(block) => block.use_cross_attn.unwrap_or(1),
        };
        let mid_cfg = UNetMidBlock2DCrossAttnConfig {
            resnet_eps: config.norm_eps,
            output_scale_factor: config.mid_block_scale_factor,
            cross_attn_dim: config.cross_attention_dim,
            attn_num_head_channels: bl_attention_head_dim,
            resnet_groups: Some(config.norm_num_groups),
            use_linear_projection: config.use_linear_projection,
            transformer_layers_per_block: mid_transformer_layers_per_block,
            ..Default::default()
        };

        let mid_block = UNetMidBlock2DCrossAttn::new(
            vs.pp("mid_block"),
            bl_channels,
            Some(time_embed_dim),
            use_flash_attn,
            mid_cfg,
        )?;

        let vs_ub = vs.pp("up_blocks");
        let up_blocks = (0..n_blocks)
            .map(|i| {
                let BlockConfig {
                    out_channels,
                    use_cross_attn,
                    attention_head_dim,
                } = config.blocks[n_blocks - 1 - i];

                // Enable automatic attention slicing if the config sliced_attention_size is set to 0.
                let sliced_attention_size = match config.sliced_attention_size {
                    Some(0) => Some(attention_head_dim / 2),
                    _ => config.sliced_attention_size,
                };

                let prev_out_channels = if i > 0 {
                    config.blocks[n_blocks - i].out_channels
                } else {
                    bl_channels
                };
                let in_channels = {
                    let index = if i == n_blocks - 1 {
                        0
                    } else {
                        n_blocks - i - 2
                    };
                    config.blocks[index].out_channels
                };
                let ub_cfg = UpBlock2DConfig {
                    num_layers: config.layers_per_block + 1,
                    resnet_eps: config.norm_eps,
                    resnet_groups: config.norm_num_groups,
                    add_upsample: i < n_blocks - 1,
                    ..Default::default()
                };
                if let Some(transformer_layers_per_block) = use_cross_attn {
                    let config = CrossAttnUpBlock2DConfig {
                        upblock: ub_cfg,
                        attn_num_head_channels: attention_head_dim,
                        cross_attention_dim: config.cross_attention_dim,
                        sliced_attention_size,
                        use_linear_projection: config.use_linear_projection,
                        transformer_layers_per_block,
                    };
                    let block = CrossAttnUpBlock2D::new(
                        vs_ub.pp(i.to_string()),
                        in_channels,
                        prev_out_channels,
                        out_channels,
                        Some(time_embed_dim),
                        use_flash_attn,
                        config,
                    )?;
                    Ok(UNetUpBlock::CrossAttn(block))
                } else {
                    let block = UpBlock2D::new(
                        vs_ub.pp(i.to_string()),
                        in_channels,
                        prev_out_channels,
                        out_channels,
                        Some(time_embed_dim),
                        ub_cfg,
                    )?;
                    Ok(UNetUpBlock::Basic(block))
                }
            })
            .collect::<Result<Vec<_>>>()?;

        let conv_norm_out = nn::group_norm(
            config.norm_num_groups,
            b_channels,
            config.norm_eps,
            vs.pp("conv_norm_out"),
        )?;
        let conv_out = conv2d(b_channels, out_channels, 3, conv_cfg, vs.pp("conv_out"))?;
        let span = tracing::span!(tracing::Level::TRACE, "unet2d");
        Ok(Self {
            conv_in,
            time_proj,
            time_embedding,
            down_blocks,
            mid_block,
            up_blocks,
            conv_norm_out,
            conv_out,
            span,
            config,
        })
    }

    pub fn forward(
        &self,
        xs: &Tensor,
        timestep: f64,
        encoder_hidden_states: &Tensor,
    ) -> Result<Tensor> {
        let _enter = self.span.enter();
        self.forward_with_additional_residuals(xs, timestep, encoder_hidden_states, None, None)
    }

    pub fn forward_with_additional_residuals(
        &self,
        xs: &Tensor,
        timestep: f64,
        encoder_hidden_states: &Tensor,
        down_block_additional_residuals: Option<&[Tensor]>,
        mid_block_additional_residual: Option<&Tensor>,
    ) -> Result<Tensor> {
        let (bsize, _channels, height, width) = xs.dims4()?;
        let device = xs.device();
        let n_blocks = self.config.blocks.len();
        let num_upsamplers = n_blocks - 1;
        let default_overall_up_factor = 2usize.pow(num_upsamplers as u32);
        let forward_upsample_size =
            height % default_overall_up_factor != 0 || width % default_overall_up_factor != 0;
        // 0. center input if necessary
        let xs = if self.config.center_input_sample {
            ((xs * 2.0)? - 1.0)?
        } else {
            xs.clone()
        };
        // 1. time
        let emb = (Tensor::ones(bsize, xs.dtype(), device)? * timestep)?;
        let emb = self.time_proj.forward(&emb)?;
        let time_emb = self.time_embedding.forward(&emb)?;
        // 2. pre-process
        let xs = self.conv_in.forward(&xs)?;
        // 3. down
        let mut down_block_res_xs = vec![xs.clone()];
        let mut xs = xs;
        for down_block in self.down_blocks.iter() {
            let (_xs, res_xs) = match down_block {
                UNetDownBlock::Basic(b) => b.forward(&xs, Some(&time_emb))?,
                UNetDownBlock::CrossAttn(b) => {
                    b.forward(&xs, Some(&time_emb), Some(encoder_hidden_states))?
                }
            };
            down_block_res_xs.extend(res_xs);
            xs = _xs;
        }

        let new_down_block_res_xs =
            if let Some(down_block_additional_residuals) = down_block_additional_residuals {
                let mut v = vec![];
                // A previous version of this code had a bug because of the addition being made
                // in place via += hence modifying the input of the mid block.
                for (i, residuals) in down_block_additional_residuals.iter().enumerate() {
                    v.push((&down_block_res_xs[i] + residuals)?)
                }
                v
            } else {
                down_block_res_xs
            };
        let mut down_block_res_xs = new_down_block_res_xs;

        // 4. mid
        let xs = self
            .mid_block
            .forward(&xs, Some(&time_emb), Some(encoder_hidden_states))?;
        let xs = match mid_block_additional_residual {
            None => xs,
            Some(m) => (m + xs)?,
        };
        // 5. up
        let mut xs = xs;
        let mut upsample_size = None;
        for (i, up_block) in self.up_blocks.iter().enumerate() {
            let n_resnets = match up_block {
                UNetUpBlock::Basic(b) => b.resnets.len(),
                UNetUpBlock::CrossAttn(b) => b.upblock.resnets.len(),
            };
            let res_xs = down_block_res_xs.split_off(down_block_res_xs.len() - n_resnets);
            if i < n_blocks - 1 && forward_upsample_size {
                let (_, _, h, w) = down_block_res_xs.last().unwrap().dims4()?;
                upsample_size = Some((h, w))
            }
            xs = match up_block {
                UNetUpBlock::Basic(b) => b.forward(&xs, &res_xs, Some(&time_emb), upsample_size)?,
                UNetUpBlock::CrossAttn(b) => b.forward(
                    &xs,
                    &res_xs,
                    Some(&time_emb),
                    upsample_size,
                    Some(encoder_hidden_states),
                )?,
            };
        }
        // 6. post-process
        let xs = self.conv_norm_out.forward(&xs)?;
        let xs = nn::ops::silu(&xs)?;
        self.conv_out.forward(&xs)
    }

    pub fn forward_with_guidance(
        &self,
        xs: &Tensor,
        timestep: f64,
        encoder_hidden_states: &Tensor,
        guidance_embedding: Option<&Tensor>,
    ) -> Result<Tensor> {
        let _enter = self.span.enter();
        let (bsize, _channels, height, width) = xs.dims4()?;
        let device = xs.device();
        let n_blocks = self.config.blocks.len();
        let num_upsamplers = n_blocks - 1;
        let default_overall_up_factor = 2usize.pow(num_upsamplers as u32);
        let forward_upsample_size =
            height % default_overall_up_factor != 0 || width % default_overall_up_factor != 0;

        // 0. center input if necessary
        let xs = if self.config.center_input_sample {
            ((xs * 2.0)? - 1.0)?
        } else {
            xs.clone()
        };

        // 1. time
        let emb = (Tensor::ones(bsize, xs.dtype(), device)? * timestep)?;
        let emb = self.time_proj.forward(&emb)?;
        let mut time_emb = self.time_embedding.forward(&emb)?;

        // Add guidance embedding if provided
        if let Some(guidance_emb) = guidance_embedding {
            // Get dimensions of both embeddings
            let (batch_size, time_emb_dim) = time_emb.dims2()?;
            let (guidance_batch, guidance_emb_dim) = guidance_emb.dims2()?;

            debug!("==== Guidance Embedding Integration ====");
            debug!("Time embedding dims: [{}, {}]", batch_size, time_emb_dim);
            debug!(
                "Guidance embedding dims: [{}, {}]",
                guidance_batch, guidance_emb_dim
            );

            // Use time_cond_proj_dim from config to determine expected guidance embedding dimension
            let expected_guidance_dim = self.config.time_cond_proj_dim.unwrap_or(time_emb_dim);
            debug!(
                "Expected guidance dimension from config: {}",
                expected_guidance_dim
            );

            // Check if dimensions match the expected projection dimension
            let processed_guidance_emb = if guidance_emb_dim != time_emb_dim {
                // Convert guidance_emb to f32 for calculations
                let guidance_emb_f32 = guidance_emb.to_dtype(DType::F32)?;
                debug!("Converting guidance embedding to F32 for processing");

                // If the guidance embedding dimension matches the expected projection dimension,
                // we need to project it to match the time embedding dimension
                if guidance_emb_dim == expected_guidance_dim {
                    debug!(
                        "Projecting guidance embedding from {} to {}",
                        guidance_emb_dim, time_emb_dim
                    );

                    // Use linear interpolation
                    let src_positions: Vec<f32> = (0..guidance_emb_dim)
                        .map(|i| i as f32 / (guidance_emb_dim - 1) as f32)
                        .collect();
                    let dst_positions: Vec<f32> = (0..time_emb_dim)
                        .map(|i| i as f32 / (time_emb_dim - 1) as f32)
                        .collect();

                    // Get guidance embedding data (now f32)
                    let guidance_data = guidance_emb_f32
                        .reshape((guidance_emb_dim,))?
                        .to_vec1::<f32>()?;
                    debug!(
                        "Reshaping guidance data to vector of length {}",
                        guidance_data.len()
                    );

                    // Perform linear interpolation
                    let mut interpolated_data = Vec::with_capacity(time_emb_dim);
                    for &t in &dst_positions {
                        // Find the two source positions that surround the target position
                        let mut i = 0;
                        while i < src_positions.len() - 1 && src_positions[i + 1] < t {
                            i += 1;
                        }

                        if i == src_positions.len() - 1 {
                            // At or beyond the last position
                            interpolated_data.push(guidance_data[i]);
                        } else if t <= src_positions[0] {
                            // At or before the first position
                            interpolated_data.push(guidance_data[0]);
                        } else {
                            // Linear interpolation between two points
                            let t_norm =
                                (t - src_positions[i]) / (src_positions[i + 1] - src_positions[i]);
                            let value =
                                guidance_data[i] * (1.0 - t_norm) + guidance_data[i + 1] * t_norm;
                            interpolated_data.push(value);
                        }
                    }

                    debug!(
                        "Created interpolated data of length {}",
                        interpolated_data.len()
                    );

                    // Create tensor and convert to time_emb's dtype
                    let tensor = Tensor::from_vec(interpolated_data, (1, time_emb_dim), device)?;
                    let result = tensor.to_dtype(time_emb.dtype())?;
                    debug!(
                        "Final projected guidance embedding shape: {:?}",
                        result.shape()
                    );
                    result
                } else {
                    // Unusual case - dimensions don't match expected pattern
                    debug!("Warning: Guidance embedding dimension ({}) doesn't match expected projection dimension ({})", 
                             guidance_emb_dim, expected_guidance_dim);

                    // Fallback to generic interpolation
                    let guidance_data = guidance_emb_f32
                        .reshape((guidance_emb_dim,))?
                        .to_vec1::<f32>()?;

                    let src_positions: Vec<f32> = (0..guidance_emb_dim)
                        .map(|i| i as f32 / (guidance_emb_dim - 1) as f32)
                        .collect();
                    let dst_positions: Vec<f32> = (0..time_emb_dim)
                        .map(|i| i as f32 / (time_emb_dim - 1) as f32)
                        .collect();

                    let mut interpolated_data = Vec::with_capacity(time_emb_dim);
                    for &t in &dst_positions {
                        let mut i = 0;
                        while i < src_positions.len() - 1 && src_positions[i + 1] < t {
                            i += 1;
                        }

                        if i == src_positions.len() - 1 {
                            interpolated_data.push(guidance_data[i]);
                        } else if t <= src_positions[0] {
                            interpolated_data.push(guidance_data[0]);
                        } else {
                            let t_norm =
                                (t - src_positions[i]) / (src_positions[i + 1] - src_positions[i]);
                            let value =
                                guidance_data[i] * (1.0 - t_norm) + guidance_data[i + 1] * t_norm;
                            interpolated_data.push(value);
                        }
                    }

                    debug!(
                        "Created interpolated data of length {}",
                        interpolated_data.len()
                    );
                    let tensor = Tensor::from_vec(interpolated_data, (1, time_emb_dim), device)?;
                    let result = tensor.to_dtype(time_emb.dtype())?;
                    debug!(
                        "Final fallback guidance embedding shape: {:?}",
                        result.shape()
                    );
                    result
                }
            } else {
                // Dimensions match, no processing needed
                debug!("Guidance dimension already matches time embedding dimension, no interpolation needed");
                let result = guidance_emb
                    .reshape((1, time_emb_dim))?
                    .to_dtype(time_emb.dtype())?;
                debug!("Reshaped guidance embedding shape: {:?}", result.shape());
                result
            };

            // Expand to match batch size if needed
            let expanded_guidance = processed_guidance_emb.broadcast_as(time_emb.shape())?;
            debug!(
                "Expanded guidance embedding shape: {:?}",
                expanded_guidance.shape()
            );

            // Save the processed and expanded guidance embeddings to disk if requested
            if let Ok(save_dir) = std::env::var("CANDLE_SAVE_TENSORS_DIR") {
                // Save pre-expansion (original projection)
                let proc_path = format!("{}/unet_processed_guidance_embedding.npy", save_dir);
                debug!("Saving processed guidance embedding to {}", proc_path);
                if let Err(e) = processed_guidance_emb.write_npy(&proc_path) {
                    debug!("Error saving processed guidance embedding: {}", e);
                } else {
                    debug!(
                        "Successfully saved processed guidance embedding to {}",
                        proc_path
                    );
                }

                // Save post-expansion (final tensor used for addition to time_emb)
                let exp_path = format!("{}/unet_expanded_guidance_embedding.npy", save_dir);
                debug!("Saving expanded guidance embedding to {}", exp_path);
                if let Err(e) = expanded_guidance.write_npy(&exp_path) {
                    debug!("Error saving expanded guidance embedding: {}", e);
                } else {
                    debug!(
                        "Successfully saved expanded guidance embedding to {}",
                        exp_path
                    );
                }
            }

            // Add to time embeddings
            time_emb = (time_emb + expanded_guidance)?;
            debug!(
                "Final time embedding with guidance shape: {:?}",
                time_emb.shape()
            );
            debug!("==== End Guidance Integration ====");
        }

        // 2. pre-process
        let xs = self.conv_in.forward(&xs)?;

        // 3. down
        let mut down_block_res_xs = vec![xs.clone()];
        let mut xs = xs;
        for down_block in self.down_blocks.iter() {
            let (_xs, res_xs) = match down_block {
                UNetDownBlock::Basic(b) => b.forward(&xs, Some(&time_emb))?,
                UNetDownBlock::CrossAttn(b) => {
                    b.forward(&xs, Some(&time_emb), Some(encoder_hidden_states))?
                }
            };
            down_block_res_xs.extend(res_xs);
            xs = _xs;
        }

        // 4. mid
        let xs = self
            .mid_block
            .forward(&xs, Some(&time_emb), Some(encoder_hidden_states))?;

        // 5. up
        let mut xs = xs;
        let mut upsample_size = None;
        for (i, up_block) in self.up_blocks.iter().enumerate() {
            let n_resnets = match up_block {
                UNetUpBlock::Basic(b) => b.resnets.len(),
                UNetUpBlock::CrossAttn(b) => b.upblock.resnets.len(),
            };
            let res_xs = down_block_res_xs.split_off(down_block_res_xs.len() - n_resnets);
            if i < n_blocks - 1 && forward_upsample_size {
                let (_, _, h, w) = down_block_res_xs.last().unwrap().dims4()?;
                upsample_size = Some((h, w))
            }
            xs = match up_block {
                UNetUpBlock::Basic(b) => b.forward(&xs, &res_xs, Some(&time_emb), upsample_size)?,
                UNetUpBlock::CrossAttn(b) => b.forward(
                    &xs,
                    &res_xs,
                    Some(&time_emb),
                    upsample_size,
                    Some(encoder_hidden_states),
                )?,
            };
        }

        // 6. post-process
        let xs = self.conv_norm_out.forward(&xs)?;
        let xs = nn::ops::silu(&xs)?;
        self.conv_out.forward(&xs)
    }

    pub fn load_with_weights(
        config: UNet2DConditionModelConfig,
        weights: HashMap<String, Tensor>,
        device: &Device,
        use_flash_attn: bool,
        dtype: DType,
    ) -> Result<Self> {
        let vb = nn::VarBuilder::from_tensors(weights, dtype, device);
        Self::new(vb, 4, 4, use_flash_attn, config)
    }
}
