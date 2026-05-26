// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use enums::common::visibility::Visibility;
use enums::common::vocoder_type::VocoderType;
use mysql_queries::queries::vocoder::get_vocoder_model::get_vocoder_model_by_token;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct GetVocoderPathInfo {
  token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct GetVocoderSuccessResponse {
  pub success: bool,
  pub vocoder: Vocoder,
}

#[derive(Serialize)]
pub struct Vocoder {
  pub vocoder_token: String,
  pub vocoder_type: VocoderType,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub is_staff_recommended: bool,

  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// Moderator fields are absent if not a moderator.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub moderator_fields: Option<VocoderModFields>,
}

#[derive(Serialize)]
pub struct VocoderModFields {
  pub creator_is_banned: bool,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,

  pub is_mod_disabled_from_public_use: bool,
  pub is_mod_disabled_from_author_use: bool,
  pub is_mod_author_editing_locked: bool,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn get_vocoder_handler(
  http_request: HttpRequest,
  path: Path<GetVocoderPathInfo>,
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

  let query_result = get_vocoder_model_by_token(
    &path.token,
    is_moderator,
    &server_state.mysql_pool,
  ).await;

  let vocoder = match query_result {
    Ok(Some(model)) => model,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
  };

  let mut vocoder = Vocoder {
    vocoder_token: vocoder.vocoder_token,
    vocoder_type: vocoder.vocoder_type,
    title: vocoder.title,
    description_markdown: vocoder.description_markdown,
    description_rendered_html: vocoder.description_rendered_html,
    is_staff_recommended: vocoder.is_staff_recommended,
    creator_user_token: vocoder.creator_user_token,
    creator_username: vocoder.creator_username,
    creator_display_name: vocoder.creator_display_name,
    creator_gravatar_hash: vocoder.creator_gravatar_hash,
    creator_set_visibility: vocoder.creator_set_visibility,
    created_at: vocoder.created_at,
    updated_at: vocoder.updated_at,
    moderator_fields: vocoder.maybe_moderator_fields.map(|mod_fields| {
      VocoderModFields {
        creator_is_banned: mod_fields.creator_is_banned,
        creator_ip_address_creation: mod_fields.creator_ip_address_creation,
        creator_ip_address_last_update: mod_fields.creator_ip_address_last_update,
        is_mod_disabled_from_public_use: mod_fields.is_mod_disabled_from_public_use,
        is_mod_disabled_from_author_use: mod_fields.is_mod_disabled_from_author_use,
        is_mod_author_editing_locked: mod_fields.is_mod_author_editing_locked,
        user_deleted_at: mod_fields.user_deleted_at,
        mod_deleted_at: mod_fields.mod_deleted_at,
      }
    })
  };

  if !is_moderator {
    vocoder.moderator_fields = None;
  }

  let response = GetVocoderSuccessResponse {
    success: true,
    vocoder,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
