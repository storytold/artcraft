use std::sync::Arc;

use crate::configs::omni_gen::video_models::OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::models::omni_gen_video_models::{
  OmniGenVideoModelsQuery,
  OmniGenVideoModelsResponse,
};

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
  _query: Query<OmniGenVideoModelsQuery>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenVideoModelsResponse>, CommonWebError> {
  let response = (*OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS).clone();
  Ok(Json(response))
}
