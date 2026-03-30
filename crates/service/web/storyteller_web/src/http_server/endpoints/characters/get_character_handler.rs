use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::characters::get_character::{GetCharacterDetails, GetCharacterPathInfo, GetCharacterResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::generation::common_model_type::CommonModelType;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::common_web_error::CommonWebError;
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
) -> Result<Json<GetCharacterResponse>, CommonWebError> {
  // TODO: Replace with real character query. This is test data using a real media file (Ernest).

  let media_domain = get_media_domain(&http_request);
  let ernest_media_token = MediaFileToken::new_from_str("m_1997908e4tcbaj34wa0s5bvr4y4szt");

  let maybe_links = match get_media_file(&ernest_media_token, false, &server_state.mysql_pool).await {
    Ok(Some(record)) => {
      let path = MediaFileBucketPath::from_object_hash(
        &record.public_bucket_directory_hash,
        record.maybe_public_bucket_prefix.as_deref(),
        record.maybe_public_bucket_extension.as_deref(),
      );
      Some(MediaLinksBuilder::from_media_path_and_env(media_domain, server_state.server_environment, &path))
    }
    Ok(None) => {
      warn!("Ernest media file not found in database");
      None
    }
    Err(err) => {
      warn!("Failed to look up Ernest media file: {:?}", err);
      None
    }
  };

  let character = GetCharacterDetails {
    token: path.character_token.clone(),
    models: vec![CommonModelType::Seedance2p0],
    name: "Ernest".to_string(),
    maybe_description: Some("Ernest P. Worrell".to_string()),
    maybe_avatar: maybe_links.clone(),
    maybe_full_image: maybe_links,
  };

  Ok(Json(GetCharacterResponse {
    success: true,
    character,
  }))
}
