use artcraft_api_defs::omni_gen::models::omni_gen_video_models::{OmniGenVideoModelDetails, OmniGenVideoModelProviderDetails, OmniGenVideoModelsResponse, OmniGenVideoProviderModelDetails};
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;

use super::by_type::grok_video_models::grok_video_models;
use super::by_type::happy_horse_video_models::happy_horse_video_models;
use super::by_type::kling_video_models::{kling_disabled_video_models, kling_video_models};
use super::by_type::seedance_1x_video_models::{seedance_1p0_video_models, seedance_1p5_video_models};
use super::by_type::seedance_2p0_video_models::seedance_2p0_video_models;
use super::by_type::sora_video_models::sora_video_models;
use super::by_type::veo_video_models::veo_video_models;

pub const OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS: Lazy<OmniGenVideoModelsResponse> = Lazy::new(|| {
  let models = build_omni_gen_video_models();
  let providers= build_omni_gen_video_model_providers();
  OmniGenVideoModelsResponse {
    success: true,
    models,
    providers,
  }
});

fn build_omni_gen_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.extend(grok_video_models());
  models.extend(happy_horse_video_models());
  models.extend(kling_video_models());
  models.extend(kling_disabled_video_models());
  models.extend(seedance_1p0_video_models());
  models.extend(seedance_1p5_video_models());
  models.extend(seedance_2p0_video_models());
  models.extend(sora_video_models());
  models.extend(veo_video_models());

  models
}

fn build_omni_gen_video_model_providers() -> Vec<OmniGenVideoModelProviderDetails> {
  let mut providers = Vec::new();

  providers.push(OmniGenVideoModelProviderDetails {
    provider: GenerationProvider::Artcraft,
    models: vec![
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Seedance1p5Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Seedance2p0,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Seedance10Lite,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Sora2,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Sora2Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo2,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3Fast,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3p1,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3p1Fast,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling16Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling21Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling21Master,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling2p5TurboPro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling2p6Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling3p0Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling3p0Standard,
        overrides: None,
      },
    ],
  });

  providers
}
