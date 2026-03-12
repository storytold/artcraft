use crate::http_server::common_responses::media::cdn_link;
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use artcraft_api_defs::common::responses::cover_image_links::CoverImageLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use server_environment::ServerEnvironment;

// TODO(bt,2024-09-18): Consolidate thumbnail builder code and vars
// TODO(bt,2024-09-05): Worth reducing the quality at all?
const QUALITY : u8 = 95;

pub struct CoverImageLinksBuilder {}

impl CoverImageLinksBuilder {

  pub fn from_media_path(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    bucket_path: &MediaFileBucketPath,
  ) -> Option<CoverImageLinks> {
    let rooted_path = bucket_path.get_full_object_path_str();
    Self::from_rooted_path(domain, server_environment, rooted_path)
  }

  pub fn from_maybe_media_path(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    bucket_path: Option<&MediaFileBucketPath>,
  ) -> Option<CoverImageLinks> {
    match bucket_path {
      None => None,
      Some(bucket_path) => Self::from_media_path(domain, server_environment, bucket_path),
    }
  }

  pub fn from_parts(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    maybe_cover_image_public_bucket_path: Option<&str>,
    maybe_cover_image_public_bucket_prefix: Option<&str>,
    maybe_cover_image_public_bucket_extension: Option<&str>,
  ) -> Option<CoverImageLinks> {
    let bucket_path= match maybe_cover_image_public_bucket_path {
      None => return None,
      Some(path) => path,
    };
    let bucket_path = MediaFileBucketPath::from_object_hash(
      bucket_path,
      maybe_cover_image_public_bucket_prefix,
      maybe_cover_image_public_bucket_extension
    );
    Self::from_media_path(domain, server_environment, &bucket_path)
  }

  pub fn from_rooted_path(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    rooted_path: &str,
  ) -> Option<CoverImageLinks> {
    if !rooted_path.ends_with(".jpg")
        && !rooted_path.ends_with(".png")
        && !rooted_path.ends_with(".gif") {
      return None;
    }

    let mut cdn_url = cdn_link::new_cdn_url(domain, server_environment);
    cdn_url.set_path(rooted_path);

    Some(CoverImageLinks {
      cdn_url,
      thumbnail_template: thumbnail_template(domain, server_environment, rooted_path),
    })
  }
}

fn thumbnail_template(media_domain: MediaDomain, server_environment: ServerEnvironment, rooted_path: &str) -> String {
  let host = cdn_link::get_cdn_host(media_domain, server_environment);
  match server_environment {
    ServerEnvironment::Production => {
      format!("{host}/cdn-cgi/image/width={{WIDTH}},quality={QUALITY}{rooted_path}")
    }
    ServerEnvironment::Development => {
      format!("{host}{rooted_path}")
    }
  }
}
