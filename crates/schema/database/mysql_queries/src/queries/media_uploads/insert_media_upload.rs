use anyhow::anyhow;
use log::warn;
use sqlx::MySqlPool;

use bucket_paths::legacy::typified_paths::public::media_uploads::bucket_file_path::MediaUploadOriginalFilePath;
use enums_db::by_table::media_uploads::media_upload_source::MediaUploadSource;
use enums_db::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_uploads::MediaUploadToken;
use tokens::tokens::users::UserToken;

use crate::payloads::media_upload_modification_details::MediaUploadModificationDetails;

/// Used to give user-facing order to logged in user inference requests
pub struct SyntheticIdRecord {
  pub next_id: i64,
}

pub struct Args <'a> {
  pub uuid_idempotency_token: &'a str,

  pub media_type: MediaUploadType,
  pub media_source: MediaUploadSource,

  pub maybe_original_filename: Option<&'a str>,
  pub original_file_size_bytes: u64,
  pub maybe_original_duration_millis: Option<u64>,
  pub maybe_original_mime_type: Option<&'a str>,
  pub maybe_original_audio_encoding: Option<&'a str>,
  pub maybe_original_video_encoding: Option<&'a str>,
  pub maybe_original_frame_width: Option<u64>,
  pub maybe_original_frame_height: Option<u64>,
  pub checksum_sha2: &'a str,

  pub public_upload_path: &'a MediaUploadOriginalFilePath,
  pub maybe_extra_file_modification_info: Option<MediaUploadModificationDetails>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<&'a str>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_media_upload(args: Args<'_>) -> AnyhowResult<(MediaUploadToken, u64)> {

  let mut maybe_creator_synthetic_id : Option<u64> = None;

  let mut transaction = args.mysql_pool.begin().await?;

  if let Some(creator_user_token) = args.maybe_creator_user_token.as_deref() {
    let query_result = sqlx::query!(
        r#"
INSERT INTO media_upload_synthetic_ids
SET
  user_token = ?,
  next_id = 1
ON DUPLICATE KEY UPDATE
  user_token = ?,
  next_id = next_id + 1
        "#,
      creator_user_token,
      creator_user_token
    )
        .execute(&mut *transaction)
        .await;

    match query_result {
      Ok(_) => {},
      Err(err) => {
        //transaction.rollback().await?;
        warn!("Transaction failure: {:?}", err);
      }
    }

    let query_result = sqlx::query_as!(
    SyntheticIdRecord,
        r#"
SELECT
  next_id
FROM
  media_upload_synthetic_ids
WHERE
  user_token = ?
LIMIT 1
        "#,
      creator_user_token,
    )
        .fetch_one(&mut *transaction)
        .await;

    let record : SyntheticIdRecord = match query_result {
      Ok(record) => record,
      Err(err) => {
        warn!("Transaction failure: {:?}", err);
        transaction.rollback().await?;
        return Err(anyhow!("Transaction failure: {:?}", err));
      }
    };

    let next_id = record.next_id as u64;
    maybe_creator_synthetic_id = Some(next_id);
  }

  let media_token = MediaUploadToken::generate();

  let maybe_extra_file_modification_info = args.maybe_extra_file_modification_info
      .clone() // FIXME
      .map(|info| info.to_json())
      .transpose()?;

  let query = sqlx::query!(
        r#"
INSERT INTO media_uploads
SET
  token = ?,
  uuid_idempotency_token = ?,

  media_type = ?,
  media_source = ?,

  maybe_original_filename = ?,
  original_file_size_bytes = ?,
  original_duration_millis = ?,
  maybe_original_mime_type = ?,
  maybe_original_audio_encoding = ?,
  maybe_original_video_encoding = ?,
  maybe_original_frame_width = ?,
  maybe_original_frame_height = ?,
  checksum_sha2 = ?,

  public_bucket_directory_hash = ?,

  maybe_extra_file_modification_info = ?,

  maybe_creator_user_token = ?,
  maybe_creator_synthetic_id = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?

        "#,
        media_token.as_str(),
        args.uuid_idempotency_token,

        args.media_type,
        args.media_source,

        args.maybe_original_filename,
        args.original_file_size_bytes,
        args.maybe_original_duration_millis.unwrap_or(0),
        args.maybe_original_mime_type,
        args.maybe_original_audio_encoding,
        args.maybe_original_video_encoding,
        args.maybe_original_frame_width,
        args.maybe_original_frame_height,
        args.checksum_sha2,

        args.public_upload_path.get_object_hash(),

        maybe_extra_file_modification_info,

        args.maybe_creator_user_token,
        maybe_creator_synthetic_id,
        args.maybe_creator_anonymous_visitor_token,
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),
    );

  let query_result = query.execute(&mut *transaction)
      .await;

  let result_tuple  = match query_result {
    Ok(res) => (media_token, res.last_insert_id()),
    Err(err) => return Err(anyhow!("error inserting new media upload: {:?}", err)),
  };

  transaction.commit().await?;

  Ok(result_tuple)
}
