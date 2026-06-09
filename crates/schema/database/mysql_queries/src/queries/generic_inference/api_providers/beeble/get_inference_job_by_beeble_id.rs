use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};

use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::platform_type::PlatformType;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;


#[derive(Debug, Default)]
pub struct BeebleJobDetails {
  pub job_token: InferenceJobToken,

  pub status: JobStatusPlus,

  pub external_third_party: InferenceJobExternalThirdParty,
  pub external_third_party_id: String,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub creator_ip_address: String,

  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_debug_log_event_token: Option<DebugLogEventToken>,

  pub maybe_platform_type: Option<PlatformType>,

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
  maybe_debug_log_event_token: Option<DebugLogEventToken>,

  maybe_platform_type: Option<PlatformType>,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,
}

/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_by_beeble_id(beeble_id: &str, mysql_pool: &MySqlPool)
  -> AnyhowResult<Option<BeebleJobDetails>>
{
  let mut connection = mysql_pool.acquire().await?;
  get_inference_job_by_beeble_id_from_connection(beeble_id, &mut connection).await
}

/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_by_beeble_id_from_connection(beeble_id: &str, mysql_connection: &mut PoolConnection<MySql>)
  -> AnyhowResult<Option<BeebleJobDetails>>
{
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
    jobs.maybe_debug_log_event_token as `maybe_debug_log_event_token: tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken`,

    jobs.platform_type as `maybe_platform_type: enums::common::platform_type::PlatformType`,

    jobs.created_at,
    jobs.updated_at

FROM generic_inference_jobs as jobs

WHERE jobs.maybe_external_third_party = ?
AND jobs.maybe_external_third_party_id = ?
        "#,
      InferenceJobExternalThirdParty::Beeble.to_str(),
      beeble_id
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

fn raw_record_to_public_result(record: RawJobRecord) -> AnyhowResult<BeebleJobDetails> {
  Ok(BeebleJobDetails {
    job_token: record.job_token,
    status: record.status,
    external_third_party: record.external_third_party.ok_or_else(|| anyhow!("missing external_third_party"))?,
    external_third_party_id: record.external_third_party_id.ok_or_else(|| anyhow!("missing external_third_party_id"))?,
    maybe_creator_user_token: record.maybe_creator_user_token,
    maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
    creator_ip_address: record.creator_ip_address,
    maybe_prompt_token: record.maybe_prompt_token,
    maybe_debug_log_event_token: record.maybe_debug_log_event_token,
    maybe_platform_type: record.maybe_platform_type,
    created_at: record.created_at,
    updated_at: record.updated_at,
  })
}
