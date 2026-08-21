use std::sync::Arc;

use crate::configs::omni_gen::video_models::video_models::OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::session_utils::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::state::server_state::ServerState;
use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::models::omni_gen_video_models::{
  OmniGenVideoModelsQuery,
  OmniGenVideoModelsResponse,
};
use enums::common::generation::common_video_model::CommonVideoModel;
use log::warn;

/// Models hidden behind the Minimax feature flags. MinimaxH3 itself stays
/// available to everyone.
const MINIMAX_GATED_MODELS: [CommonVideoModel; 2] = [
  CommonVideoModel::MinimaxH3Turbo,
  CommonVideoModel::MinimaxH3Ultra,
];

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
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  _query: Query<OmniGenVideoModelsQuery>,
) -> Result<Json<OmniGenVideoModelsResponse>, CommonWebError> {
  let mut response = (*OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS).clone();

  if !can_see_minimax(&http_request, &server_state).await? {
    remove_models(&mut response, &MINIMAX_GATED_MODELS);
  }

  Ok(Json(response))
}

/// Whether the (optional) logged-in user holds a Minimax feature flag.
/// Anonymous requests see the ungated model list.
pub async fn can_see_minimax(
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

  let can_use_minimax = user_feature_flags.can_use_minimax();
  let can_use_minimax_priority = user_feature_flags.can_use_minimax_priority();

  Ok(can_use_minimax || can_use_minimax_priority)
}

/// Strip the given models from both the top-level model list and every
/// provider's model list.
fn remove_models(response: &mut OmniGenVideoModelsResponse, hidden_models: &[CommonVideoModel]) {
  response.models.retain(|details| !hidden_models.contains(&details.model));
  for provider in &mut response.providers {
    provider.models.retain(|details| !hidden_models.contains(&details.model));
  }
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
