use std::sync::Arc;

use crate::configs::omni_gen::video_models::OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::state::server_state::ServerState;
use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::models::omni_gen_video_models::{
  OmniGenVideoModelsQuery,
  OmniGenVideoModelsResponse,
};
use enums::common::generation::common_video_model::CommonVideoModel;
use log::warn;

/// List available video models.
#[utoipa::path(
  get,
  tag = "Omni Gen",
  path = "/v1/omni_gen/models/video",
  params(OmniGenVideoModelsQuery),
  responses(
    (status = 200, description = "Success", body = OmniGenVideoModelsResponse),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_video_models_handler(
  _http_request: HttpRequest,
  _server_state: web::Data<Arc<ServerState>>,
  _query: Query<OmniGenVideoModelsQuery>,
) -> Result<Json<OmniGenVideoModelsResponse>, CommonWebError> {
  let mut response = (*OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS).clone();
  Ok(Json(response))
}

// NB: Keeping this for future reference if we need to feature gate other models.
pub async fn can_see_happy_horse(
  http_request: &HttpRequest,
  server_state: &ServerState,
) -> Result<bool, CommonWebError> {

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from(e)
      })?;
  
  let user_session = match maybe_user_session {
    Some(session) => session,
    None => return Ok(false),
  };

  let user_feature_flags =
      UserSessionFeatureFlags::new(user_session.maybe_feature_flags.as_deref());

  let can_use_happy_horse = user_feature_flags.can_use_happy_horse();
  let can_use_happy_horse_ratelimited = user_feature_flags.can_use_happy_horse_rate_limited();

  Ok(can_use_happy_horse || can_use_happy_horse_ratelimited)
}
