use anyhow::anyhow;
use chrono::{DateTime, NaiveDateTime, TimeZone, Utc};
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};

use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, PolymorphicInferenceArgs};

#[derive(Debug, Default)]
pub struct FalJobDetails {
  pub job_token: InferenceJobToken,

  pub status: JobStatusPlus,

  pub external_third_party: InferenceJobExternalThirdParty,
  pub external_third_party_id: String,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub creator_ip_address: String,
  
  pub maybe_prompt_token: Option<PromptToken>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Default)]
struct RawJobRecord {
  job_token: InferenceJobToken,

  status: JobStatusPlus,

  // NB: Nullable, but required to be filled for this query
  external_third_party: Option<InferenceJobExternalThirdParty>,

  // NB: Nullable, but required to be filled for this query
  external_third_party_id: Option<String>,

  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  creator_ip_address: String,

  maybe_prompt_token: Option<PromptToken>,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}

/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_by_fal_id(fal_id: &str, mysql_pool: &MySqlPool)
  -> AnyhowResult<Option<FalJobDetails>>
{
  let mut connection = mysql_pool.acquire().await?;
  get_inference_job_by_fal_id_from_connection(fal_id, &mut connection).await
}

/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_by_fal_id_from_connection(fal_id: &str, mysql_connection: &mut PoolConnection<MySql>)
  -> AnyhowResult<Option<FalJobDetails>>
{
  // NB(bt): jobs.uuid_idempotency_token is the current way to reconstruct the hash of the
  // TTS result since we don't store a bucket hash on the table. This is an ugly hack :(
  // TODO(bt,2023-10-12): ^^^ Is this comment still accurate? I don't see that field referenced below.

  let maybe_status = sqlx::query_as!(
      RawJobRecord,
        r#"
SELECT
    jobs.token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,

    jobs.status as `status: enums::common::job_status_plus::JobStatusPlus`,
    
    jobs.maybe_external_third_party as `external_third_party: enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty`,
    jobs.maybe_external_third_party_id as `external_third_party_id`,

    jobs.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    jobs.maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken`,
    jobs.creator_ip_address,
    
    jobs.maybe_prompt_token as `maybe_prompt_token: tokens::tokens::prompts::PromptToken`,

    jobs.created_at,
    jobs.updated_at

FROM generic_inference_jobs as jobs

WHERE jobs.maybe_external_third_party = ?
AND jobs.maybe_external_third_party_id = ?
        "#,
      InferenceJobExternalThirdParty::Fal.to_str(),
      fal_id
    )
      .fetch_one(&mut **mysql_connection)
      .await;

  let record = match maybe_status {
    Ok(record) => record,
    Err(err) => match err {
      sqlx::Error::RowNotFound => return Ok(None),
      _ => {
        warn!("error querying job record: {:?}", err);
        return Err(anyhow!("error querying job record: {:?}", err));
      }
    }
  };

  let record = raw_record_to_public_result(record)?;
  
  Ok(Some(record))
}

fn raw_record_to_public_result(record: RawJobRecord) -> AnyhowResult<FalJobDetails> {
  Ok(FalJobDetails {
    job_token: record.job_token,
    status: record.status,
    external_third_party: record.external_third_party.ok_or_else(|| anyhow!("missing external_third_party"))?,
    external_third_party_id: record.external_third_party_id.ok_or_else(|| anyhow!("missing external_third_party_id"))?,
    maybe_creator_user_token: record.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
    creator_ip_address: record.creator_ip_address,
    maybe_prompt_token: record.maybe_prompt_token,
    created_at: record.created_at,
    updated_at: record.updated_at,
  })
}
