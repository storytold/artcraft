use once_cell::sync::Lazy;

use enums_db::by_table::model_categories::model_type::ModelType;

use crate::configs::static_model::categories::synthetic_category::SyntheticCategory;

pub const SYNTHETIC_CATEGORY_LATEST_TTS_MODELS : SyntheticCategory = SyntheticCategory {
  category_token: "SYNTHETIC_CATEGORY:LATEST_MODELS",
  maybe_super_category_token: None,
  name: "Latest Voices 🎁",
  name_for_dropdown: "Latest Voices 🎁",
  model_type: ModelType::Tts,
  can_directly_have_models: false,
  can_directly_have_subcategories: false,
  should_be_sorted: false,
};

pub const SYNTHETIC_CATEGORY_TRENDING_TTS_MODELS : SyntheticCategory = SyntheticCategory {
  category_token: "SYNTHETIC_CATEGORY:TRENDING_MODELS",
  maybe_super_category_token: None,
  name: "Trending Voices 🔥",
  name_for_dropdown: "Trending Voices 🔥",
  model_type: ModelType::Tts,
  can_directly_have_models: false,
  can_directly_have_subcategories: false,
  should_be_sorted: true,
};

/// List of the system's statically configured synthetic TTS categories
/// These are populated serverside and served to the frontend along with
/// the user-generated/user-populated categories.
pub static SYNTHETIC_CATEGORY_LIST : Lazy<Vec<&'static SyntheticCategory>> =
  Lazy::new(|| {
    Vec::from([
      &SYNTHETIC_CATEGORY_LATEST_TTS_MODELS,
      &SYNTHETIC_CATEGORY_TRENDING_TTS_MODELS,
    ])
  });
