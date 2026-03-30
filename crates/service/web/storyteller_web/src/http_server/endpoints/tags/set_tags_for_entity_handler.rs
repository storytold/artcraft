//// NB: Incrementally getting rid of build warnings...
//#![forbid(unused_imports)]
//#![forbid(unused_mut)]
//#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::tag_info::TagInfo;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Data, Json, Path};
use actix_web::{HttpRequest, HttpResponse};
use composite_identifiers::by_table::tag_uses::tag_use_entity::TagUseEntity;
use enums::by_table::tag_uses::tag_use_entity_type::TagUseEntityType;
use log::warn;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file_with_transactor;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token_with_transactor;
use mysql_queries::queries::tags::create_tag::create_tag;
use mysql_queries::queries::tags::select_matching_tags::select_matching_tags;
use mysql_queries::queries::tags::update_tags_for_entity::update_tags_for_entity;
use mysql_queries::utils::transactor::Transactor;
use sqlx::MySqlConnection;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;
use utoipa::ToSchema;

/// Maximum number of tags allowed per item.
const MAX_TAGS : usize = 30;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct SetTagsForEntityPathInfo {
  entity_type: TagUseEntityType,
  entity_token: String,
}

#[derive(Deserialize, ToSchema)]
pub struct SetTagsForEntityRequest {
  /// A comma separated list of tags.
  tags: String,
}

#[derive(Serialize, ToSchema)]
pub struct SetTagsForEntitySuccessResponse {
  pub success: bool,
  pub tags: Vec<TagInfo>,
}

#[derive(Debug, ToSchema)]
pub enum SetTagsForEntityError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  ServerError,
}

impl ResponseError for SetTagsForEntityError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetTagsForEntityError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetTagsForEntityError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetTagsForEntityError::NotFound => StatusCode::NOT_FOUND,
      SetTagsForEntityError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      SetTagsForEntityError::BadInput(reason) => reason.to_string(),
      SetTagsForEntityError::NotAuthorized => "unauthorized".to_string(),
      SetTagsForEntityError::NotFound => "not found".to_string(),
      SetTagsForEntityError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SetTagsForEntityError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Edit the tags (in bulk) for an entity. Comma-separated.
#[utoipa::path(
  post,
  tag = "Tags",
  path = "/v1/tags/edit/{entity_type}/{entity_token}",
  responses(
    (status = 200, description = "Success", body = SetTagsForEntitySuccessResponse),
    (status = 400, description = "Bad input", body = SetTagsForEntityError),
    (status = 401, description = "Not authorized", body = SetTagsForEntityError),
    (status = 500, description = "Server error", body = SetTagsForEntityError),
  ),
  params(
    ("request" = SetTagsForEntityRequest, description = "Payload for Request"),
  )
)]
pub async fn set_tags_for_entity_handler(
  http_request: HttpRequest,
  request: Json<SetTagsForEntityRequest>,
  path: Path<SetTagsForEntityPathInfo>,
  server_state: Data<Arc<ServerState>>,
) -> Result<Json<SetTagsForEntitySuccessResponse>, SetTagsForEntityError>
{
  let token = path.entity_token.as_str();
  let token_prefix_matches = match path.entity_type {
    TagUseEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    TagUseEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", path.entity_token, path.entity_type);
    return Err(SetTagsForEntityError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        SetTagsForEntityError::ServerError
      })?;

  let user_session = require_user_session_extended_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection)
      .await
      .map_err(|_err| {
        SetTagsForEntityError::NotAuthorized
      })?;

  if user_session.role.is_banned {
    return Err(SetTagsForEntityError::NotAuthorized);
  }

  let is_mod = user_session.role.can_ban_users;

  let is_creator = get_is_creator(
    path.entity_type,
    &path.entity_token,
    &user_session.user_token_typed,
    &mut *mysql_connection
  ).await?;

  if !is_creator && !is_mod {
    warn!("user is not allowed to modify entity: {:?}", user_session.user_token);
    return Err(SetTagsForEntityError::NotAuthorized);
  }

  let request_tags = to_normalized_tags(&request.tags);

  let matching_tags = select_matching_tags(&request_tags, Transactor::for_connection(&mut *mysql_connection))
      .await
      .map(|tags| tags.into_iter()
          .map(|tag| TagInfo {
            token: tag.token,
            value: tag.tag_value.to_string(),
          })
          .collect::<Vec<TagInfo>>())
      .map_err(|e| {
        warn!("error selecting tags: {:?}", e);
        SetTagsForEntityError::ServerError
      })?;

  let matching_tag_values = matching_tags
      .iter()
      .map(|tag| tag.value.to_string())
      .collect::<Vec<String>>();

  let new_tag_values = request_tags.iter()
      .filter(|tag| !matching_tag_values.contains(tag))
      .map(|tag| tag.as_str())
      .collect::<Vec<&str>>();

  let mut new_tags = Vec::new();

  // TODO(bt): Bulk insert instead of insert per tag.

  for new_tag_value in new_tag_values {
    let token = create_tag(new_tag_value, Transactor::for_connection(&mut *mysql_connection))
        .await
        .map_err(|e| {
          warn!("error creating tag: {:?}", e);
          SetTagsForEntityError::ServerError
        })?;
    new_tags.push(TagInfo {
      token,
      value: new_tag_value.to_string(),
    });
  }

  let final_tag_set = matching_tags.into_iter()
      .chain(new_tags.into_iter())
      .collect::<Vec<TagInfo>>();

  let final_tag_tokens = final_tag_set.iter()
      .map(|tag_info| tag_info.token.clone())
      .collect::<Vec<TagToken>>();

  let entity = TagUseEntity::from_entity_type_and_token(
    path.entity_type, &path.entity_token);

  update_tags_for_entity(
    entity,
    &final_tag_tokens,
    &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("error updating tags: {:?}", e);
        SetTagsForEntityError::ServerError
      })?;

  Ok(Json(SetTagsForEntitySuccessResponse {
    success: true,
    tags: final_tag_set,
  }))
}

async fn get_is_creator(
  entity_type: TagUseEntityType,
  entity_token: &str,
  user_token: &UserToken,
  mysql_connection: &mut MySqlConnection
) -> Result<bool, SetTagsForEntityError> {
  match entity_type {
    TagUseEntityType::MediaFile => {
      let entity_token = MediaFileToken::new_from_str(entity_token);
      let result = get_media_file_with_transactor(
        &entity_token,
        false,
        Transactor::for_connection(mysql_connection),
      ).await;
      match result {
        Ok(Some(media_file)) => {
          Ok(media_file.maybe_creator_user_token
              .is_some_and(|t| t.as_str() == user_token.as_str()))
        },
        Ok(None) => Err(SetTagsForEntityError::NotFound),
        Err(err) => {
          warn!("Error looking up media_file: {:?}", err);
          Err(SetTagsForEntityError::ServerError)
        }
      }
    }
    TagUseEntityType::ModelWeight => {
      let entity_token = ModelWeightToken::new_from_str(entity_token);
      let result = get_weight_by_token_with_transactor(
        &entity_token,
        false,
        Transactor::for_connection(mysql_connection),
      ).await;
      match result {
        Ok(Some(model_weight)) => {
          Ok(model_weight.creator_user_token.as_str() == user_token.as_str())
        },
        Ok(None) => Err(SetTagsForEntityError::NotFound),
        Err(err) => {
          warn!("Error looking up model_weight: {:?}", err);
          Err(SetTagsForEntityError::ServerError)
        }
      }
    }
  }
}

fn to_normalized_tags(tags: &str) -> Vec<String> {
  let mut tags : Vec<String> = tags.split(',')
      .map(|tag| tag.trim().to_lowercase())
      .filter(|tag| !tag.is_empty())
      .collect();

  tags.truncate(MAX_TAGS);

  tags
}
