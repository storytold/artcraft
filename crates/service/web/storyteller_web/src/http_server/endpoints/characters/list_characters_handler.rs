use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::characters::list_characters::{ListCharactersEntry, ListCharactersQuery, ListCharactersResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::common::generation::common_model_type::CommonModelType;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
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
  _query: Query<ListCharactersQuery>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListCharactersResponse>, CommonWebError> {
  // TODO: Replace with real character queries. This is test data using real media files.

  let media_domain = get_media_domain(&http_request);

  struct TestCharacter {
    token: &'static str,
    name: &'static str,
    description: &'static str,
    media_token: &'static str,
  }

  let test_characters = vec![
    TestCharacter { token: "character_mock_ernest_001", name: "Ernest", description: "Ernest P. Worrell", media_token: "m_1997908e4tcbaj34wa0s5bvr4y4szt" },
    TestCharacter { token: "character_mock_juno_002", name: "Juno", description: "Juno the corgi", media_token: "m_m1bz02z1kkzanxy6rb4vk1kvq9de9g" },
    TestCharacter { token: "character_mock_mochi_003", name: "Mochi", description: "Mochi with glasses", media_token: "m_5y81rcnpnrbey55da6cc2s9z4d2f45" },
  ];

  let media_tokens: Vec<MediaFileToken> = test_characters.iter()
    .map(|c| MediaFileToken::new_from_str(c.media_token))
    .collect();

  let media_records = batch_get_media_files_by_tokens(&server_state.mysql_pool, &media_tokens, false)
    .await
    .unwrap_or_else(|err| {
      warn!("Failed to look up media files for test characters: {:?}", err);
      vec![]
    });

  let characters = test_characters.iter().map(|tc| {
    let maybe_links = media_records.iter()
      .find(|r| r.token.as_str() == tc.media_token)
      .map(|r| {
        let path = MediaFileBucketPath::from_object_hash(
          &r.public_bucket_directory_hash,
          r.maybe_public_bucket_prefix.as_deref(),
          r.maybe_public_bucket_extension.as_deref(),
        );
        MediaLinksBuilder::from_media_path_and_env(media_domain, server_state.server_environment, &path)
      });

    ListCharactersEntry {
      token: CharacterToken::new_from_str(tc.token),
      models: vec![CommonModelType::Seedance2p0],
      name: tc.name.to_string(),
      maybe_description: Some(tc.description.to_string()),
      maybe_avatar: maybe_links.clone(),
      maybe_full_image: maybe_links,
    }
  }).collect();

  Ok(Json(ListCharactersResponse {
    success: true,
    characters,
    next_cursor: None,
  }))
}
