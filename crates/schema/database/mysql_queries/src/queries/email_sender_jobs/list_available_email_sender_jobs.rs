use anyhow::anyhow;
use chrono::Utc;
use sqlx::MySqlPool;

use enums::by_table::email_sender_jobs::email_category::EmailCategory;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::email_sender_job_token::EmailSenderJobToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::email_sender_jobs::email_sender_job_args::EmailSenderJobArgs;
use crate::queries::email_sender_jobs::_keys::EmailSenderJobId;

/// table: email_sender_jobs
#[derive(Debug)]
pub struct AvailableEmailSenderJob {
  pub id: EmailSenderJobId,
  pub token: EmailSenderJobToken,

  // Job type
  pub email_category: EmailCategory,
  pub maybe_email_args: Option<EmailSenderJobArgs>,

  // Email details
  pub destination_email_address: String,
  pub maybe_destination_user_token: Option<UserToken>,

  // Language details
  pub ietf_language_tag: Option<String>,
  pub ietf_primary_language_subtag: Option<String>,

  // User information to propagate downstream
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub maybe_creator_ip_address: String,

  // Job information
  pub status: JobStatusPlus,
  pub attempt_count: u16,

  pub priority_level: u16,

  // Development / debug info
  pub is_debug_request: bool,
  pub maybe_routing_tag: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}

pub struct ListAvailableEmailSenderJobArgs<'a> {
  pub num_records: u32,
  pub is_debug_worker: bool,
  pub sort_by_priority: bool,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_available_email_sender_jobs(
  args: ListAvailableEmailSenderJobArgs<'_>,
)
  -> AnyhowResult<Vec<AvailableEmailSenderJob>>
{
  let query = if args.sort_by_priority {
    list_sorted_by_priority(args).await
  } else {
    list_sorted_by_id(args).await
  };

  let job_records = query?;

  let job_records : Vec<AvailableEmailSenderJob> = job_records.into_iter()
      .map(|record : AvailableEmailSenderJobRawInternal| {
        let record = AvailableEmailSenderJob {
          id: EmailSenderJobId(record.id),
          token: EmailSenderJobToken::new_from_str(&record.token),
          email_category: EmailCategory::from_str(&record.email_category)
              .map_err(|err| anyhow!("incorrect category: {:?}", err))?,
          maybe_email_args: record.maybe_email_args
              .as_deref()
              .map(|args| EmailSenderJobArgs::from_json(args))
              .transpose()?,
          destination_email_address: record.destination_email_address,
          maybe_destination_user_token: record.maybe_destination_user_token
              .map(|token| UserToken::new_from_str(&token)),
          ietf_language_tag: record.ietf_language_tag,
          ietf_primary_language_subtag: record.ietf_primary_language_subtag,
          maybe_creator_ip_address: record.maybe_creator_ip_address,
          maybe_creator_user_token: record.maybe_creator_user_token
              .map(|token| UserToken::new_from_str(&token)),
          maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token
              .map(|token| AnonymousVisitorTrackingToken::new_from_str(&token)),
          status: JobStatusPlus::from_str(&record.status)
              .map_err(|err| anyhow!("incorrect category: {:?}", err))?,
          attempt_count: record.attempt_count,
          priority_level: record.priority_level,
          is_debug_request: i8_to_bool(record.is_debug_request),
          maybe_routing_tag: record.maybe_routing_tag,
          created_at: record.created_at,
          updated_at: record.updated_at,
          retry_at: record.retry_at,
        };
        Ok(record)
      })
      // NB: Magic Vec<Result> -> Result<Vec<>>
      // https://stackoverflow.com/a/63798748
      .into_iter()
      .collect::<Result<Vec<AvailableEmailSenderJob>, anyhow::Error>>()?;

  Ok(job_records)
}

async fn list_sorted_by_id(args: ListAvailableEmailSenderJobArgs<'_>) -> Result<Vec<AvailableEmailSenderJobRawInternal>, sqlx::Error> {
  // NB: Can't be type checked because of WHERE IN clause with dynamic contents
  // TODO(bt,2023-11-15): Include the types. This should be a static query, not a query builder.

  let mut query = r#"
SELECT
  id,
  token,

  email_category,
  maybe_email_args,

  destination_email_address,
  maybe_destination_user_token,

  ietf_language_tag,
  ietf_primary_language_subtag,

  maybe_creator_user_token,
  maybe_creator_anonymous_visitor_token,
  maybe_creator_ip_address,

  status,
  attempt_count,

  priority_level,

  is_debug_request,
  maybe_routing_tag,

  created_at,
  updated_at,
  retry_at

FROM email_sender_jobs"#.to_string();

  query.push_str(r#"
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
  AND
  (
    is_debug_request = ?
  )
  ORDER BY id ASC
  LIMIT ?
        "#);

  let query = sqlx::query_as::<_, AvailableEmailSenderJobRawInternal>(sqlx::AssertSqlSafe(&*query))
      .bind(args.is_debug_worker)
      .bind(args.num_records);

  query.fetch_all(args.mysql_pool)
      .await
}

async fn list_sorted_by_priority(args: ListAvailableEmailSenderJobArgs<'_>) -> Result<Vec<AvailableEmailSenderJobRawInternal>, sqlx::Error> {
  // NB: Can't be type checked because of WHERE IN clause with dynamic contents
  // TODO(bt,2023-11-15): Include the types. This should be a static query, not a query builder.

  let mut query = r#"
SELECT
  id,
  token,

  email_category,
  maybe_email_args,

  destination_email_address,
  maybe_destination_user_token,

  ietf_language_tag,
  ietf_primary_language_subtag,

  maybe_creator_user_token,
  maybe_creator_anonymous_visitor_token,
  maybe_creator_ip_address,

  status,
  attempt_count,

  priority_level,

  is_debug_request,
  maybe_routing_tag,

  created_at,
  updated_at,
  retry_at

FROM email_sender_jobs"#.to_string();

  query.push_str(r#"
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
  AND
  (
    is_debug_request = ?
  )
  ORDER BY priority_level DESC, id ASC
  LIMIT ?
        "#);

  let query = sqlx::query_as::<_, AvailableEmailSenderJobRawInternal>(sqlx::AssertSqlSafe(&*query))
      .bind(args.is_debug_worker)
      .bind(args.num_records);

  query.fetch_all(args.mysql_pool)
      .await
}

#[derive(Debug)]
#[derive(sqlx::FromRow)]
struct AvailableEmailSenderJobRawInternal {
  pub id: i64,
  pub token: String,

  // Job type
  pub email_category: String,
  pub maybe_email_args: Option<String>,

  // Email details
  pub destination_email_address: String,
  pub maybe_destination_user_token: Option<String>,

  // Language details
  pub ietf_language_tag: Option<String>,
  pub ietf_primary_language_subtag: Option<String>,

  // User information to propagate downstream
  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_anonymous_visitor_token: Option<String>,
  pub maybe_creator_ip_address: String,

  // Job information
  pub status: String,
  pub attempt_count: u16,

  pub priority_level: u16,

  // Development / debug info
  pub is_debug_request: i8,
  pub maybe_routing_tag: Option<String>,

  pub created_at: chrono::DateTime<Utc>,
  pub updated_at: chrono::DateTime<Utc>,
  pub retry_at: Option<chrono::DateTime<Utc>>,
}
