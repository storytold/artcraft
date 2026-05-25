use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::state::server_state::ServerState;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use artcraft_api_defs::credits::get_session_credits::GetSessionCreditsResponse;
use chrono::{DateTime, Utc};
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, warn};
use mysql_queries::queries::prompt_context_items::list_prompt_context_items::list_prompt_context_items;
use mysql_queries::queries::prompts::get_prompt::{get_prompt, get_prompt_from_connection};
use mysql_queries::queries::wallets::find_primary_wallet_for_owner::find_primary_wallet_for_owner_using_connection;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use utoipa::ToSchema;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetSessionCreditsPathInfo {
  namespace: PaymentsNamespace,
}

#[utoipa::path(
  get,
  tag = "Credits",
  path = "/v1/credits/namespace/{namespace}",
  responses(
    (status = 200, description = "Success", body = GetSessionCreditsResponse),
  ),
  params(
    ("path" = GetSessionCreditsPathInfo, description = "Path for Request")
  )
)]
pub async fn get_session_credits_handler(
  http_request: HttpRequest,
  path: Path<GetSessionCreditsPathInfo>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetSessionCreditsResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Error acquiring MySQL connection: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_token = match maybe_user_session {
    Some(session) => session.user_token,
    None => return Err(CommonWebError::NotAuthorized),
  };

  let maybe_wallet = find_primary_wallet_for_owner_using_connection(
    &user_token,
    path.namespace,
    &mut mysql_connection,
  ).await.map_err(|err| {
    error!("Error finding primary wallet for user: {:?}, error: {:?}", user_token, err);
    CommonWebError::from_error(err)
  })?;

  let free_credits = 0u64;

  let monthly_credits = maybe_wallet
      .as_ref()
      .map(|w| w.monthly_credits)
      .unwrap_or(0);

  let banked_credits = maybe_wallet
      .as_ref()
      .map(|w| w.banked_credits)
      .unwrap_or(0);

  let sum_total_credits = free_credits
      .saturating_add(monthly_credits)
      .saturating_add(banked_credits);

  Ok(Json(GetSessionCreditsResponse {
    success: true,
    free_credits,
    monthly_credits,
    banked_credits,
    sum_total_credits,
  }))
}
