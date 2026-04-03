use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::characters::list_characters::{ListCharactersEntry, ListCharactersQuery, ListCharactersResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::generation::common_model_type::CommonModelType;
use mysql_queries::queries::characters::list_active_characters_for_user::list_active_characters_for_user;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens_with_connection, MediaFilesByTokensRecord};
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

/// List characters for the current session.
#[utoipa::path(
  get,
  tag = "Characters",
  path = "/v1/characters/session",
  params(ListCharactersQuery),
  responses(
    (status = 200, description = "Success", body = ListCharactersResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_characters_handler(
  http_request: HttpRequest,
  query: Query<ListCharactersQuery>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListCharactersResponse>, AdvancedCommonWebError> {

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let user_session = require_user_session_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection,
  ).await?;

  let user_token = &user_session.user_token;

  // --- Query characters ---

  let result = list_active_characters_for_user(user_token, query.cursor, &mut mysql_connection)
      .await?;

  if result.characters.is_empty() {
    return Ok(Json(ListCharactersResponse {
      success: true,
      characters: vec![],
      next_cursor: None,
    }));
  }

  // --- Resolve media links ---

  let media_domain = get_media_domain(&http_request);

  let mut media_tokens_to_lookup: Vec<MediaFileToken> = Vec::new();
  for character in &result.characters {
    if let Some(ref t) = character.maybe_avatar_media_token { media_tokens_to_lookup.push(t.clone()); }
    if let Some(ref t) = character.maybe_full_image_media_token { media_tokens_to_lookup.push(t.clone()); }
    if let Some(ref t) = character.maybe_original_upload_media_token { media_tokens_to_lookup.push(t.clone()); }
  }

  let media_records = if media_tokens_to_lookup.is_empty() {
    vec![]
  } else {
    batch_get_media_files_by_tokens_with_connection(&mut mysql_connection, &media_tokens_to_lookup, false)
        .await
        .unwrap_or_else(|err| {
          warn!("Failed to look up media files for characters: {:?}", err);
          vec![]
        })
  };

  // --- Build response ---

  let characters = result.characters.iter().map(|c| {
    let maybe_avatar = resolve_media_links(&media_records, &c.maybe_avatar_media_token, media_domain, server_state.server_environment);
    let maybe_full_image = resolve_media_links(&media_records, &c.maybe_full_image_media_token, media_domain, server_state.server_environment);

    ListCharactersEntry {
      token: c.token.clone(),
      models: vec![CommonModelType::Seedance2p0],
      name: c.character_name.clone().unwrap_or_default(),
      maybe_description: c.maybe_description.clone(),
      maybe_avatar,
      maybe_full_image,
    }
  }).collect();

  Ok(Json(ListCharactersResponse {
    success: true,
    characters,
    next_cursor: result.next_cursor,
  }))
}

// =============== Private helpers ===============

fn resolve_media_links(
  media_records: &[MediaFilesByTokensRecord],
  maybe_token: &Option<MediaFileToken>,
  media_domain: MediaDomain,
  server_environment: server_environment::ServerEnvironment,
) -> Option<MediaLinks> {
  let token = maybe_token.as_ref()?;
  let record = media_records.iter().find(|r| &r.token == token)?;
  let path = MediaFileBucketPath::from_object_hash(
    &record.public_bucket_directory_hash,
    record.maybe_public_bucket_prefix.as_deref(),
    record.maybe_public_bucket_extension.as_deref(),
  );
  Some(MediaLinksBuilder::from_media_path_and_env(media_domain, server_environment, &path))
}
