use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::subfolder::{
  BulkAddSubfoldersRequest, BulkAddSubfoldersSuccessResponse, SubfolderPathInfo,
};
use std::collections::HashSet;

use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::folder::list_ancestor_folder_tokens::{
  list_ancestor_folder_tokens, ListAncestorFolderTokensArgs,
};
use mysql_queries::queries::folders::subfolder::bulk_set_parent_folder::{
  bulk_set_parent_folder, BulkSetParentFolderArgs,
};
use mysql_queries::queries::folders::subfolder::filter_existing_owned_folder_tokens::{
  filter_existing_owned_folder_tokens, FilterExistingOwnedFolderTokensArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// Bulk-reparent folders under the URL `folder_token`. Idempotent: tokens
/// that don't exist or are already parented to this folder are silently
/// accepted; the response lists the tokens that "stick".
#[utoipa::path(
  put,
  tag = "Folders (Subfolder Management)",
  path = "/v1/folders/subfolders/{folder_token}/bulk_add",
  params(("folder_token" = FolderToken, description = "Parent folder token")),
  request_body = BulkAddSubfoldersRequest,
  responses(
    (status = 200, body = BulkAddSubfoldersSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_add_subfolders_handler(
  http_request: HttpRequest,
  path: Path<SubfolderPathInfo>,
  request: Json<BulkAddSubfoldersRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkAddSubfoldersSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  if request.subfolder_tokens.len() > MAX_BULK {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("too many subfolders in one request (max {})", MAX_BULK),
    ));
  }

  let parent = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Parent folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let parent = match parent {
    Some(parent) => parent,
    None => return Err(CommonWebError::NotFound),
  };

  // Drop any self-reference up front. A folder can't be its own parent;
  // reporting it as "accepted" would be a lie since the SQL guard
  // silently excludes it from the UPDATE.
  let parent_str = parent.token.as_str();

  let candidates: Vec<FolderToken> = request.subfolder_tokens
    .iter()
    .filter(|t| t.as_str() != parent_str)
    .cloned()
    .collect();

  // Block ancestor cycles: reparenting a folder under one of its own
  // descendants would close a loop. Equivalently, the new parent must
  // not be a descendant of any candidate — i.e. no candidate may appear
  // in the new parent's ancestor chain.
  let ancestor_tokens = list_ancestor_folder_tokens(ListAncestorFolderTokensArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_ancestor_folder_tokens failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let ancestor_set: HashSet<&str> = ancestor_tokens
    .iter()
    .map(|t| t.as_str())
    .collect();

  let candidates: Vec<FolderToken> = candidates
    .into_iter()
    .filter(|t| !ancestor_set.contains(t.as_str()))
    .collect();

  let accepted = filter_existing_owned_folder_tokens(FilterExistingOwnedFolderTokensArgs {
    candidate_tokens: &candidates,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("filter_existing_owned_folder_tokens failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  if !accepted.is_empty() {
    bulk_set_parent_folder(BulkSetParentFolderArgs {
      child_tokens: &accepted,
      new_parent_token: &path.folder_token,
      owner_user_token: &user_session.user_token,
      mysql_executor: &mut *conn,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("bulk_set_parent_folder failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;
  }

  Ok(Json(BulkAddSubfoldersSuccessResponse {
    success: true,
    accepted_subfolder_tokens: accepted,
  }))
}
