use std::collections::{HashMap, HashSet};
use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use artcraft_api_defs::folders::common::{FolderInfo, FolderThumbnail, FolderThumbnailVideoPreviews};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::folders::folder::folder_row::FolderRow;
use mysql_queries::queries::media_files::get::batch_get_media_file_thumbnails_by_tokens::{
  batch_get_media_file_thumbnails_by_tokens, BatchGetMediaFileThumbnailsByTokensArgs,
  MediaFileThumbnailRow,
};
use server_environment::ServerEnvironment;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;

/// Gather every media-file token referenced by the given folder rows
/// (the four `last_media_*` slots + the custom cover) and batch-fetch
/// the thumbnail descriptors so we can build [`FolderInfo`]s in one go.
///
/// Returns a token → thumbnail map. Tokens for media files that don't
/// exist or are soft-deleted are silently absent from the map; the
/// caller treats them as "slot skipped".
pub async fn build_folder_thumbnails_lookup<'e, 'c: 'e, E>(
  folder_rows: &[FolderRow],
  mysql_executor: E,
  media_domain: MediaDomain,
  server_environment: ServerEnvironment,
) -> Result<HashMap<MediaFileToken, FolderThumbnail>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql> + 'c,
{
  let candidate_tokens = collect_candidate_thumbnail_tokens(folder_rows);

  if candidate_tokens.is_empty() {
    return Ok(HashMap::new());
  }

  let thumbnail_rows = batch_get_media_file_thumbnails_by_tokens(
    BatchGetMediaFileThumbnailsByTokensArgs {
      candidate_tokens: &candidate_tokens,
      mysql_executor,
      phantom: PhantomData,
    },
  ).await?;

  Ok(thumbnail_rows.into_iter()
    .map(|row| {
      let token = row.token.clone();
      (token, build_folder_thumbnail(row, media_domain, server_environment))
    })
    .collect())
}

pub fn folder_row_to_info(
  row: FolderRow,
  thumbnails_by_token: &HashMap<MediaFileToken, FolderThumbnail>,
) -> FolderInfo {
  // Vec rather than array so `.into_iter()` yields owned `Option`s on
  // every edition.
  let last_media_thumbnails: Vec<FolderThumbnail> = vec![
    row.maybe_last_media_file_token_1,
    row.maybe_last_media_file_token_2,
    row.maybe_last_media_file_token_3,
    row.maybe_last_media_file_token_4,
  ]
    .into_iter()
    .filter_map(|maybe_token| {
      maybe_token.and_then(|t| thumbnails_by_token.get(&t).cloned())
    })
    .collect();

  let maybe_custom_cover_thumbnail = row.maybe_cover_image_custom_media_token
    .and_then(|t| thumbnails_by_token.get(&t).cloned());

  FolderInfo {
    token: row.token,
    name: row.name,
    owner_user_token: row.owner_user_token,
    maybe_parent_folder_token: row.maybe_parent_folder_token,
    last_media_thumbnails,
    maybe_custom_cover_thumbnail,
    maybe_color_code: row.maybe_color_code,
    has_star: row.has_star,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_orphaned: row.is_orphaned,
  }
}

fn collect_candidate_thumbnail_tokens(rows: &[FolderRow]) -> Vec<MediaFileToken> {
  // Dedup with a `HashSet` so a folder that reuses the same token across
  // multiple slots (or two folders that share a thumbnail) doesn't pad
  // the IN-list bound parameter list.
  let mut seen: HashSet<MediaFileToken> = HashSet::with_capacity(rows.len() * 5);
  for row in rows {
    for maybe_token in [
      row.maybe_last_media_file_token_1.as_ref(),
      row.maybe_last_media_file_token_2.as_ref(),
      row.maybe_last_media_file_token_3.as_ref(),
      row.maybe_last_media_file_token_4.as_ref(),
      row.maybe_cover_image_custom_media_token.as_ref(),
    ] {
      if let Some(token) = maybe_token {
        seen.insert(token.clone());
      }
    }
  }
  seen.into_iter().collect()
}

fn build_folder_thumbnail(
  row: MediaFileThumbnailRow,
  media_domain: MediaDomain,
  server_environment: ServerEnvironment,
) -> FolderThumbnail {
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &row.public_bucket_directory_hash,
    row.maybe_public_bucket_prefix.as_deref(),
    row.maybe_public_bucket_extension.as_deref(),
  );

  // Reuse `MediaLinksBuilder` to produce the CDN URL, thumbnail template,
  // and video previews, then pull those fields onto the compact
  // FolderThumbnail wire shape.
  let media_links = MediaLinksBuilder::from_media_path_and_env(
    media_domain,
    server_environment,
    &bucket_path,
  );

  // Only video media files have previews; `MediaLinksBuilder` returns
  // `None` for everything else.
  let maybe_video_previews = media_links.maybe_video_previews
    .map(|previews| FolderThumbnailVideoPreviews {
      still: previews.still,
      animated: previews.animated,
      still_thumbnail_template: previews.still_thumbnail_template,
      animated_thumbnail_template: previews.animated_thumbnail_template,
    });

  FolderThumbnail {
    token: row.token,
    media_class: row.media_class,
    media_type: row.media_type,
    cdn_url: media_links.cdn_url,
    maybe_thumbnail_template: media_links.maybe_thumbnail_template,
    maybe_video_previews,
  }
}

#[cfg(test)]
mod tests {
  use enums::by_table::media_files::media_file_class::MediaFileClass;
  use enums::by_table::media_files::media_file_type::MediaFileType;

  use super::*;

  const PROD_CDN: &str = "https://cdn-2.fakeyou.com";
  const OBJECT_HASH: &str = "t6cnyw4g3e8k7carkk2bvrt6nd3fycjv";

  #[test]
  fn mp4_video_gets_video_previews() {
    let thumbnail = build_thumbnail_for_extension(MediaFileClass::Video, MediaFileType::Mp4, ".mp4");

    assert_eq!(thumbnail.maybe_thumbnail_template, None);

    let previews = thumbnail.maybe_video_previews.expect("video should have previews");
    assert_eq!(
      previews.still.as_str(),
      format!("{PROD_CDN}/media/t/6/c/n/y/{OBJECT_HASH}/storyteller_{OBJECT_HASH}.mp4-thumb.jpg"));
    assert_eq!(
      previews.animated.as_str(),
      format!("{PROD_CDN}/media/t/6/c/n/y/{OBJECT_HASH}/storyteller_{OBJECT_HASH}.mp4-thumb.gif"));
    assert_eq!(
      previews.still_thumbnail_template,
      format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/{OBJECT_HASH}/storyteller_{OBJECT_HASH}.mp4-thumb.jpg"));
    assert_eq!(
      previews.animated_thumbnail_template,
      format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/{OBJECT_HASH}/storyteller_{OBJECT_HASH}.mp4-thumb.gif"));
  }

  #[test]
  fn png_image_gets_thumbnail_template_but_no_video_previews() {
    let thumbnail = build_thumbnail_for_extension(MediaFileClass::Image, MediaFileType::Png, ".png");

    assert_eq!(
      thumbnail.maybe_thumbnail_template,
      Some(format!("{PROD_CDN}/cdn-cgi/image/width={{WIDTH}},quality=95/media/t/6/c/n/y/{OBJECT_HASH}/storyteller_{OBJECT_HASH}.png")));
    assert!(thumbnail.maybe_video_previews.is_none());
  }

  fn build_thumbnail_for_extension(
    media_class: MediaFileClass,
    media_type: MediaFileType,
    extension: &str,
  ) -> FolderThumbnail {
    let row = MediaFileThumbnailRow {
      token: MediaFileToken::new_from_str("m_test"),
      media_class,
      media_type,
      public_bucket_directory_hash: OBJECT_HASH.to_string(),
      maybe_public_bucket_prefix: Some("storyteller_".to_string()),
      maybe_public_bucket_extension: Some(extension.to_string()),
    };

    build_folder_thumbnail(row, MediaDomain::FakeYou, ServerEnvironment::Production)
  }
}
