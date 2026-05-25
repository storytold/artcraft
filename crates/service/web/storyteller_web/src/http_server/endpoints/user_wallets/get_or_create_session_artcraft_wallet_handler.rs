use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, warn};
use mysql_queries::queries::wallets::create_new_artcraft_wallet_for_owner_user::create_new_artcraft_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::find_primary_wallet_token_for_owner_using_connection;
use serde::{Deserialize, Serialize};
use sqlx::Acquire;
use tokens::tokens::wallets::WalletToken;
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct GetOrCreateSessionArtcraftWalletResponse {
  pub success: bool,
  pub wallet_token: WalletToken,
}

/// NB: This endpoint was created primarily for local testing with new dev accounts
/// It should be harmless to have in production as wallet creation is idempotent
/// and (should be) side effect free.
#[utoipa::path(
  get,
  tag = "Wallets",
  path = "/v1/wallets/session_artcraft_wallet",
  responses(
    (status = 200, description = "Success", body = GetOrCreateSessionArtcraftWalletResponse),
  ),
)]
pub async fn get_or_create_session_artcraft_wallet_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<GetOrCreateSessionArtcraftWalletResponse>, CommonWebError> {
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

  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_connection(
    &user_token,
    PaymentsNamespace::Artcraft,
    &mut mysql_connection,
  ).await.map_err(|err| {
    error!("Error finding primary artcraft wallet for user {:?}: {:?}", user_token, err);
    CommonWebError::from_error(err)
  })?;

  if let Some(wallet_token) = maybe_wallet_token {
    return Ok(Json(GetOrCreateSessionArtcraftWalletResponse {
      success: true,
      wallet_token,
    }));
  }

  let mut transaction = mysql_connection
      .begin()
      .await
      .map_err(|err| {
        error!("Error starting MySQL transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let wallet_token = create_new_artcraft_wallet_for_owner_user(
    &user_token,
    &mut transaction,
  ).await.map_err(|err| {
    error!("Error creating artcraft wallet for user {:?}: {:?}", user_token, err);
    CommonWebError::from_error(err)
  })?;

  transaction
      .commit()
      .await
      .map_err(|err| {
        error!("Error committing MySQL transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  Ok(Json(GetOrCreateSessionArtcraftWalletResponse {
    success: true,
    wallet_token,
  }))
}
