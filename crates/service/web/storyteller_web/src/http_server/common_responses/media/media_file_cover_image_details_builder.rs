use crate::http_server::common_responses::media::cover_image_links_builder::CoverImageLinksBuilder;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use artcraft_api_defs::common::responses::media_file_cover_image_details::{MediaFileCoverImageDetails, MediaFileDefaultCover};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use server_environment::ServerEnvironment;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// There are currently 25 cover images numbered 0 to 24 (0-indexed).
/// The original dataset was numbered 1 - 25, but I renamed 25 to 0.
const NUMBER_OF_IMAGES : u64 = 25;
const NUMBER_OF_IMAGES_SALT_OFFSET : u8 = 5;

const NUMBER_OF_COLORS : u64 = 8;
const NUMBER_OF_COLORS_SALT_OFFSET : u8 = 1;


pub struct MediaFileCoverImageDetailsBuilder {}

pub struct MediaFileDefaultCoverBuilder {}

impl MediaFileCoverImageDetailsBuilder {
  /// Typical constructor
  pub fn from_token(token: &MediaFileToken) -> MediaFileCoverImageDetails {
    Self::from_token_str(token.as_str())
  }

  /// For non-media file tokens (eg. emulated TTS results)
  pub fn from_token_str(token: &str) -> MediaFileCoverImageDetails {
    MediaFileCoverImageDetails {
      // NB: The code using this builder does not populate or read these legacy fields:
      // maybe_cover_image_public_bucket_path: None,
      // maybe_cover_image_public_bucket_url: None,
      // maybe_media_links: None,
      maybe_links: None,
      default_cover: MediaFileDefaultCoverBuilder::from_token_str(token),
    }
  }

  pub fn from_optional_db_fields(
    token: &MediaFileToken,
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    maybe_cover_image_public_bucket_path: Option<&str>,
    maybe_cover_image_public_bucket_prefix: Option<&str>,
    maybe_cover_image_public_bucket_extension: Option<&str>,
  ) -> MediaFileCoverImageDetails {
    Self::from_optional_db_str_fields(
      token.as_str(),
      domain,
      server_environment,
      maybe_cover_image_public_bucket_path,
      maybe_cover_image_public_bucket_prefix,
      maybe_cover_image_public_bucket_extension
    )
  }

  pub fn from_optional_db_str_fields(
    token: &str,
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    maybe_cover_image_public_bucket_path: Option<&str>,
    maybe_cover_image_public_bucket_prefix: Option<&str>,
    maybe_cover_image_public_bucket_extension: Option<&str>,
  ) -> MediaFileCoverImageDetails {
    let maybe_bucket_path = maybe_cover_image_public_bucket_path
        .map(|hash| MediaFileBucketPath::from_object_hash(
          hash,
          maybe_cover_image_public_bucket_prefix,
          maybe_cover_image_public_bucket_extension
        ));

    let maybe_links = CoverImageLinksBuilder::from_maybe_media_path(
      domain, server_environment, maybe_bucket_path.as_ref());

    MediaFileCoverImageDetails {
      maybe_links,
      default_cover: MediaFileDefaultCoverBuilder::from_token_str(token),
    }
  }
}

impl MediaFileDefaultCoverBuilder {
  /// Typical constructor
  pub fn from_token(token: &MediaFileToken) -> MediaFileDefaultCover {
    Self::from_token_str(token.as_str())
  }

  /// For non-media file tokens (eg. emulated TTS results)
  pub fn from_token_str(token: &str) -> MediaFileDefaultCover {
    MediaFileDefaultCover {
      image_index: hash(token, NUMBER_OF_IMAGES, NUMBER_OF_IMAGES_SALT_OFFSET),
      color_index: hash(token, NUMBER_OF_COLORS, NUMBER_OF_COLORS_SALT_OFFSET),
    }
  }
}

fn hash(token: &str, max_number: u64, salt: u8) -> u8 {
  let mut hasher = DefaultHasher::new();

  token.hash(&mut hasher);
  salt.hash(&mut hasher);

  let hash = hasher.finish();

  let index= hash % max_number;
  index as u8
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::http_server::common_responses::media::media_file_cover_image_details_builder::MediaFileDefaultCoverBuilder;

  #[test]
  fn test() {
    let token = MediaFileToken::new_from_str("foo");
    let cover = MediaFileDefaultCoverBuilder::from_token(&token);
    assert_eq!(cover.color_index, 5);
    assert_eq!(cover.image_index, 2);

    let token = MediaFileToken::new_from_str("bar");
    let cover = MediaFileDefaultCoverBuilder::from_token(&token);
    assert_eq!(cover.color_index, 5);
    assert_eq!(cover.image_index, 3);

    let token = MediaFileToken::new_from_str("asdf");
    let cover = MediaFileDefaultCoverBuilder::from_token(&token);
    assert_eq!(cover.color_index, 0);
    assert_eq!(cover.image_index, 23);
  }
}
