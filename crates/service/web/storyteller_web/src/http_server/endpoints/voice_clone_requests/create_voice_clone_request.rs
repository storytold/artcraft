use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::voice_clone_requests::insert_voice_clone_requests_builder::InsertVoiceCloneRequestBuilder;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

#[derive(Deserialize)]
pub struct CreateVoiceRequestRequest {
  pub idempotency_token: String,

  // Contact
  pub email_address: String,
  pub discord_username: String,

  // TODO: Make enum.
  // Visibility
  pub is_for_private_use: bool,
  pub is_for_public_use: bool,

  // Use
  pub is_for_studio: bool,
  pub is_for_twitch_tts: bool,
  pub is_for_api_use: bool,
  pub is_for_music: bool,
  pub is_for_games: bool,
  pub is_for_other: bool,
  pub optional_notes_on_use: Option<String>,

  // Subject/Ownership
  pub is_own_voice: bool,
  pub is_third_party_voice: bool,
  pub optional_notes_on_subject: Option<String>,

  // Equipment
  pub has_clean_audio_recordings: bool,
  pub has_good_microphone: bool,

  // Comments
  pub optional_questions: Option<String>,
  pub optional_extra_comments: Option<String>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct CreateVoiceRequestResponse {
  pub success: bool,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============

pub async fn create_voice_clone_request_handler(
  http_request: HttpRequest,
  request: web::Json<CreateVoiceRequestRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let creator_ip_address = get_request_ip(&http_request);

  let builder = InsertVoiceCloneRequestBuilder {
    uuid_idempotency_token: request.idempotency_token.clone(),
    maybe_user_token: maybe_user_session.map(|user| user.user_token.as_str().to_string()),
    email_address: request.email_address.clone(),
    discord_username: request.discord_username.clone(),
    is_for_private_use: request.is_for_private_use,
    is_for_public_use: request.is_for_public_use,
    is_for_studio: request.is_for_studio,
    is_for_twitch_tts: request.is_for_twitch_tts,
    is_for_api_use: request.is_for_api_use,
    is_for_music: request.is_for_music,
    is_for_games: request.is_for_games,
    is_for_other: request.is_for_other,
    optional_notes_on_use: request.optional_notes_on_use.clone(),
    is_own_voice: request.is_own_voice,
    is_third_party_voice: request.is_third_party_voice,
    optional_notes_on_subject: request.optional_notes_on_subject.clone(),
    has_clean_audio_recordings: request.has_clean_audio_recordings,
    has_good_microphone: request.has_good_microphone,
    optional_questions: request.optional_questions.clone(),
    optional_extra_comments: request.optional_extra_comments.clone(),
    ip_address_creation: creator_ip_address,
  };

  builder.insert(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("creation error: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let response = CreateVoiceRequestResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
