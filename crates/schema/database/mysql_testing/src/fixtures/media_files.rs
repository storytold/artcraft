//! Media file fixtures: rows a generation request can reference. The bucket
//! paths are fake — nothing downloads successfully from them, which tests
//! rely on (e.g. the reference-video probe falls back to worst-case billing).

use anyhow::anyhow;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use sqlx::MySqlPool;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;

/// Insert a video media_files row whose CDN path encodes `duration_millis`
/// as a `dur{millis}ms` prefix. Paired with a media-CDN override pointing at
/// a stub that serves real generated video of that duration, this lets tests
/// exercise the download + ffprobe billing path with exact durations. The
/// STORED duration column is deliberately wrong (999_000 ms) to prove the
/// database is never trusted for billing.
pub async fn create_probeable_test_video_media_file(
  pool: &MySqlPool,
  owner: &UserToken,
  duration_millis: u64,
) -> anyhow::Result<MediaFileToken> {
  let prefix = format!("dur{duration_millis}ms");
  let bucket_path = MediaFileBucketPath::generate_new(Some(&prefix), Some("mp4"));

  MediaFileInsertBuilder::new()
    .creator_user(owner)
    .creator_ip_address("127.0.0.1")
    .creator_set_visibility(Visibility::Private)
    .media_file_class(MediaFileClass::Video)
    .media_file_type(MediaFileType::Video)
    .is_user_upload(true)
    .is_intermediate_system_file(false)
    .media_file_origin_category(MediaFileOriginCategory::Upload)
    .media_file_origin_product_category(MediaFileOriginProductCategory::Unknown)
    .mime_type("video/mp4")
    .file_size_bytes(1_024)
    .maybe_duration_millis(Some(999_000))
    .checksum_sha2(&"0".repeat(64))
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(pool)
    .await
    .map_err(|err| anyhow!("media file insert failed: {err:?}"))
}

/// Insert a video media_files row owned by `owner`, with the given stored
/// duration. Returns its token for use in `reference_video_media_tokens`.
pub async fn create_test_video_media_file(
  pool: &MySqlPool,
  owner: &UserToken,
  maybe_duration_millis: Option<u64>,
) -> anyhow::Result<MediaFileToken> {
  let bucket_path = MediaFileBucketPath::generate_new(None, Some("mp4"));

  MediaFileInsertBuilder::new()
    .creator_user(owner)
    .creator_ip_address("127.0.0.1")
    .creator_set_visibility(Visibility::Private)
    .media_file_class(MediaFileClass::Video)
    .media_file_type(MediaFileType::Video)
    .is_user_upload(true)
    .is_intermediate_system_file(false)
    .media_file_origin_category(MediaFileOriginCategory::Upload)
    .media_file_origin_product_category(MediaFileOriginProductCategory::Unknown)
    .mime_type("video/mp4")
    .file_size_bytes(1_024)
    .maybe_duration_millis(maybe_duration_millis)
    .checksum_sha2(&"0".repeat(64))
    .public_bucket_directory_hash(&bucket_path)
    .insert_pool(pool)
    .await
    .map_err(|err| anyhow!("media file insert failed: {err:?}"))
}
