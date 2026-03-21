//// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::BTreeSet;

use enums_db::by_table::trending_model_analytics::window_name::WindowName;
use mysql_queries::queries::trending_model_analytics::list_trending_tts_models::TrendingModels;
use tokens::tokens::model_categories::ModelCategoryToken;
use tokens::tokens::tts_models::TtsModelToken;

use crate::configs::static_model::categories::synthetic_category_list::{SYNTHETIC_CATEGORY_LATEST_TTS_MODELS, SYNTHETIC_CATEGORY_TRENDING_TTS_MODELS};
use crate::http_server::deprecated_endpoints::categories::tts::list_fully_computed_assigned_tts_categories::query_and_construct_payload::{CategoryTokenToModelTokensMap, TtsModelInfoLite};

pub fn add_recent_models(recursive_category_to_model_map: &mut CategoryTokenToModelTokensMap, models: &Vec<TtsModelInfoLite>) {
  let mut model_refs : Vec<&TtsModelInfoLite> = models.iter()
      .collect::<Vec<&TtsModelInfoLite>>();

  // Make the list nice for human readers.
  model_refs.sort_by(|a, b| b.created_at.cmp(&a.created_at));

  let mut model_tokens = BTreeSet::new();

  model_refs.iter().take(30).for_each(|model| {
    model_tokens.insert(model.model_token.clone());
  });

  let synthetic_token = ModelCategoryToken::new_from_str(SYNTHETIC_CATEGORY_LATEST_TTS_MODELS.category_token);
  recursive_category_to_model_map.insert(synthetic_token, model_tokens);
}

pub fn add_trending_models(recursive_category_to_model_map: &mut CategoryTokenToModelTokensMap, trending_models: TrendingModels) {
  // TODO: This is a grossly bad guess.
  let model_tokens = trending_models.models.iter()
      .filter(|trending_model| trending_model.window_name == WindowName::Last3Hours)
      .take(30)
      .map(|trending_model| {
        trending_model.model_token.clone()
      })
      .collect::<BTreeSet<TtsModelToken>>();

  let synthetic_token = ModelCategoryToken::new_from_str(SYNTHETIC_CATEGORY_TRENDING_TTS_MODELS.category_token);
  recursive_category_to_model_map.insert(synthetic_token, model_tokens);
}

