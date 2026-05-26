// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::collections::HashSet;
use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use lexical_sort::natural_lexical_cmp;
use log::{error, info, warn};
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use enums::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use migration::text_to_speech::list_tts_models_for_migration::list_tts_models_for_migration;
use mysql_queries::queries::tts::tts_category_assignments::fetch_and_build_tts_model_category_map::fetch_and_build_tts_model_category_map_with_connection;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize, Clone)]
pub struct TtsModelRecordForResponse {
  pub model_token: String,
  pub tts_model_type: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub title: String,
  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,
  pub is_front_page_featured: bool,
  pub is_twitch_featured: bool,
  pub maybe_suggested_unique_bot_command: Option<String>,

  pub creator_set_visibility: Visibility,

  pub user_ratings: UserRatingsStats,

  /// Category assignments
  /// From non-deleted, mod-approved categories only
  pub category_tokens: HashSet<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Clone)]
pub struct UserRatingsStats {
  pub positive_count: u32,
  pub negative_count: u32,
  /// Total count does not take into account "neutral" ratings.
  pub total_count: u32,
}

#[derive(Serialize)]
pub struct ListTtsModelsSuccessResponse {
  pub success: bool,
  pub models: Vec<TtsModelRecordForResponse>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn list_tts_models_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  if server_state.flags.disable_tts_model_list_endpoint {
    // NB: Despite the cache being a powerful protector of the database (this is an expensive query),
    // if the cache goes stale during an outage, there is no protection. This feature flag lets us
    // shut off all traffic to the endpoint.
    return render_response_busy(ListTtsModelsSuccessResponse {
      success: true,
      models: Vec::new(),
    });
  }

  let maybe_models = server_state.caches.ephemeral.tts_model_list.grab_copy_without_bump_if_unexpired()
      .map_err(|e| {
        error!("Error consulting cache: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  // NB: We don't know if we need a MySQL connection, so don't grab one unless we do.
  let mut maybe_mysql_connection = None;

  let models = match maybe_models {
    Some(models) => {
      info!("Serving TTS models from cache");
      models
    },
    None => {
      info!("Populating TTS models from database");

      let mut mysql_connection = server_state.mysql_pool.acquire()
          .await
          .map_err(|e| {
            warn!("Could not acquire DB pool: {:?}", e);
            CommonWebError::from_error(e)
          })?;

      // TODO: Fail open in case the DB is down. Pull from expired cache if query fails.
      let models = get_all_models(&mut mysql_connection, server_state.flags.switch_tts_to_model_weights)
          .await
          .map_err(|e| {
            error!("Error querying database: {:?}", e);
            CommonWebError::from_anyhow_error(e)
          })?;

      maybe_mysql_connection = Some(mysql_connection);

      server_state.caches.ephemeral.tts_model_list.store_copy(&models)
          .map_err(|e| {
            error!("Error storing cache: {:?}", e);
            CommonWebError::from_anyhow_error(e)
          })?;

      models
    },
  };

  let maybe_user_session : Option<SessionUserRecord> = match maybe_mysql_connection {
    None => {
      server_state.session_checker
          .maybe_get_user_session(&http_request, &server_state.mysql_pool)
          .await
    }
    Some(mut mysql_connection) => {
      server_state.session_checker
          .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
          .await
    }
  }.map_err(|e| {
    warn!("Session checker error: {:?}", e);
    CommonWebError::from_error(e)
  })?;

  let maybe_session_user_token = maybe_user_session
      .as_ref()
      .map(|s| s.user_token.as_str());

  let models = models.into_iter()
      .filter(|model| {
        match model.creator_set_visibility {
          Visibility::Public => true,
          Visibility::Hidden | Visibility::Private => maybe_session_user_token
              .map(|token| token == model.creator_user_token.as_str())
              .unwrap_or(false),
        }
      })
      .collect();

  render_response_ok(ListTtsModelsSuccessResponse {
    success: true,
    models,
  })
}

pub fn render_response_busy(response: ListTtsModelsSuccessResponse) -> Result<HttpResponse, CommonWebError> {
  let body = render_response_payload(response)?;
  Ok(HttpResponse::TooManyRequests()
      .content_type("application/json")
      .body(body))
}

pub fn render_response_ok(response: ListTtsModelsSuccessResponse) -> Result<HttpResponse, CommonWebError> {
  let body = render_response_payload(response)?;
  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

pub fn render_response_payload(response: ListTtsModelsSuccessResponse) -> Result<String, CommonWebError> {
  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        CommonWebError::from_error(e)
      })?;
  Ok(body)
}

async fn get_all_models(mysql_connection: &mut PoolConnection<MySql>, use_weights_table: bool) -> AnyhowResult<Vec<TtsModelRecordForResponse>> {
  let mut models = list_tts_models_for_migration(mysql_connection, use_weights_table).await?;

  // Make the list nice for human readers.
  models.sort_by(|a, b|
      natural_lexical_cmp(&a.title(), &b.title()));

  let model_categories_map
      = fetch_and_build_tts_model_category_map_with_connection(mysql_connection).await?;

  let models_for_response = models.into_iter()
      .map(|model| {
        // NB: All the cloning is just for the migration of tts_models --> model_weights
        let model_token = model.token().to_string();
        TtsModelRecordForResponse {
          model_token: model.token().to_string(),
          tts_model_type: TtsModelType::Tacotron2.to_string(), // NB(bt): We only ever supported the TT2 value
          creator_user_token: model.creator_user_token().to_string(),
          creator_username: model.creator_username().to_string(),
          creator_display_name: model.creator_display_name().to_string(),
          creator_gravatar_hash: model.creator_gravatar_hash().to_string(),
          title: model.title().to_string(),
          ietf_language_tag: model.ietf_language_tag().to_string(),
          ietf_primary_language_subtag: model.ietf_primary_language_subtag().to_string(),
          is_front_page_featured: model.is_front_page_featured(),
          is_twitch_featured: false, // NB: This is no longer used.
          maybe_suggested_unique_bot_command: None, // NB: This is no longer used.
          creator_set_visibility: model.creator_set_visibility(),
          user_ratings: UserRatingsStats {
            positive_count: model.user_ratings_positive_count(),
            negative_count: model.user_ratings_negative_count(),
            total_count: model.user_ratings_total_count(),
          },
          category_tokens: model_categories_map.model_to_category_tokens.get(&model_token)
              .map(|hash| hash.clone())
              .unwrap_or(HashSet::new()),
          created_at: *model.created_at(),
          updated_at: *model.updated_at(),
        }
      })
      .collect::<Vec<TtsModelRecordForResponse>>();

  Ok(models_for_response)
}
