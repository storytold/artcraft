use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::characters::get_character::{GetCharacterDetails, GetCharacterPathInfo, GetCharacterResponse};
use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::generation::common_model_type::CommonModelType;
use mysql_queries::queries::characters::get_character_by_token::get_character_by_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens_with_connection, MediaFilesByTokensRecord};
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::state::server_state::ServerState;

/// Get a character by token.
#[utoipa::path(
  get,
  tag = "Characters",
  path = "/v1/character/{character_token}",
  responses(
    (status = 200, description = "Success", body = GetCharacterResponse),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("character_token" = CharacterToken, Path, description = "Character token"),
  )
)]
pub async fn get_character_handler(
  http_request: HttpRequest,
  path: Path<GetCharacterPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<GetCharacterResponse>, AdvancedCommonWebError> {

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let character = get_character_by_token(&path.character_token, &mut mysql_connection)
      .await?
      .ok_or_else(|| {
        warn!("Character not found: {}", path.character_token);
        AdvancedCommonWebError::NotFound
      })?;

  // --- Resolve media links ---

  let media_domain = get_media_domain(&http_request);

  let mut media_tokens_to_lookup: Vec<MediaFileToken> = Vec::new();
  if let Some(ref t) = character.maybe_avatar_media_token { media_tokens_to_lookup.push(t.clone()); }
  if let Some(ref t) = character.maybe_full_image_media_token { media_tokens_to_lookup.push(t.clone()); }
  if let Some(ref t) = character.maybe_original_upload_media_token { media_tokens_to_lookup.push(t.clone()); }

  let media_records = if media_tokens_to_lookup.is_empty() {
    vec![]
  } else {
    batch_get_media_files_by_tokens_with_connection(&mut mysql_connection, &media_tokens_to_lookup, true)
        .await
        .unwrap_or_else(|err| {
          warn!("Failed to look up media files for character: {:?}", err);
          vec![]
        })
  };

  let maybe_avatar = resolve_media_links(&media_records, &character.maybe_avatar_media_token, media_domain, server_state.server_environment);
  let maybe_full_image = resolve_media_links(&media_records, &character.maybe_full_image_media_token, media_domain, server_state.server_environment);

  Ok(Json(GetCharacterResponse {
    success: true,
    character: GetCharacterDetails {
      token: character.token,
      models: vec![CommonModelType::Seedance2p0],
      name: character.character_name.unwrap_or_default(),
      maybe_description: character.maybe_description,
      maybe_avatar,
      maybe_full_image,
    },
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
