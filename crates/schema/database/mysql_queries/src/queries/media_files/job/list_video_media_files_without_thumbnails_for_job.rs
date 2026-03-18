use enums::by_table::media_files::media_file_class::MediaFileClass;
use sqlx::MySqlPool;
use tokens::tokens::media_files::MediaFileToken;

const DEFAULT_PAGE_SIZE: i64 = 100;

const DEFAULT_MAX_LOOKBACK_HOURS: i32 = 4;

pub struct ListVideoMediaFilesWithoutThumbnailsArgs<'a> {
  /// Override the maximum number of hours in our lookback window.
  pub custom_max_lookback_hours: Option<i32>,
  /// Override how many results to fetch (given a full page of results)
  pub custom_page_size: Option<i64>,
  /// Cursor to continue paginating with
  pub maybe_id_cursor: Option<i64>,
  pub pool: &'a MySqlPool,
}

pub struct VideoMediaFileWithoutThumbnail {
  pub id: i64,
  pub token: MediaFileToken,
  pub maybe_thumbnail_version: Option<u8>,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
}

pub struct VideoMediaFilesWithoutThumbnails {
  pub media_files: Vec<VideoMediaFileWithoutThumbnail>,
  pub next_cursor: Option<i64>,
}

pub async fn list_video_media_files_without_thumbnails_for_job(
  args: ListVideoMediaFilesWithoutThumbnailsArgs<'_>,
) -> Result<VideoMediaFilesWithoutThumbnails, sqlx::Error> {
  let cursor = args.maybe_id_cursor.unwrap_or(i64::MAX);

  let page_size = args.custom_page_size.unwrap_or(DEFAULT_PAGE_SIZE);
  let max_lookback_hours = args.custom_max_lookback_hours.unwrap_or(DEFAULT_MAX_LOOKBACK_HOURS);

  const MEDIA_CLASS_VIDEO: &str = MediaFileClass::Video.to_str();

  // NB: `COALESCE ...` helps us force the index for a more performant query plan (otherwise it explodes into a table scan).
  // NB: `NOW() - INTERVAL ? HOUR` uses the database clock to avoid client/server clock skew.
  let media_files = sqlx::query_as!(
    VideoMediaFileWithoutThumbnail,
    r#"
SELECT
    id,
    token as `token: MediaFileToken`,
    maybe_thumbnail_version as `maybe_thumbnail_version: u8`,
    public_bucket_directory_hash,
    maybe_public_bucket_prefix,
    maybe_public_bucket_extension
FROM media_files
WHERE
    id >= (SELECT COALESCE(MIN(id), 0) FROM media_files WHERE created_at >= NOW() - INTERVAL ? HOUR)
    AND id < ?
    AND media_class = ?
    AND maybe_thumbnail_version IS NULL
    AND user_deleted_at IS NULL
    AND mod_deleted_at IS NULL
ORDER BY id DESC
LIMIT ?
    "#,
    max_lookback_hours,
    cursor,
    MEDIA_CLASS_VIDEO,
    page_size,
  )
    .fetch_all(args.pool)
    .await?;

  let next_cursor = if media_files.len() as i64 == page_size {
    media_files.last().map(|f| f.id)
  } else {
    None
  };

  Ok(VideoMediaFilesWithoutThumbnails { media_files, next_cursor })
}
