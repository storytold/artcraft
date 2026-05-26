// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::HashSet;
use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::error;

use elasticsearch_schema::searches::search_tts_models::search_tts_models;
use enums::common::visibility::Visibility;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct SearchTtsModelsRequest {
  pub search_term: String,
}

#[derive(Serialize, Clone)]
pub struct TtsModel {
  pub model_token: TtsModelToken,
  //pub tts_model_type: String,
  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  //pub creator_gravatar_hash: String,
  pub title: String,
  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,
  //pub is_front_page_featured: bool,
  //pub is_twitch_featured: bool,
  //pub maybe_suggested_unique_bot_command: Option<String>,

  pub creator_set_visibility: Visibility,

  //pub user_ratings: UserRatingsStats,

  ///// Category assignments
  ///// From non-deleted, mod-approved categories only
  //pub category_tokens: HashSet<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

//#[derive(Serialize, Clone)]
//pub struct UserRatingsStats {
//  pub positive_count: u32,
//  pub negative_count: u32,
//  /// Total count does not take into account "neutral" ratings.
//  pub total_count: u32,
//}

#[derive(Serialize)]
pub struct SearchTtsModelsSuccessResponse {
  pub success: bool,
  pub models: Vec<TtsModel>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn search_tts_models_handler(
  _http_request: HttpRequest,
  request: web::Json<SearchTtsModelsRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let results = search_tts_models(
    &server_state.elasticsearch,
    &request.search_term,
    None)
      .await
      .map_err(|err| {
        error!("Searching error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let results = results.into_iter()
      .map(|result| TtsModel {
        model_token: result.token,
        creator_user_token: result.creator_user_token,
        creator_username: result.creator_username,
        creator_display_name: result.creator_display_name,
        title: result.title,
        ietf_language_tag: result.ietf_language_tag,
        ietf_primary_language_subtag: result.ietf_primary_language_subtag,
        creator_set_visibility: result.creator_set_visibility,
        created_at: result.created_at,
        updated_at: result.updated_at,
      })
      .collect::<Vec<_>>();

  // TODO(bt,2023-10-27): For some reason Elasticsearch returns duplicates. Maybe we populated the
  //  DB twice? Need to filter them out, or React chokes and gets stuck on duplicates. (Effectively
  //  freezing them into the UI, despite component updates)

  let mut added_tokens = HashSet::new();
  let mut new_results = Vec::with_capacity(results.len());

  for result in results.into_iter() {
    if added_tokens.contains(&result.model_token) {
      continue;
    }
    added_tokens.insert(result.model_token.clone());
    new_results.push(result);
  }

  let response = SearchTtsModelsSuccessResponse {
    success: true,
    models: new_results,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

