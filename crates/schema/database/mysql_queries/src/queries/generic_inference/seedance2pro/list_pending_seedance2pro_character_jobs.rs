use log::warn;
use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

/// A pending Seedance2Pro character job waiting for a result.
#[derive(Debug)]
pub struct PendingSeedance2ProCharacterJob {
  pub job_token: InferenceJobToken,

  /// The Kinovi character_id (stored as the external third party ID).
  pub kinovi_character_id: String,

  pub maybe_creator_user_token: Option<UserToken>,
}

#[derive(Debug, Default)]
struct RawRecord {
  job_token: InferenceJobToken,
  kinovi_character_id: Option<String>,
  maybe_creator_user_token: Option<UserToken>,
}

/// Returns all non-terminal Seedance2Pro character jobs that have an associated character ID.
pub async fn list_pending_seedance2pro_character_jobs(pool: &MySqlPool) -> Result<Vec<PendingSeedance2ProCharacterJob>, sqlx::Error> {
  let records = sqlx::query_as!(
    RawRecord,
    r#"
SELECT
    jobs.token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,
    jobs.maybe_external_third_party_id as `kinovi_character_id`,
    jobs.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`

FROM generic_inference_jobs as jobs

WHERE jobs.maybe_external_third_party = ?
  AND jobs.job_type = ?
  AND jobs.status NOT IN ('complete_success', 'complete_failure')
  AND jobs.maybe_external_third_party_id IS NOT NULL

LIMIT 25000
    "#,
    InferenceJobExternalThirdParty::Seedance2Pro.to_str(),
    InferenceJobType::Seedance2ProCharacter.to_str(),
  )
    .fetch_all(pool)
    .await?;

  let jobs = records
    .into_iter()
    .filter_map(|record| {
      let kinovi_character_id = match record.kinovi_character_id {
        Some(id) => id,
        None => {
          warn!("PendingSeedance2ProCharacterJob has no kinovi_character_id, skipping");
          return None;
        }
      };

      Some(PendingSeedance2ProCharacterJob {
        job_token: record.job_token,
        kinovi_character_id,
        maybe_creator_user_token: record.maybe_creator_user_token,
      })
    })
    .collect();

  Ok(jobs)
}
