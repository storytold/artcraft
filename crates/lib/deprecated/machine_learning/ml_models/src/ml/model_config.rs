use crate::ml::model_file::StableDiffusionVersion;
use candle_core::{DType, Device};
use candle_transformers::models::stable_diffusion::StableDiffusionConfig;
use hf_hub::api::sync::Api;
use log::info;

const DEFAULT_SD_IMAGE_WIDTH: usize = 1024;
const DEFAULT_SD_IMAGE_HEIGHT: usize = 1024;
const DEFAULT_SD_NUMERIC_DATATYPE: DType = DType::F32;
const SD_VERSION: StableDiffusionVersion = StableDiffusionVersion::V1_5;

pub struct ModelConfig {

  /// We only support one device type currently, and we can't multiplex
  /// over several devices yet.
  pub device: Device,

  /// The core numeric type to use for models.
  pub dtype: DType,

  pub sd_version: StableDiffusionVersion,
  pub sd_config: StableDiffusionConfig,

  /// Probably shouldn't be here.
  pub hf_api: Api,
}

impl ModelConfig {
  pub fn init() -> anyhow::Result<Self> {
    let device = Device::new_cuda(0)
      .unwrap_or_else(|e| {
          info!("CUDA not available ({}), falling back to CPU", e);
          Device::Cpu
        });

    let sd_config = match SD_VERSION {
      StableDiffusionVersion::Turbo => {
        StableDiffusionConfig::sdxl_turbo(None, Some(DEFAULT_SD_IMAGE_HEIGHT), Some(DEFAULT_SD_IMAGE_WIDTH))
      }
      StableDiffusionVersion::V1_5 | StableDiffusionVersion::V1_5Inpaint => {
        StableDiffusionConfig::v1_5(None, Some(DEFAULT_SD_IMAGE_HEIGHT), Some(DEFAULT_SD_IMAGE_WIDTH))
      }
      StableDiffusionVersion::V2_1 | StableDiffusionVersion::V2Inpaint => {
        StableDiffusionConfig::v2_1(None, Some(DEFAULT_SD_IMAGE_HEIGHT), Some(DEFAULT_SD_IMAGE_WIDTH))
      }
      StableDiffusionVersion::Xl | StableDiffusionVersion::XlInpaint => {
        StableDiffusionConfig::sdxl(None, Some(DEFAULT_SD_IMAGE_HEIGHT), Some(DEFAULT_SD_IMAGE_WIDTH))
      }
    };

    let hf_api = Api::new()?;

    Ok(Self {
      device,
      dtype: DEFAULT_SD_NUMERIC_DATATYPE,
      sd_version: SD_VERSION,
      sd_config,
      hf_api,
    })
  }
}