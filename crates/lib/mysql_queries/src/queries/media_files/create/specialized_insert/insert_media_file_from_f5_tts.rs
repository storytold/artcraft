use anyhow::anyhow;
use sqlx;
use sqlx::MySqlPool;

use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use crate::queries::generic_synthetic_ids::transactional_increment_generic_synthetic_id::transactional_increment_generic_synthetic_id;

pub struct InsertF5TTSMediaFileArgs<'a> {
  pub pool: &'a MySqlPool,
  pub job: &'a AvailableInferenceJob,

  pub maybe_mime_type: Option<&'a str>,
  pub file_size_bytes: u64,
  pub sha256_checksum: &'a str,
  pub maybe_duration_millis: Option<u64>,
  pub maybe_audio_codec_name: Option<&'a str>,

  pub public_bucket_directory_hash: &'a str,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,

  pub is_on_prem: bool,
  pub worker_hostname: &'a str,
  pub worker_cluster: &'a str,
}

pub async fn insert_media_file_from_f5_tts(
  args: InsertF5TTSMediaFileArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
  let result_token = MediaFileToken::generate();

  let origin_model_type = MediaFileOriginModelType::F5TTS;

  let mut maybe_creator_file_synthetic_id : Option<u64> = None;
  let mut maybe_creator_category_synthetic_id : Option<u64> = None;

  let mut transaction = args.pool.begin().await?;

  if let Some(creator_user_token) = args.job.maybe_creator_user_token.as_deref() {
    let user_token = UserToken::new_from_str(creator_user_token);

    let next_media_file_id = transactional_increment_generic_synthetic_id(
      &user_token,
      IdCategory::MediaFile,
      &mut transaction
    ).await?;

    let next_voice_conversion_id = transactional_increment_generic_synthetic_id(
      &user_token,
      IdCategory::TtsResult,
      &mut transaction
    ).await?;

    maybe_creator_file_synthetic_id = Some(next_media_file_id);
    maybe_creator_category_synthetic_id = Some(next_voice_conversion_id);
  }

  const ORIGIN_CATEGORY : MediaFileOriginCategory = MediaFileOriginCategory::Inference;
  const ORIGIN_PRODUCT_CATEGORY : MediaFileOriginProductCategory = MediaFileOriginProductCategory::TextToSpeech;

  let record_id = {
    let query_result = sqlx::query!(
        r#"
INSERT INTO media_files
SET
  token = ?,

  media_class = ?,
  media_type = ?,

  origin_category = ?,
  origin_product_category = ?,

  maybe_origin_model_type = ?,
  maybe_origin_model_token = ?,

  maybe_text_transcript = ?,

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

  creator_set_visibility = ?,

  maybe_creator_file_synthetic_id = ?,
  maybe_creator_category_synthetic_id = ?,

  is_generated_on_prem = ?,
  generated_by_worker = ?,
  generated_by_cluster = ?

        "#,
      result_token.as_str(),

      MediaFileClass::Audio.to_str(),
      MediaFileType::Audio.to_str(), // TODO(bt,2024-04-30): This needs to become "wav" after a frontend migration

      ORIGIN_CATEGORY.to_str(),
      ORIGIN_PRODUCT_CATEGORY.to_str(),

      origin_model_type.to_str(),
      args.job.maybe_model_token,

      args.job.maybe_raw_inference_text,

      args.maybe_mime_type,
      args.file_size_bytes,

      args.maybe_duration_millis,
      args.maybe_audio_codec_name,

      args.sha256_checksum,

      args.public_bucket_directory_hash,
      args.maybe_public_bucket_prefix,
      args.maybe_public_bucket_extension,

      args.job.maybe_creator_user_token,
      args.job.maybe_creator_anonymous_visitor_token,
      args.job.creator_ip_address,

      args.job.creator_set_visibility.to_str(),

      maybe_creator_file_synthetic_id,
      maybe_creator_category_synthetic_id,

      args.is_on_prem,
      args.worker_hostname,
      args.worker_cluster
    )
      .execute(&mut *transaction)
      .await;

    let record_id = match query_result {
      Ok(res) => {
        res.last_insert_id()
      },
      Err(err) => {
        // TODO: handle better
        //transaction.rollback().await?;
        return Err(anyhow!("Mysql error: {:?}", err));
      }
    };

    record_id
  };

  transaction.commit().await?;

  Ok((result_token, record_id))
}
