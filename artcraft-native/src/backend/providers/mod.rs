//! Generating through another provider (`ClassyModelSelector`'s "Select Provider"): Midjourney
//! with the user's own account, or fal or OpenRouter with their API key, instead of ArtCraft. Images only;
//! video always runs on ArtCraft. Jobs are tracked here (they aren't ArtCraft jobs) and their
//! results uploaded into the user's library, like the Tauri app.

pub mod accounts;
pub mod jobs;
pub mod submit;
pub mod worker;

use artcraft_router::api::router_image_model::RouterImageModel;
use artcraft_router::generate::generate_image::providers::openrouter::models::openrouter_image_model;
use serde::{Deserialize, Serialize};

use crate::models::ModelInfo;

/// Midjourney's models; direct jobs always make four images and take no references.
const MIDJOURNEY_MODELS: [&str; 4] = ["midjourney", "midjourney_7", "midjourney_7_niji", "midjourney_8"];
const MIDJOURNEY_BATCH: u16 = 4;
/// The models OpenRouter runs (the router's `openrouter::models`).
#[cfg(test)]
const OPENROUTER_MODELS: [&str; 10] = ["nano_banana", "nano_banana_2", "nano_banana_pro", "gpt_image_1", "gpt_image_2", "gpt_image_2p5_flare", "gpt_image_2p5_sunburst", "seedream_4p5", "seedream_5_lite", "seedream_5p0_pro"];

/// Who runs a generation.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Provider {
  #[default]
  Artcraft,
  Midjourney,
  Fal,
  OpenRouter,
}

impl Provider {
  /// The picker's name (`getProviderDisplayName`).
  pub fn label(self) -> &'static str {
    match self {
      Provider::Artcraft => "ArtCraft",
      Provider::Midjourney => "Midjourney",
      Provider::Fal => "FAL",
      Provider::OpenRouter => "OpenRouter",
    }
  }

  /// The logo's key in the creator icons.
  pub fn icon(self) -> &'static str {
    match self {
      Provider::Artcraft => "artcraft",
      Provider::Midjourney => "midjourney",
      Provider::Fal => "fal",
      Provider::OpenRouter => "openrouter",
    }
  }

  /// Whether generating here needs an ArtCraft sign-in. fal and OpenRouter run on the user's own
  /// key, and their results are kept on this computer when nobody's signed in.
  pub fn needs_artcraft_account(self) -> bool {
    matches!(self, Provider::Artcraft | Provider::Midjourney)
  }

  /// The providers `model_id` can run on, the default first (`ImageModels.ts`,
  /// `buildModelsFromListing.ts`): fal for four ArtCraft models, OpenRouter for the Gemini, GPT
  /// Image and Seedream models it runs, Midjourney directly for Midjourney's.
  pub fn for_model(model_id: &str) -> &'static [Provider] {
    match model_id {
      "flux_1_dev" | "flux_1_schnell" => &[Provider::Artcraft, Provider::Fal],
      "nano_banana_2" | "nano_banana_pro" => &[Provider::Artcraft, Provider::Fal, Provider::OpenRouter],
      "nano_banana" | "gpt_image_1" | "gpt_image_2" | "gpt_image_2p5_flare" | "gpt_image_2p5_sunburst" | "seedream_4p5" | "seedream_5_lite" | "seedream_5p0_pro" => &[Provider::Artcraft, Provider::OpenRouter],
      "midjourney" => &[Provider::Midjourney, Provider::Artcraft],
      "midjourney_7" | "midjourney_7_niji" | "midjourney_8" => &[Provider::Artcraft, Provider::Midjourney],
      _ => &[Provider::Artcraft],
    }
  }

  /// `picked` if `model_id` runs there, else the model's default.
  pub fn resolve(model_id: &str, picked: Option<Provider>) -> Provider {
    let allowed = Provider::for_model(model_id);
    picked.filter(|p| allowed.contains(p)).unwrap_or(allowed[0])
  }

  /// What the model can do on this provider (`imageModelForProvider`): direct Midjourney makes
  /// four images, without references, resolution or quality choices; OpenRouter takes as many
  /// references as its version of the model does.
  pub fn adapt(self, model: &ModelInfo) -> ModelInfo {
    let mut m = model.clone();
    if self == Provider::OpenRouter {
      if let Some(spec) = router_model(&model.id).and_then(openrouter_image_model) {
        m.image_refs_max = m.image_refs_max.min(usize::from(spec.max_reference_images));
      }
    }
    if self == Provider::Midjourney && is_midjourney(&model.id) {
      m.batch_sizes = vec![MIDJOURNEY_BATCH];
      m.batch_default = MIDJOURNEY_BATCH;
      m.image_refs_max = 0;
      m.resolutions.clear();
      m.resolution_default = None;
      m.qualities.clear();
      m.quality_default = None;
    }
    m
  }
}

pub fn is_midjourney(model_id: &str) -> bool {
  MIDJOURNEY_MODELS.contains(&model_id)
}

/// The router's model for an ArtCraft model id (they share names).
pub fn router_model(model_id: &str) -> Option<RouterImageModel> {
  serde_json::from_value(serde_json::Value::String(model_id.to_owned())).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn models_offer_their_providers_default_first() {
    assert_eq!(Provider::for_model("nano_banana_pro"), [Provider::Artcraft, Provider::Fal, Provider::OpenRouter]);
    assert_eq!(Provider::for_model("midjourney"), [Provider::Midjourney, Provider::Artcraft]);
    assert_eq!(Provider::for_model("midjourney_8"), [Provider::Artcraft, Provider::Midjourney]);
    assert_eq!(Provider::for_model("seedream_4"), [Provider::Artcraft]);
    assert_eq!(Provider::resolve("seedream_4", Some(Provider::Fal)), Provider::Artcraft, "a pick the model can't use falls back");
    assert_eq!(Provider::resolve("flux_1_dev", Some(Provider::Fal)), Provider::Fal);
  }

  #[test]
  fn openrouter_runs_the_models_it_has_slugs_for() {
    assert_eq!(Provider::for_model("nano_banana_pro"), [Provider::Artcraft, Provider::Fal, Provider::OpenRouter]);
    assert_eq!(Provider::for_model("gpt_image_2"), [Provider::Artcraft, Provider::OpenRouter]);
    assert_eq!(Provider::for_model("flux_1_dev"), [Provider::Artcraft, Provider::Fal], "not on OpenRouter");
    assert_eq!(Provider::resolve("seedream_4p5", Some(Provider::OpenRouter)), Provider::OpenRouter);
    for id in OPENROUTER_MODELS {
      assert!(router_model(id).and_then(openrouter_image_model).is_some(), "{id} has no OpenRouter slug in the router");
      assert!(Provider::for_model(id).contains(&Provider::OpenRouter), "{id} doesn't offer OpenRouter");
    }
  }

  #[test]
  fn openrouter_caps_references_at_the_models_limit() {
    let model = ModelInfo { id: "nano_banana".into(), image_refs_max: 10, batch_sizes: vec![1, 2, 4], ..Default::default() };
    let adapted = Provider::OpenRouter.adapt(&model);
    assert_eq!(adapted.image_refs_max, 3, "Gemini 2.5 Flash Image takes three on OpenRouter");
    assert_eq!(adapted.batch_sizes, model.batch_sizes, "batches split into one request per image");
    assert_eq!(Provider::OpenRouter.label(), "OpenRouter");
  }

  #[test]
  fn direct_midjourney_makes_four_images_without_options() {
    let model = ModelInfo { id: "midjourney_7".into(), batch_sizes: vec![1, 2, 4], batch_default: 1, image_refs_max: 1, resolutions: vec!["one_k".into()], aspect_ratios: vec!["square".into()], ..Default::default() };
    let direct = Provider::Midjourney.adapt(&model);
    assert_eq!((direct.batch_sizes.as_slice(), direct.batch_default, direct.image_refs_max), ([4].as_slice(), 4, 0));
    assert!(direct.resolutions.is_empty());
    assert_eq!(direct.aspect_ratios, model.aspect_ratios, "aspect ratios stay");
    assert_eq!(Provider::Artcraft.adapt(&model).batch_sizes, model.batch_sizes);
  }
}
