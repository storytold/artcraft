use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::w2l_inference_jobs::W2lInferenceJobToken;

pub struct InsertW2lInferenceJobExtendedArgs<'a> {
  pub uuid_idempotency_token: &'a str,
  pub maybe_template_token: Option<&'a str>,
  pub audio_upload_bucket_hash: Option<&'a str>,
  pub audio_upload_bucket_path: Option<&'a str>,
  pub maybe_audio_file_name: Option<&'a str>,
  pub audio_type: Option<&'a str>,
  pub maybe_user_token: Option<&'a str>,
  pub ip_address: &'a str,
  pub set_visibility: Visibility,

  pub mysql_pool: &'a MySqlPool,
}

/// Returns the new job's token on success
pub async fn insert_w2l_inference_job_extended(args: InsertW2lInferenceJobExtendedArgs<'_>) -> AnyhowResult<String> {
  // This token is returned to the client.
  let job_token = W2lInferenceJobToken::generate().to_string();

  let query_result = sqlx::query!(
        r#"
INSERT INTO w2l_inference_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,

  maybe_w2l_template_token = ?,
  maybe_public_audio_bucket_hash = ?,
  maybe_public_audio_bucket_location = ?,

  maybe_original_audio_filename = ?,
  maybe_audio_mime_type = ?,

  maybe_creator_user_token = ?,
  creator_ip_address = ?,
  disable_end_bump = false,
  creator_set_visibility = ?,
  status = "pending"
        "#,
        &job_token,
        args.uuid_idempotency_token.to_string(),
        args.maybe_template_token.clone(),
        args.audio_upload_bucket_hash.clone(),
        args.audio_upload_bucket_path.clone(),
        args.maybe_audio_file_name.clone(),
        args.audio_type.clone(),
        args.maybe_user_token.clone(),
        args.ip_address.to_string(),
        args.set_visibility.to_str(),
    )
      .execute(args.mysql_pool)
      .await;

  let _record_id = match query_result {
    Ok(res) => res.last_insert_id(),
    Err(err) => {
      return Err(anyhow!("New w2l template upload creation DB error: {:?}", err));
    }
  };

  Ok(job_token)
}
