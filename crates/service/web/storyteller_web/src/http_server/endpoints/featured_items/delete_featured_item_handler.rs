use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};
use sqlx::Acquire;
use utoipa::ToSchema;

use composite_identifiers::by_table::audit_logs::audit_log_entity::AuditLogEntity;
use composite_identifiers::by_table::featured_items::featured_item_entity::FeaturedItemEntity;
use enums::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction;
use enums::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::audit_logs::insert_audit_log_transactional::{insert_audit_log_transactional, InsertAuditLogTransactionalArgs};
use mysql_queries::queries::featured_items::delete_featured_item::delete_featured_item;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct DeleteFeaturedItemRequest {
  entity_token: String,
  entity_type: FeaturedItemEntityType,
}

#[derive(Debug, ToSchema)]
pub enum DeleteFeaturedItemError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for DeleteFeaturedItemError {
  fn status_code(&self) -> StatusCode {
    match *self {
      DeleteFeaturedItemError::BadInput(_) => StatusCode::BAD_REQUEST,
      DeleteFeaturedItemError::NotAuthorized => StatusCode::UNAUTHORIZED,
      DeleteFeaturedItemError::NotFound => StatusCode::NOT_FOUND,
      DeleteFeaturedItemError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      DeleteFeaturedItemError::BadInput(reason) => reason.to_string(),
      DeleteFeaturedItemError::NotAuthorized => "unauthorized".to_string(),
      DeleteFeaturedItemError::NotFound => "not found".to_string(),
      DeleteFeaturedItemError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for DeleteFeaturedItemError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Remove a featured item (only mods can do this).
#[utoipa::path(
  delete,
  tag = "Featured Items",
  path = "/v1/featured_item/delete",
  request_body = DeleteFeaturedItemRequest,
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = DeleteFeaturedItemError),
    (status = 401, description = "Not authorized", body = DeleteFeaturedItemError),
    (status = 404, description = "Not found", body = DeleteFeaturedItemError),
    (status = 500, description = "Server error", body = DeleteFeaturedItemError),
  ),
)]
pub async fn delete_featured_item_handler(
  http_request: HttpRequest,
  request: web::Json<DeleteFeaturedItemRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, DeleteFeaturedItemError> {

  // NB(bt,2023-12-14): Kasisnu found that we're getting entity type mismatches in production. Apart from
  // querying the database for entity existence, this is the next best way to prevent incorrect comment
  // attachment. This is a bit of a bad process, though, since the token types are supposed to be opaque.
  let token = request.entity_token.as_str();
  let token_prefix_matches = match request.entity_type {
    // NB: Users had an older prefix (U:) that got replaced with the new prefix (user_)
    FeaturedItemEntityType::User => token.starts_with(UserToken::token_prefix()) || token.starts_with("U:"),
    FeaturedItemEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    FeaturedItemEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", request.entity_token, request.entity_type);
    return Err(DeleteFeaturedItemError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        DeleteFeaturedItemError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        DeleteFeaturedItemError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      return Err(DeleteFeaturedItemError::NotAuthorized);
    }
  };

  let is_mod = user_session.can_ban_users;

  if !is_mod {
    warn!("not moderator");
    return Err(DeleteFeaturedItemError::NotAuthorized);
  }

  let entity = FeaturedItemEntity::from_entity_type_and_token(
    request.entity_type, &request.entity_token);

  let mut transaction = mysql_connection.begin().await
      .map_err(|err| {
        error!("error creating transaction: {:?}", err);
        DeleteFeaturedItemError::ServerError
      })?;

  let delete_result = delete_featured_item(
    &entity,
    &mut *transaction,
  ).await;

  let ip_address = get_request_ip(&http_request);

  // NB: fail open
  let _r = insert_audit_log_transactional(InsertAuditLogTransactionalArgs {
    entity: &AuditLogEntity::User(user_session.user_token.clone()),
    entity_action: AuditLogEntityAction::FeaturedItemDelete,
    maybe_actor_user_token: Some(&user_session.user_token),
    maybe_actor_anonymous_visitor_token: None,
    actor_ip_address: &ip_address,
    is_actor_moderator: true,
    transaction: &mut transaction,
  }).await;

  transaction.commit().await
      .map_err(|err| {
        error!("error committing transaction: {:?}", err);
        DeleteFeaturedItemError::ServerError
      })?;

  match delete_result {
    Ok(_) => {},
    Err(_err) => {
      return Err(DeleteFeaturedItemError::ServerError);
    }
  };

  Ok(simple_json_success())
}
