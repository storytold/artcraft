//// NB: Incrementally getting rid of build warnings...
//#![forbid(unused_imports)]
//#![forbid(unused_mut)]
//#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::tag_info::TagInfo;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use composite_identifiers::by_table::tag_uses::tag_use_entity::TagUseEntity;
use enums::by_table::tag_uses::tag_use_entity_type::TagUseEntityType;
use log::warn;
use mysql_queries::queries::tags::list_tags_for_entity::list_tags_for_entity;
use mysql_queries::utils::transactor::Transactor;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use utoipa::ToSchema;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct ListTagsForEntityPathInfo {
  entity_type: TagUseEntityType,
  entity_token: String,
}

#[derive(Serialize, ToSchema)]
pub struct ListTagsForEntitySuccessResponse {
  pub success: bool,
  pub tags: Vec<TagInfo>,
}

#[derive(Debug, ToSchema)]
pub enum ListTagsForEntityError {
  NotFound,
  ServerError,
  BadInput(String),
}

impl ResponseError for ListTagsForEntityError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListTagsForEntityError::NotFound => StatusCode::NOT_FOUND,
      ListTagsForEntityError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ListTagsForEntityError::BadInput(_) => StatusCode::BAD_REQUEST,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ListTagsForEntityError::NotFound => "not found".to_string(),
      ListTagsForEntityError::ServerError => "server error".to_string(),
      ListTagsForEntityError::BadInput(ref reason) => reason.clone(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ListTagsForEntityError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// List the tags for an entity
#[utoipa::path(
  get,
  tag = "Tags",
  path = "/v1/tags/list/{entity_type}/{entity_token}",
  responses(
    (status = 200, description = "Success", body = ListTagsForEntitySuccessResponse),
    (status = 400, description = "Bad input", body = ListTagsForEntityError),
    (status = 401, description = "Not authorized", body = ListTagsForEntityError),
    (status = 500, description = "Server error", body = ListTagsForEntityError),
  ),
  params(
    ("request" = ListTagsForEntityPathInfo, description = "Payload for Request"),
  )
)]
pub async fn list_tags_for_entity_handler(
  http_request: HttpRequest,
  path: Path<ListTagsForEntityPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListTagsForEntitySuccessResponse>, ListTagsForEntityError>
{
  let token = path.entity_token.as_str();
  let token_prefix_matches = match path.entity_type {
    TagUseEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    TagUseEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", path.entity_token, path.entity_type);
    return Err(ListTagsForEntityError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        ListTagsForEntityError::ServerError
      })?;

  let entity = TagUseEntity::from_entity_type_and_token(
    path.entity_type, &path.entity_token);

  let mut tags = list_tags_for_entity(entity, Transactor::for_connection(&mut *mysql_connection))
      .await
      .map_err(|e| {
        warn!("error listing tags: {:?}", e);
        ListTagsForEntityError::ServerError
      })?;

  tags.sort_by(|a, b| a.tag_value.cmp(&b.tag_value));

  Ok(Json(ListTagsForEntitySuccessResponse {
    success: true,
    tags: tags
        .into_iter()
        .map(|tag| TagInfo {
          token: tag.token,
          value: tag.tag_value,
        })
        .collect(),
  }))
}
