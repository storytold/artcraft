//! Flux  Model
//!
//! Flux is a 12B rectified flow transformer capable of generating images from text descriptions.
//!
//! - 🤗 [Hugging Face Model](https://huggingface.co/black-forest-labs/FLUX.1-schnell)
//! - 💻 [GitHub Repository](https://github.com/black-forest-labs/flux)
//! - 📝 [Blog Post](https://blackforestlabs.ai/announcing-black-forest-labs/)
//!
//! # Usage
//!
//! ```bash
//! cargo run --features cuda \
//!     --example flux -r -- \
//!     --height 1024 --width 1024 \
//!     --prompt "a rusty robot walking on a beach holding a small torch, \
//!               the robot has the word \"rust\" written on it, high quality, 4k"
//! ```
//!
//! <div align=center>
//!   <img src="https://github.com/huggingface/candle/raw/main/candle-examples/examples/flux/assets/flux-robot.jpg" alt="" width=320>
//! </div>
//!

use candle::{Result, Tensor};

pub trait WithForward {
    /// The forward pass for the Flux model.
    ///
    /// # Arguments
    ///
    /// * `img` - The input image tensor
    /// * `img_ids` - The image position ids
    /// * `txt` - The text tensor
    /// * `txt_ids` - The text position ids
    /// * `timesteps` - The timesteps tensor
    /// * `y` - The conditioning vector
    /// * `guidance` - An optional guidance vector
    ///
    /// # Returns
    ///
    /// The result of the forward pass
    ///
    /// # Note on Memory Optimization
    ///
    /// To optimize memory usage, we could implement a mechanism to move model blocks 
    /// to CPU when not in use. This would require:
    ///
    /// 1. Adding `to_device` methods to all model blocks (DoubleStreamBlock, SingleStreamBlock, etc.)
    /// 2. Implementing these methods by moving all tensors inside each block to the target device
    /// 3. Modifying the forward method to:
    ///    - Move each block to GPU when needed
    ///    - Process the block
    ///    - Move the block back to CPU when done
    ///
    /// This pattern could significantly reduce GPU memory usage for large models by
    /// keeping only the currently active block in GPU memory.
    #[allow(clippy::too_many_arguments)]
    fn forward(
        &mut self,
        img: &Tensor,
        img_ids: &Tensor,
        txt: &Tensor,
        txt_ids: &Tensor,
        timesteps: &Tensor,
        y: &Tensor,
        guidance: Option<&Tensor>,
    ) -> Result<Tensor>;
}

pub mod autoencoder;
pub mod model;
pub mod quantized_model;
pub mod sampling;
