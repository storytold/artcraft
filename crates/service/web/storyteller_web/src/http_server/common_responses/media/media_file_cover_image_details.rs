use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use url::Url;
use utoipa::ToSchema;

use crate::http_server::common_responses::media::cdn_link;
use crate::http_server::common_responses::media::cover_image_links::CoverImageLinks;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use server_environment::ServerEnvironment;
use tokens::tokens::media_files::MediaFileToken;

/// There are currently 25 cover images numbered 0 to 24 (0-indexed).
/// The original dataset was numbered 1 - 25, but I renamed 25 to 0.
const NUMBER_OF_IMAGES : u64 = 25;
const NUMBER_OF_IMAGES_SALT_OFFSET : u8 = 5;

const NUMBER_OF_COLORS : u64 = 8;
const NUMBER_OF_COLORS_SALT_OFFSET : u8 = 1;


/// Everything we need to create a cover image.
/// Cover images are small descriptive images that can be set for any media file.
/// If a cover image is set, this is the path to the asset.
#[derive(Clone, Serialize, ToSchema)]
pub struct MediaFileCoverImageDetails {
  /// (DEPRECATED) URL path to the media file
  #[deprecated(note="This field doesn't point to the full URL. Use media_links instead to leverage the CDN.")]
  pub maybe_cover_image_public_bucket_path: Option<String>,

  /// (DEPRECATED) Full URL to the media file
  #[deprecated(note="This points to the bucket. Use media_links instead to leverage the CDN.")]
  pub maybe_cover_image_public_bucket_url: Option<Url>,

  // NB(bt,2024-09-19): I accidentally rolled this field out to production.
  // I don't think this field is in use, but maybe ...
  // /// (DEPRECATED) Use maybe_links instead.
  // #[deprecated(note="Use `maybe_links` instead.")]
  // pub maybe_media_links: Option<MediaLinks>,

  /// Links to the cover image (CDN direct link, thumbnail template)
  /// If a cover image is set, this is the path to the asset.
  /// If a cover image is not set, use the information in `default_cover` instead.
  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub maybe_links: Option<CoverImageLinks>,

  /// For items without a cover image, we can use one of our own.
  pub default_cover: MediaFileDefaultCover,
}

/// The default cover is composed of an image and color pair that are
/// predefined by the frontend.
#[derive(Clone, Serialize,ToSchema)]
pub struct MediaFileDefaultCover {
  pub image_index: u8,
  pub color_index: u8,
}

impl MediaFileCoverImageDetails {
  /// Typical constructor
  pub fn from_token(token: &MediaFileToken) -> Self {
    Self::from_token_str(token.as_str())
  }

  /// For non-media file tokens (eg. emulated TTS results)
  pub fn from_legacy_token_str(token: &str) -> Self {
    Self::from_token_str(token)
  }
  
  fn from_token_str(token: &str) -> Self {
    Self {
      // TODO(bt,2024-04-07): Add column to schema to support + CRUD to add.
      maybe_cover_image_public_bucket_path: None,
      maybe_cover_image_public_bucket_url: None,
      //maybe_media_links: None,
      maybe_links: None,
      default_cover: MediaFileDefaultCover::from_token_str(token),
    }
  }

  pub fn from_optional_db_fields(
    token: &MediaFileToken,
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    maybe_cover_image_public_bucket_path: Option<&str>,
    maybe_cover_image_public_bucket_prefix: Option<&str>,
    maybe_cover_image_public_bucket_extension: Option<&str>,
  ) -> Self {
    Self::from_optional_db_str_fields(
      token.as_str(),
      domain,
      server_environment,
      maybe_cover_image_public_bucket_path,
      maybe_cover_image_public_bucket_prefix,
      maybe_cover_image_public_bucket_extension
    )
  }

  fn from_optional_db_str_fields(
    token: &str,
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    maybe_cover_image_public_bucket_path: Option<&str>,
    maybe_cover_image_public_bucket_prefix: Option<&str>,
    maybe_cover_image_public_bucket_extension: Option<&str>,
  ) -> Self {
    let maybe_bucket_path = maybe_cover_image_public_bucket_path
        .map(|hash| MediaFileBucketPath::from_object_hash(
          hash,
          maybe_cover_image_public_bucket_prefix,
          maybe_cover_image_public_bucket_extension
        ));

    let maybe_cover_image_public_bucket_path = maybe_bucket_path
        .as_ref()
        .map(|bucket_path| bucket_path
            .get_full_object_path_str()
            .to_string());

    // NB: Fail construction open.
    let maybe_cover_image_public_bucket_url = maybe_bucket_path
        .as_ref()
        .and_then(|bucket_path| {
          let rooted_path = bucket_path.get_full_object_path_str();
          let mut url = cdn_link::new_cdn_url(domain, server_environment);
          url.set_path(rooted_path);
          Some(url)
        });

    let maybe_links = CoverImageLinks::from_maybe_media_path(
      domain, server_environment, maybe_bucket_path.as_ref());

    Self {
      maybe_cover_image_public_bucket_path,
      maybe_cover_image_public_bucket_url,
      maybe_links,
      default_cover: MediaFileDefaultCover::from_token_str(token),
    }
  }
}

impl MediaFileDefaultCover {
  /// Typical constructor
  pub fn from_token(token: &MediaFileToken) -> Self {
    Self::from_token_str(token.as_str())
  }

  /// For non-media file tokens (eg. emulated TTS results)
  pub fn from_token_str(token: &str) -> Self {
    Self {
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

  use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileDefaultCover;

  #[test]
  fn test() {
    let token = MediaFileToken::new_from_str("foo");
    let cover = MediaFileDefaultCover::from_token(&token);
    assert_eq!(cover.color_index, 5);
    assert_eq!(cover.image_index, 2);

    let token = MediaFileToken::new_from_str("bar");
    let cover = MediaFileDefaultCover::from_token(&token);
    assert_eq!(cover.color_index, 5);
    assert_eq!(cover.image_index, 3);

    let token = MediaFileToken::new_from_str("asdf");
    let cover = MediaFileDefaultCover::from_token(&token);
    assert_eq!(cover.color_index, 0);
    assert_eq!(cover.image_index, 23);
  }

  #[test]
  fn test_cover_image_url_production() {
    let token = MediaFileToken::new_from_str("test_token");
    let domain = super::MediaDomain::FakeYou;
    let env = super::ServerEnvironment::Production;

    let details = super::MediaFileCoverImageDetails::from_optional_db_fields(
      &token,
      domain,
      env,
      Some("bucket_hash"),
      Some("image_"),
      Some(".png"),
    );

    let url = details.maybe_cover_image_public_bucket_url.unwrap();
    assert!(
      url.as_str().starts_with("https://cdn-2.fakeyou.com"),
      "Production URL should start with https://cdn-2.fakeyou.com, got: {}",
      url
    );
  }

  #[test]
  fn test_cover_image_url_development() {
    let token = MediaFileToken::new_from_str("test_token");
    let domain = super::MediaDomain::FakeYou;
    let env = super::ServerEnvironment::Development;

    let details = super::MediaFileCoverImageDetails::from_optional_db_fields(
      &token,
      domain,
      env,
      Some("bucket_hash"),
      Some("image_"),
      Some(".png"),
    );

    let url = details.maybe_cover_image_public_bucket_url.unwrap();
    assert!(
      url.as_str().starts_with("https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/"),
      "Development URL should start with https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/, got: {}",
      url
    );
  }

  #[test]
  fn test_cover_image_links_cdn_url_production() {
    let token = MediaFileToken::new_from_str("test_token");
    let domain = super::MediaDomain::FakeYou;
    let env = super::ServerEnvironment::Production;

    let details = super::MediaFileCoverImageDetails::from_optional_db_fields(
      &token,
      domain,
      env,
      Some("bucket_hash"),
      Some("image_"),
      Some(".png"),
    );

    let links = details.maybe_links.unwrap();
    assert!(
      links.cdn_url.as_str().starts_with("https://cdn-2.fakeyou.com"),
      "Production cdn_url should start with https://cdn-2.fakeyou.com, got: {}",
      links.cdn_url
    );
  }

  #[test]
  fn test_cover_image_links_cdn_url_development() {
    let token = MediaFileToken::new_from_str("test_token");
    let domain = super::MediaDomain::FakeYou;
    let env = super::ServerEnvironment::Development;

    let details = super::MediaFileCoverImageDetails::from_optional_db_fields(
      &token,
      domain,
      env,
      Some("bucket_hash"),
      Some("image_"),
      Some(".png"),
    );

    let links = details.maybe_links.unwrap();
    assert!(
      links.cdn_url.as_str().starts_with("https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/"),
      "Development cdn_url should start with https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/, got: {}",
      links.cdn_url
    );
  }

  #[test]
  fn test_cover_image_links_thumbnail_template_production() {
    let token = MediaFileToken::new_from_str("test_token");
    let domain = super::MediaDomain::FakeYou;
    let env = super::ServerEnvironment::Production;

    let details = super::MediaFileCoverImageDetails::from_optional_db_fields(
      &token,
      domain,
      env,
      Some("bucket_hash"),
      Some("image_"),
      Some(".png"),
    );

    let links = details.maybe_links.unwrap();
    assert!(
      links.thumbnail_template.starts_with("https://cdn-2.fakeyou.com"),
      "Production thumbnail_template should start with https://cdn-2.fakeyou.com, got: {}",
      links.thumbnail_template
    );
  }

  #[test]
  fn test_cover_image_links_thumbnail_template_development() {
    let token = MediaFileToken::new_from_str("test_token");
    let domain = super::MediaDomain::FakeYou;
    let env = super::ServerEnvironment::Development;

    let details = super::MediaFileCoverImageDetails::from_optional_db_fields(
      &token,
      domain,
      env,
      Some("bucket_hash"),
      Some("image_"),
      Some(".png"),
    );

    let links = details.maybe_links.unwrap();
    assert!(
      links.thumbnail_template.starts_with("https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/"),
      "Development thumbnail_template should start with https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/, got: {}",
      links.thumbnail_template
    );
  }
}
