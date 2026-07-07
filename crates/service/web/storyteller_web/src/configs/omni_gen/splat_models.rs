use artcraft_api_defs::omni_gen::models::omni_gen_splat_models::{
  OmniGenSplatModelDetails,
  OmniGenSplatModelProviderDetails,
  OmniGenSplatModelsResponse,
  OmniGenSplatProviderModelDetails,
};
use enums::common::generation::common_splat_model::CommonSplatModel;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;

/// World Labs MultiImage input accepts up to this many reference images.
const MARBLE_MAX_IMAGE_REFERENCES: u16 = 4;

pub static OMNI_GEN_SPLAT_MODELS_AND_PROVIDERS: Lazy<OmniGenSplatModelsResponse> = Lazy::new(|| {
  let models = build_omni_gen_splat_models();
  let providers = build_omni_gen_splat_model_providers();
  OmniGenSplatModelsResponse {
    success: true,
    models,
    providers,
  }
});

fn build_omni_gen_splat_models() -> Vec<OmniGenSplatModelDetails> {
  vec![
    marble_model(CommonSplatModel::Marble1p0, "Marble 1.0"),
    marble_model(CommonSplatModel::Marble1p0Draft, "Marble 1.0 Draft"),
    marble_model(CommonSplatModel::Marble1p1, "Marble 1.1"),
    marble_model(CommonSplatModel::Marble1p1Plus, "Marble 1.1 Plus"),
  ]
}

fn build_omni_gen_splat_model_providers() -> Vec<OmniGenSplatModelProviderDetails> {
  let mut providers = Vec::new();

  providers.push(OmniGenSplatModelProviderDetails {
    provider: GenerationProvider::Artcraft,
    models: vec![
      OmniGenSplatProviderModelDetails {
        model: CommonSplatModel::Marble1p0,
        overrides: None,
      },
      OmniGenSplatProviderModelDetails {
        model: CommonSplatModel::Marble1p0Draft,
        overrides: None,
      },
      OmniGenSplatProviderModelDetails {
        model: CommonSplatModel::Marble1p1,
        overrides: None,
      },
      OmniGenSplatProviderModelDetails {
        model: CommonSplatModel::Marble1p1Plus,
        overrides: None,
      },
    ],
  });

  providers
}

/// All Marble models share the same capability surface: text prompt, image
/// references (up to 4, multi-view), a reference video, 360-degree panorama
/// input, and the "disable recaption" toggle.
fn marble_model(model: CommonSplatModel, full_name: &str) -> OmniGenSplatModelDetails {
  OmniGenSplatModelDetails {
    model,
    model_creator: Some(ModelCreator::WorldLabs),
    full_name: Some(full_name.to_string()),
    text_prompt_supported: Some(true),
    image_references_supported: Some(true),
    image_references_max: Some(MARBLE_MAX_IMAGE_REFERENCES),
    video_reference_supported: Some(true),
    panorama_supported: Some(true),
    disable_recaption_supported: Some(true),
    ..Default::default()
  }
}
