use super::schedulers::{betas_for_alpha_bar, BetaSchedule, PredictionType};
use candle::{DType, Device, IndexOp, Result, Tensor};
use log::debug;

const FINAL_ALPHA_CUMPROD: f64 = 0.9991499781608582;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LCMVarianceType {
    FixedSmall,
    FixedSmallLog,
    FixedLarge,
    FixedLargeLog,
    Learned,
}

impl Default for LCMVarianceType {
    fn default() -> Self {
        Self::FixedSmall
    }
}

#[derive(Debug, Clone)]
pub struct LCMSchedulerConfig {
    /// The value of beta at the beginning of training.
    pub beta_start: f64,
    /// The value of beta at the end of training.
    pub beta_end: f64,
    /// How beta evolved during training.
    pub beta_schedule: BetaSchedule,
    /// Option to predicted sample between -1 and 1 for numerical stability.
    pub clip_sample: bool,
    /// Option to clip the variance used when adding noise to the denoised sample.
    pub variance_type: LCMVarianceType,
    /// prediction type of the scheduler function
    pub prediction_type: PredictionType,
    /// number of diffusion steps used to train the model.
    pub train_timesteps: usize,
    /// timestep scaling factor
    pub timestep_scaling: f64,
}

impl Default for LCMSchedulerConfig {
    fn default() -> Self {
        Self {
            beta_start: 0.00085,
            beta_end: 0.012,
            beta_schedule: BetaSchedule::ScaledLinear,
            clip_sample: false,
            variance_type: LCMVarianceType::FixedSmall,
            prediction_type: PredictionType::Epsilon,
            train_timesteps: 1000,
            timestep_scaling: 10.0,
        }
    }
}

pub struct LCMScheduler {
    alphas_cumprod: Vec<f64>,
    init_noise_sigma: f64,
    timesteps: Vec<usize>,
    step_ratio: usize,
    pub config: LCMSchedulerConfig,
}

impl LCMScheduler {
    pub fn new(inference_steps: usize, strength: f64, config: LCMSchedulerConfig) -> Result<Self> {
        let betas = match config.beta_schedule {
            BetaSchedule::ScaledLinear => super::utils::linspace(
                config.beta_start.sqrt(),
                config.beta_end.sqrt(),
                config.train_timesteps,
            )?
            .sqr()?,
            BetaSchedule::Linear => {
                super::utils::linspace(config.beta_start, config.beta_end, config.train_timesteps)?
            }
            BetaSchedule::SquaredcosCapV2 => betas_for_alpha_bar(config.train_timesteps, 0.999)?,
        };

        let betas = betas.to_vec1::<f64>()?;
        let mut alphas_cumprod = Vec::with_capacity(betas.len());
        let mut alpha_prod = 1f64;
        for &beta in betas.iter() {
            let alpha = 1.0 - beta;
            alpha_prod *= alpha;
            alphas_cumprod.push(alpha_prod);
        }

        // Create proper LCM timesteps to match diffusers
        let timesteps = LCMScheduler::get_timesteps_for_steps(inference_steps, strength);
        let step_ratio = config.train_timesteps / inference_steps;

        debug!("Using LCM timesteps: {:?}", timesteps);

        Ok(Self {
            alphas_cumprod,
            init_noise_sigma: 1.0,
            timesteps,
            step_ratio,
            config,
        })
    }

    fn get_variance(&self, timestep: usize) -> f64 {
        let prev_t = timestep as isize - self.step_ratio as isize;
        let alpha_prod_t = self.alphas_cumprod[timestep];
        let alpha_prod_t_prev = if prev_t >= 0 {
            self.alphas_cumprod[prev_t as usize]
        } else {
            1.0
        };
        let current_beta_t = 1. - alpha_prod_t / alpha_prod_t_prev;

        // For t > 0, compute predicted variance βt (see formula (6) and (7) from [the pdf](https://arxiv.org/pdf/2006.11239.pdf))
        // and sample from it to get previous sample
        // x_{t-1} ~ N(pred_prev_sample, variance) == add variance to pred_sample
        let variance = (1. - alpha_prod_t_prev) / (1. - alpha_prod_t) * current_beta_t;

        // retrieve variance
        match self.config.variance_type {
            LCMVarianceType::FixedSmall => variance.max(1e-20),
            // for rl-diffuser https://arxiv.org/abs/2205.09991
            LCMVarianceType::FixedSmallLog => {
                let variance = variance.max(1e-20).ln();
                (variance * 0.5).exp()
            }
            LCMVarianceType::FixedLarge => current_beta_t,
            LCMVarianceType::FixedLargeLog => current_beta_t.ln(),
            LCMVarianceType::Learned => variance,
        }
    }

    pub fn timesteps(&self) -> &[usize] {
        self.timesteps.as_slice()
    }

    ///  Ensures interchangeability with schedulers that need to scale the denoising model input
    /// depending on the current timestep.
    pub fn scale_model_input(&self, sample: Tensor, _timestep: usize) -> Tensor {
        sample
    }
    fn get_scalings_for_boundary_condition_discrete(&self, timestep: usize) -> (f64, f64) {
        let sigma_data: f64 = 0.5;
        let scaled_timestep = (timestep as f64) * self.config.timestep_scaling;
        let sigma_squared = sigma_data.powi(2);
        let scaled_timestep_squared = scaled_timestep.powi(2);
        let denominator = scaled_timestep_squared + sigma_squared;

        debug!(
            "Boundary condition for timestep {}, scaled timestep {}",
            timestep, scaled_timestep
        );
        debug!(
            "  Intermediate values: sigma_data^2: {:.20}, scaled_timestep^2: {:.20}, denominator: {:.20}",
            sigma_squared, scaled_timestep_squared, denominator
        );

        let c_skip = sigma_squared / denominator;
        let c_out = scaled_timestep / (scaled_timestep_squared + sigma_squared).sqrt();

        debug!(
            "  Final computed values: c_skip: {:.20}, c_out: {:.20}",
            c_skip, c_out
        );

        (c_skip, c_out)
    }

    pub fn get_guidance_scale_embedding(
        &self,
        guidance_scale: f64,
        embedding_dim: usize,
        device: &Device,
        dtype: DType,
    ) -> Result<Tensor> {
        // Scale by exactly 1000.0 to match diffusers
        let w = guidance_scale * 1000.0;
        debug!(
            "Creating guidance embedding with dim={}, scaled value={}",
            embedding_dim, w
        );

        // Calculate the half dimension
        let half_dim = embedding_dim / 2;
        debug!("Half dimension: {}", half_dim);

        let log_10000 = (10000.0f32).ln();
        let freq_factor = log_10000 / ((half_dim - 1) as f32); // pre-compute division

        let mut freqs = Vec::with_capacity(half_dim);
        for i in 0..half_dim {
            // This matches torch.exp(torch.arange(half_dim) * -emb)
            let freq = (-freq_factor * i as f32).exp();
            freqs.push(freq);
        }

        debug!(
            "First few frequencies: {:?}",
            &freqs.iter().take(5).collect::<Vec<_>>()
        );

        // To match PyTorch's w[:, None] * emb[None, :], we need to broadcast manually
        // First, create a vector with w multiplied by each frequency
        let mut emb_data = Vec::with_capacity(half_dim);
        let w_val = w as f32;
        for &freq in freqs.iter() {
            emb_data.push(w_val * freq);
        }

        debug!(
            "First few scaled frequencies: {:?}",
            &emb_data.iter().take(5).collect::<Vec<_>>()
        );

        // Create the embedding tensor
        let emb = Tensor::new(emb_data.as_slice(), device)?.to_dtype(dtype)?;
        debug!("Embedding tensor shape: {:?}", emb.shape());

        // Reshape for correct sin/cos application
        let emb = emb.reshape((1, half_dim))?;
        debug!("Reshaped embedding tensor: {:?}", emb.shape());

        // Compute sin and cos components
        let sin_emb = emb.sin()?;
        debug!("Sin embedding shape: {:?}", sin_emb.shape());
        let cos_emb = emb.cos()?;
        debug!("Cos embedding shape: {:?}", cos_emb.shape());

        // Concatenate sin and cos (along dimension 1)
        let result = Tensor::cat(&[sin_emb, cos_emb], 1)?;
        debug!("After concatenation shape: {:?}", result.shape());

        // If odd dimension, pad with zero
        let result = if embedding_dim % 2 == 1 {
            debug!("Adding zero padding for odd dimension");
            let zero = Tensor::zeros((1, 1), dtype, device)?;
            Tensor::cat(&[result, zero], 1)?
        } else {
            result
        };

        debug!("Final guidance embedding shape: {:?}", result.shape());

        Ok(result)
    }

    pub fn get_timesteps_for_steps(inference_steps: usize, strength: f64) -> Vec<usize> {
        // These are the timesteps for LCM
        let all_timesteps = match inference_steps {
            2 => vec![999, 499],
            3 => vec![999, 679, 339],
            4 => vec![999, 759, 499, 259],
            5 => vec![999, 799, 599, 399, 199],
            6 => vec![999, 839, 679, 499, 339, 179],
            7 => vec![999, 859, 719, 579, 439, 299, 159],
            8 => vec![999, 879, 759, 639, 499, 379, 259, 139],
            9 => vec![999, 899, 779, 679, 559, 459, 339, 239, 119],
            10 => vec![999, 899, 799, 699, 599, 499, 399, 299, 199, 99],
            11 => vec![999, 919, 819, 739, 639, 559, 459, 379, 279, 199, 99],
            12 => vec![999, 919, 839, 759, 679, 599, 499, 419, 339, 259, 179, 99],
            13 => vec![
                999, 939, 859, 779, 699, 619, 539, 479, 399, 319, 239, 159, 79,
            ],
            14 => vec![
                999, 939, 859, 799, 719, 659, 579, 499, 439, 359, 299, 219, 159, 79,
            ],
            15 => vec![
                999, 939, 879, 799, 739, 679, 599, 539, 479, 399, 339, 279, 199, 139, 79,
            ],
            16 => vec![
                999, 939, 879, 819, 759, 699, 639, 579, 499, 439, 379, 319, 259, 199, 139, 79,
            ],
            _ => {
                // if there's an error return the timesteps for 16 steps
                let linspace = match super::utils::linspace(0.0, (999) as f64, inference_steps) {
                    Ok(linspace) => match linspace.to_vec1::<f64>() {
                        Ok(linspace) => linspace,
                        Err(_) => {
                            return vec![
                                999, 939, 879, 819, 759, 699, 639, 579, 499, 439, 379, 319, 259,
                                199, 139, 79,
                            ];
                        }
                    },
                    Err(_) => {
                        return vec![
                            999, 939, 879, 819, 759, 699, 639, 579, 499, 439, 379, 319, 259, 199,
                            139, 79,
                        ];
                    }
                };

                let timesteps = linspace.iter().map(|&f| f as usize).rev().collect();
                debug!("timesteps: {:?}", timesteps);
                timesteps
            }
        };

        debug!("all_timesteps: {:?}", all_timesteps);

        // Compute `t_start` based on `strength`
        let num_train_timesteps = 1000;
        let init_timestep = (strength * num_train_timesteps as f64).round() as usize;
        let t_start = all_timesteps
            .iter()
            .position(|&t| t <= init_timestep)
            .unwrap_or(0);

        debug!(
            "get_timesteps: t_start: {} init_timestep: {} strength: {}",
            t_start, init_timestep, strength
        );

        // Return only the steps from `t_start` onward
        all_timesteps[t_start..].to_vec()
    }

    pub fn step(
        &self,
        model_output: &Tensor,
        timestep: usize,
        sample: &Tensor,
        step_index: usize,
        num_inference_steps: usize,
    ) -> Result<Tensor> {
        let step_index = self.timesteps.iter().position(|&t| t == timestep).unwrap();
        let prev_timestep = if step_index + 1 < self.timesteps.len() {
            self.timesteps[step_index + 1]
        } else {
            0
        };

        debug!(
            "LCM step: timestep={}, prev_timestep={}, step_index={}",
            timestep, prev_timestep, step_index
        );

        let alpha_prod_t = self.alphas_cumprod[timestep];
        let alpha_prod_t_prev = if prev_timestep == 0 {
            FINAL_ALPHA_CUMPROD
        } else {
            self.alphas_cumprod[prev_timestep]
        };

        let beta_prod_t = 1.0 - alpha_prod_t;
        let beta_prod_t_prev = 1.0 - alpha_prod_t_prev;

        let (c_skip, c_out) = self.get_scalings_for_boundary_condition_discrete(timestep);

        let pred_original_sample = match self.config.prediction_type {
            PredictionType::Epsilon => {
                ((sample - (beta_prod_t.sqrt() * model_output)?)? / alpha_prod_t.sqrt())?
            }
            PredictionType::Sample => model_output.clone(),
            PredictionType::VPrediction => {
                ((sample * alpha_prod_t.sqrt())? - (model_output * beta_prod_t.sqrt())?)?
            }
        };

        let denoised = ((c_out * pred_original_sample )? + (c_skip * sample)?)?;

        let pred_prev_sample = if step_index != self.timesteps.len() - 1 {
            debug!("Adding noise at intermediate step {}", timestep);
            let noise = Tensor::randn_like(&denoised, 0.0, 1.0)?;
            ((alpha_prod_t_prev.sqrt() * denoised)? + (beta_prod_t_prev.sqrt() * noise)?)?
        } else {
            debug!("No noise for final timestep {}", timestep);
            denoised
        };

        debug!(
            "Denoised sample shape: {:?}, first few values: {}",
            pred_prev_sample.shape(),
            pred_prev_sample
                .i(0)?
                .i(0)?
                .narrow(0, 0, 5)?
                .narrow(1, 0, 5)?
        );

        Ok(pred_prev_sample)
    }

    // pub fn step(&self, model_output: &Tensor, timestep: usize, sample: &Tensor) -> Result<Tensor> {
    //     let step_index = self.timesteps.iter().position(|&t| t == timestep).unwrap();

    //     // Get previous timestep value correctly
    //     let prev_timestep = if step_index == self.timesteps.len() - 1 {
    //         0 // If this is the last step, use timestep 0
    //     } else {
    //         self.timesteps[step_index + 1]
    //     };

    //     debug!(
    //         "LCM step: timestep={}, prev_timestep={}",
    //         timestep, prev_timestep
    //     );

    //     // Get alpha values for current and previous timestep
    //     let alpha_prod_t = self.alphas_cumprod[timestep];
    //     let alpha_prod_t_prev = if prev_timestep == 0 {
    //         1.0 // Use 1.0 for the final step
    //     } else {
    //         self.alphas_cumprod[prev_timestep]
    //     };

    //     debug!(
    //         "LCM scheduler step: timestep={}, step_index={}, sigma={}",
    //         timestep,
    //         step_index,
    //         alpha_prod_t.sqrt()
    //     );

    //     let beta_prod_t = 1.0 - alpha_prod_t;
    //     let beta_prod_t_prev = 1.0 - alpha_prod_t_prev;

    //     // Get scalings for boundary conditions
    //     let (c_skip, c_out) = self.get_scalings_for_boundary_condition_discrete(timestep);

    //     // Compute predicted original sample x_0
    //     let mut pred_original_sample = match self.config.prediction_type {
    //         PredictionType::Epsilon => {
    //             let predicted_original_sample =
    //                 ((sample - (beta_prod_t.sqrt() * model_output)?)? / alpha_prod_t.sqrt())?;
    //             predicted_original_sample
    //         }
    //         PredictionType::Sample => model_output.clone(),
    //         PredictionType::VPrediction => {
    //             let predicted_original_sample =
    //                 ((sample * alpha_prod_t.sqrt())? - (model_output * beta_prod_t.sqrt())?)?;
    //             predicted_original_sample
    //         }
    //     };

    //     if self.config.clip_sample {
    //         pred_original_sample = pred_original_sample.clamp(-1f32, 1f32)?;
    //     }

    //     debug!("boundary: Pred original sample first few values: {}",
    //              pred_original_sample.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);

    //     // Denoise model output using boundary conditions
    //     let denoised = ((pred_original_sample * c_out)? + (sample * c_skip)?)?;

    //     debug!("boundary: Denoised first few values: {}",
    //              denoised.i(0)?.i(0)?.narrow(0, 0, 5)?.narrow(1, 0, 5)?);

    //     // LCM doesn't add noise during inference
    //     let pred_prev_sample = if prev_timestep >= self.alphas_cumprod.len() {
    //         denoised
    //     } else {
    //         let scale = (Tensor::zeros_like(&denoised)? + alpha_prod_t_prev.sqrt())?;
    //         (&denoised).mul(&scale)?
    //     };

    //     // let pred_prev_sample = pred_prev_sample.clamp(-1f32, 1f32)?;

    //     debug!(
    //         "LCM scheduler pred_original shape: {:?}",
    //         pred_prev_sample.shape()
    //     );
    //     debug!(
    //         "LCM scheduler pred_original first few values: {}",
    //         pred_prev_sample
    //             .i(0)?
    //             .i(0)?
    //             .narrow(0, 0, 5)?
    //             .narrow(1, 0, 5)?
    //     );

    //     Ok(pred_prev_sample)
    // }

    pub fn add_noise(&self, original: &Tensor, noise: Tensor, timestep: usize) -> Result<Tensor> {
        debug!("Adding noise at timestep {}", timestep);
        let timestep = if timestep >= self.alphas_cumprod.len() {
            self.alphas_cumprod.len() - 1 // Ensure valid range
        } else {
            timestep
        };
        let sqrt_alpha_prod = self.alphas_cumprod[timestep].sqrt();
        let sqrt_one_minus_alpha_prod = (1.0 - self.alphas_cumprod[timestep] + 1e-6).sqrt(); // Prevent zero issue

        (original * sqrt_alpha_prod)? + (noise * sqrt_one_minus_alpha_prod)?
    }

    // pub fn add_noise(
    //     &self,
    //     original_samples: &Tensor,
    //     noise: Tensor,
    //     timestep: usize,
    // ) -> Result<Tensor> {
    //     // Get the correct alpha value
    //     let alpha_cumprod = self.alphas_cumprod[timestep];

    //     // Print the alpha value to debug
    //     debug!(
    //         "Adding noise with timestep={}, alpha={}, sqrt(alpha)={}",
    //         timestep,
    //         alpha_cumprod,
    //         alpha_cumprod.sqrt()
    //     );

    //     // Correctly scale the original samples and noise using scalar multiplication
    //     //     let scaled_samples = (original_samples * alpha_cumprod.sqrt())?;
    //     //     let scaled_noise = (noise * (1.0 - alpha_cumprod).sqrt())?;

    //     //    scaled_samples + scaled_noise
    //     let clamped_strength = 0.6;
    //     let scaled_samples = (original_samples * alpha_cumprod.sqrt())?;
    //     let scaled_noise = ((noise * (1.0 - alpha_cumprod).sqrt())? * clamped_strength)?;

    //     scaled_samples + scaled_noise
    // }

    pub fn init_noise_sigma(&self) -> f64 {
        self.init_noise_sigma
    }

    pub fn alphas_cumprod(&self) -> &[f64] {
        &self.alphas_cumprod
    }
}
