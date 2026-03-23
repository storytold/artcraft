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
use enums_db::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction;
use enums_db::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType;
use enums_api::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType as ApiFeaturedItemEntityType;
use enums_db::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::audit_logs::insert_audit_log_transactional::{insert_audit_log_transactional, InsertAuditLogTransactionalArgs};
use mysql_queries::queries::featured_items::upsert_featured_item::{upsert_featured_item, UpsertFeaturedItemArgs};
use mysql_queries::queries::media_files::edit::update_media_file_visibility_transactional::{update_media_file_visibility_transactional, UpdateMediaFileTransactionalArgs};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct CreateFeaturedItemRequest {
  entity_token: String,
  entity_type: FeaturedItemEntityType,
}

#[derive(Serialize, ToSchema)]
pub struct CreateFeaturedItemSuccessResponse {
  pub success: bool,
}

#[derive(Debug, ToSchema)]
pub enum CreateFeaturedItemError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateFeaturedItemError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateFeaturedItemError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateFeaturedItemError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateFeaturedItemError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      CreateFeaturedItemError::BadInput(reason) => reason.to_string(),
      CreateFeaturedItemError::NotAuthorized => "unauthorized".to_string(),
      CreateFeaturedItemError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for CreateFeaturedItemError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Create a featured item (only mods can do this).
#[utoipa::path(
  post,
  tag = "Featured Items",
  path = "/v1/featured_item/create",
  request_body = CreateFeaturedItemRequest,
  responses(
    (status = 200, body = CreateFeaturedItemSuccessResponse),
    (status = 400, body = CreateFeaturedItemError),
  )
)]
pub async fn create_featured_item_handler(
  http_request: HttpRequest,
  request: web::Json<CreateFeaturedItemRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, CreateFeaturedItemError>
{
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
    return Err(CreateFeaturedItemError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        CreateFeaturedItemError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CreateFeaturedItemError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CreateFeaturedItemError::NotAuthorized);
    }
  };

  let is_mod = user_session.can_ban_users;

  if !is_mod {
    warn!("not moderator");
    return Err(CreateFeaturedItemError::NotAuthorized);
  }

  let entity = FeaturedItemEntity::from_entity_type_and_token(
    request.entity_type, &request.entity_token);

  let mut transaction = mysql_connection.begin().await
      .map_err(|err| {
        error!("error creating transaction: {:?}", err);
        CreateFeaturedItemError::ServerError
      })?;

  match request.entity_type {
    FeaturedItemEntityType::MediaFile => {
      let token = MediaFileToken::new_from_str(&request.entity_token);
      let result = update_media_file_visibility_transactional(UpdateMediaFileTransactionalArgs {
        media_file_token: &token,
        creator_set_visibility: enums_convert::common::visibility::visibility_to_db(&Visibility::Public),

        transaction: &mut transaction,
      }).await;

      if let Err(err) = result {
        warn!("error modifying visibility: {:?}", err);
        return Err(CreateFeaturedItemError::ServerError);
      }
    }
    FeaturedItemEntityType::ModelWeight => {} // TODO
    FeaturedItemEntityType::User => {} // No-op
  }

  let upsert_result = upsert_featured_item(UpsertFeaturedItemArgs {
    entity: &entity,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  if let Err(err) = upsert_result {
    warn!("error setting featured: {:?}", err);
    return Err(CreateFeaturedItemError::ServerError);
  }

  let ip_address = get_request_ip(&http_request);

  // NB: fail open
  let _r = insert_audit_log_transactional(InsertAuditLogTransactionalArgs {
    entity: &AuditLogEntity::User(user_session.user_token.clone()),
    entity_action: AuditLogEntityAction::FeaturedItemCreate,
    maybe_actor_user_token: Some(&user_session.user_token),
    maybe_actor_anonymous_visitor_token: None,
    actor_ip_address: &ip_address,
    is_actor_moderator: true,
    transaction: &mut transaction,
  }).await;

  transaction.commit().await
      .map_err(|err| {
        error!("error committing transaction: {:?}", err);
        CreateFeaturedItemError::ServerError
      })?;

  let response = CreateFeaturedItemSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| CreateFeaturedItemError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
