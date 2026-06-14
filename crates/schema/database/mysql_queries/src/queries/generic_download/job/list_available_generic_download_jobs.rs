use std::collections::BTreeSet;

use chrono::Utc;
use sqlx::MySqlPool;

use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
use enums::common::job_status::JobStatus;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::generic_download_jobs::DownloadJobToken;
use tokens::tokens::users::UserToken;

use crate::queries::generic_download::job::_keys::GenericDownloadJobId;

/// table: generic_download_jobs
#[derive(Debug)]
pub struct AvailableDownloadJob {
  pub id: GenericDownloadJobId,
  pub download_job_token: DownloadJobToken,

  pub creator_user_token: UserToken,
  pub creator_ip_address: String,
  pub creator_set_visibility: Visibility,

  pub download_type: GenericDownloadType,
  pub download_url: String,
  pub title: String,

  pub status: JobStatus,
  pub attempt_count: i32,
  pub failure_reason: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}

pub async fn list_available_generic_download_jobs(
  pool: &MySqlPool,
  num_records: u32,
  maybe_scoped_download_types: Option<&BTreeSet<GenericDownloadType>>
)
  -> AnyhowResult<Vec<AvailableDownloadJob>>
{
  let download_types = maybe_scoped_download_types
      .map(|types| types.clone())
      .unwrap_or(GenericDownloadType::all_variants()); // NB: All model types

  // NB/TODO(bt,2023-07-20): Non-statically typed SQL can't do type annotations AFAIK
  let mut query = String::from(r#"
SELECT
  id,
  token,

  creator_user_token,
  creator_ip_address,
  creator_set_visibility,

  download_type,
  download_url,
  title,

  status,
  attempt_count,
  failure_reason,

  created_at,
  updated_at,
  retry_at
FROM generic_download_jobs
WHERE
  (
    status IN ("pending", "attempt_failed")
  )
  AND
  (
    retry_at IS NULL
    OR
    retry_at < CURRENT_TIMESTAMP
  )
  "#);

  if let Some(clause) = download_type_clause(&download_types) {
    query.push_str(" AND ");
    query.push_str(&clause);
    query.push_str(" ");
  }

  query.push_str(&format!(r#"
    ORDER BY id ASC
    LIMIT {}
  "#, num_records));

  let job_records = sqlx::query_as::<_, AvailableDownloadJobRawInternal>(sqlx::AssertSqlSafe(&*query))
      .fetch_all(pool)
      .await?;

  let job_records = job_records.into_iter()
      .map(|record : AvailableDownloadJobRawInternal| {
        AvailableDownloadJob {
          id: GenericDownloadJobId(record.id),
          download_job_token: DownloadJobToken::new(record.token),
          creator_ip_address: record.creator_ip_address,
          creator_user_token: UserToken::new_from_str(&record.creator_user_token),
          // NB: Failure case for parsing visibility - default to private
          creator_set_visibility: Visibility::from_str(&record.creator_set_visibility)
              .unwrap_or(Visibility::Private),
          // NB: Failure case for parsing download type - unhandled model type
          download_type: GenericDownloadType::from_str(&record.download_type)
              .unwrap_or(GenericDownloadType::RocketVc),
          download_url: record.download_url,
          title: record.title,
          // NB: Failure case for parsing download type - dead job
          status: JobStatus::from_str(&record.status)
              .unwrap_or(JobStatus::Dead),
          attempt_count: record.attempt_count,
          failure_reason: record.failure_reason,
          created_at: record.created_at,
          updated_at: record.updated_at,
          retry_at: record.retry_at,
        }
      })
      .collect::<Vec<AvailableDownloadJob>>();

  Ok(job_records)
}

fn download_type_clause(download_types: &BTreeSet<GenericDownloadType>) -> Option<String> {
  if download_types.is_empty() {
    return None;
  }

  let download_types = download_types.into_iter()
      .map(|download_type| download_type.to_str())
      .map(|download_type| format!("\"{}\"", download_type))
      .collect::<Vec<_>>()
      .join(", ");

  Some(format!("download_type IN ( {} )", download_types))
}

#[derive(Debug, sqlx::FromRow)]
struct AvailableDownloadJobRawInternal {
  pub id: i64,
  pub token: String,

  pub creator_user_token: String,
  pub creator_ip_address: String,
  pub creator_set_visibility: String,

  pub download_type: String,
  pub download_url: String,
  pub title: String,

  pub status: String,
  pub attempt_count: i32,
  pub failure_reason: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}


#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;

  use crate::queries::generic_download::job::list_available_generic_download_jobs::download_type_clause;

  #[test]
  fn test_download_types_with_clause() {
    let clause = download_type_clause(&BTreeSet::from([GenericDownloadType::HifiGan, GenericDownloadType::RvcV2]));
    assert_eq!(clause.as_deref(), Some("download_type IN ( \"hifigan\", \"rvc_v2\" )"));
  }

  #[test]
  fn test_download_types_with_clause_absent() {
    let clause = download_type_clause(&BTreeSet::from([]));
    assert_eq!(clause, None);
  }
}
