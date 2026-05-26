// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use enums::common::vocoder_type::VocoderType;
use mysql_queries::queries::vocoder::list_vocoder_models::{list_vocoder_models, VocoderModelListItem};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct ListVocodersSuccessResponse {
  pub success: bool,
  pub vocoders: Vec<VocoderListItem>,
}

#[derive(Serialize)]
pub struct VocoderListItem {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub is_staff_recommended: bool,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// Moderator fields are absent if not a moderator.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub moderator_fields: Option<VocoderListItemModFields>,
}

#[derive(Serialize)]
pub struct VocoderListItemModFields {
  pub is_mod_disabled_from_public_use: bool,
  pub is_mod_disabled_from_author_use: bool,
  pub is_mod_author_editing_locked: bool,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn list_vocoders_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError> {

  let is_moderator = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?
      .map(|session| {
        // NB: Since we need to rip out and replace the permissions system,
        // this is a proxy for being a moderator.
        session.can_ban_users
      })
      .unwrap_or(false);

  const NO_CREATOR_SCOPING_HERE : Option<&'static str> = None;

  let query_results = list_vocoder_models(
    &server_state.mysql_pool,
    NO_CREATOR_SCOPING_HERE,
    false,
  ).await;

  let vocoders = match query_results {
    Ok(results) => results,
    Err(e) => {
      warn!("vocoder list query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
  };

  let vocoders = vocoders
      .into_iter()
      .map(|v: VocoderModelListItem| {
        let mut vocoder = VocoderListItem {
          vocoder_token: v.vocoder_token,
          vocoder_type: v.vocoder_type,
          title: v.title,
          is_staff_recommended: v.is_staff_recommended,
          creator_user_token: v.creator_user_token,
          creator_username: v.creator_username,
          creator_display_name: v.creator_display_name,
          creator_gravatar_hash: v.creator_gravatar_hash,
          created_at: v.created_at,
          updated_at: v.updated_at,
          moderator_fields: Some(VocoderListItemModFields {
            is_mod_disabled_from_public_use: v.moderator_fields.is_mod_disabled_from_public_use,
            is_mod_disabled_from_author_use: v.moderator_fields.is_mod_disabled_from_author_use,
            is_mod_author_editing_locked: v.moderator_fields.is_mod_author_editing_locked,
            user_deleted_at: v.moderator_fields.user_deleted_at,
            mod_deleted_at:v.moderator_fields.mod_deleted_at,
          })
        };

        if !is_moderator {
          vocoder.moderator_fields = None;
        }

        vocoder
      })
      .collect();

  let response = ListVocodersSuccessResponse {
    success: true,
    vocoders,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
