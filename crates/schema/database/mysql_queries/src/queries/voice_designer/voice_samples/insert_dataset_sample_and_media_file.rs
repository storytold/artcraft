use anyhow::anyhow;
use sqlx::MySqlPool;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums_db::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums_db::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voice_dataset_samples::ZsVoiceDatasetSampleToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

/// Used to give user-facing order to logged in user inference requests
pub struct SyntheticIdRecord {
  pub next_id: i64,
}

pub struct InsertDatasetSampleAndMediaFileArgs<'a> {
  pub uuid_idempotency_token: &'a str,

  // Dataset to which this sample belongs
  pub dataset_token: &'a ZsVoiceDatasetToken,

  pub media_type: MediaUploadType,

  pub origin_category: MediaFileOriginCategory,

  // TODO:
  pub maybe_original_filename: Option<&'a str>,
  pub maybe_mime_type: Option<&'a str>,
  pub file_size_bytes: u64,
  pub maybe_original_duration_millis: Option<u64>,
  pub maybe_original_audio_encoding: Option<&'a str>,

  pub checksum_sha2: &'a str,

  pub media_file_path: &'a MediaFileBucketPath,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub mysql_pool: &'a MySqlPool,
}

const ORIGIN_PRODUCT : MediaFileOriginProductCategory = MediaFileOriginProductCategory::ZeroShotVoice;

pub async fn insert_dataset_sample_and_media_file(args: InsertDatasetSampleAndMediaFileArgs<'_>) -> AnyhowResult<(ZsVoiceDatasetSampleToken, MediaFileToken, u64)> {

  let _maybe_creator_synthetic_id : Option<u64> = None;

  let mut transaction = args.mysql_pool.begin().await?;

// TODO: Synthetic IDs

//  if let Some(creator_user_token) = args.maybe_creator_user_token.as_deref() {
//    let query_result = sqlx::query!(
//        r#"
//INSERT INTO media_upload_synthetic_ids
//SET
//  user_token = ?,
//  next_id = 1
//ON DUPLICATE KEY UPDATE
//  user_token = ?,
//  next_id = next_id + 1
//        "#,
//      creator_user_token,
//      creator_user_token
//    )
//        .execute(&mut transaction)
//        .await;
//
//    match query_result {
//      Ok(_) => {},
//      Err(err) => {
//        //transaction.rollback().await?;
//        warn!("Transaction failure: {:?}", err);
//      }
//    }
//
//    let query_result = sqlx::query_as!(
//    SyntheticIdRecord,
//        r#"
//SELECT
//  next_id
//FROM
//  media_upload_synthetic_ids
//WHERE
//  user_token = ?
//LIMIT 1
//        "#,
//      creator_user_token,
//    )
//        .fetch_one(&mut transaction)
//        .await;
//
//    let record : SyntheticIdRecord = match query_result {
//      Ok(record) => record,
//      Err(err) => {
//        warn!("Transaction failure: {:?}", err);
//        transaction.rollback().await?;
//        return Err(anyhow!("Transaction failure: {:?}", err));
//      }
//    };
//
//    let next_id = record.next_id as u64;
//    maybe_creator_synthetic_id = Some(next_id);
//  }

  let media_file_token = MediaFileToken::generate();
  let dataset_sample_token = ZsVoiceDatasetSampleToken::generate();

//  let maybe_extra_file_modification_info = args.maybe_extra_file_modification_info
//      .clone() // FIXME
//      .map(|info| info.to_json())
//      .transpose()?;

  let query = sqlx::query!(
        r#"
INSERT INTO media_files
SET
  token = ?,

  origin_category = ?,
  origin_product_category = ?,

  media_type = ?,

  maybe_origin_filename = ?,
  maybe_mime_type = ?,
  file_size_bytes = ?,

  maybe_duration_millis = ?,
  maybe_audio_encoding = ?,

  checksum_sha2 = ?,

  public_bucket_directory_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?

        "#,
        media_file_token,

        args.origin_category,
        ORIGIN_PRODUCT,

        args.media_type,

        args.maybe_original_filename,
        args.maybe_mime_type,
        args.file_size_bytes,

        args.maybe_original_duration_millis.unwrap_or(0),
        args.maybe_original_audio_encoding,

        args.checksum_sha2,

        args.media_file_path.get_object_hash(),
        args.maybe_public_bucket_prefix,
        args.maybe_public_bucket_extension,

        //maybe_extra_file_modification_info,

        args.maybe_creator_user_token,
        //maybe_creator_synthetic_id,
        args.maybe_creator_anonymous_visitor_token,
        args.creator_ip_address,
        args.creator_set_visibility.to_str()
    );

  let query_result = query.execute(&mut *transaction)
      .await;

  if let Err(err) = query_result {
    return Err(anyhow!("error inserting new dataset sample: {:?}", err));
  }

  let query = sqlx::query!(
        r#"
  INSERT INTO zs_voice_dataset_samples SET

  token = ?,

  uuid_idempotency_token = ?,

  dataset_token = ?,
  media_file_token = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?
        "#,
        dataset_sample_token,

        args.uuid_idempotency_token,

        args.dataset_token,
        media_file_token,

        args.maybe_creator_user_token,
        args.maybe_creator_anonymous_visitor_token,
        args.creator_ip_address,
    );

  let query_result = query.execute(&mut *transaction)
      .await;

  let result_tuple  = match query_result {
    Ok(res) => (dataset_sample_token, media_file_token, res.last_insert_id()),
    Err(err) => return Err(anyhow!("error inserting new dataset sample: {:?}", err)),
  };

  transaction.commit().await?;

  Ok(result_tuple)
}
