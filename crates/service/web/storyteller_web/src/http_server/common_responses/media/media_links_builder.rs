use crate::http_server::common_responses::media::cdn_link::{get_cdn_host, new_cdn_url};
use crate::http_server::common_responses::media::media_domain::MediaDomain;
use artcraft_api_defs::common::responses::media_links::{MediaLinks, VideoPreviews};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::path_conventions::video_thumbnail_suffixes::{VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX, VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX};
use server_environment::ServerEnvironment;
use url::Url;
use utoipa::ToSchema;

// TODO(bt,2024-09-05): Worth reducing the quality at all?
const QUALITY : u8 = 95;


/// Links to media file locations (bucket, CDN, etc.)
/// 
/// This migrates the constructors to the `artcraft_api_defs` crate
pub struct MediaLinksBuilder {}

impl MediaLinksBuilder {

  pub fn from_media_path_and_env(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    bucket_path: &MediaFileBucketPath,
  ) -> MediaLinks {
    let rooted_path = bucket_path.get_full_object_path_str();
    Self::from_rooted_path_and_env(domain, server_environment, rooted_path)
  }

  pub fn from_rooted_path_and_env(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    rooted_path: &str,
  ) -> MediaLinks {
    let mut cdn_url = new_cdn_url(domain, server_environment);
    cdn_url.set_path(rooted_path);
    MediaLinks {
      cdn_url,
      maybe_thumbnail_template: thumbnail_template(domain, server_environment, rooted_path),
      maybe_video_previews: VideoPreviewsBuilder::from_rooted_path(domain, server_environment, rooted_path),
    }
  }
}

pub struct VideoPreviewsBuilder {}

impl VideoPreviewsBuilder {
  fn from_rooted_path(
    domain: MediaDomain,
    server_environment: ServerEnvironment,
    rooted_path: &str,
  ) -> Option<VideoPreviews> {
    if !rooted_path.ends_with(".mp4") {
      return None;
    }
    Some(VideoPreviews {
      still: video_preview(domain, server_environment, rooted_path, PreviewType::Jpg),
      animated: video_preview(domain, server_environment, rooted_path, PreviewType::Gif),
      still_thumbnail_template: video_preview_thumbnail_template(domain, server_environment, rooted_path, PreviewType::Jpg),
      animated_thumbnail_template: video_preview_thumbnail_template(domain, server_environment, rooted_path, PreviewType::Gif),
    })
  }
}

enum PreviewType {
  Gif,
  Jpg
}

/// Returns a jpeg or gif preview of the video.
fn video_preview(media_domain: MediaDomain, server_environment: ServerEnvironment, rooted_path: &str, thumbnail_type: PreviewType) -> Url {
  let rooted_path = match thumbnail_type {
    PreviewType::Gif => format!("{rooted_path}{VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX}"),
    PreviewType::Jpg => format!("{rooted_path}{VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX}"),
  };
  let mut url = new_cdn_url(media_domain, server_environment);
  url.set_path(&rooted_path);
  url
}

/// Returns a thumbnail template for image
fn thumbnail_template(media_domain: MediaDomain, server_environment: ServerEnvironment, rooted_path: &str) -> Option<String> {
  if !rooted_path.ends_with(".jpg")
      && !rooted_path.ends_with(".png")
      && !rooted_path.ends_with(".gif") {
    return None;
  }

  let host = get_cdn_host(media_domain, server_environment);

  // NB(bt,2025-02-01): Development doesn't currently support thumbnails, so serve the full image.
  match server_environment {
    ServerEnvironment::Development => Some(format!("{host}{rooted_path}")), // NB(bt,2025-02-01): No thumbnails in development.
    ServerEnvironment::Production => Some(format!("{host}/cdn-cgi/image/width={{WIDTH}},quality={QUALITY}{rooted_path}"))
  }
}

/// Returns a thumbnail template for video
fn video_preview_thumbnail_template(media_domain: MediaDomain, server_environment: ServerEnvironment, rooted_path: &str, thumbnail_type: PreviewType) -> String {
  let host = get_cdn_host(media_domain, server_environment);
  let rooted_path = match thumbnail_type {
    PreviewType::Gif => format!("{rooted_path}{VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX}"),
    PreviewType::Jpg => format!("{rooted_path}{VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX}"),
  };
  // NB: Development doesn't support cdn-cgi image resizing.
  match server_environment {
    ServerEnvironment::Development => format!("{host}{rooted_path}"),
    ServerEnvironment::Production => format!("{host}/cdn-cgi/image/width={{WIDTH}},quality={QUALITY}{rooted_path}"),
  }
}


#[cfg(test)]
mod tests {
  use crate::http_server::common_responses::media::media_domain::MediaDomain;
  use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
  use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
  use server_environment::ServerEnvironment;

  const DEV_CDN: &str = "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev";
  const PROD_CDN: &str = "https://cdn-2.fakeyou.com";

  mod fakeyou {
    use super::*;

    const DOMAIN : MediaDomain = MediaDomain::FakeYou;

    mod production {
      use super::*;

      const ENV : ServerEnvironment = ServerEnvironment::Production;

      #[test]
      fn wav_file() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.wav");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.wav"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn glb_file() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.glb");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.glb"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn jpg_image() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.jpg");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.jpg"));
        assert_eq!(links.maybe_thumbnail_template, Some(format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/foo/bar.jpg")));
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn mp4_video() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.mp4");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.mp4"));
        assert_eq!(links.maybe_thumbnail_template, None);
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{PROD_CDN}/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{PROD_CDN}/foo/bar.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/foo/bar.mp4-thumb.gif"));
      }

      #[test]
      fn mp4_video_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("t6cnyw4g3e8k7carkk2bvrt6nd3fycjv", Some("storyteller_"), Some(".mp4"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4"));
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{PROD_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{PROD_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
      }

      #[test]
      fn wav_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("94a27nmbd0bqmd10tg0pp3hz45zytf67", Some("fakeyou_"), Some(".wav"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/media/9/4/a/2/7/94a27nmbd0bqmd10tg0pp3hz45zytf67/fakeyou_94a27nmbd0bqmd10tg0pp3hz45zytf67.wav"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn png_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("37mb3gh8fmj85y21thvbv08bzv24atjt", Some("upload_"), Some(".png"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/media/3/7/m/b/3/37mb3gh8fmj85y21thvbv08bzv24atjt/upload_37mb3gh8fmj85y21thvbv08bzv24atjt.png"));
        assert_eq!(links.maybe_thumbnail_template, Some(format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/3/7/m/b/3/37mb3gh8fmj85y21thvbv08bzv24atjt/upload_37mb3gh8fmj85y21thvbv08bzv24atjt.png")));
        assert_eq!(links.maybe_video_previews, None);
      }
    }

    mod development {
      use super::*;

      const ENV : ServerEnvironment = ServerEnvironment::Development;

      #[test]
      fn wav_file() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.wav");
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/foo/bar.wav"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn jpg_image() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.jpg");
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/foo/bar.jpg"));
        // NB: Development doesn't support cdn-cgi, so serve the full image.
        assert_eq!(links.maybe_thumbnail_template, Some(format!("{DEV_CDN}/foo/bar.jpg")));
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn mp4_video() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.mp4");
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/foo/bar.mp4"));
        assert_eq!(links.maybe_thumbnail_template, None);
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{DEV_CDN}/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{DEV_CDN}/foo/bar.mp4-thumb.gif"));
        // NB: Development doesn't support cdn-cgi, so templates are plain URLs.
        assert_eq!(video_previews.still_thumbnail_template, format!("{DEV_CDN}/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{DEV_CDN}/foo/bar.mp4-thumb.gif"));
      }

      #[test]
      fn mp4_video_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("t6cnyw4g3e8k7carkk2bvrt6nd3fycjv", Some("storyteller_"), Some(".mp4"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4"));
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
      }
    }
  }

  mod storyteller {
    use super::*;

    const DOMAIN : MediaDomain = MediaDomain::Storyteller;

    mod production {
      use super::*;

      const ENV : ServerEnvironment = ServerEnvironment::Production;

      #[test]
      fn wav_file() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.wav");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.wav"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn glb_file() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.glb");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.glb"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn jpg_image() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.jpg");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.jpg"));
        assert_eq!(links.maybe_thumbnail_template, Some(format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/foo/bar.jpg")));
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn mp4_video() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.mp4");
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/foo/bar.mp4"));
        assert_eq!(links.maybe_thumbnail_template, None);
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{PROD_CDN}/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{PROD_CDN}/foo/bar.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/foo/bar.mp4-thumb.gif"));
      }

      #[test]
      fn mp4_video_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("t6cnyw4g3e8k7carkk2bvrt6nd3fycjv", Some("storyteller_"), Some(".mp4"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4"));
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{PROD_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{PROD_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
      }

      #[test]
      fn wav_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("94a27nmbd0bqmd10tg0pp3hz45zytf67", Some("fakeyou_"), Some(".wav"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/media/9/4/a/2/7/94a27nmbd0bqmd10tg0pp3hz45zytf67/fakeyou_94a27nmbd0bqmd10tg0pp3hz45zytf67.wav"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn png_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("37mb3gh8fmj85y21thvbv08bzv24atjt", Some("upload_"), Some(".png"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{PROD_CDN}/media/3/7/m/b/3/37mb3gh8fmj85y21thvbv08bzv24atjt/upload_37mb3gh8fmj85y21thvbv08bzv24atjt.png"));
        assert_eq!(links.maybe_thumbnail_template, Some(format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/3/7/m/b/3/37mb3gh8fmj85y21thvbv08bzv24atjt/upload_37mb3gh8fmj85y21thvbv08bzv24atjt.png")));
        assert_eq!(links.maybe_video_previews, None);
      }
    }

    mod development {
      use super::*;

      const ENV : ServerEnvironment = ServerEnvironment::Development;

      #[test]
      fn wav_file() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.wav");
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/foo/bar.wav"));
        assert_eq!(links.maybe_thumbnail_template, None);
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn jpg_image() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.jpg");
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/foo/bar.jpg"));
        assert_eq!(links.maybe_thumbnail_template, Some(format!("{DEV_CDN}/foo/bar.jpg")));
        assert_eq!(links.maybe_video_previews, None);
      }

      #[test]
      fn mp4_video() {
        let links = MediaLinksBuilder::from_rooted_path_and_env(DOMAIN, ENV, "/foo/bar.mp4");
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/foo/bar.mp4"));
        assert_eq!(links.maybe_thumbnail_template, None);
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{DEV_CDN}/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{DEV_CDN}/foo/bar.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{DEV_CDN}/foo/bar.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{DEV_CDN}/foo/bar.mp4-thumb.gif"));
      }

      #[test]
      fn mp4_video_media_path() {
        let media_path = MediaFileBucketPath::from_object_hash("t6cnyw4g3e8k7carkk2bvrt6nd3fycjv", Some("storyteller_"), Some(".mp4"));
        let links = MediaLinksBuilder::from_media_path_and_env(DOMAIN, ENV, &media_path);
        assert_eq!(links.cdn_url.as_str(), format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4"));
        let video_previews = links.maybe_video_previews.expect("should have previews");
        assert_eq!(video_previews.still.as_str(), format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated.as_str(), format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
        assert_eq!(video_previews.still_thumbnail_template, format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.jpg"));
        assert_eq!(video_previews.animated_thumbnail_template, format!("{DEV_CDN}/media/t/6/c/n/y/t6cnyw4g3e8k7carkk2bvrt6nd3fycjv/storyteller_t6cnyw4g3e8k7carkk2bvrt6nd3fycjv.mp4-thumb.gif"));
      }
    }
  }
}
