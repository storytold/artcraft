use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::models::omni_gen_splat_models::OmniGenSplatModelsResponse;

use crate::configs::omni_gen::splat_models::OMNI_GEN_SPLAT_MODELS_AND_PROVIDERS;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// List available splat (3D world) models.
#[utoipa::path(
  get,
  tag = "Omni Gen",
  path = "/v1/omni_gen/models/splat",
  responses(
    (status = 200, description = "Success", body = OmniGenSplatModelsResponse),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_splat_models_handler(
  _http_request: HttpRequest,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenSplatModelsResponse>, CommonWebError> {
  let response = (*OMNI_GEN_SPLAT_MODELS_AND_PROVIDERS).clone();
  Ok(Json(response))
}
