use url::Url;
use utoipa::ToSchema;

use crate::http_server::common_responses::media::cdn_link;
use crate::http_server::common_responses::media::cover_image_links::CoverImageLinks;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::util::placeholder_images::cover_images::default_cover_image_color_from_token::default_cover_image_color_from_token;
use crate::util::placeholder_images::cover_images::default_cover_image_from_token::default_cover_image_from_token;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use server_environment::ServerEnvironment;
use tokens::tokens::model_weights::ModelWeightToken;

/// Everything we need to create a cover image.
/// Cover images are small descriptive images that can be set for any model.
/// If a cover image is set, this is the path to the asset.
#[derive(Clone, Serialize, ToSchema)]
pub struct WeightsCoverImageDetails {
  /// DEPRECATED. If a cover image is set, this is the path to the asset.
  #[deprecated(note="Deprecated. Use `maybe_cdn_url` and `maybe_thumbnail_template` instead.")]
  pub maybe_cover_image_public_bucket_path: Option<String>,

  /// DEPRECATED. If a cover image is set, this is the URL to the asset.
  #[deprecated(note="Deprecated. Use `maybe_cdn_url` and `maybe_thumbnail_template` instead.")]
  pub maybe_cover_image_public_bucket_url: Option<Url>,

  /// Links to the cover image (CDN direct link, thumbnail template)
  /// If a cover image is set, this is the path to the asset.
  /// If a cover image is not set, use the information in `default_cover` instead.
  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub maybe_links: Option<CoverImageLinks>,

  /// For items without a cover image, we can use one of our own.
  pub default_cover: WeightsDefaultCoverInfo,
}


#[derive(Clone, Serialize,ToSchema)]
pub struct WeightsDefaultCoverInfo {
  /// Which image to show.
  pub image_index: u8,
  /// Which color to use.
  pub color_index: u8,
}

impl WeightsCoverImageDetails {

  pub fn from_optional_db_fields(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    model_weight_token: &ModelWeightToken,
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
      default_cover: WeightsDefaultCoverInfo::from_token(model_weight_token),
    }
  }
}

impl WeightsDefaultCoverInfo {
  pub fn from_token(model_weight_token: &ModelWeightToken) -> Self {
    Self {
      image_index: default_cover_image_from_token(model_weight_token),
      color_index: default_cover_image_color_from_token(model_weight_token),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::http_server::common_responses::media::media_domain::MediaDomain;
  use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
  use server_environment::ServerEnvironment;
  use tokens::tokens::model_weights::ModelWeightToken;
  use url::Url;

  #[test]
  fn test_from_optional_db_fields() {
    let domain = MediaDomain::Storyteller;
    let token = ModelWeightToken::new_from_str("weight_token");
    let maybe_public_bucket_hash = Some("bucket_hash");
    let maybe_prefix = Some("image_");
    let maybe_extension= Some(".png");

    let cover_image = WeightsCoverImageDetails::from_optional_db_fields(
      domain,
      ServerEnvironment::Production,
      &token,
      maybe_public_bucket_hash,
      maybe_prefix,
      maybe_extension,
    );

    assert_eq!(cover_image.maybe_cover_image_public_bucket_path, Some("/media/b/u/c/k/e/bucket_hash/image_bucket_hash.png".to_string()));
    assert_eq!(cover_image.maybe_cover_image_public_bucket_url,
               Some(Url::parse("https://storage.googleapis.com/vocodes-public/media/b/u/c/k/e/bucket_hash/image_bucket_hash.png").unwrap()));
    assert_eq!(cover_image.default_cover.image_index, 18);

    let links = cover_image.maybe_links.unwrap();

    assert_eq!(links.cdn_url, Url::parse(
      "https://cdn.storyteller.ai/media/b/u/c/k/e/bucket_hash/image_bucket_hash.png").unwrap());
    assert_eq!(links.thumbnail_template,
               "https://cdn.storyteller.ai/cdn-cgi/image/width={WIDTH},quality=95/media/b/u/c/k/e/bucket_hash/image_bucket_hash.png");
  }
}
