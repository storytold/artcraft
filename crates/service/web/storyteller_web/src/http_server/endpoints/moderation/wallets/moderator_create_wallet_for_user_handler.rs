use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, warn};
use sqlx::Acquire;

use artcraft_api_defs::moderation::wallets::moderator_create_wallet_for_user::{
  ModeratorCreateWalletForUserRequest,
  ModeratorCreateWalletForUserResponse,
};
use mysql_queries::queries::users::user::get::get_username_by_user_token::get_username_by_user_token;
use mysql_queries::queries::wallets::create_new_wallet_for_owner_user::create_new_wallet_for_owner_user;
use mysql_queries::queries::wallets::find_primary_wallet_token_for_owner::find_primary_wallet_token_for_owner_using_connection;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// Create a wallet for a user (moderation)
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/wallet/create_for_user",
  request_body = ModeratorCreateWalletForUserRequest,
  responses(
    (status = 200, description = "Success", body = ModeratorCreateWalletForUserResponse),
    (status = 400, description = "Bad request"),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_create_wallet_for_user_handler(
  http_request: HttpRequest,
  request: Json<ModeratorCreateWalletForUserRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorCreateWalletForUserResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let user_token = request.user_token.as_ref()
    .ok_or_else(|| CommonWebError::BadInputWithSimpleMessage("user_token is required".to_string()))?;

  // Verify user exists
  let maybe_user = get_username_by_user_token(user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("moderator_create_wallet_for_user user lookup error: {:?}", err);
      CommonWebError::ServerError
    })?;

  if maybe_user.is_none() {
    return Err(CommonWebError::BadInputWithSimpleMessage("User not found".to_string()));
  }

  let namespace = request.payments_namespace.unwrap_or(PaymentsNamespace::Artcraft);

  // Check for existing wallet
  let mut mysql_connection = server_state.mysql_pool
    .acquire()
    .await
    .map_err(|err| {
      error!("Error acquiring MySQL connection: {:?}", err);
      CommonWebError::ServerError
    })?;

  let maybe_wallet_token = find_primary_wallet_token_for_owner_using_connection(
    user_token,
    namespace,
    &mut mysql_connection,
  ).await.map_err(|err| {
    error!("Error finding wallet for user {:?}: {:?}", user_token, err);
    CommonWebError::ServerError
  })?;

  if let Some(wallet_token) = maybe_wallet_token {
    return Ok(Json(ModeratorCreateWalletForUserResponse {
      success: true,
      wallet_token,
    }));
  }

  // Create new wallet
  let mut transaction = mysql_connection
    .begin()
    .await
    .map_err(|err| {
      error!("Error starting MySQL transaction: {:?}", err);
      CommonWebError::ServerError
    })?;

  let wallet_token = create_new_wallet_for_owner_user(
    user_token,
    namespace,
    &mut transaction,
  ).await.map_err(|err| {
    error!("Error creating wallet for user {:?}: {:?}", user_token, err);
    CommonWebError::ServerError
  })?;

  transaction
    .commit()
    .await
    .map_err(|err| {
      error!("Error committing MySQL transaction: {:?}", err);
      CommonWebError::ServerError
    })?;

  Ok(Json(ModeratorCreateWalletForUserResponse {
    success: true,
    wallet_token,
  }))
}
