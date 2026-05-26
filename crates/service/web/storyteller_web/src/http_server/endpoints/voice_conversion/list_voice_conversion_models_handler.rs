// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use lexical_sort::natural_lexical_cmp;
use log::{debug, error, warn};
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use migration::voice_conversion::list_vc_models_for_migration::list_vc_models_for_migration;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::state::server_state::ServerState;

#[derive(Serialize, Clone)]
pub struct VoiceConversionModel {
  /// NB: token can be a `model_weights` token or a `voice_conversion_models` token.
  pub token: String,

  pub model_type: VoiceConversionModelType,

  pub title: String,

  pub creator: UserDetailsLight,
  pub creator_set_visibility: Visibility,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,
  pub is_front_page_featured: bool,

  // TODO: Add user ratings.
  //pub user_ratings: UserRatingsStats,

  // TODO: Add categories.
  ///// Category assignments
  ///// From non-deleted, mod-approved categories only
  //pub category_tokens: HashSet<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// TODO: Add user ratings.
//#[derive(Serialize, Clone)]
//pub struct UserRatingsStats {
//  pub positive_count: u32,
//  pub negative_count: u32,
//  /// Total count does not take into account "neutral" ratings.
//  pub total_count: u32,
//}

#[derive(Serialize)]
pub struct ListVoiceConversionModelsSuccessResponse {
  pub success: bool,
  pub models: Vec<VoiceConversionModel>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn list_voice_conversion_models_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  if server_state.flags.disable_voice_conversion_model_list_endpoint {
    // NB: Despite the cache being a powerful protector of the database (this is an expensive query),
    // if the cache goes stale during an outage, there is no protection. This feature flag lets us
    // shut off all traffic to the endpoint.
    return render_response_busy(ListVoiceConversionModelsSuccessResponse {
      success: true,
      models: Vec::new(),
    });
  }

  let maybe_models = server_state.caches.ephemeral.voice_conversion_model_list.grab_copy_without_bump_if_unexpired()
      .map_err(|e| {
        error!("Error consulting cache: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  // NB: We don't know if we need a MySQL connection, so don't grab one unless we do.
  let mut maybe_mysql_connection = None;

  let models = match maybe_models {
    Some(models) => {
      debug!("Serving voice conversion models from cache");
      models
    },
    None => {
      debug!("Populating voice conversion models from database");
      let mut mysql_connection = server_state.mysql_pool.acquire()
          .await
          .map_err(|e| {
            warn!("Could not acquire DB pool: {:?}", e);
            CommonWebError::from_error(e)
          })?;

      // TODO: Fail open in case the DB is down. Pull from expired cache if query fails.
      let models = get_all_models(&mut mysql_connection, true)
          .await
          .map_err(|e| {
            error!("Error querying database: {:?}", e);
            CommonWebError::from_anyhow_error(e)
          })?;

      maybe_mysql_connection = Some(mysql_connection);

      server_state.caches.ephemeral.voice_conversion_model_list.store_copy(&models)
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
              .map(|token| token == model.creator.user_token.as_str())
              .unwrap_or(false),
        }
      })
      .collect();

  render_response_ok(ListVoiceConversionModelsSuccessResponse {
    success: true,
    models,
  })
}

pub fn render_response_busy(response: ListVoiceConversionModelsSuccessResponse) -> Result<HttpResponse, CommonWebError> {
  let body = render_response_payload(response)?;
  Ok(HttpResponse::TooManyRequests()
      .content_type("application/json")
      .body(body))
}

pub fn render_response_ok(response: ListVoiceConversionModelsSuccessResponse) -> Result<HttpResponse, CommonWebError> {
  let body = render_response_payload(response)?;
  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

pub fn render_response_payload(response: ListVoiceConversionModelsSuccessResponse) -> Result<String, CommonWebError> {
  let body = serde_json::to_string(&response)
      .map_err(|e| {
        error!("error returning response: {:?}",  e);
        CommonWebError::from_error(e)
      })?;
  Ok(body)
}

async fn get_all_models(mysql_connection: &mut PoolConnection<MySql>, use_weights_table: bool) -> AnyhowResult<Vec<VoiceConversionModel>> {
  let mut models = list_vc_models_for_migration(mysql_connection, use_weights_table).await?;

  // NB: Make the list nice for human readers.
  models.sort_by(|a, b|
      natural_lexical_cmp(&a.title(), &b.title()));

  let models_for_response = models.into_iter()
      .filter(|model| model.is_voice_conversion_model())
      .map(|model| {
        // TODO(bt,2023-12-18): All of these clones are lame, but this is just to support the migration.
        VoiceConversionModel {
          token: model.token().to_string(),
          model_type: model.legacy_voice_conversion_model_type()
              .unwrap_or(VoiceConversionModelType::SoVitsSvc),
          title: model.title().to_string(),
          is_front_page_featured: false, // TODO(bt,2023-12-18): None of the models are "featured" yet.
          creator: UserDetailsLight::from_db_fields(
              model.creator_user_token(),
              model.creator_username(),
              model.creator_display_name(),
              model.creator_gravatar_hash(),
          ),
          creator_set_visibility: model.creator_set_visibility(),
          ietf_language_tag: model.ietf_language_tag().to_string(),
          ietf_primary_language_subtag: model.ietf_primary_language_subtag().to_string(),
          created_at: *model.created_at(),
          updated_at: *model.updated_at(),
        }
      })
      .collect::<Vec<VoiceConversionModel>>();

  Ok(models_for_response)
}
