// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::{web, HttpRequest};
use actix_web::web::Json;
use log::warn;

use crate::http_server::validations::validate_model_title::validate_model_title;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use config::bad_urls::is_bad_tts_model_download_url;
use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::generic_download::web::insert_generic_download_job::{insert_generic_download_job, InsertGenericDownloadJobArgs};
use mysql_queries::queries::tts::tts_model_upload_jobs::insert_tts_model_upload_job::{insert_tts_model_upload_job, InsertTtsModelUploadJobArgs};

#[derive(Deserialize, Copy, Clone)]
pub enum SupportedTtsModelType {
  #[serde(rename = "tacotron2")]
  Tacotron2,

  #[serde(rename = "vits")]
  Vits,

  // Not yet supported:
  // /// glowtts
  // GlowTts,
  // /// glowtts-vocodes
  // GlowTts_Vocodes,
  // /// talknet
  // Talknet,
}

#[derive(Deserialize)]
pub struct UploadTtsModelRequest {
  idempotency_token: String,
  title: String,
  download_url: String,
  tts_model_type: Option<SupportedTtsModelType>,
  creator_set_visibility: Option<Visibility>,
}

/// Tell the frontend how to deal with the download queue.
#[derive(Serialize)]
pub enum DownloadJobType {
  /// Legacy TTS download job
  #[serde(rename = "legacy_tts")]
  LegacyTts,

  /// Modern shared download type (everything will use this in the
  /// future, and this endpoint will die.)
  #[serde(rename = "generic")]
  Generic,
}

#[derive(Serialize)]
pub struct UploadTtsModelSuccessResponse {
  pub success: bool,
  /// This is how frontend clients can request the job execution status.
  pub job_token: String,

  /// This is a transitional field to tell the frontend how to process the job checking.
  pub job_type: DownloadJobType,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn upload_tts_model_handler(
  http_request: HttpRequest,
  request: Json<UploadTtsModelRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<UploadTtsModelSuccessResponse>, CommonWebError> {

  if server_state.flags.disable_tts {
    return Err(CommonWebError::TooManyRequests);
  }
  
  if let Err(_err) = server_state.redis_rate_limiters.model_upload.rate_limit_request(&http_request).await {
    return Err(CommonWebError::TooManyRequests);
  }

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session(&http_request, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      CommonWebError::from_error(e)
    })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  if let Err(reason) = validate_idempotency_token(&request.idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  if let Err(reason) = validate_model_title(&request.title) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  let ip_address = get_request_ip(&http_request);

  let uuid = request.idempotency_token.to_string();
  let title = request.title.trim().to_string();
  let download_url = request.download_url.to_string();

  match is_bad_tts_model_download_url(&download_url) {
    Ok(false) => {} // Ok case
    Ok(true) => {
      return Err(CommonWebError::BadInputWithSimpleMessage("Bad model download URL".to_string()));
    }
    Err(err) => {
      warn!("Error parsing url: {:?}", err);
      return Err(CommonWebError::BadInputWithSimpleMessage("Bad model download URL".to_string()));
    }
  }

  let supported_tts_model_type = request.tts_model_type
      .unwrap_or(SupportedTtsModelType::Tacotron2);

  let job_token ;
  let download_job_type;

  match supported_tts_model_type {
    SupportedTtsModelType::Tacotron2 => {
      // NB: This is the legacy upload path. In the future, all TT2 models should be generic uploads.

      // This token is returned to the client.
      let maybe_new_job_token = insert_tts_model_upload_job(InsertTtsModelUploadJobArgs {
        uuid: &uuid,
        creator_user_token: user_session.user_token.as_str(),
        creator_ip_address: &ip_address,
        creator_set_visibility: "public", // TODO: Creator set preference.
        title: &title,
        tts_model_type: "tacotron2",
        download_url: &download_url,
        mysql_pool: &server_state.mysql_pool,
      }).await;

      job_token = match maybe_new_job_token {
        Ok(token) => token,
        Err(err) => {
          warn!("Error inserting new job record: {:?}", err);
          return Err(CommonWebError::from_anyhow_error(err));
        }
      };
      download_job_type = DownloadJobType::LegacyTts;
    }
    SupportedTtsModelType::Vits => {
      // NB: This is the new upload path. In the future, all models should use this path.
      // When that's done, the code can be simplified.
      // **ACTUALLY**, all future downloads should use the generic download job endpoint instead of this one!
      let (download_job_token, _record_id)= insert_generic_download_job(InsertGenericDownloadJobArgs {
        uuid_idempotency_token: &uuid,
        download_type: GenericDownloadType::Vits,
        download_url: &download_url,
        title: &title,
        creator_user_token: user_session.user_token.as_str(),
        creator_ip_address: &ip_address,
        creator_set_visibility: Visibility::Public, // TODO: Creator set preference
        mysql_pool: &server_state.mysql_pool,
      })
          .await
          .map_err(|err| {
            warn!("New generic download creation DB error (for TTS model): {:?}", err);
            CommonWebError::from_anyhow_error(err)
          })?;

      job_token = download_job_token.to_string();
      download_job_type = DownloadJobType::Generic;
    }
  }

  server_state.firehose_publisher.enqueue_tts_model_upload(user_session.user_token.as_str(), &job_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  Ok(Json(UploadTtsModelSuccessResponse {
    success: true,
    job_token: job_token.to_string(),
    job_type: download_job_type,
  }))
}

fn validate_idempotency_token(token: &str) -> Result<(), String> {
  if token.len() != 36 {
    return Err("idempotency token should be 36 characters".to_string());
  }

  Ok(())
}
