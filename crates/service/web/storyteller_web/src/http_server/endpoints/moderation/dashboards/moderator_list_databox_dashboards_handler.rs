use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use serde::Serialize;
use utoipa::ToSchema;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct ListDataboxDashboardsResponse {
  pub success: bool,

  /// Configured Databox datawalls, in display order.
  pub databoards: Vec<DataboxDashboardEntry>,
}

#[derive(Serialize, ToSchema)]
pub struct DataboxDashboardEntry {
  /// Human-readable dashboard name.
  pub name: String,

  /// Databox datawall id.
  pub id: String,
}

/// List the Databox metrics dashboards configured for the admin dashboard.
/// Dashboards whose env vars aren't set are omitted.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/dashboards/databox",
  responses(
    (status = 200, description = "Success", body = ListDataboxDashboardsResponse),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn moderator_list_databox_dashboards_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListDataboxDashboardsResponse>, CommonWebError> {

  require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let databox = &server_state.dashboards.databox;

  let databoards = [
    ("DAUs", databox.daus_id.as_ref()),
    ("Daily Generations", databox.daily_generations_id.as_ref()),
  ]
    .into_iter()
    .filter_map(|(name, maybe_id)| {
      maybe_id.map(|id| DataboxDashboardEntry {
        name: name.to_string(),
        id: id.clone(),
      })
    })
    .collect();

  Ok(Json(ListDataboxDashboardsResponse {
    success: true,
    databoards,
  }))
}
