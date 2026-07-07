use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::models::omni_gen_mesh_models::OmniGenMeshModelsResponse;

use crate::configs::omni_gen::mesh_models::OMNI_GEN_MESH_MODELS_AND_PROVIDERS;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// List available mesh (3D object) models.
#[utoipa::path(
  get,
  tag = "Omni Gen",
  path = "/v1/omni_gen/models/mesh",
  responses(
    (status = 200, description = "Success", body = OmniGenMeshModelsResponse),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_mesh_models_handler(
  _http_request: HttpRequest,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenMeshModelsResponse>, CommonWebError> {
  let response = (*OMNI_GEN_MESH_MODELS_AND_PROVIDERS).clone();
  Ok(Json(response))
}
