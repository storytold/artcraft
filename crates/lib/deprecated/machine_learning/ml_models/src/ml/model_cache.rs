use anyhow::anyhow;
use candle_transformers::models::stable_diffusion::unet_2d::UNet2DConditionModel;
use candle_transformers::models::stable_diffusion::vae::AutoEncoderKL;
use std::sync::{Arc, RwLock};
// TODO: This data structure is gross. Generalize the locking and loading semantics for reuse.

// Simple registry for now. We can build complex machinery that aids in 
// VRAM utilization, disk space saving, intelligent scheduling, etc. in the future.
pub struct ModelCache {
  vae: RwLock<Option<Arc<AutoEncoderKL>>>,
  unet2: RwLock<Option<Arc<UNet2DConditionModel>>>,
}

impl ModelCache {
  pub fn new() -> Self {
    Self { 
      vae: RwLock::new(None),
      unet2: RwLock::new(None),
    }
  }
  
  pub fn set_vae(&self, vae: Arc<AutoEncoderKL>) -> anyhow::Result<()> {
    match self.vae.write() {
      Err(err) => Err(anyhow!("{}", err)),
      Ok(mut lock) => {
        *lock = Some(vae);
        Ok(())
      }
    }
  }

  pub fn get_vae(&self) -> anyhow::Result<Option<Arc<AutoEncoderKL>>> {
    match self.vae.read() {
      Err(err) => Err(anyhow!("{}", err)),
      Ok(ref lock) => {
        Ok(lock.as_ref().map(|v|v.clone()))
      }
    }
  }

  pub fn set_unet(&self, vae: Arc<UNet2DConditionModel>) -> anyhow::Result<()> {
    match self.unet2.write() {
      Err(err) => Err(anyhow!("{}", err)),
      Ok(mut lock) => {
        *lock = Some(vae);
        Ok(())
      }
    }
  }

  pub fn get_unet(&self) -> anyhow::Result<Option<Arc<UNet2DConditionModel>>> {
    match self.unet2.read() {
      Err(err) => Err(anyhow!("{}", err)),
      Ok(ref lock) => {
        Ok(lock.as_ref().map(|v|v.clone()))
      }
    }
  }
  
}
