use std::sync::Arc;

use crate::configs::omni_gen::image_models::OMNI_GEN_IMAGE_MODELS_AND_PROVIDERS;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use artcraft_api_defs::omni_gen::models::omni_gen_image_models::{
  OmniGenImageModelsQuery,
  OmniGenImageModelsResponse,
};

/// List available image models.
#[utoipa::path(
  get,
  tag = "Omni Gen",
  path = "/v1/omni_gen/models/image",
  params(OmniGenImageModelsQuery),
  responses(
    (status = 200, description = "Success", body = OmniGenImageModelsResponse),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_image_models_handler(
  _http_request: HttpRequest,
  _query: Query<OmniGenImageModelsQuery>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenImageModelsResponse>, CommonWebError> {
  let response = (*OMNI_GEN_IMAGE_MODELS_AND_PROVIDERS).clone();
  Ok(Json(response))
}
